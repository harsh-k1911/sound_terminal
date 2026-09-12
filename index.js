#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Player = require('./src/player.js');
const Queue = require('./src/queue.js');
const UI = require('./src/ui.js');
const { probeAll } = require('./src/probe.js');

// Module-level state
const player = new Player();
const queue = new Queue();
const ui = new UI();

let status = 'stopped';
let message = '';
let renderTimer = null;

/**
 * Builds the current state object for UI rendering
 */
function getState() {
  return {
    status,
    track: queue.current,
    elapsed: player.elapsedSeconds,
    volume: player.volume,
    shuffle: queue.shuffle,
    repeat: queue.repeat,
    queueIndex: queue.currentIndex,
    queueTotal: queue.total,
    tracks: queue.tracks,
    message
  };
}

/**
 * Render the current state to the terminal
 */
function render() {
  ui.render(getState());
}

/**
 * Start the render loop (re-render every second for progress bar updates)
 */
function startRenderLoop() {
  if (renderTimer) {
    return; // Already running
  }
  renderTimer = setInterval(render, 1000);
}

/**
 * Stop the render loop to avoid pointless re-renders when paused/stopped
 */
function stopRenderLoop() {
  if (renderTimer) {
    clearInterval(renderTimer);
    renderTimer = null;
  }
}

/**
 * Play a given track, or stop if track is null
 */
function playTrack(track) {
  if (!track) {
    status = 'stopped';
    setMessage('End of queue.', 3000);
    stopRenderLoop();
    render();
    return;
  }

  player.play(track.filePath);
  status = 'playing';
  setMessage(`Now playing: ${track.title}`, 2000);
  startRenderLoop();
  render();
}

/**
 * Set a transient message that auto-clears after clearAfter milliseconds
 */
function setMessage(msg, clearAfter = 2000) {
  message = msg;
  render();

  if (clearAfter) {
    setTimeout(() => {
      message = '';
      render();
    }, clearAfter);
  }
}

/**
 * Handle a single keypress
 */
function handleKey(key) {
  switch (key) {
    case 'p': {
      // Play/Pause toggle
      if (!player.isActive) {
        playTrack(queue.current);
      } else {
        const toggleResult = player.togglePause();
        if (toggleResult === 'paused') {
          status = 'paused';
          setMessage('Paused.', 1500);
          stopRenderLoop();
        } else if (toggleResult === 'playing') {
          status = 'playing';
          setMessage('Resumed.', 1500);
          startRenderLoop();
        }
        render();
      }
      break;
    }

    case 'n': {
      // Next track
      const nextTrack = queue.next();
      if (nextTrack) {
        playTrack(nextTrack);
      } else {
        player.stop();
        status = 'stopped';
        setMessage('End of queue.', 2000);
        stopRenderLoop();
        render();
      }
      break;
    }

    case 'b': {
      // Previous track
      const prevTrack = queue.prev();
      playTrack(prevTrack);
      break;
    }

    case 's': {
      // Stop
      player.stop();
      status = 'stopped';
      setMessage('Stopped.', 1500);
      stopRenderLoop();
      render();
      break;
    }

    case '+':
    case '=': {
      // Volume up
      player.setVolume(player.volume + 10);
      setMessage(`Volume: ${player.volume}%`, 1500);
      break;
    }

    case '-': {
      // Volume down
      player.setVolume(player.volume - 10);
      setMessage(`Volume: ${player.volume}%`, 1500);
      break;
    }

    case 'r': {
      // Toggle repeat
      const repeatOn = queue.toggleRepeat();
      setMessage(repeatOn ? 'Repeat ON' : 'Repeat OFF', 1500);
      break;
    }

    case 'z': {
      // Toggle shuffle
      const shuffleOn = queue.toggleShuffle();
      setMessage(shuffleOn ? 'Shuffle ON' : 'Shuffle OFF', 1500);
      break;
    }

    case 'q': {
      // Quit
      player.stop();
      stopRenderLoop();
      process.stdout.write('\x1B[?25h'); // Show cursor
      console.log('Goodbye!');
      process.exit(0);
    }

    default: {
      // Check for 1-9 track jump
      const trackNum = parseInt(key, 10);
      if (trackNum >= 1 && trackNum <= 9) {
        const trackToPlay = queue.jumpTo(trackNum - 1);
        if (trackToPlay) {
          playTrack(trackToPlay);
        } else {
          setMessage(`No track #${trackNum}.`, 1500);
        }
      }
      break;
    }
  }
}

/**
 * Set up keyboard input handling
 */
function setupKeyboard() {
  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (str, key) => {
    if (key && key.ctrl && key.name === 'c') {
      // Ctrl+C: same as 'q'
      handleKey('q');
    } else if (str) {
      handleKey(str.toLowerCase());
    }
  });
}

/**
 * Main entry point: set up the player, load music, and start the event loop
 */
async function main() {
  try {
    // Initialize UI
    await ui.init();

    // Get music path from command-line argument
    const musicPath = process.argv[2];
    if (!musicPath) {
      ui.renderError('Usage: node index.js /path/to/music/folder\nNo path provided.');
      process.exit(1);
    }

    // Resolve and validate the path
    const resolvedPath = path.resolve(musicPath);
    let stat;
    try {
      stat = fs.statSync(resolvedPath);
    } catch (err) {
      ui.renderError(`Path not found: ${resolvedPath}`);
      process.exit(1);
    }

    // Load tracks from directory or single file
    if (stat.isDirectory()) {
      const trackCount = queue.loadDirectory(resolvedPath);
      if (trackCount === 0) {
        ui.renderError(`No .mp3 files found in: ${resolvedPath}`);
        process.exit(1);
      }
    } else if (resolvedPath.toLowerCase().endsWith('.mp3')) {
      queue.addFile(resolvedPath);
    } else {
      ui.renderError('Path must be a directory or a .mp3 file.');
      process.exit(1);
    }

    // Show loading screen and probe durations
    ui.renderLoading(`Loading ${queue.total} track(s)...`);

    await probeAll(queue, (done, total) => {
      ui.renderLoading(`Probing tracks... ${done}/${total}`);
    });

    // Hide the cursor (we'll take over the terminal)
    process.stdout.write('\x1B[?25l');

    // Wire player events
    player.on('end', () => {
      // When a song finishes naturally, advance to next
      const nextTrack = queue.next();
      if (nextTrack) {
        playTrack(nextTrack);
      } else {
        player.stop();
        status = 'stopped';
        setMessage('End of queue.', 2000);
        stopRenderLoop();
        render();
      }
    });

    player.on('error', (err) => {
      setMessage(`Player error: ${err.message}`, 4000);
    });

    // Set up keyboard input
    setupKeyboard();

    // Initial render and auto-start playback
    setMessage(`Loaded ${queue.total} track(s). Starting playback...`, 1500);
    render();

    setTimeout(() => {
      playTrack(queue.current);
    }, 500);

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the application
main();

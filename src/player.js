const { EventEmitter } = require('events');
const { spawn } = require('child_process');

class Player extends EventEmitter {
  constructor() {
    super();
    this._process = null;
    this._paused = false;
    this._volume = 100;
    this._startTime = null;
    this._elapsed = 0;
  }

  play(filePath) {
    this.stop();

    // Spawn ffplay with audio-only flags
    this._process = spawn('ffplay', [
      '-nodisp',                    // no video window
      '-autoexit',                  // exit when song ends
      '-volume', String(this._volume),  // ffplay expects 0-100 scale
      '-loglevel', 'quiet',         // suppress ffplay's verbose output
      filePath
    ], {
      stdio: ['ignore', 'ignore', 'ignore']  // Ignore all stdio to avoid file descriptor issues
    });

    this._paused = false;
    this._elapsed = 0;
    this._startTime = Date.now();

    // Handle process close (song finished or user stopped it)
    this._process.on('close', (code) => {
      if (code === 0) {
        this.emit('end');
      }
      this._process = null;
    });

    // Handle process errors
    this._process.on('error', (error) => {
      this.emit('error', error);
      this._process = null;
    });
  }

  pause() {
    if (!this._process || this._paused) {
      return;
    }

    // SIGSTOP freezes the process at the OS level
    this._process.kill('SIGSTOP');
    this._paused = true;

    // Fold current segment's elapsed time into _elapsed
    this._elapsed += (Date.now() - this._startTime) / 1000;
    this._startTime = null;
  }

  resume() {
    if (!this._process || !this._paused) {
      return;
    }

    // SIGCONT un-freezes the process
    this._process.kill('SIGCONT');
    this._paused = false;
    this._startTime = Date.now();
  }

  stop() {
    if (this._process) {
      this._process.kill('SIGKILL');
    }

    this._process = null;
    this._paused = false;
    this._startTime = null;
    this._elapsed = 0;
  }

  /**
   * Stops playback and returns a Promise that resolves when the process has
   * actually exited. Used during shutdown to ensure ffplay is terminated
   * before the app exits, preventing orphaned audio playback.
   * @returns {Promise<void>}
   */
  async stopAndWait() {
    if (!this._process) {
      return;
    }

    const processRef = this._process;
    const pid = processRef.pid;
    this._process = null;
    this._paused = false;
    this._startTime = null;
    this._elapsed = 0;

    return new Promise((resolve) => {
      let resolved = false;

      const resolveOnce = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve();
        }
      };

      // Set a hard timeout - if process doesn't exit in 3 seconds, give up
      const timeout = setTimeout(() => {
        // Timeout firing means events didn't fire, so just resolve
        resolveOnce();
      }, 3000);

      // Wait for the process to actually emit the exit event
      const onExit = () => {
        resolveOnce();
      };

      const onClose = () => {
        resolveOnce();
      };

      processRef.once('exit', onExit);
      processRef.once('close', onClose);

      // Send SIGKILL to terminate the process
      try {
        processRef.kill('SIGKILL');
      } catch (err) {
        // Process already dead or error, just resolve
        resolveOnce();
      }
    });
  }

  togglePause() {
    if (!this._process) {
      return 'stopped';
    }

    if (this._paused) {
      this.resume();
      return 'playing';
    } else {
      this.pause();
      return 'paused';
    }
  }

  get elapsedSeconds() {
    if (!this._process) {
      return 0;
    }

    if (this._paused) {
      return this._elapsed;
    }

    return this._elapsed + (Date.now() - this._startTime) / 1000;
  }

  get isActive() {
    return this._process !== null;
  }

  get isPaused() {
    return this._paused;
  }

  get volume() {
    return this._volume;
  }

  setVolume(v) {
    // Guard against non-number values (NaN, strings, Infinity, etc.)
    if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) {
      return;
    }
    
    // Clamp between 0 and 100
    this._volume = Math.max(0, Math.min(100, v));
    
    // Note: Volume change only takes effect on the NEXT track played.
    // ffplay doesn't support live volume adjustments on a running process
    // without pausing/resuming with a new command. This is an ffplay limitation.
  }
}

module.exports = Player;

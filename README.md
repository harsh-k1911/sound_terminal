# Terminal Music Player

A fully-functional, terminal-based MP3 music player built with Node.js, featuring live playback control, shuffle/repeat modes, and a beautiful color-coded interface.

## Features

- **Play/Pause/Stop** — Control playback with single-key commands
- **Next/Previous** — Skip forward or backward through your library
- **Live Progress Bar** — See elapsed and total time, updates every second
- **Volume Control** — Adjust volume (0-100%) on the fly
- **Queue Loading** — Load all .mp3 files from a folder or play a single file
- **Shuffle Mode** — Randomize track order
- **Repeat Mode** — Loop the entire queue or stop at the end
- **Jump to Track** — Press 1-9 to jump to tracks 1-9 in the queue
- **Auto-Advance** — Automatically play the next track when one finishes
- **Transient Messages** — Status feedback (Volume: 75%) that auto-clears

## Tech Stack

| Technology | Role |
|---|---|
| **Node.js** | Runtime environment and CLI framework |
| **ffplay** | Audio playback engine (spawned as child process, controlled via OS signals) |
| **ffprobe** | MP3 metadata reading (duration extraction) |
| **readline** | Keyboard input handling (raw mode, keypress events) |
| **chalk** | Terminal colors and text styling (dynamic ESM import) |
| **EventEmitter** | Decoupled event-driven architecture (Player emits 'end' and 'error') |
| **child_process** | Process spawning and signal management (SIGSTOP/SIGCONT for pause/resume) |

## Prerequisites

- **Node.js v16 or higher** — Required for async/await, dynamic imports, and modern ES features
- **ffmpeg** — Provides ffplay (playback) and ffprobe (duration reading)

### Install ffmpeg

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt-get update && sudo apt-get install ffmpeg
```

**Windows (Chocolatey):**
```bash
choco install ffmpeg
```

**Other:** Download from https://ffmpeg.org/download.html

**Note:** ffplay and ffprobe are bundled with ffmpeg — no separate installation needed.

## Installation

```bash
# Clone the repository
git clone https://github.com/harsh-k1911/sound_terminal.git
cd sound_terminal

# Install dependencies
npm install
```

## Usage

### Play a folder of MP3s
```bash
node index.js /path/to/music/folder
```
Loads all .mp3 files alphabetically, probes durations, and starts playing.

### Play a single MP3 file
```bash
node index.js /path/to/song.mp3
```
Plays just that file; queue shows 1 track.

### After startup
The player begins playing the first track automatically. Use keyboard controls to navigate.

## Controls

| Key | Action |
|---|---|
| **Space / p** | Play/Pause toggle |
| **n** | Next track |
| **b** | Back (previous track) |
| **s** | Stop playback |
| **+** or **=** | Volume up (+10%) |
| **-** | Volume down (-10%) |
| **r** | Toggle Repeat mode |
| **z** | Toggle Shuffle mode |
| **1-9** | Jump to track 1-9 |
| **q** | Quit (restore cursor, exit cleanly) |
| **Ctrl+C** | Same as 'q' |

## Project Structure

```
terminal-music-player/
├── index.js              # Entry point: orchestrates all modules + keyboard input
├── package.json          # Dependencies (chalk for colors)
├── .gitignore            # Ignore node_modules, .DS_Store, .env, *.log
├── README.md             # This file
│
└── src/
    ├── queue.js          # Queue class: playlist navigation, shuffle, repeat
    ├── probe.js          # getDuration(), probeAll(): duration extraction via ffprobe
    ├── player.js         # Player class: ffplay spawning, pause/resume via SIGSTOP/SIGCONT
    └── ui.js             # UI class: terminal rendering, progress bar, queue display
```

### File Descriptions

- **index.js** — Main controller. Creates Player, Queue, UI instances. Wires them together with event listeners. Handles keyboard input via readline.emitKeypressEvents. Manages render loop (1/sec) and startup sequence (load → probe → play).

- **src/queue.js** — Playlist logic. Loads .mp3 files from a directory, tracks metadata (title, path, duration). Implements next()/prev()/jumpTo() with shuffle and repeat modes. Zero dependency on playback.

- **src/probe.js** — Duration extraction. Uses ffprobe via child_process.execFile to read MP3 lengths. Returns 0 gracefully on error (never rejects). Probes sequentially to avoid OS load spikes.

- **src/player.js** — Audio engine. Wraps ffplay as a child process. Implements pause/resume using SIGSTOP/SIGCONT OS signals. Emits 'end' event on natural completion, 'error' on crashes. Tracks elapsed time across pauses.

- **src/ui.js** — Terminal rendering. Takes a plain state object and renders the full screen: now-playing, progress bar, volume, mode badges, queue list, controls legend. Uses chalk for colors. No direct connection to Player/Queue (fully decoupled).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      index.js (Controller)                  │
│                                                               │
│  - Keyboard input (readline.emitKeypressEvents)             │
│  - State management (status, message, render loop)          │
│  - Event wiring (player.on('end', ...))                     │
│  - Startup sequence (load → probe → play)                   │
└────────────────────┬────────────────┬────────────────────────┘
                     │                │
        ┌────────────┴────┐  ┌────────┴──────────┐
        │                 │  │                   │
   ┌────▼─────┐      ┌────▼──────┐        ┌──────▼─────┐
   │  Queue   │      │  Player   │        │     UI     │
   │          │      │           │        │            │
   │- Load    │      │- Play     │        │- Render    │
   │- Navigate│      │- Pause    │        │- Format    │
   │- Shuffle │      │- Resume   │        │- Colors    │
   │- Repeat  │      │- Stop     │        │- Layout    │
   └──────────┘      │- Volume   │        └────────────┘
                     │- Events   │
                     └───────────┘
                            │
                            │
                        ┌───▼────┐
                        │ Probe  │
                        │        │
                        │ Duration
                        └────────┘
```

**Data Flow:**
1. User presses a key → index.js handleKey()
2. handleKey() updates Queue or Player
3. index.js render() calls getState()
4. getState() snapshots current values from Queue + Player
5. index.js passes state to UI.render()
6. UI.render() draws the terminal screen

**Event Flow:**
- Player emits 'end' → index.js auto-advances via queue.next()
- Player emits 'error' → index.js shows error message
- Each second, render loop redraws progress bar

## Concepts Demonstrated

This project illustrates several software engineering principles and modern Node.js patterns:

### Separation of Concerns
Each module has a single responsibility:
- Queue owns playlist logic, not playback
- Player owns audio, not UI or navigation
- UI owns rendering, not playback or control
- index.js owns orchestration, not implementation

**Why it matters:** Easy to test (mock other modules), easy to replace (swap ffplay for mpv), easy to understand (follow one concern at a time).

### Event-Driven Architecture
- Player emits 'end' and 'error' events
- index.js subscribes to player events
- No direct callbacks passed around; loose coupling

**Why it matters:** Multiple listeners can react to the same event; listeners can be added/removed dynamically.

### Process Management (OS-Level Tricks)
- ffplay spawned as child process
- SIGSTOP (pause) / SIGCONT (resume) for playback control
- SIGKILL for immediate termination
- Process signals work reliably across platforms

**Why it matters:** ffplay has no pause API; OS signals are the only solution. Demonstrates deep OS understanding.

### File I/O & Directory Traversal
- fs.readdirSync() to list .mp3 files
- fs.statSync() to distinguish files vs. directories
- path.resolve(), path.parse() for path manipulation
- Error handling for missing paths

**Why it matters:** Real CLI apps must handle various filesystem states gracefully.

### Async/Await & Promises
- async main() orchestrates startup
- await probeAll() waits for duration reading
- Promise-based getDuration() for non-blocking I/O
- probeAll() uses sequential awaits (not Promise.all) for simplicity

**Why it matters:** Non-blocking I/O is essential for responsive UIs; sequential processing trades speed for predictability.

### Dynamic Imports (ESM in CommonJS)
- chalk imported dynamically via `import()` (it's ESM-only)
- Needed because project uses CommonJS everywhere else
- Awaited in async init() method

**Why it matters:** Real projects mix module systems; dynamic imports bridge the gap.

### Terminal Control (ANSI Escape Sequences)
- Cursor hiding/showing (`\x1B[?25l`, `\x1B[?25h`)
- Screen clearing (`\x1B[2J\x1B[H`)
- Colors, bold, italic via chalk (which generates ANSI codes)

**Why it matters:** TUI applications must take control of the terminal; ANSI codes are the low-level mechanism.

### State Management & Rendering
- Centralized state (status, message, render loop)
- getState() snapshots current values
- Render loop (setInterval) decoupled from state changes
- Transient messages with auto-clear

**Why it matters:** Prevents flickering, enables consistent UI updates, avoids re-rendering on every keystroke.

### Error Handling Strategies
- Graceful degradation (getDuration returns 0 on error, doesn't crash)
- Early exit (main() validates path before loading)
- Try/catch for sync errors (path validation)
- Event-based async errors (player 'error' event)
- SIGINT safety net (process.on('SIGINT') for terminal cleanup)

**Why it matters:** Production code must not crash on edge cases; users expect graceful failure modes.

## Future Improvements

These features are out of scope for the current MVP but could enhance the player:

1. **Seeking** — Forward/backward within a track (arrow keys)
   - Requires parsing ffplay output stream or using a different player library

2. **ID3 Tag Reading** — Display artist, album, genre from MP3 metadata
   - Use node-id3 or similar library to read embedded tags

3. **Playlist Files (.m3u)** — Save/load .m3u playlists instead of just directories
   - Parse .m3u format, maintain playlist references

4. **Richer TUI** — Windows, panels, mouse support
   - Use blessed or ink library for advanced terminal UI

5. **Config File** — ~/.terminal-music-player/config.json for defaults
   - Remember last volume, repeat/shuffle state, favorite folders

6. **Now-Playing Browser** — Full queue view (press 'l' for list)
   - Scroll through entire queue, preview track info

7. **Visualization** — ASCII spectrum analyzer while playing
   - Use ffplay's output stream or a dedicated library

---

**Built with ❤️ as a portfolio project demonstrating modern Node.js patterns, CLI development, and terminal UI techniques.**


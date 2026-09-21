# ♫ Terminal Music Player

A fully functional MP3 music player that runs entirely in the terminal, built with Node.js.

## Features

Play, pause, stop, next, previous · live progress bar · volume control · queue loading from a folder · shuffle & repeat · jump to track · auto-advance on song end · ID3 metadata (title/artist) with filename fallback · clean process shutdown (no orphaned audio on quit)

## Tech Stack

Node.js · `ffplay` (playback, via `child_process`) · `ffprobe` (duration + ID3 tags) · `readline` (keyboard input) · `chalk` (colored UI) · `EventEmitter` (playback events)

## Prerequisites

Node.js v16+ and `ffmpeg` installed system-wide:

```bash
brew install ffmpeg        # macOS
sudo apt install ffmpeg    # Ubuntu/Debian
```

## Setup

```bash
git clone https://github.com/harsh-k1911/sound_terminal.git
cd sound_terminal
npm install
node index.js /path/to/music/folder   # or a single .mp3 file
```

## Controls

| Key | Action | Key | Action |
|---|---|---|---|
| `P` | Play/Pause | `R` | Repeat |
| `N` | Next | `H` | Shuffle |
| `B` | Back | `1`-`9` | Jump to track |
| `S` | Stop | `Q` | Quit |
| `V` | Volume | | |

## Project Structure

```
index.js         # Controller — wires everything, handles keyboard input
src/player.js     # Spawns/controls ffplay (play, pause, stop, volume)
src/queue.js       # Playlist logic (next, prev, shuffle, repeat)
src/probe.js        # Reads duration + ID3 tags via ffprobe
src/ui.js             # Terminal renderer
```

---

Built by **Harsh Kothari**

# Terminal Music Player - Design Notes (Commit 6)

## Overview

`index.js` is the orchestrator — it wires Player, Queue, UI, and keyboard input together into a cohesive application. It has almost **no playback logic of its own**. Instead, it delegates:

- **Player**: audio playback, pause/resume, volume
- **Queue**: track navigation, shuffle/repeat modes
- **UI**: terminal rendering, formatting, colors
- **Keyboard/Events**: input handling, state transitions

## Why index.js is Mostly Glue Code

Each module does one thing well:

1. **Player** knows how to play audio (ffplay, signals, events)
2. **Queue** knows how to navigate a playlist (next/prev/shuffle/repeat)
3. **UI** knows how to format and display state (colors, layout, truncation)
4. **index.js** knows how to connect them

If we baked everything into index.js, we'd have ~2000 lines of tangled logic. By keeping modules separate:
- Easy to test each piece in isolation (we did this in commits 2-5)
- Easy to swap implementations (e.g., replace ffplay with mpv)
- Easy to understand: follow the data flow instead of reading spaghetti code

## The Render Loop Strategy

The UI doesn't re-render on *every* state change. Instead:

```javascript
setInterval(render, 1000);  // Re-render every second
```

**Why not re-render on every state change?**
- **Flickering**: Every keystroke, event, state change would redraw → visual noise
- **Performance**: Terminal redraws are I/O-bound; 1/second is fast enough for a progress bar
- **Simplicity**: No event bus needed; just set state and let the timer pick it up

**When do we render outside the loop?**
- Immediately after a keypress (for snappy feedback)
- When showing a transient message (visible before it auto-clears)
- On mode toggles (shuffle/repeat changes should be instant)

**Real-world TUI libraries** (blessed, ink, etc.) do smarter updates using a virtual DOM and dirty checking. For our use case, full redraws every second are perfectly fine.

## Natural Song Completion vs. Manual Advance

Both `player.on('end')` and the `'n'` keypress handler advance to the next track:

```javascript
// Player event (song finished naturally)
player.on('end', () => {
  const nextTrack = queue.next();
  playTrack(nextTrack);  // or stop if null
});

// Keyboard handler (user pressed 'n')
case 'n': {
  const nextTrack = queue.next();
  playTrack(nextTrack);  // same logic!
}
```

**Why separate handlers?**
- **Semantics**: "Song ended" ≠ "User skipped" (useful for analytics/logging later)
- **Future flexibility**: We might retry on error, show a "still playing?" timeout, or log stats per event source
- **Decoupling**: Player doesn't know about keyboard; both just trigger the same business logic

This is the **Command pattern** — different event sources converge on the same action.

## Terminal Cursor Control

We hide the cursor at startup:
```javascript
process.stdout.write('\x1B[?25l');  // Hide
```

And show it at quit:
```javascript
process.stdout.write('\x1B[?25h');  // Show
```

**Why?**
- **Visual polish**: Blinking cursor would distract from the UI
- **Prevent corruption**: If user types while we're rendering, the cursor could appear mid-screen
- **Cleanup**: Exiting without restoring it leaves the terminal in a broken state

## Transient Messages

The `setMessage(msg, clearAfter)` pattern:

```javascript
setMessage('Volume: 75%', 1500);  // Show for 1.5 seconds
setMessage('Paused.', false);     // Show permanently (until next message)
```

**Why separate from permanent state?**
- Status bar feedback (volume, repeat toggle) should disappear automatically
- Errors/confirmations persist until explicitly cleared
- No special "message" field on Player/Queue — it's UI-only, managed at the controller level

## Error Handling

Three layers:

1. **Sync errors** (missing path, invalid file): caught in `main()` with try/catch, call `ui.renderError()`
2. **Async errors** (ffprobe fails, ffplay crashes): Player/Queue emit events or return gracefully (0 duration, null from next())
3. **Fatal**: Uncaught error in main() falls through to `console.error` (plain console since UI might not be ready)

## State Machine

The `status` variable tracks the player's mode:

```
stopped → playing → paused → playing → stopped (end of queue)
   ↓        ↓          ↓         ↓
  (p)      (p)        (p)       (n at end with no repeat)
```

- `playTrack(track)`: moves to playing (or stopped if track=null)
- `togglePause()`: moves between playing ↔ paused
- Stop/end: moves to stopped

Render loop respects status to show correct icon (▶/⏸/■).

## Key Mapping Philosophy

- **Single-char keys** (p/n/b/s/r/z/q): simple, memorable, no Shift needed
- **1-9 numeric**: track jumping (only 9 because more would clutter the legend)
- **+/- for volume**: consistent with many audio players (PuTTY, VLC use the same)
- **z for shuffle**: "z" → "shuffle" phonetically; avoids QWERTY conflicts
- **Ctrl+C**: same as 'q' because users expect it to exit

See the controls legend in `src/ui.js` for the full mapping.

## Auto-Start Playback

After loading and probing:

```javascript
setTimeout(() => {
  playTrack(queue.current);
}, 500);
```

Why the delay?
- Gives UI time to render the "Loaded N tracks..." message
- User sees something happened (files were loaded) before music starts
- Feels more intentional than instant playback

## Next Steps (Commit 7)

This is a fully functional player. Commit 7 will likely:
- Add optional config (default volume, auto-repeat, remember shuffle state)
- Improve error recovery (skip corrupted MP3s instead of crashing)
- Add a "now playing" queue browser screen (full list view)
- Performance optimization (parallel probing, incremental UI updates)

For now, the core loop works: load → probe → play → control → quit.

---

**Commit Message:**

```
feat: implement main controller (index.js) wiring player, queue, ui, keyboard

- Create Player + Queue + UI instances, wire with event listeners
- Implement getState() to snapshot current playback state for rendering
- Add render loop (1/second) for progress bar updates
- Implement playTrack() to handle natural track progression
- Handle keyboard input (p/n/b/s/+/−/r/z/1−9/q) via readline emitKeypressEvents
- Add transient message system with auto-clear (setMessage)
- Implement async main() for path validation, directory/file loading, duration probing
- Wire player 'end' event to auto-advance like 'n' keypress
- Hide cursor at startup, restore on quit for terminal cleanliness
- Include manual integration test guide (MANUAL_TEST.js)
- No automated tests (inherently interactive); verified via manual steps
```


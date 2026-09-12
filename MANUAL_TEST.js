#!/usr/bin/env node

/**
 * Manual Integration Test Guide for index.js
 * 
 * This script provides instructions for manually testing the music player.
 * Since the player is inherently interactive (real keyboard, real audio, real terminal),
 * full automation isn't practical. Follow these steps to verify all functionality.
 */

console.log(`
=== Terminal Music Player - Manual Integration Test ===

PREREQUISITES:
- A folder containing at least 3-5 .mp3 files
- ffmpeg + ffplay installed (brew install ffmpeg on macOS)
- Node.js with chalk installed (npm install)

TEST STEPS:

1. START THE PLAYER
   Command: node index.js /path/to/your/music/folder
   
   Expected:
   - Loading screen shows "Probing tracks... X/Y"
   - After probing, the main UI appears
   - "Loaded N track(s). Starting playback..." message
   - After ~1 second, playback starts automatically
   - Progress bar shows elapsed/total time
   - Now-playing line shows current track title

2. TEST PLAYBACK & PAUSE
   - Wait 5-10 seconds into the song
   - Press 'p' to pause
   - Expected: Status icon changes to ⏸, progress bar stops advancing, message shows "Paused."
   - Press 'p' again to resume
   - Expected: Status changes to ▶, progress advances again, message shows "Resumed."

3. TEST NEXT TRACK
   - Press 'n' to skip to next track
   - Expected: Now-playing line updates to new track title
   - Progress bar resets to 0:00
   - Message shows "Now playing: <new title>"

4. TEST PREVIOUS TRACK
   - Press 'b' to go to previous track
   - Expected: Jumps back one track (or to start of current if < 5 seconds in)
   - Now-playing updates, progress resets

5. TEST STOP
   - Press 's' to stop playback
   - Expected: Status icon changes to ■ (gray square)
   - Progress bar shows 0:00
   - Message shows "Stopped."

6. TEST VOLUME CONTROLS
   - Press '+' or '=' to increase volume
   - Expected: Volume bar increases, message shows "Volume: N%"
   - Press '-' to decrease volume
   - Expected: Volume bar decreases, message shows "Volume: N%"
   - Note: Changes apply to the NEXT track played (ffplay limitation)

7. TEST REPEAT MODE
   - Press 'r' to toggle repeat
   - Expected: Badge "REPEAT" changes from gray (off) to bright magenta (on)
   - Message shows "Repeat ON" or "Repeat OFF"
   - Verify: Play last track, press 'n' — with repeat ON, loops to first; OFF, shows "End of queue."

8. TEST SHUFFLE MODE
   - Press 'z' to toggle shuffle
   - Expected: Badge "SHUFFLE" changes from gray (off) to bright cyan (on)
   - Message shows "Shuffle ON" or "Shuffle OFF"
   - Verify: With shuffle ON, 'n' picks random tracks (not sequential)

9. TEST JUMP TO TRACK (1-9)
   - Press a number key '1' through '9'
   - Expected: Jumps to that track in the queue
   - Message shows "Now playing: <track title>" if track exists
   - Message shows "No track #N" if track number out of bounds

10. TEST END OF QUEUE
    - Go to last track (press 'n' repeatedly or use track 9 jump)
    - With repeat OFF, wait for song to finish or press 'n'
    - Expected: Status becomes ■ (stopped), message shows "End of queue."
    - With repeat ON, pressing 'n' at end jumps back to first track

11. TEST ERROR HANDLING
    - Run: node index.js /nonexistent/path
    - Expected: Error screen shows "Path not found" with usage hint
    - Run: node index.js (no arguments)
    - Expected: Error screen shows "Usage: ..." with usage hint

12. TEST KEYBOARD CONTROLS LEGEND
    - While playing, check the controls line
    - Expected: Shows [Space] Play/Pause, [N] Next, [P] Back, [S] Stop, [V] Vol, etc.
    - (Note: Legend currently uses letters; [Space] is represented as 'p' in actual impl)

13. TEST QUIT
    - Press 'q' to quit
    - Expected: Screen clears, "Goodbye!" message, terminal cursor reappears
    - Application exits cleanly

14. TEST CTRL+C
    - Press Ctrl+C (same as 'q')
    - Expected: Cleans up (cursor shown, goodbye message, exit)

KNOWN LIMITATIONS:
- Volume changes take effect on the NEXT track (ffplay doesn't support live volume)
- Progress bar updates ~1 second apart (not frame-by-frame)
- Shuffle within a stopped queue doesn't auto-update mode badges until next play
- Queue list shows ~5 tracks; jump to track 10+ doesn't jump (only 1-9 keys mapped)

TROUBLESHOOTING:
- No audio playing? Check ffmpeg installed (ffplay -version)
- Error on startup? Verify music folder has .mp3 files
- Terminal looks weird? Try running in a full-screen terminal
- Keyboard not responding? Press 'q' to quit and check terminal is in raw mode

VERIFICATION CHECKLIST:
  [ ] Playback starts automatically after loading
  [ ] Play/pause toggle works (p key)
  [ ] Next/prev navigation works (n/b keys)
  [ ] Stop works (s key)
  [ ] Volume +/- work (=/- keys), bar updates
  [ ] Repeat toggle works (r key), affects end-of-queue behavior
  [ ] Shuffle toggle works (z key), affects next() randomization
  [ ] Track jumping works (1-9 keys)
  [ ] End-of-queue handling works (with/without repeat)
  [ ] Quit cleans up properly (q key, cursor shown, exit)
  [ ] Transient messages disappear after 1-3 seconds
  [ ] Invalid paths show error screen

All tests pass? Great! The player is ready for production. 🎵
`);

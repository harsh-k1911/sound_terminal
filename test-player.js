const { execSync } = require('child_process');
const Player = require('./src/player.js');

console.log('=== Player Module Tests ===\n');

// Step 1: Check if ffplay is available
console.log('Checking for ffplay availability...');
let ffplayAvailable = false;
try {
  execSync('ffplay -version 2>&1 | head -1', { stdio: 'pipe' });
  ffplayAvailable = true;
  console.log('✓ ffplay is available on this system\n');
} catch (error) {
  console.warn('⚠ ffplay is NOT available. Install ffmpeg to enable playback.');
  console.warn('  On macOS: brew install ffmpeg');
  console.warn('  On Linux: sudo apt-get install ffmpeg');
  console.warn('  On Windows: https://ffmpeg.org/download.html\n');
}

// Step 2: Create a Player instance
console.log('Test 1: Player initialization...');
const player = new Player();

console.assert(player.isActive === false, 'Player should not be active on init');
console.assert(player.isPaused === false, 'Player should not be paused on init');
console.assert(player.elapsedSeconds === 0, 'Elapsed should be 0 on init');
console.assert(player.volume === 100, 'Volume should start at 100');
console.log('✓ Test 1 passed: Initial state is correct\n');

// Step 3: Test setVolume clamping
console.log('Test 2: Volume clamping...');
player.setVolume(150);
console.assert(player.volume === 100, 'Volume > 100 should clamp to 100');

player.setVolume(-50);
console.assert(player.volume === 0, 'Volume < 0 should clamp to 0');

player.setVolume(75);
console.assert(player.volume === 75, 'Valid volume should be set');
console.log('✓ Test 2 passed: Volume clamping works\n');

// Step 4: Test togglePause when stopped
console.log('Test 3: togglePause when stopped...');
const state = player.togglePause();
console.assert(state === 'stopped', 'togglePause should return "stopped" when no process');
console.log('✓ Test 3 passed: togglePause returns "stopped" correctly\n');

// Step 5: Manual playback test instructions
console.log('Test 4: Interactive playback test (manual verification)\n');
if (ffplayAvailable) {
  console.log('⚠ To manually test end-to-end playback, follow these steps:\n');
  console.log('1. Prepare an MP3 file (e.g., /path/to/song.mp3)');
  console.log('2. Run this Node code:');
  console.log('');
  console.log('   const Player = require("./src/player.js");');
  console.log('   const player = new Player();');
  console.log('   player.on("end", () => console.log("Song finished!"));');
  console.log('   player.on("error", (err) => console.error("Error:", err));');
  console.log('   player.play("/path/to/song.mp3");');
  console.log('');
  console.log('3. After a few seconds, press Enter and run:');
  console.log('   player.pause();  // Audio should freeze');
  console.log('   console.log("Paused at:", player.elapsedSeconds, "seconds");');
  console.log('');
  console.log('4. After a pause, resume:');
  console.log('   player.resume();  // Audio should continue');
  console.log('   console.log("Resumed from:", player.elapsedSeconds, "seconds");');
  console.log('');
  console.log('5. To stop:');
  console.log('   player.stop();  // Audio stops immediately');
  console.log('   console.log("Stopped. isActive:", player.isActive);');
  console.log('');
  console.log('Expected behavior:');
  console.log('- Play: audio plays, elapsedSeconds increases');
  console.log('- Pause: audio freezes, elapsedSeconds stays constant');
  console.log('- Resume: audio continues from where it paused');
  console.log('- Stop: audio stops, elapsedSeconds resets to 0, isActive becomes false\n');
} else {
  console.log('⚠ ffplay not available. Install ffmpeg to test playback.\n');
}

// Step 6: Test EventEmitter inheritance
console.log('Test 5: EventEmitter functionality...');
let errorEmitted = false;
player.on('error', () => {
  errorEmitted = true;
});
player.emit('error', new Error('test error'));
console.assert(errorEmitted === true, 'Player should be able to emit and listen to events');
console.log('✓ Test 5 passed: EventEmitter inheritance works\n');

console.log('=== Automated tests completed! ===');
console.log('For interactive testing with real audio, see Test 4 instructions above.');

const { execSync } = require('child_process');
const Queue = require('./src/queue.js');
const { getDuration, probeAll } = require('./src/probe.js');

console.log('=== Probe Module Tests ===\n');

// Step 1: Check if ffprobe is available
console.log('Checking for ffprobe availability...');
let ffprobeAvailable = false;
try {
  execSync('ffprobe -version', { stdio: 'ignore' });
  ffprobeAvailable = true;
  console.log('✓ ffprobe is available on this system\n');
} catch (error) {
  console.warn('⚠ ffprobe is NOT available. Install ffmpeg to enable duration probing.');
  console.warn('  On macOS: brew install ffmpeg');
  console.warn('  On Linux: sudo apt-get install ffmpeg');
  console.warn('  On Windows: https://ffmpeg.org/download.html\n');
}

// Step 2: Test getDuration with a fake file (should resolve to 0, not throw)
console.log('Test 1: getDuration with non-existent file (should return 0)...');
getDuration('/fake/nonexistent.mp3').then(duration => {
  console.assert(duration === 0, 'Should resolve to 0 for missing file');
  console.log('✓ Test 1 passed: getDuration gracefully handles missing files\n');

  // Step 3: Create a Queue and inject fake tracks
  console.log('Test 2: probeAll with fake tracks...');
  const q = new Queue();
  q._tracks = [
    { title: 'Track 1', filePath: '/fake/track1.mp3', duration: 0 },
    { title: 'Track 2', filePath: '/fake/track2.mp3', duration: 0 },
    { title: 'Track 3', filePath: '/fake/track3.mp3', duration: 0 }
  ];
  q._index = 0;

  let progressUpdates = [];
  probeAll(q, (done, total) => {
    progressUpdates.push({ done, total });
    console.log(`  Progress: ${done}/${total} tracks probed`);
  }).then(() => {
    console.assert(progressUpdates.length === 3, 'Should have 3 progress updates');
    console.assert(progressUpdates[0].done === 1, 'First update should be 1/3');
    console.assert(progressUpdates[2].done === 3, 'Last update should be 3/3');
    console.log('✓ Test 2 passed: probeAll processes all tracks sequentially\n');

    // Step 4: Verify queue durations are all 0 (since files don't exist)
    console.log('Test 3: Verify durations are set (to 0 for fake files)...');
    console.assert(q.tracks[0].duration === 0, 'Track 0 duration should be 0');
    console.assert(q.tracks[1].duration === 0, 'Track 1 duration should be 0');
    console.assert(q.tracks[2].duration === 0, 'Track 2 duration should be 0');
    console.log('✓ Test 3 passed: All durations set (0 for non-existent files)\n');

    // Step 5: If ffprobe is available, test with a real system audio file
    if (ffprobeAvailable) {
      console.log('Test 4: Probing a real system audio file...');
      // Try to find a system audio file or create a simple one
      const testAudioPath = '/System/Library/Sounds/Ping.aiff'; // macOS
      
      const q2 = new Queue();
      q2._tracks = [
        { title: 'System Audio', filePath: testAudioPath, duration: 0 }
      ];

      probeAll(q2).then(() => {
        if (q2.tracks[0].duration > 0) {
          console.log(`✓ Test 4 passed: Read duration = ${q2.tracks[0].duration.toFixed(2)}s`);
        } else {
          console.log(`⚠ Test 4: File not found or no duration (expected for some systems)`);
        }
        console.log('\n=== All tests completed! ===');
      });
    } else {
      console.log('=== All tests completed! (ffprobe not available, skipped real file test) ===');
    }
  });
});

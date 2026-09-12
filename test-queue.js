const Queue = require('./src/queue.js');

console.log('=== Queue Module Tests ===\n');

// Test 1: Basic initialization and getters
const q = new Queue();
console.assert(q.total === 0, 'Empty queue should have 0 tracks');
console.assert(q.current === null, 'Empty queue current should be null');
console.assert(q.currentIndex === 0, 'Index should start at 0');
console.assert(q.shuffle === false, 'Shuffle should start false');
console.assert(q.repeat === false, 'Repeat should start false');
console.log('✓ Test 1 passed: Initialization and getters');

// Test 2: Add fake tracks
const fakeTracks = [
  { title: 'Track 1', filePath: '/fake/track1.mp3', duration: 180 },
  { title: 'Track 2', filePath: '/fake/track2.mp3', duration: 240 },
  { title: 'Track 3', filePath: '/fake/track3.mp3', duration: 200 }
];

q._tracks = fakeTracks;
q._index = 0;

console.assert(q.total === 3, 'Should have 3 tracks');
console.assert(q.current.title === 'Track 1', 'Current should be Track 1');
console.log('✓ Test 2 passed: Track injection');

// Test 3: next() without shuffle/repeat
let track = q.next();
console.assert(q.currentIndex === 1, 'Should move to index 1');
console.assert(track.title === 'Track 2', 'Should return Track 2');

track = q.next();
console.assert(q.currentIndex === 2, 'Should move to index 2');
console.assert(track.title === 'Track 3', 'Should return Track 3');

track = q.next();
console.assert(track === null, 'At end with no repeat, should return null');
console.assert(q.currentIndex === 2, 'Index should not change at end without repeat');
console.log('✓ Test 3 passed: next() without repeat');

// Test 4: repeat mode
q._index = 2;
q.toggleRepeat();
console.assert(q.repeat === true, 'Repeat should be on');

track = q.next();
console.assert(q.currentIndex === 0, 'Should wrap to index 0 with repeat');
console.assert(track.title === 'Track 1', 'Should return Track 1 after wrap');
console.log('✓ Test 4 passed: Repeat mode and wraparound');

// Test 5: prev()
q._index = 1;
track = q.prev();
console.assert(q.currentIndex === 0, 'Should move to index 0');
console.assert(track.title === 'Track 1', 'Should return Track 1');

q._index = 0;
track = q.prev();
console.assert(q.currentIndex === 2, 'Should wrap to last track at index 0');
console.assert(track.title === 'Track 3', 'Should return Track 3 after wrap');
console.log('✓ Test 5 passed: prev() and wraparound');

// Test 6: jumpTo()
track = q.jumpTo(1);
console.assert(q.currentIndex === 1, 'Should jump to index 1');
console.assert(track.title === 'Track 2', 'Should return Track 2');

track = q.jumpTo(10);
console.assert(track === null, 'Out of bounds should return null');
console.assert(q.currentIndex === 1, 'Index should not change on invalid jump');
console.log('✓ Test 6 passed: jumpTo()');

// Test 7: setDuration()
q.setDuration(0, 150);
console.assert(q.tracks[0].duration === 150, 'Duration should be set to 150');
q.setDuration(1, 250);
console.assert(q.tracks[1].duration === 250, 'Duration should be set to 250');
console.log('✓ Test 7 passed: setDuration()');

// Test 8: toggleShuffle()
q._index = 1;
q.toggleRepeat();
q.toggleShuffle();
console.assert(q.shuffle === true, 'Shuffle should be on');

// Verify shuffle picks different track (run multiple times to check randomness)
let differentTrackFound = false;
for (let i = 0; i < 10; i++) {
  q._index = 1;
  const shuffledTrack = q.next();
  if (shuffledTrack.title !== 'Track 2') {
    differentTrackFound = true;
    break;
  }
}
console.assert(differentTrackFound, 'Shuffle should pick different tracks');
console.log('✓ Test 8 passed: shuffle mode and randomness');

console.log('\n=== All tests passed! ===');

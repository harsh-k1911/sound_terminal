const UI = require('./src/ui.js');

(async () => {
  console.log('=== UI Module Tests ===\n');

  // Initialize UI
  console.log('Initializing UI and importing chalk dynamically...');
  const ui = new UI();
  await ui.init();
  console.assert(ui._ready === true, 'UI should be ready after init');
  console.assert(ui._chalk !== null, 'Chalk should be imported');
  console.log('✓ UI initialized\n');

  // Create mock state
  const mockState = {
    status: 'playing',
    track: {
      title: 'Beautiful Day (Extended Remix Version)',
      duration: 245
    },
    elapsed: 87.5,
    volume: 75,
    shuffle: true,
    repeat: false,
    queueIndex: 2,
    queueTotal: 8,
    tracks: [
      { title: 'Track One', duration: 180 },
      { title: 'Track Two - The Sequel', duration: 215 },
      { title: 'Beautiful Day (Extended Remix Version)', duration: 245 },
      { title: 'Track Four: A New Beginning', duration: 198 },
      { title: 'Epic Finale', duration: 320 },
      { title: 'Bonus Hidden Track', duration: 125 },
      { title: 'Outro Music Box', duration: 89 },
      { title: 'Credits Roll', duration: 156 }
    ],
    message: 'Shuffle ON – Playing random order'
  };

  console.log('Test 1: Full render with playing status and queue\n');
  console.log('─'.repeat(80));
  ui.render(mockState);
  console.log('─'.repeat(80) + '\n');

  // Test 2: Paused state
  console.log('Test 2: Paused state render\n');
  console.log('─'.repeat(80));
  const pausedState = { ...mockState, status: 'paused', message: 'Music paused' };
  ui.render(pausedState);
  console.log('─'.repeat(80) + '\n');

  // Test 3: Stopped state (no track)
  console.log('Test 3: Stopped state render (no track loaded)\n');
  console.log('─'.repeat(80));
  const stoppedState = {
    status: 'stopped',
    track: null,
    elapsed: 0,
    volume: 100,
    shuffle: false,
    repeat: true,
    queueIndex: 0,
    queueTotal: 0,
    tracks: [],
    message: null
  };
  ui.render(stoppedState);
  console.log('─'.repeat(80) + '\n');

  // Test 4: renderLoading
  console.log('Test 4: Loading screen render\n');
  console.log('─'.repeat(80));
  ui.renderLoading('Scanning tracks... 12/47 files found');
  console.log('─'.repeat(80) + '\n');

  // Test 5: renderError
  console.log('Test 5: Error screen render\n');
  console.log('─'.repeat(80));
  ui.renderError('Directory not found: /nonexistent/path/to/music');
  console.log('─'.repeat(80) + '\n');

  // Test 6: Helper function tests
  console.log('Test 6: Helper function tests\n');

  // _fmt tests
  console.log('  _fmt() formatting:');
  console.assert(ui._fmt(0) === '0:00', '_fmt(0) should be "0:00"');
  console.assert(ui._fmt(45) === '0:45', '_fmt(45) should be "0:45"');
  console.assert(ui._fmt(125) === '2:05', '_fmt(125) should be "2:05"');
  console.assert(ui._fmt(3665) === '61:05', '_fmt(3665) should be "61:05"');
  console.assert(ui._fmt(NaN) === '0:00', '_fmt(NaN) should be "0:00"');
  console.assert(ui._fmt(undefined) === '0:00', '_fmt(undefined) should be "0:00"');
  console.log('  ✓ All _fmt() tests passed');

  // _bar tests (test that output is a string without checking colors)
  console.log('  _bar() progress bar:');
  const bar1 = ui._bar(0, 100);
  console.assert(typeof bar1 === 'string', '_bar() should return a string');
  
  const bar2 = ui._bar(50, 100);
  console.assert(typeof bar2 === 'string', '_bar() should return a string');
  
  const bar3 = ui._bar(100, 100);
  console.assert(typeof bar3 === 'string', '_bar() should return a string');
  
  const bar4 = ui._bar(50, 0);
  console.assert(typeof bar4 === 'string', '_bar() with zero total should return a string');
  
  console.log('  ✓ All _bar() tests passed');

  console.log('\n✓ Test 6 passed: All helpers work correctly\n');

  console.log('=== All UI tests completed! ===');
})();

class UI {
  constructor() {
    this._chalk = null;
    this._ready = false;
  }

  async init() {
    const { default: chalk } = await import('chalk');
    this._chalk = chalk;
    this._ready = true;
  }

  _fmt(sec) {
    if (!sec || isNaN(sec)) {
      return '0:00';
    }
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  _bar(elapsed, total, width = 30) {
    if (!total) {
      // No total duration; show a placeholder dashed line
      return this._chalk.gray('─'.repeat(width));
    }

    const ratio = Math.min(elapsed / total, 1);
    const filled = Math.round(ratio * width);
    const empty = width - filled;

    const filledBar = this._chalk.cyan('━'.repeat(filled));
    const emptyBar = this._chalk.gray('─'.repeat(empty));

    return filledBar + emptyBar;
  }

  _clear() {
    process.stdout.write('\x1B[2J\x1B[H');
  }

  render(state) {
    if (!this._ready) {
      return;
    }

    this._clear();

    const termWidth = Math.min(process.stdout.columns || 80, 60);
    const divider = this._chalk.gray('─'.repeat(termWidth));

    let output = '';

    // Header
    output += this._chalk.bold.cyan('♫  Terminal Music Player') + '\n';
    output += divider + '\n';

    // Now playing
    let statusIcon;
    let trackLine;

    if (state.status === 'playing') {
      statusIcon = this._chalk.green('▶');
    } else if (state.status === 'paused') {
      statusIcon = this._chalk.yellow('⏸');
    } else {
      statusIcon = this._chalk.gray('■');
    }

    if (state.track) {
      const title = state.track.title.length > termWidth - 4
        ? state.track.title.substring(0, termWidth - 7) + '...'
        : state.track.title;
      trackLine = `${statusIcon} ${this._chalk.bold.white(title)}`;
    } else {
      trackLine = `${statusIcon} ${this._chalk.gray('No track loaded')}`;
    }

    output += trackLine + '\n';

    // Progress bar
    const elapsedStr = this._fmt(state.elapsed);
    const totalStr = this._fmt(state.track?.duration || 0);
    const bar = this._bar(state.elapsed, state.track?.duration || 0);
    output += `${elapsedStr} ${bar} ${totalStr}\n`;

    // Volume bar
    const volBlocks = Math.round(state.volume / 10);
    const volFilled = this._chalk.green('█'.repeat(volBlocks));
    const volEmpty = this._chalk.gray('░'.repeat(10 - volBlocks));
    output += `Vol ${volFilled}${volEmpty} ${state.volume}%\n`;

    // Mode badges
    const shuffleBadge = state.shuffle
      ? this._chalk.bgCyan.black(' SHUFFLE ')
      : this._chalk.gray('shuffle');
    const repeatBadge = state.repeat
      ? this._chalk.bgMagenta.black(' REPEAT ')
      : this._chalk.gray('repeat');
    output += `${shuffleBadge} ${repeatBadge}\n`;

    output += divider + '\n';

    // Queue section
    output += `Queue [${state.queueIndex + 1}/${state.queueTotal}]\n`;

    if (state.tracks && state.tracks.length > 0) {
      // Show up to 5 tracks: 1 before, current, 3 after
      const start = Math.max(0, state.queueIndex - 1);
      const end = Math.min(state.tracks.length, state.queueIndex + 4);
      const windowTracks = state.tracks.slice(start, end);

      windowTracks.forEach((track, idx) => {
        const actualIdx = start + idx;
        const isCurrent = actualIdx === state.queueIndex;

        if (isCurrent) {
          const marker = this._chalk.cyan('›');
          const title = this._chalk.bold.cyan(track.title);
          const duration = this._chalk.gray(this._fmt(track.duration));
          output += `${marker} ${title.padEnd(termWidth - 10)} ${duration}\n`;
        } else {
          const title = this._chalk.gray(track.title);
          const duration = this._chalk.gray(this._fmt(track.duration));
          output += `  ${title.padEnd(termWidth - 10)} ${duration}\n`;
        }
      });

      if (end < state.tracks.length) {
        const remaining = state.tracks.length - end;
        output += this._chalk.gray(`... ${remaining} more track(s)\n`);
      }
    } else {
      output += this._chalk.gray('Queue is empty.\n');
    }

    output += divider + '\n';

    // Controls legend
    output += this._chalk.gray('Controls: [P] Play/Pause  [N] Next  [B] Back  [S] Stop  [V] Vol  [R] Repeat  [H] Shuffle  [Q] Quit\n');
    output += this._chalk.gray('           [1-9] Jump to track\n');

    output += divider + '\n';

    // Optional message
    if (state.message) {
      output += this._chalk.italic.yellow(state.message) + '\n';
    }

    process.stdout.write(output);
  }

  renderLoading(message) {
    if (!this._ready) {
      return;
    }

    this._clear();

    const termWidth = Math.min(process.stdout.columns || 80, 60);
    const divider = this._chalk.gray('─'.repeat(termWidth));

    let output = '';
    output += this._chalk.bold.cyan('♫  Terminal Music Player') + '\n';
    output += divider + '\n';
    output += this._chalk.gray(message) + '\n';

    process.stdout.write(output);
  }

  renderError(message) {
    if (!this._ready) {
      return;
    }

    this._clear();

    const termWidth = Math.min(process.stdout.columns || 80, 60);
    const divider = this._chalk.gray('─'.repeat(termWidth));

    let output = '';
    output += this._chalk.bold.red('✖ Error') + '\n';
    output += divider + '\n';
    output += this._chalk.red(message) + '\n';
    output += this._chalk.gray('Usage: node index.js /path/to/music/folder\n');

    process.stdout.write(output);
  }
}

module.exports = UI;

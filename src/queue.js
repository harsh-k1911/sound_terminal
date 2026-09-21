const fs = require('fs');
const path = require('path');

class Queue {
  constructor() {
    this._tracks = [];
    this._index = 0;
    this._shuffle = false;
    this._repeat = false;
  }

  // Loading tracks
  loadDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    const files = fs.readdirSync(dirPath)
      .filter(file => file.toLowerCase().endsWith('.mp3'))
      .sort();

    this._tracks = files.map(file => ({
      title: path.parse(file).name,
      filePath: path.join(dirPath, file),
      duration: 0,
      artist: '',
      album: ''
    }));

    this._index = 0;
    return this._tracks.length;
  }

  addFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    if (!filePath.toLowerCase().endsWith('.mp3')) {
      throw new Error(`File is not an MP3: ${filePath}`);
    }

    this._tracks.push({
      title: path.parse(filePath).name,
      filePath: filePath,
      duration: 0,
      artist: '',
      album: ''
    });
  }

  setDuration(index, seconds) {
    if (index >= 0 && index < this._tracks.length) {
      this._tracks[index].duration = seconds;
    }
  }

  setMetadata(index, metadata) {
    if (index >= 0 && index < this._tracks.length && metadata) {
      if (metadata.title && metadata.title.trim() !== '') {
        this._tracks[index].title = metadata.title.trim();
      }
      this._tracks[index].artist = metadata.artist || '';
      this._tracks[index].album = metadata.album || '';
    }
  }

  // Getters
  get current() {
    return this._tracks.length > 0 ? this._tracks[this._index] : null;
  }

  get currentIndex() {
    return this._index;
  }

  get total() {
    return this._tracks.length;
  }

  get tracks() {
    return this._tracks;
  }

  get shuffle() {
    return this._shuffle;
  }

  get repeat() {
    return this._repeat;
  }

  // Navigation
  next() {
    if (this._tracks.length === 0) {
      return null;
    }

    if (this._shuffle) {
      // Pick a random index different from current (if more than 1 track)
      if (this._tracks.length > 1) {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * this._tracks.length);
        } while (newIndex === this._index);
        this._index = newIndex;
      }
      return this._tracks[this._index];
    }

    // Not shuffle mode
    if (this._index < this._tracks.length - 1) {
      this._index++;
      return this._tracks[this._index];
    }

    // At the end
    if (this._repeat) {
      this._index = 0;
      return this._tracks[this._index];
    }

    return null;
  }

  prev() {
    if (this._tracks.length === 0) {
      return null;
    }

    if (this._index === 0) {
      this._index = this._tracks.length - 1;
    } else {
      this._index--;
    }

    return this._tracks[this._index];
  }

  jumpTo(index) {
    if (index >= 0 && index < this._tracks.length) {
      this._index = index;
      return this._tracks[this._index];
    }
    return null;
  }

  // Mode toggles
  toggleShuffle() {
    this._shuffle = !this._shuffle;
    return this._shuffle;
  }

  toggleRepeat() {
    this._repeat = !this._repeat;
    return this._repeat;
  }
}

module.exports = Queue;

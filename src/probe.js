const { execFile } = require('child_process');

/**
 * Gets the duration of an MP3 file using ffprobe.
 * 
 * IMPORTANT: This function NEVER rejects the promise, even if:
 * - ffprobe is missing from PATH entirely
 * - The file doesn't exist
 * - The file is corrupted or not an MP3
 * - Any other error occurs
 * 
 * Instead, it resolves to 0 on any error. This ensures that one bad file
 * doesn't crash the entire probing process during queue initialization.
 * 
 * @param {string} filePath - Path to the MP3 file
 * @returns {Promise<number>} Duration in seconds, or 0 if probe fails
 */
function getDuration(filePath) {
  return new Promise((resolve) => {
    execFile(
      'ffprobe',
      [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ],
      (error, stdout, stderr) => {
        if (error) {
          resolve(0);
          return;
        }

        const duration = parseFloat(stdout.trim());
        if (isNaN(duration)) {
          resolve(0);
        } else {
          resolve(duration);
        }
      }
    );
  });
}

/**
 * Gets ID3 metadata (title, artist, album) from an MP3 file using ffprobe.
 * 
 * IMPORTANT: This function NEVER rejects the promise, even if:
 * - ffprobe is missing from PATH entirely
 * - The file doesn't exist
 * - The file is corrupted or has no tags
 * - Any other error occurs
 * 
 * Instead, it resolves to { title: '', artist: '', album: '' } on any error.
 * 
 * @param {string} filePath - Path to the MP3 file
 * @returns {Promise<{title: string, artist: string, album: string}>}
 */
function getMetadata(filePath) {
  return new Promise((resolve) => {
    execFile(
      'ffprobe',
      [
        '-v', 'error',
        '-show_entries', 'format_tags=title,artist,album',
        '-of', 'json',
        filePath
      ],
      (error, stdout, stderr) => {
        if (error) {
          resolve({ title: '', artist: '', album: '' });
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const tags = data?.format?.tags || {};

          const findTag = (name) => {
            const lowerName = name.toLowerCase();
            for (const key of Object.keys(tags)) {
              if (key.toLowerCase() === lowerName && typeof tags[key] === 'string') {
                return tags[key].trim();
              }
            }
            return '';
          };

          resolve({
            title: findTag('title'),
            artist: findTag('artist'),
            album: findTag('album')
          });
        } catch (err) {
          resolve({ title: '', artist: '', album: '' });
        }
      }
    );
  });
}

/**
 * Probes all tracks in a queue to fill in their durations and ID3 metadata.
 * @param {Queue} queue - Queue instance with tracks to probe
 * @param {Function} onProgress - Optional callback(doneCount, totalCount) after each track
 * @returns {Promise<void>}
 */
async function probeAll(queue, onProgress) {
  const tracks = queue.tracks;

  for (let i = 0; i < tracks.length; i++) {
    const duration = await getDuration(tracks[i].filePath);
    queue.setDuration(i, duration);

    const metadata = await getMetadata(tracks[i].filePath);
    queue.setMetadata(i, metadata);

    if (onProgress) {
      onProgress(i + 1, tracks.length);
    }
  }
}

module.exports = { getDuration, getMetadata, probeAll };

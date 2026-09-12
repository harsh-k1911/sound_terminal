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
 * Probes all tracks in a queue to fill in their durations.
 * @param {Queue} queue - Queue instance with tracks to probe
 * @param {Function} onProgress - Optional callback(doneCount, totalCount) after each track
 * @returns {Promise<void>}
 */
async function probeAll(queue, onProgress) {
  const tracks = queue.tracks;

  for (let i = 0; i < tracks.length; i++) {
    const duration = await getDuration(tracks[i].filePath);
    queue.setDuration(i, duration);

    if (onProgress) {
      onProgress(i + 1, tracks.length);
    }
  }
}

module.exports = { getDuration, probeAll };

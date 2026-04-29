/**
 * Splits a timeline into contiguous scenes.
 * @param {number} totalDurationSeconds
 * @param {number[]} sceneChangeTimestamps
 * @returns {{index:number,start:number,end:number}[]}
 */
export function splitScenes(totalDurationSeconds, sceneChangeTimestamps) {
  if (!Number.isFinite(totalDurationSeconds) || totalDurationSeconds < 0) {
    throw new Error('totalDurationSeconds must be a finite number >= 0');
  }

  if (!Array.isArray(sceneChangeTimestamps)) {
    throw new Error('sceneChangeTimestamps must be an array');
  }

  const sorted = [...sceneChangeTimestamps].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i += 1) {
    const ts = sorted[i];
    if (!Number.isFinite(ts)) {
      throw new Error('sceneChangeTimestamps must contain finite numbers only');
    }
    if (ts <= 0 || ts >= totalDurationSeconds) {
      throw new Error('scene change timestamps must be strictly between 0 and totalDurationSeconds');
    }
    if (i > 0 && sorted[i - 1] === ts) {
      throw new Error('scene change timestamps must be unique');
    }
  }

  if (sceneChangeTimestamps.some((value, idx) => idx > 0 && sceneChangeTimestamps[idx - 1] > value)) {
    throw new Error('scene change timestamps must be sorted in ascending order');
  }

  const boundaries = [0, ...sorted, totalDurationSeconds];
  return boundaries.slice(0, -1).map((start, index) => ({
    index,
    start,
    end: boundaries[index + 1]
  }));
}

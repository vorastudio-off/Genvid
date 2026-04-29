import test from 'node:test';
import assert from 'node:assert/strict';
import { splitScenes } from '../backend/src/scene/sceneSplitter.js';

test('0s duration with no cuts returns one empty scene', () => {
  const scenes = splitScenes(0, []);
  assert.deepEqual(scenes, [{ index: 0, start: 0, end: 0 }]);
});

test('single scene when no cuts are provided', () => {
  const scenes = splitScenes(10, []);
  assert.deepEqual(scenes, [{ index: 0, start: 0, end: 10 }]);
});

test('boundary split example: 10s with cut at 5s', () => {
  const scenes = splitScenes(10, [5]);
  assert.deepEqual(scenes, [
    { index: 0, start: 0, end: 5 },
    { index: 1, start: 5, end: 10 }
  ]);
});

test('duplicate cuts are rejected', () => {
  assert.throws(() => splitScenes(10, [2, 2, 7]), /unique/);
});

test('unsorted cuts are rejected', () => {
  assert.throws(() => splitScenes(10, [8, 3]), /sorted/);
});

test('out-of-bounds cuts are rejected', () => {
  assert.throws(() => splitScenes(10, [0]), /strictly between/);
  assert.throws(() => splitScenes(10, [10]), /strictly between/);
});

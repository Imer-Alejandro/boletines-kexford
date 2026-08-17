const test = require('node:test');
const assert = require('node:assert/strict');
const { chunkArray } = require('../src/lib/batchUtils');

test('chunkArray splits items into fixed-size batches', () => {
  assert.deepEqual(chunkArray([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test('chunkArray returns empty array for empty input', () => {
  assert.deepEqual(chunkArray([], 100), []);
});

test('chunkArray rejects invalid batch size', () => {
  assert.throws(() => chunkArray([1], 0), /Batch size must be greater than zero/);
});

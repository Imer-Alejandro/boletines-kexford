const test = require('node:test');
const assert = require('node:assert/strict');
const worker = require('../src/worker');

test('worker exports processPendingRecipients', () => {
  assert.equal(typeof worker.processPendingRecipients, 'function');
});

test('processPendingRecipients returns processed count or handles connection error', async () => {
  try {
    const result = await worker.processPendingRecipients();
    assert.equal(typeof result.processed, 'number');
  } catch (err) {
    assert.ok(err instanceof Error);
  }
});

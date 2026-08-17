const test = require('node:test');
const assert = require('node:assert/strict');
const { generateUnsubscribeToken } = require('../src/lib/tokenUtils');

test('generates a 64-character hex string', () => {
  const token = generateUnsubscribeToken();
  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64);
  assert.match(token, /^[0-9a-f]{64}$/);
});

test('generates unique tokens', () => {
  const tokens = new Set();
  for (let i = 0; i < 50; i++) {
    tokens.add(generateUnsubscribeToken());
  }
  assert.equal(tokens.size, 50);
});

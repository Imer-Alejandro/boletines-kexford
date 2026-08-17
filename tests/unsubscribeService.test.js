const test = require('node:test');
const assert = require('node:assert/strict');
const { buildUnsubscribeUrl, ensureUnsubscribeToken, unsubscribeByToken } = require('../src/lib/unsubscribeService');

test('unsubscribeService exports all required functions', () => {
  assert.equal(typeof buildUnsubscribeUrl, 'function');
  assert.equal(typeof ensureUnsubscribeToken, 'function');
  assert.equal(typeof unsubscribeByToken, 'function');
});

test('buildUnsubscribeUrl constructs correct URL', () => {
  const original = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = 'https://boletin.kexford.com';
  const url = buildUnsubscribeUrl('abc123token');
  assert.equal(url, 'https://boletin.kexford.com/unsubscribe/abc123token');
  if (original) process.env.APP_BASE_URL = original;
  else delete process.env.APP_BASE_URL;
});

test('buildUnsubscribeUrl strips trailing slash from base', () => {
  const original = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = 'https://boletin.kexford.com/';
  const url = buildUnsubscribeUrl('token123');
  assert.equal(url, 'https://boletin.kexford.com/unsubscribe/token123');
  if (original) process.env.APP_BASE_URL = original;
  else delete process.env.APP_BASE_URL;
});

test('buildUnsubscribeUrl throws without APP_BASE_URL', () => {
  const original = process.env.APP_BASE_URL;
  delete process.env.APP_BASE_URL;
  assert.throws(() => buildUnsubscribeUrl('token'), /Missing APP_BASE_URL/);
  if (original) process.env.APP_BASE_URL = original;
});

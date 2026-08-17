const test = require('node:test');
const assert = require('node:assert/strict');
const { sendMail, getTransport, resetTransport } = require('../src/lib/emailSender');

test('emailSender exports required functions', () => {
  assert.equal(typeof sendMail, 'function');
  assert.equal(typeof getTransport, 'function');
  assert.equal(typeof resetTransport, 'function');
});

test('getTransport throws when SMTP not configured', () => {
  const original = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  resetTransport();
  assert.throws(() => getTransport(), /Missing SMTP/);
  if (original) process.env.SMTP_HOST = original;
});

test('resetTransport clears cached transport', () => {
  resetTransport();
  assert.equal(typeof getTransport, 'function');
});

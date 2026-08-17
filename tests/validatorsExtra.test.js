const test = require('node:test');
const assert = require('node:assert/strict');
const { emailSchema } = require('../src/lib/validators');

test('emailSchema rejects emails longer than 320 chars', () => {
  const longEmail = 'a'.repeat(312) + '@test.com';
  assert.ok(!emailSchema.safeParse(longEmail).success);
});

test('emailSchema accepts international domains', () => {
  assert.ok(emailSchema.safeParse('user@empresa.com.do').success);
  assert.ok(emailSchema.safeParse('test@sub.domain.co.uk').success);
});

test('emailSchema trims whitespace', () => {
  const result = emailSchema.safeParse('  test@example.com  ');
  assert.ok(result.success);
  assert.equal(result.data, 'test@example.com');
});

test('emailSchema rejects emails with spaces', () => {
  assert.ok(!emailSchema.safeParse('user name@example.com').success);
});

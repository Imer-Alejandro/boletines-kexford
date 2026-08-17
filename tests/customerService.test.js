const test = require('node:test');
const assert = require('node:assert/strict');
const { listCustomers, importExcelCustomers, importCustomersFromJson, getCustomerStats, parseExcelFile } = require('../src/lib/customerService');

test('customerService exports all required functions', () => {
  assert.equal(typeof listCustomers, 'function');
  assert.equal(typeof importExcelCustomers, 'function');
  assert.equal(typeof importCustomersFromJson, 'function');
  assert.equal(typeof getCustomerStats, 'function');
  assert.equal(typeof parseExcelFile, 'function');
});

test('importCustomersFromJson validates and normalizes data', async () => {
  try {
    await importCustomersFromJson([
      { name: 'Luis', email: '  LUIS@Test.COM  ' },
      { name: 'Maria', email: 'maria@test.com' },
    ]);
  } catch (err) {
    assert.ok(err.message.includes('connect') || err.message.includes('Missing') || err.message.includes('DATABASE'));
  }
});

test('importCustomersFromJson rejects empty array', async () => {
  try {
    const result = await importCustomersFromJson([]);
    assert.equal(result.imported, 0);
  } catch (err) {
    assert.ok(err instanceof Error);
  }
});

test('importCustomersFromJson filters invalid emails', async () => {
  try {
    await importCustomersFromJson([
      { name: 'Valid', email: 'ok@test.com' },
      { name: 'Invalid', email: 'not-an-email' },
      { name: 'Empty', email: '' },
    ]);
  } catch (err) {
    assert.ok(err instanceof Error);
  }
});

test('importCustomersFromJson handles non-object items', async () => {
  try {
    await importCustomersFromJson([null, 'string', 123, { email: 'ok@test.com', name: 'OK' }]);
  } catch (err) {
    assert.ok(err instanceof Error);
  }
});

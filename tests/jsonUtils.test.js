const test = require('node:test');
const assert = require('node:assert/strict');
const { serializeBigInt } = require('../src/lib/jsonUtils');

test('serializeBigInt converts bigint values to strings', () => {
  const payload = {
    id: BigInt(42),
    nested: [{ campaign_id: BigInt(99) }],
  };

  assert.deepEqual(serializeBigInt(payload), {
    id: '42',
    nested: [{ campaign_id: '99' }],
  });
});

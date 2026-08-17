function serializeBigInt(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) => (
      typeof currentValue === 'bigint' ? currentValue.toString() : currentValue
    ))
  );
}

module.exports = { serializeBigInt };

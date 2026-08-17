function chunkArray(items, size) {
  if (size <= 0) {
    throw new Error('Batch size must be greater than zero');
  }

  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

module.exports = { chunkArray };

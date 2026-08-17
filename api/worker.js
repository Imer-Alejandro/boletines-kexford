const { processPendingRecipients } = require('../src/worker');

module.exports = async (req, res) => {
  try {
    const result = await processPendingRecipients();
    res.status(200).json({ message: 'Worker ejecutado', ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al ejecutar worker' });
  }
};

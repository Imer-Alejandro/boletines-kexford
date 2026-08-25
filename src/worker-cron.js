require('dotenv').config();
const { processPendingRecipients } = require('./worker');

async function run() {
  const start = Date.now();
  try {
    const result = await processPendingRecipients();
    if (result.processed > 0) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`[cron-worker] ${result.processed} destinatarios procesados en ${elapsed}s`);
    }
  } catch (error) {
    console.error(`[cron-worker] Error:`, error.message);
    process.exitCode = 1;
  } finally {
    const prisma = require('./lib/prismaClient');
    await prisma.$disconnect();
  }
}

run();

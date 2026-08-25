require('dotenv').config();
const { processPendingRecipients } = require('./worker');

async function run() {
  const start = Date.now();
  console.log(`[cron-worker] Iniciando procesamiento...`);
  try {
    const result = await processPendingRecipients();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (result.processed > 0) {
      console.log(`[cron-worker] ${result.processed} destinatarios procesados en ${elapsed}s`);
    } else {
      console.log(`[cron-worker] Sin destinatarios pendientes (${elapsed}s)`);
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

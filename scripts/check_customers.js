const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.customer.count();
    const sample = await prisma.customer.findMany({ take: 5 });
    console.log('COUNT:' + count);
    console.log(JSON.stringify(sample, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();

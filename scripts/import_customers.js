require('dotenv').config();
const { importSqlServerCustomers } = require('../src/lib/customerService');
(async () => {
  try {
    const res = await importSqlServerCustomers();
    console.log('IMPORT RESULT:', res);
  } catch (e) {
    console.error('IMPORT ERROR:', e);
    process.exitCode = 1;
  }
})();

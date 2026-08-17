const express = require('express');
const router = express.Router();
const { listCustomers, importCustomersFromJson, getCustomerStats } = require('../lib/customerService');

router.get('/', async (req, res) => {
  try {
    const customers = await listCustomers();
    res.json({ ok: true, customers, count: customers.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await getCustomerStats();
    res.json({ ok: true, ...stats });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { customers } = req.body;
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Debes enviar un array "customers" con al menos un registro: { customers: [{ name, email }] }',
      });
    }
    const result = await importCustomersFromJson(customers);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;

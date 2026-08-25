require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const campaignRoutes = require('./routes/campaigns');
const customerRoutes = require('./routes/customers');
const unsubscribeRoutes = require('./routes/unsubscribe');
const { requireAuth } = require('./middleware/auth');
const { serializeBigInt } = require('./lib/jsonUtils');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
  credentials: corsOrigin !== '*',
}));

app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(serializeBigInt(body));
  next();
});

const SERVER_START = Date.now();
const MONTHLY_HOUR_LIMIT = Number(process.env.MONTHLY_HOUR_LIMIT || 750);
const HOUR_BUFFER = Number(process.env.HOUR_BUFFER || 30);

function getUptimeHours() {
  return (Date.now() - SERVER_START) / (1000 * 60 * 60);
}

function isOverHourLimit() {
  return getUptimeHours() >= (MONTHLY_HOUR_LIMIT - HOUR_BUFFER);
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server Boletin Kexford API' });
});

app.get('/health', async (req, res) => {
  if (isOverHourLimit()) {
    return res.status(503).json({
      status: 'rate_limited',
      message: 'Límite de horas mensuales alcanzado. Cron pausado.',
      uptime_hours: Math.round(getUptimeHours() * 100) / 100,
      limit: MONTHLY_HOUR_LIMIT,
      buffer: HOUR_BUFFER,
    });
  }
  try {
    const prisma = require('./lib/prismaClient');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.get('/status', requireAuth, (req, res) => {
  const uptimeHours = Math.round(getUptimeHours() * 100) / 100;
  const remainingHours = Math.round((MONTHLY_HOUR_LIMIT - HOUR_BUFFER - uptimeHours) * 100) / 100;
  res.json({
    status: 'ok',
    uptime_hours: uptimeHours,
    monthly_limit: MONTHLY_HOUR_LIMIT,
    buffer: HOUR_BUFFER,
    remaining_hours: remainingHours,
    worker: 'render-cron-job',
  });
});

app.use('/campaigns', requireAuth, campaignRoutes);
app.use('/customers', requireAuth, customerRoutes);
app.use('/unsubscribe', unsubscribeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;

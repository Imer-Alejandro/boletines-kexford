const express = require('express');
const router = express.Router();
const {
  createCampaign,
  listCampaigns,
  getCampaignById,
  getCampaignRecipients,
  getCampaignStats,
  pauseCampaign,
  cancelCampaign,
  resumeCampaign,
  retryFailedRecipients,
  forceSendRecipients,
} = require('../lib/campaignService');

router.get('/', async (req, res) => {
  try {
    const campaigns = await listCampaigns();
    res.json({ ok: true, campaigns });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createCampaign(req.body);
    res.status(201).json({ ok: true, ...result });
  } catch (error) {
    const status = error.message.includes('Ya existe') ? 409 : 400;
    res.status(status).json({ ok: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await getCampaignById(Number(req.params.id));
    res.json({ ok: true, campaign });
  } catch (error) {
    res.status(404).json({ ok: false, error: error.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await getCampaignStats(Number(req.params.id));
    res.json({ ok: true, stats });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ ok: false, error: error.message });
  }
});

router.get('/:id/recipients', async (req, res) => {
  try {
    const recipients = await getCampaignRecipients(Number(req.params.id));
    res.json({ ok: true, recipients, count: recipients.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/:id/pause', async (req, res) => {
  try {
    const campaign = await pauseCampaign(Number(req.params.id));
    res.json({ ok: true, campaign, message: 'Campaña pausada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const campaign = await cancelCampaign(Number(req.params.id));
    res.json({ ok: true, campaign, message: 'Campaña cancelada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/:id/resume', async (req, res) => {
  try {
    const campaign = await resumeCampaign(Number(req.params.id));
    res.json({ ok: true, campaign, message: 'Campaña reanudada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/:id/force-send', async (req, res) => {
  try {
    const result = await forceSendRecipients(Number(req.params.id));
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/:id/retry-failed', async (req, res) => {
  try {
    const result = await retryFailedRecipients(Number(req.params.id), req.body || {});
    res.json({ ok: true, ...result, message: 'Fallidos reprogramados correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

module.exports = router;

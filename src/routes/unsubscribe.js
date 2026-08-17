const express = require('express');
const router = express.Router();
const { unsubscribeByToken } = require('../lib/unsubscribeService');
const { createUnsubscribeConfirmationHtml } = require('../lib/emailTemplate');

async function handleUnsubscribe(req, res) {
  try {
    const result = await unsubscribeByToken(req.params.token);

    if (req.method === 'GET' && req.headers.accept && req.headers.accept.includes('text/html')) {
      res.type('html').send(createUnsubscribeConfirmationHtml(result));
      return;
    }

    res.json({
      message: result.alreadyUnsubscribed
        ? 'Email was already unsubscribed'
        : 'Email unsubscribed successfully',
      ...result,
    });
  } catch (error) {
    const statusCode = error.message === 'Invalid unsubscribe token' ? 404 : 400;
    if (req.method === 'GET' && req.headers.accept && req.headers.accept.includes('text/html')) {
      res.status(statusCode).type('html').send(`<h1>Baja de boletines</h1><p>${error.message}</p>`);
      return;
    }
    res.status(statusCode).json({ error: error.message });
  }
}

router.get('/:token', handleUnsubscribe);
router.post('/:token', handleUnsubscribe);

module.exports = router;

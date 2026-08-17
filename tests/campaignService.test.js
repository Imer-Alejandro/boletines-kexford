const test = require('node:test');
const assert = require('node:assert/strict');

test('campaignService exports all required functions', () => {
  const svc = require('../src/lib/campaignService');
  assert.equal(typeof svc.createCampaign, 'function');
  assert.equal(typeof svc.listCampaigns, 'function');
  assert.equal(typeof svc.getCampaignById, 'function');
  assert.equal(typeof svc.getCampaignRecipients, 'function');
  assert.equal(typeof svc.getCampaignStats, 'function');
  assert.equal(typeof svc.pauseCampaign, 'function');
  assert.equal(typeof svc.cancelCampaign, 'function');
  assert.equal(typeof svc.resumeCampaign, 'function');
  assert.equal(typeof svc.retryFailedRecipients, 'function');
  assert.equal(typeof svc.refreshCampaignTotals, 'function');
  assert.equal(typeof svc.assertNoActiveCampaign, 'function');
});

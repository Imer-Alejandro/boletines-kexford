const prisma = require('./lib/prismaClient');
const { sendMail } = require('./lib/emailSender');
const { createEmailHtml } = require('./lib/emailTemplate');
const { buildUnsubscribeUrl, ensureUnsubscribeToken } = require('./lib/unsubscribeService');
const { refreshCampaignTotals } = require('./lib/campaignService');

const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 3);
const PROCESSING_TIMEOUT_SECONDS = Number(process.env.PROCESSING_TIMEOUT_SECONDS || 600);
const RECOVERY_LIMIT_PER_RUN = Number(process.env.RECOVERY_LIMIT_PER_RUN || 10);
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 10);

async function recoverStuckRecipients() {
  const threshold = new Date(Date.now() - PROCESSING_TIMEOUT_SECONDS * 1000);
  await prisma.campaignRecipient.updateMany({
    where: {
      status: 'PROCESSING',
      processing_at: { lte: threshold },
      campaign: { status: 'RUNNING' },
    },
    data: {
      status: 'PENDING',
      processing_at: null,
    },
  });
}

async function fetchPendingRecipients(limit) {
  const now = new Date();
  return prisma.campaignRecipient.findMany({
    where: {
      status: 'PENDING',
      scheduled_at: { lte: now },
      campaign: { status: 'RUNNING' },
      customer: {
        active: true,
        unsubscribed_at: null,
      },
    },
    include: {
      campaign: true,
      customer: true,
    },
    orderBy: { scheduled_at: 'asc' },
    take: limit,
  });
}

async function lockRecipient(recipientId) {
  const now = new Date();
  const result = await prisma.campaignRecipient.updateMany({
    where: {
      id: BigInt(recipientId),
      status: 'PENDING',
      campaign: { status: 'RUNNING' },
      customer: {
        active: true,
        unsubscribed_at: null,
      },
    },
    data: {
      status: 'PROCESSING',
      processing_at: now,
      last_attempt_at: now,
    },
  });

  return result.count > 0;
}

async function updateRecipientStatus(recipientId, updates) {
  await prisma.campaignRecipient.update({
    where: { id: BigInt(recipientId) },
    data: updates,
  });
}

async function sendRecipient(recipient) {
  const campaign = recipient.campaign;
  if (!campaign) {
    throw new Error('Campaign missing for recipient');
  }

  const token = await ensureUnsubscribeToken(recipient.customer_id);
  const unsubscribeUrl = buildUnsubscribeUrl(token);
  const privacyPolicyUrl = process.env.PRIVACY_POLICY_URL || null;

  const title = campaign.title || 'Programa de Boletines Informativo Kexford para la Salud Financiera';
  const content = campaign.content || '';

  const html = createEmailHtml({
    title,
    content,
    imageUrl: campaign.image_url,
    unsubscribeUrl,
    privacyPolicyUrl,
  });

  const text = [
    title,
    '',
    content || null,
    '',
    `Darse de baja: ${unsubscribeUrl}`,
    privacyPolicyUrl ? `Política de privacidad: ${privacyPolicyUrl}` : null,
    '',
    `(c) ${new Date().getFullYear()} Sanchez Business & Corp. Todos los derechos reservados.`,
  ].filter(Boolean).join('\n');

  await sendMail({
    to: recipient.email,
    subject: campaign.subject,
    html,
    text,
  });
}

async function processRecipient(recipient) {
  const isLocked = await lockRecipient(recipient.id);
  if (!isLocked) {
    return null;
  }

  try {
    await sendRecipient(recipient);
    await updateRecipientStatus(recipient.id, {
      status: 'SENT',
      sent_at: new Date(),
      processing_at: null,
      error_message: null,
    });
    return { campaignId: recipient.campaign_id, status: 'SENT' };
  } catch (error) {
    const attempts = (recipient.attempts || 0) + 1;
    const nextStatus = attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING';

    await updateRecipientStatus(recipient.id, {
      status: nextStatus,
      attempts,
      processing_at: null,
      last_attempt_at: new Date(),
      error_message: error.message,
    });

    return { campaignId: recipient.campaign_id, status: nextStatus };
  }
}

async function processPendingRecipients() {
  const activeCampaigns = await prisma.campaign.count({
    where: { status: 'RUNNING' },
  });

  if (activeCampaigns === 0) {
    return { processed: 0 };
  }

  await recoverStuckRecipients();
  const limit = Math.min(BATCH_SIZE, RECOVERY_LIMIT_PER_RUN);
  const recipients = await fetchPendingRecipients(limit);

  if (recipients.length === 0) {
    console.log('No pending recipients ready to send');
    return { processed: 0 };
  }

  const campaignsToRefresh = new Set();

  for (const recipient of recipients) {
    try {
      const result = await processRecipient(recipient);
      if (result) {
        campaignsToRefresh.add(result.campaignId);
      }
    } catch (error) {
      console.error(`Failed to process recipient ${recipient.id}:`, error.message);
    }
  }

  for (const campaignId of campaignsToRefresh) {
    await refreshCampaignTotals(campaignId);
  }

  return { processed: recipients.length };
}

module.exports = { processPendingRecipients };

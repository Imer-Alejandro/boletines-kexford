const prisma = require('./prismaClient');
const { emailSchema, campaignSchema } = require('./validators');
const { generateScheduledAtTimes } = require('./scheduleGenerator');
const { chunkArray } = require('./batchUtils');

const RECIPIENT_BATCH_SIZE = Number(process.env.RECIPIENT_BATCH_SIZE || 500);
const ACTIVE_CAMPAIGN_STATUSES = ['RUNNING', 'PAUSED'];

async function fetchActiveCustomers() {
  const customersData = await prisma.customer.findMany({
    where: {
      active: true,
      unsubscribed_at: null,
    },
    orderBy: { id: 'asc' },
  });

  const seen = new Set();
  const validCustomers = [];
  let totalFound = 0;

  for (const customer of customersData) {
    totalFound += 1;
    if (!customer.email) continue;
    const email = customer.email.trim().toLowerCase();
    const validation = emailSchema.safeParse(email);
    if (!validation.success) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    validCustomers.push({
      id: customer.id,
      external_id: customer.external_id,
      name: customer.name,
      email,
    });
  }

  return { customers: validCustomers, totalFound };
}

function parseTimeToDate(timeString) {
  const normalized = timeString.length === 5 ? `${timeString}:00` : timeString;
  return new Date(`1970-01-01T${normalized}Z`);
}

function formatTimeFromDate(dateValue) {
  const date = new Date(dateValue);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateFromDate(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

async function assertNoActiveCampaign(excludeCampaignId = null) {
  const activeCampaign = await prisma.campaign.findFirst({
    where: {
      status: { in: ACTIVE_CAMPAIGN_STATUSES },
      ...(excludeCampaignId ? { id: { not: BigInt(excludeCampaignId) } } : {}),
    },
  });

  if (activeCampaign) {
    throw new Error(
      `Ya existe una campaña activa (id: ${activeCampaign.id}, status: ${activeCampaign.status}). Pausa o cancela esa campaña primero.`
    );
  }
}

async function createRecipientsInBatches(campaignId, customers, scheduledAt) {
  const recipientRecords = customers.map((customer, index) => ({
    campaign_id: campaignId,
    customer_id: customer.id,
    email: customer.email,
    scheduled_at: new Date(scheduledAt[index]),
  }));

  for (const batch of chunkArray(recipientRecords, RECIPIENT_BATCH_SIZE)) {
    await prisma.campaignRecipient.createMany({ data: batch });
  }
}

async function refreshCampaignTotals(campaignId) {
  const id = BigInt(campaignId);
  const [pendingCount, sentCount, failedCount, campaign] = await Promise.all([
    prisma.campaignRecipient.count({
      where: { campaign_id: id, status: 'PENDING' },
    }),
    prisma.campaignRecipient.count({
      where: { campaign_id: id, status: 'SENT' },
    }),
    prisma.campaignRecipient.count({
      where: { campaign_id: id, status: 'FAILED' },
    }),
    prisma.campaign.findUnique({ where: { id } }),
  ]);

  const updateData = {
    total_pending: pendingCount,
    total_sent: sentCount,
    total_failed: failedCount,
  };

  if (campaign && campaign.status === 'RUNNING' && pendingCount === 0) {
    updateData.status = 'COMPLETED';
  }

  await prisma.campaign.update({
    where: { id },
    data: updateData,
  });
}

async function createCampaign(payload) {
  const validated = campaignSchema.parse(payload);
  await assertNoActiveCampaign();

  let customers;
  let totalFound;
  let isTestMode = false;

  if (validated.test_emails && validated.test_emails.length > 0) {
    isTestMode = true;
    const normalizedEmails = validated.test_emails.map((e) => e.trim().toLowerCase());
    const found = await prisma.customer.findMany({
      where: {
        email: { in: normalizedEmails },
        active: true,
      },
      select: { id: true, external_id: true, name: true, email: true },
    });
    const seen = new Set();
    customers = [];
    for (const c of found) {
      const email = c.email.trim().toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      customers.push({ id: c.id, external_id: c.external_id, name: c.name, email });
    }
    totalFound = customers.length;
    if (customers.length === 0) {
      throw new Error('Ninguno de los correos de prueba fue encontrado como cliente activo');
    }
    const notFound = normalizedEmails.filter((e) => !seen.has(e));
    if (notFound.length > 0) {
      throw new Error(
        `Estos correos no están registrados como clientes activos: ${notFound.join(', ')}`
      );
    }
  } else {
    const result = await fetchActiveCustomers();
    customers = result.customers;
    totalFound = result.totalFound;
  }

  if (customers.length === 0) {
    throw new Error('No se encontraron clientes activos válidos para la campaña');
  }

  const scheduledAt = generateScheduledAtTimes(validated, customers.length);

  const campaign = await prisma.campaign.create({
    data: {
      name: validated.name + (isTestMode ? ' [PRUEBA]' : ''),
      title: validated.title,
      content: validated.content || '',
      subject: validated.subject,
      image_url: validated.image_url,
      start_date: new Date(validated.start_date),
      end_date: new Date(validated.end_date),
      start_time: parseTimeToDate(validated.start_time),
      end_time: parseTimeToDate(validated.end_time),
      daily_limit: validated.daily_limit,
      hourly_limit: validated.hourly_limit,
      min_interval_seconds: validated.min_interval_seconds,
      max_interval_seconds: validated.max_interval_seconds,
      status: 'RUNNING',
      total_recipients: customers.length,
      total_pending: customers.length,
    },
  });

  await createRecipientsInBatches(campaign.id, customers, scheduledAt);

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      title: campaign.title,
      subject: campaign.subject,
      image_url: campaign.image_url,
      status: campaign.status,
      total_recipients: customers.length,
      total_pending: customers.length,
      start_date: validated.start_date,
      end_date: validated.end_date,
      daily_limit: validated.daily_limit,
    },
    totalFound,
    validRecipients: customers.length,
    testMode: isTestMode,
  };
}

async function listCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      title: true,
      subject: true,
      status: true,
      image_url: true,
      total_recipients: true,
      total_sent: true,
      total_failed: true,
      total_pending: true,
      start_date: true,
      end_date: true,
      created_at: true,
    },
  });
}

async function getCampaignById(id) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: BigInt(id) },
  });

  if (!campaign) {
    throw new Error('Campaña no encontrada');
  }

  return campaign;
}

async function getCampaignRecipients(campaignId) {
  return prisma.campaignRecipient.findMany({
    where: { campaign_id: BigInt(campaignId) },
    orderBy: { scheduled_at: 'asc' },
  });
}

async function getCampaignStats(campaignId) {
  const id = BigInt(campaignId);
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new Error('Campaña no encontrada');

  const [pending, sent, failed, processing] = await Promise.all([
    prisma.campaignRecipient.count({ where: { campaign_id: id, status: 'PENDING' } }),
    prisma.campaignRecipient.count({ where: { campaign_id: id, status: 'SENT' } }),
    prisma.campaignRecipient.count({ where: { campaign_id: id, status: 'FAILED' } }),
    prisma.campaignRecipient.count({ where: { campaign_id: id, status: 'PROCESSING' } }),
  ]);

  return {
    campaign_id: campaign.id,
    status: campaign.status,
    total_recipients: campaign.total_recipients,
    pending,
    sent,
    failed,
    processing,
    progress_pct: campaign.total_recipients > 0
      ? Math.round((sent / campaign.total_recipients) * 100)
      : 0,
  };
}

async function pauseCampaign(id) {
  const campaign = await getCampaignById(id);
  if (campaign.status !== 'RUNNING') {
    throw new Error('Solo se pueden pausar campañas con status RUNNING');
  }

  return prisma.campaign.update({
    where: { id: BigInt(id) },
    data: { status: 'PAUSED' },
  });
}

async function cancelCampaign(id) {
  const campaign = await getCampaignById(id);
  if (['CANCELLED', 'COMPLETED'].includes(campaign.status)) {
    throw new Error('Esta campaña no se puede cancelar');
  }

  await prisma.$transaction([
    prisma.campaignRecipient.updateMany({
      where: {
        campaign_id: BigInt(id),
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      data: {
        status: 'CANCELLED',
        processing_at: null,
        error_message: 'Campaña cancelada',
      },
    }),
    prisma.campaign.update({
      where: { id: BigInt(id) },
      data: { status: 'CANCELLED' },
    }),
  ]);

  await refreshCampaignTotals(id);
  return getCampaignById(id);
}

async function resumeCampaign(id) {
  const campaign = await getCampaignById(id);
  if (campaign.status !== 'PAUSED') {
    throw new Error('Solo se pueden reanudar campañas con status PAUSED');
  }

  await assertNoActiveCampaign(id);

  return prisma.campaign.update({
    where: { id: BigInt(id) },
    data: { status: 'RUNNING' },
  });
}

async function retryFailedRecipients(id, options = {}) {
  const campaign = await getCampaignById(id);
  if (!['RUNNING', 'PAUSED'].includes(campaign.status)) {
    throw new Error('Solo se pueden reintentar fallidos en campañas RUNNING o PAUSED');
  }

  const failedRecipients = await prisma.campaignRecipient.findMany({
    where: {
      campaign_id: BigInt(id),
      status: 'FAILED',
    },
    orderBy: { id: 'asc' },
  });

  if (failedRecipients.length === 0) {
    return { retried: 0, campaign_id: id };
  }

  const scheduleFrom = options.schedule_from || formatDateFromDate(new Date());
  const scheduleEnd = options.schedule_to || formatDateFromDate(campaign.end_date);
  const scheduledAt = generateScheduledAtTimes(
    {
      start_date: scheduleFrom,
      end_date: scheduleEnd,
      start_time: formatTimeFromDate(campaign.start_time),
      end_time: formatTimeFromDate(campaign.end_time),
      daily_limit: campaign.daily_limit,
      hourly_limit: campaign.hourly_limit,
      min_interval_seconds: campaign.min_interval_seconds,
      max_interval_seconds: campaign.max_interval_seconds,
    },
    failedRecipients.length
  );

  let offset = 0;
  for (const batch of chunkArray(failedRecipients, RECIPIENT_BATCH_SIZE)) {
    await prisma.$transaction(
      batch.map((recipient, batchIndex) =>
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'PENDING',
            attempts: 0,
            scheduled_at: new Date(scheduledAt[offset + batchIndex]),
            processing_at: null,
            sent_at: null,
            error_message: null,
            last_attempt_at: null,
          },
        })
      )
    );
    offset += batch.length;
  }

  if (campaign.status === 'COMPLETED') {
    await prisma.campaign.update({
      where: { id: BigInt(id) },
      data: { status: 'RUNNING' },
    });
  }

  await refreshCampaignTotals(id);

  return {
    retried: failedRecipients.length,
    campaign_id: id,
  };
}

module.exports = {
  createCampaign,
  listCampaigns,
  getCampaignById,
  getCampaignRecipients,
  getCampaignStats,
  pauseCampaign,
  cancelCampaign,
  resumeCampaign,
  retryFailedRecipients,
  refreshCampaignTotals,
  assertNoActiveCampaign,
};

const prisma = require('./prismaClient');
const { generateUnsubscribeToken } = require('./tokenUtils');

function getAppBaseUrl() {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing APP_BASE_URL environment variable');
  }
  return baseUrl.replace(/\/$/, '');
}

function buildUnsubscribeUrl(token) {
  return `${getAppBaseUrl()}/unsubscribe/${token}`;
}

async function ensureUnsubscribeToken(customerId) {
  const customer = await prisma.customer.findUnique({
    where: { id: BigInt(customerId) },
    select: { unsubscribe_token: true },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  if (customer.unsubscribe_token) {
    return customer.unsubscribe_token;
  }

  const token = generateUnsubscribeToken();
  await prisma.customer.update({
    where: { id: BigInt(customerId) },
    data: { unsubscribe_token: token },
  });

  return token;
}

async function unsubscribeByToken(token) {
  const customer = await prisma.customer.findUnique({
    where: { unsubscribe_token: token },
  });

  if (!customer) {
    throw new Error('Invalid unsubscribe token');
  }

  if (customer.unsubscribed_at) {
    return {
      alreadyUnsubscribed: true,
      email: customer.email,
      unsubscribed_at: customer.unsubscribed_at,
    };
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customer.id },
      data: {
        active: false,
        unsubscribed_at: now,
      },
    }),
    prisma.campaignRecipient.updateMany({
      where: {
        customer_id: customer.id,
        status: 'PENDING',
      },
      data: {
        status: 'SKIPPED',
        error_message: 'Unsubscribed by recipient',
      },
    }),
  ]);

  return {
    alreadyUnsubscribed: false,
    email: customer.email,
    unsubscribed_at: now,
  };
}

module.exports = {
  buildUnsubscribeUrl,
  ensureUnsubscribeToken,
  unsubscribeByToken,
};

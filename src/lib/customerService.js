const prisma = require('./prismaClient');
const { emailSchema } = require('./validators');
const { chunkArray } = require('./batchUtils');
const { generateUnsubscribeToken } = require('./tokenUtils');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const IMPORT_BATCH_SIZE = Number(process.env.IMPORT_BATCH_SIZE || 100);

async function listCustomers() {
  const customers = await prisma.customer.findMany({
    orderBy: { id: 'asc' },
  });

  return customers
    .map((customer) => ({
      ...customer,
      email: customer.email ? customer.email.trim().toLowerCase() : null,
    }))
    .filter((customer) => {
      if (!customer.email) return false;
      const result = emailSchema.safeParse(customer.email);
      return result.success;
    });
}

async function upsertCustomerBatch(batch) {
  await prisma.$transaction(
    batch.map((customer) =>
      prisma.customer.upsert({
        where: { email: customer.email },
        update: {
          external_id: customer.external_id,
          name: customer.name,
        },
        create: {
          external_id: customer.external_id,
          name: customer.name,
          email: customer.email,
          active: true,
          unsubscribe_token: generateUnsubscribeToken(),
        },
      })
    )
  );
}

function parseExcelFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet['!ref']);

  let headerRow = -1;
  let clienteCol = -1;
  let correoCol = -1;

  for (let r = range.s.r; r <= Math.min(range.s.r + 10, range.e.r); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell || typeof cell.v !== 'string') continue;
      const val = cell.v.trim().toLowerCase();
      if (val === 'cliente') { clienteCol = c; headerRow = r; }
      if (val === 'correo') correoCol = c;
    }
    if (headerRow >= 0) break;
  }

  if (headerRow < 0) throw new Error('No se encontraron los headers "Cliente" y "Correo" en el Excel');
  if (clienteCol < 0) throw new Error('No se encontró la columna "Cliente"');
  if (correoCol < 0) throw new Error('No se encontró la columna "Correo"');

  const seen = new Set();
  const customers = [];

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const nameCell = sheet[XLSX.utils.encode_cell({ r, c: clienteCol })];
    const emailCell = sheet[XLSX.utils.encode_cell({ r, c: correoCol })];

    if (!emailCell || !emailCell.v) continue;
    const email = String(emailCell.v).trim().toLowerCase();
    if (!email) continue;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) continue;
    if (seen.has(email)) continue;
    seen.add(email);

    const name = nameCell && nameCell.v ? String(nameCell.v).trim() : email;
    customers.push({ external_id: null, name, email });
  }

  return customers;
}

async function importExcelCustomers(filePath) {
  let customers;
  try {
    customers = parseExcelFile(filePath);
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }

  if (customers.length === 0) {
    return { imported: 0, message: 'No se encontraron correos válidos en el Excel' };
  }

  for (const batch of chunkArray(customers, IMPORT_BATCH_SIZE)) {
    await upsertCustomerBatch(batch);
  }

  return {
    imported: customers.length,
    batches: Math.ceil(customers.length / IMPORT_BATCH_SIZE),
  };
}

async function getCustomerStats() {
  const [total, active, unsubscribed] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { active: true, unsubscribed_at: null } }),
    prisma.customer.count({ where: { unsubscribed_at: { not: null } } }),
  ]);
  return { total, active, unsubscribed };
}

async function importCustomersFromJson(customersArray) {
  const seen = new Set();
  const valid = [];

  for (const item of customersArray) {
    if (!item || typeof item !== 'object') continue;
    const email = String(item.email || '').trim().toLowerCase();
    if (!email) continue;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    const name = String(item.name || '').trim() || email;
    valid.push({ external_id: null, name, email });
  }

  if (valid.length === 0) {
    return { imported: 0, message: 'No se encontraron correos válidos en los datos enviados' };
  }

  for (const batch of chunkArray(valid, IMPORT_BATCH_SIZE)) {
    await upsertCustomerBatch(batch);
  }

  return {
    imported: valid.length,
    batches: Math.ceil(valid.length / IMPORT_BATCH_SIZE),
  };
}

module.exports = { listCustomers, importExcelCustomers, importCustomersFromJson, getCustomerStats, parseExcelFile };

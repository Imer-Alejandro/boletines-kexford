const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { parseExcelFile } = require('../src/lib/customerService');
const { createTestExcel, cleanupTestFile } = require('./testHelpers');

test('parseExcelFile extracts name and email from valid Excel', () => {
  const filePath = createTestExcel([
    ['Luis Mejia', 'D-2E', 'Coral', 'Sundistrict', '8095194958', 'mejialuismarino@gmail.com', 'Dominicana'],
    ['Elizabeth Martinez', 'D-2C', 'Arena', 'Sundistrict', '8577560227', 'delrosario396@gmail.com', 'Dominicana'],
  ]);

  const customers = parseExcelFile(filePath);
  assert.equal(customers.length, 2);
  assert.equal(customers[0].name, 'Luis Mejia');
  assert.equal(customers[0].email, 'mejialuismarino@gmail.com');
  assert.equal(customers[1].name, 'Elizabeth Martinez');
  cleanupTestFile(filePath);
});

test('parseExcelFile deduplicates emails', () => {
  const filePath = createTestExcel([
    ['Luis', 'D-1', 'A', 'B', '111', 'luis@test.com', 'Dom'],
    ['Otro Luis', 'D-2', 'A', 'B', '222', 'LUIS@TEST.COM', 'Dom'],
  ]);

  const customers = parseExcelFile(filePath);
  assert.equal(customers.length, 1);
  assert.equal(customers[0].email, 'luis@test.com');
  cleanupTestFile(filePath);
});

test('parseExcelFile skips rows without email', () => {
  const filePath = createTestExcel([
    ['Luis', 'D-1', 'A', 'B', '111', 'luis@test.com', 'Dom'],
    ['Sin Email', 'D-2', 'A', 'B', '222', '', 'Dom'],
    ['Otro', 'D-3', 'A', 'B', '333', null, 'Dom'],
  ]);

  const customers = parseExcelFile(filePath);
  assert.equal(customers.length, 1);
  cleanupTestFile(filePath);
});

test('parseExcelFile rejects invalid emails', () => {
  const filePath = createTestExcel([
    ['Luis', 'D-1', 'A', 'B', '111', 'not-an-email', 'Dom'],
    ['Valido', 'D-2', 'A', 'B', '222', 'ok@test.com', 'Dom'],
  ]);

  const customers = parseExcelFile(filePath);
  assert.equal(customers.length, 1);
  assert.equal(customers[0].email, 'ok@test.com');
  cleanupTestFile(filePath);
});

test('parseExcelFile trims and lowercases emails', () => {
  const filePath = createTestExcel([
    ['Luis', 'D-1', 'A', 'B', '111', '  TEST@EXAMPLE.COM  ', 'Dom'],
  ]);

  const customers = parseExcelFile(filePath);
  assert.equal(customers[0].email, 'test@example.com');
  cleanupTestFile(filePath);
});

test('parseExcelFile uses email as name fallback when name is empty', () => {
  const filePath = createTestExcel([
    ['', 'D-1', 'A', 'B', '111', 'fallback@test.com', 'Dom'],
  ]);

  const customers = parseExcelFile(filePath);
  assert.equal(customers[0].name, 'fallback@test.com');
  cleanupTestFile(filePath);
});

test('parseExcelFile throws on missing headers', () => {
  const fs = require('fs');
  const os = require('os');
  const XLSX = require('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    ['Wrong', 'Headers', 'Here', 'Alto', 'Aqui', 'Mal', 'Nope'],
    ['Data', 'Data', 'Data', 'Data', 'Data', 'Data', 'Data'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-nohdr-'));
  const filePath = path.join(dir, 'bad.xlsx');
  XLSX.writeFile(wb, filePath);

  assert.throws(() => parseExcelFile(filePath), /headers|Cliente|Correo/i);
  cleanupTestFile(filePath);
});

test('parseExcelFile handles real Excel structure (header on row 1)', () => {
  const filePath = createTestExcel([
    ['Luis', 'D-1', 'Coral', 'Etapa1', '111', 'luis@test.com', 'Dom'],
  ]);

  const customers = parseExcelFile(filePath);
  assert.ok(customers.length >= 1);
  assert.ok(customers[0].email.includes('@'));
  cleanupTestFile(filePath);
});

test('parseExcelFile handles large dataset (100 rows)', () => {
  const rows = [];
  for (let i = 0; i < 100; i++) {
    rows.push([`Cliente ${i}`, `C-${i}`, 'Inmueble', 'Etapa', `809${i}`, `user${i}@test.com`, 'Dom']);
  }
  const filePath = createTestExcel(rows);

  const customers = parseExcelFile(filePath);
  assert.equal(customers.length, 100);
  assert.equal(customers[99].email, 'user99@test.com');
  cleanupTestFile(filePath);
});

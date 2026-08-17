const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createTestExcel(rows) {
  const data = [
    ['Cliente', 'No. Casa', 'Inmueble', 'Etapa', 'Telefono', 'Correo', 'Nacionalidad'],
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-excel-'));
  const filePath = path.join(tmpDir, 'test-clients.xlsx');
  XLSX.writeFile(wb, filePath);
  return filePath;
}

function createTestExcelWithHeaders(row0, rows) {
  const data = [row0, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-excel-'));
  const filePath = path.join(tmpDir, 'test-clients.xlsx');
  XLSX.writeFile(wb, filePath);
  return filePath;
}

function cleanupTestFile(filePath) {
  try {
    const dir = path.dirname(filePath);
    fs.unlinkSync(filePath);
    fs.rmdirSync(dir);
  } catch {}
}

module.exports = { createTestExcel, createTestExcelWithHeaders, cleanupTestFile };

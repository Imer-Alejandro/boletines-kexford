const test = require('node:test');
const assert = require('node:assert/strict');
const { requireAuth } = require('../src/middleware/auth');

function mockReq(headers = {}) {
  return { headers };
}

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

const originalEnv = { ...process.env };

test.beforeEach(() => {
  process.env.API_KEY = 'test_api_key_123';
  process.env.API_EMAIL = 'test@kexford.com';
});

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test('requireAuth passes with valid credentials', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'test_api_key_123', 'x-api-email': 'test@kexford.com' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, true);
  assert.equal(res.statusCode, null);
});

test('requireAuth passes with different email casing', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'test_api_key_123', 'x-api-email': 'TEST@KEXFORD.COM' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, true);
});

test('requireAuth rejects missing x-api-key', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-email': 'test@kexford.com' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.ok(res.body.error.includes('x-api-key'));
});

test('requireAuth rejects missing x-api-email', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'test_api_key_123' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.ok(res.body.error.includes('x-api-email'));
});

test('requireAuth rejects missing both headers', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({});
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
});

test('requireAuth rejects wrong API key', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'wrong_key', 'x-api-email': 'test@kexford.com' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.ok(res.body.error.includes('inválidas'));
});

test('requireAuth rejects wrong email', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'test_api_key_123', 'x-api-email': 'wrong@email.com' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('requireAuth rejects both wrong', () => {
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'wrong', 'x-api-email': 'wrong' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('requireAuth returns 500 when API_KEY not configured', () => {
  delete process.env.API_KEY;
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'any', 'x-api-email': 'any' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 500);
  assert.ok(res.body.error.includes('configuradas'));
});

test('requireAuth returns 500 when API_EMAIL not configured', () => {
  delete process.env.API_EMAIL;
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'any', 'x-api-email': 'any' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 500);
});

test('requireAuth returns 500 when both env vars missing', () => {
  delete process.env.API_KEY;
  delete process.env.API_EMAIL;
  let called = false;
  const next = () => { called = true; };
  const req = mockReq({ 'x-api-key': 'any', 'x-api-email': 'any' });
  const res = mockRes();

  requireAuth(req, res, next);
  assert.equal(called, false);
  assert.equal(res.statusCode, 500);
});

test('requireAuth is a function', () => {
  assert.equal(typeof requireAuth, 'function');
});

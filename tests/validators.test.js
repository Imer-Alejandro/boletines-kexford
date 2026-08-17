const test = require('node:test');
const assert = require('node:assert/strict');
const { emailSchema, campaignSchema, CLOUDINARY_PATTERN } = require('../src/lib/validators');

const VALID_PAYLOAD = {
  name: 'Boletin Agosto',
  title: 'Programa de Boletines Informativo Kexford',
  subject: 'Boletin Agosto 2026',
  image_url: 'https://res.cloudinary.com/szsduo8f/image/upload/v1786375411/boletin_02.png',
  start_date: '2026-08-17',
  end_date: '2026-08-31',
  start_time: '08:00',
  end_time: '18:00',
};

test('emailSchema accepts valid emails', () => {
  assert.ok(emailSchema.safeParse('user@example.com').success);
  assert.ok(emailSchema.safeParse('test.name+tag@domain.co').success);
  assert.ok(emailSchema.safeParse(' CLIENT@DOMAIN.COM ').success);
});

test('emailSchema rejects invalid emails', () => {
  assert.ok(!emailSchema.safeParse('').success);
  assert.ok(!emailSchema.safeParse('not-an-email').success);
  assert.ok(!emailSchema.safeParse('@domain.com').success);
  assert.ok(!emailSchema.safeParse('user@').success);
});

test('CLOUDINARY_PATTERN matches valid Cloudinary URLs', () => {
  assert.ok(CLOUDINARY_PATTERN.test('https://res.cloudinary.com/szsduo8f/image/upload/v1786375411/boletin_02.png'));
  assert.ok(CLOUDINARY_PATTERN.test('https://res.cloudinary.com/demo/image/upload/sample.jpg'));
});

test('CLOUDINARY_PATTERN rejects non-Cloudinary URLs', () => {
  assert.ok(!CLOUDINARY_PATTERN.test('https://example.com/image.jpg'));
  assert.ok(!CLOUDINARY_PATTERN.test('https://res.cloudinary.com/szsduo8f/video/upload/v1/file.mp4'));
});

test('campaignSchema accepts valid payload with Cloudinary image', () => {
  const result = campaignSchema.safeParse(VALID_PAYLOAD);
  assert.ok(result.success);
  assert.equal(result.data.daily_limit, 50);
  assert.equal(result.data.hourly_limit, 7);
  assert.equal(result.data.content, undefined);
});

test('campaignSchema accepts optional content', () => {
  const payload = { ...VALID_PAYLOAD, content: 'Texto adicional del boletín' };
  const result = campaignSchema.safeParse(payload);
  assert.ok(result.success);
  assert.equal(result.data.content, 'Texto adicional del boletín');
});

test('campaignSchema rejects missing image_url', () => {
  const { image_url, ...payload } = VALID_PAYLOAD;
  assert.ok(!campaignSchema.safeParse(payload).success);
});

test('campaignSchema rejects non-Cloudinary image_url', () => {
  const payload = { ...VALID_PAYLOAD, image_url: 'https://example.com/promo.jpg' };
  assert.ok(!campaignSchema.safeParse(payload).success);
});

test('campaignSchema rejects invalid dates', () => {
  const payload = { ...VALID_PAYLOAD, start_date: '31-08-2026' };
  assert.ok(!campaignSchema.safeParse(payload).success);
});

test('campaignSchema rejects short name', () => {
  const payload = { ...VALID_PAYLOAD, name: 'ab' };
  assert.ok(!campaignSchema.safeParse(payload).success);
});

test('campaignSchema rejects invalid image_url format', () => {
  const payload = { ...VALID_PAYLOAD, image_url: 'not-a-url' };
  assert.ok(!campaignSchema.safeParse(payload).success);
});

test('campaignSchema uses default limits', () => {
  const result = campaignSchema.safeParse(VALID_PAYLOAD);
  assert.ok(result.success);
  assert.equal(result.data.min_interval_seconds, 30);
  assert.equal(result.data.max_interval_seconds, 90);
  assert.equal(result.data.max_attempts, 3);
});

test('campaignSchema accepts custom limits', () => {
  const payload = {
    ...VALID_PAYLOAD,
    daily_limit: 25,
    hourly_limit: 5,
    min_interval_seconds: 40,
    max_interval_seconds: 120,
  };
  const result = campaignSchema.safeParse(payload);
  assert.ok(result.success);
  assert.equal(result.data.daily_limit, 25);
  assert.equal(result.data.hourly_limit, 5);
});

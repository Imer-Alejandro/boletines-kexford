const test = require('node:test');
const assert = require('node:assert/strict');
const { createEmailHtml, createUnsubscribeConfirmationHtml, escapeHtml } = require('../src/lib/emailTemplate');

test('createEmailHtml renders KEXFORD header', () => {
  const html = createEmailHtml({
    title: 'Boletín Agosto',
    imageUrl: 'https://res.cloudinary.com/szsduo8f/image/upload/v1/boletin.png',
    unsubscribeUrl: 'https://example.com/unsubscribe/abc',
  });
  assert.match(html, /KEXFORD/);
  assert.match(html, /Boletín Agosto/);
});

test('createEmailHtml includes Cloudinary image', () => {
  const html = createEmailHtml({
    title: 'Test',
    imageUrl: 'https://res.cloudinary.com/szsduo8f/image/upload/v1786375411/boletin_02.png',
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.match(html, /res\.cloudinary\.com.*boletin_02\.png/);
  assert.match(html, /width="600"/);
});

test('createEmailHtml works without image', () => {
  const html = createEmailHtml({
    title: 'Sin imagen',
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.match(html, /Sin imagen/);
  assert.doesNotMatch(html, /<img/);
});

test('createEmailHtml works without content', () => {
  const html = createEmailHtml({
    title: 'Sin contenido',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.match(html, /Sin contenido/);
  assert.match(html, /sample\.jpg/);
  assert.doesNotMatch(html, /<p><\/p>/);
});

test('createEmailHtml includes optional content', () => {
  const html = createEmailHtml({
    title: 'Test',
    content: 'Texto adicional del boletín',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.match(html, /Texto adicional del boletín/);
});

test('createEmailHtml escapes XSS in title and content', () => {
  const html = createEmailHtml({
    title: '<script>alert(1)</script>',
    content: '<img src=x onerror=alert(1)>',
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
});

test('createEmailHtml includes copyright Sanchez Business & Corp', () => {
  const html = createEmailHtml({
    title: 'Test',
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.match(html, /Sanchez Business &amp; Corp/);
  assert.match(html, /Todos los derechos reservados/);
});

test('createEmailHtml includes unsubscribe link', () => {
  const html = createEmailHtml({
    title: 'Test',
    unsubscribeUrl: 'https://example.com/unsubscribe/abc123',
  });
  assert.match(html, /Darse de baja de los boletines/);
  assert.match(html, /https:\/\/example\.com\/unsubscribe\/abc123/);
});

test('createEmailHtml includes privacy policy link when provided', () => {
  const html = createEmailHtml({
    title: 'Test',
    unsubscribeUrl: 'https://example.com/unsub/tok',
    privacyPolicyUrl: 'https://example.com/privacidad',
  });
  assert.match(html, /Política de privacidad/);
  assert.match(html, /https:\/\/example\.com\/privacidad/);
});

test('createEmailHtml escapes special chars in content', () => {
  const html = createEmailHtml({
    title: 'Oferta "especial" & más',
    content: "La mejor oferta del año '2026'",
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.match(html, /Oferta &quot;especial&quot; &amp; más/);
});

test('createUnsubscribeConfirmationHtml shows success message', () => {
  const html = createUnsubscribeConfirmationHtml({
    email: 'test@example.com',
    alreadyUnsubscribed: false,
  });
  assert.match(html, /test@example\.com/);
  assert.match(html, /dado de baja correctamente/);
  assert.match(html, /Sanchez Business &amp; Corp/);
});

test('createUnsubscribeConfirmationHtml handles already unsubscribed', () => {
  const html = createUnsubscribeConfirmationHtml({
    email: 'test@example.com',
    alreadyUnsubscribed: true,
  });
  assert.match(html, /ya estaba dado de baja/);
});

test('escapeHtml encodes special characters', () => {
  assert.equal(escapeHtml(`Tom & Jerry "ok"`), 'Tom &amp; Jerry &quot;ok&quot;');
});

test('createEmailHtml uses lang="es"', () => {
  const html = createEmailHtml({
    title: 'Test',
    unsubscribeUrl: 'https://example.com/unsub/tok',
  });
  assert.match(html, /lang="es"/);
});

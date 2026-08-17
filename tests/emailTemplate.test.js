const test = require('node:test');
const assert = require('node:assert/strict');
const { createEmailHtml, escapeHtml } = require('../src/lib/emailTemplate');

test('createEmailHtml includes unsubscribe link and copyright', () => {
  const html = createEmailHtml({
    title: 'Titulo',
    content: 'Contenido',
    unsubscribeUrl: 'https://example.com/unsubscribe/abc123',
    privacyPolicyUrl: 'https://example.com/privacidad',
  });

  assert.match(html, /Darse de baja de los boletines/);
  assert.match(html, /https:\/\/example\.com\/unsubscribe\/abc123/);
  assert.match(html, /Sanchez Business &amp; Corp/);
  assert.match(html, /Política de privacidad/);
});

test('createEmailHtml escapes unsafe content', () => {
  const html = createEmailHtml({
    title: '<script>alert(1)</script>',
    content: 'Linea 1\nLinea 2',
    unsubscribeUrl: 'https://example.com/unsubscribe/token',
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Linea 1<br \/>Linea 2/);
});

test('escapeHtml encodes special characters', () => {
  assert.equal(escapeHtml(`Tom & Jerry "ok"`), 'Tom &amp; Jerry &quot;ok&quot;');
});

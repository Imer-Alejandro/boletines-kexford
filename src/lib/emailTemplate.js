function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatContentHtml(content) {
  return escapeHtml(content).replace(/\r?\n/g, '<br />');
}

function createEmailHtml({ title, content, imageUrl, unsubscribeUrl, privacyPolicyUrl }) {
  const safeTitle = escapeHtml(title || 'Programa de Boletines Informativo Kexford para la Salud Financiera');
  const safeContent = content ? formatContentHtml(content) : null;
  const safeImageUrl = imageUrl ? escapeHtml(imageUrl) : null;
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
  const safePrivacyPolicyUrl = privacyPolicyUrl ? escapeHtml(privacyPolicyUrl) : null;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; -webkit-text-size-adjust: 100%; }
    .wrapper { width: 100%; background-color: #f4f4f4; padding: 24px 0; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; }
    .header { padding: 24px 20px; text-align: center; background-color: #0a2540; }
    .header img { height: 32px; }
    .header-title { margin: 0; padding: 12px 20px 0; text-align: center; font-size: 18px; font-weight: 600; color: #0a2540; line-height: 1.4; }
    .image { padding: 0; }
    .image img { width: 100%; height: auto; display: block; border: 0; }
    .content { padding: 20px 24px; color: #333333; font-size: 14px; line-height: 1.6; }
    .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #888888; line-height: 1.6; border-top: 1px solid #eeeeee; }
    .footer a { color: #0a2540; text-decoration: underline; }
    .footer .copyright { margin: 8px 0 0; color: #aaaaaa; font-size: 11px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="header">
                <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">KEXFORD</h1>
              </td>
            </tr>
            <tr>
              <td class="header-title">${safeTitle}</td>
            </tr>
            ${safeImageUrl ? `
            <tr>
              <td class="image">
                <img src="${safeImageUrl}" alt="${safeTitle}" width="600" style="width:100%;max-width:600px;height:auto;display:block;border:0;" />
              </td>
            </tr>` : ''}
            ${safeContent ? `
            <tr>
              <td class="content">
                <p>${safeContent}</p>
              </td>
            </tr>` : ''}
            <tr>
              <td class="footer">
                <p>
                  <a href="${safeUnsubscribeUrl}">Darse de baja de los boletines</a>
                  ${safePrivacyPolicyUrl ? ` &nbsp;|&nbsp; <a href="${safePrivacyPolicyUrl}">Política de privacidad</a>` : ''}
                </p>
                <p class="copyright">&copy; ${currentYear} Sanchez Business &amp; Corp. Todos los derechos reservados.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function createUnsubscribeConfirmationHtml({ email, alreadyUnsubscribed }) {
  const message = alreadyUnsubscribed
    ? `El correo <strong>${escapeHtml(email)}</strong> ya estaba dado de baja de los boletines.`
    : `El correo <strong>${escapeHtml(email)}</strong> fue dado de baja correctamente de los boletines.`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Baja de boletines</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f4; margin: 0; padding: 40px 16px; }
    .card { max-width: 520px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 4px; border: 1px solid #e0e0e0; }
    h1 { margin-top: 0; color: #0a2540; font-size: 20px; }
    p { color: #333; line-height: 1.6; font-size: 14px; }
    .footer { margin-top: 24px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Baja de boletines</h1>
    <p>${message}</p>
    <p class="footer">&copy; ${new Date().getFullYear()} Sanchez Business &amp; Corp. Todos los derechos reservados.</p>
  </div>
</body>
</html>`;
}

module.exports = { createEmailHtml, createUnsubscribeConfirmationHtml, escapeHtml };

function requireAuth(req, res, next) {
  const apiKey = process.env.API_KEY;
  const apiEmail = process.env.API_EMAIL;

  if (!apiKey || !apiEmail) {
    return res.status(500).json({
      ok: false,
      error: 'API_KEY y API_EMAIL no están configuradas en el servidor',
    });
  }

  const providedKey = req.headers['x-api-key'];
  const providedEmail = req.headers['x-api-email'];

  if (!providedKey || !providedEmail) {
    return res.status(401).json({
      ok: false,
      error: 'Faltan headers de autenticación: x-api-key y x-api-email son requeridos',
    });
  }

  const keyValid = timingSafeEqual(providedKey, apiKey);
  const emailValid = timingSafeEqual(providedEmail.toLowerCase(), apiEmail.toLowerCase());

  if (!keyValid || !emailValid) {
    return res.status(403).json({
      ok: false,
      error: 'Credenciales inválidas',
    });
  }

  next();
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

module.exports = { requireAuth };

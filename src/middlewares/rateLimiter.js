const rateLimit = require('express-rate-limit');

// Límite general para toda la API
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intentá de nuevo en unos minutos' },
});

// Límite estricto para login y registro (previene ataques de fuerza bruta)
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación, esperá 15 minutos e intentá de nuevo' },
});

module.exports = { limiterGeneral, limiterAuth };

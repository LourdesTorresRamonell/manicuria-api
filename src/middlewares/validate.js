const { validationResult } = require('express-validator');

// Corta la request con 400 si alguna validación de express-validator falló
function validar(req, res, next) {
  const errores = validationResult(req);
  if (errores.isEmpty()) return next();

  return res.status(400).json({
    error: 'Datos inválidos',
    detalles: errores.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
  });
}

module.exports = validar;

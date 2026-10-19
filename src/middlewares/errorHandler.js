// 404 para rutas que no existen
function noEncontrado(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejo centralizado de errores
// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, next) {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El body no es un JSON válido' });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos (valor duplicado)' });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      error: 'No se puede completar la operación: el registro está relacionado con otros datos',
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.errors.map((e) => ({ campo: e.path, mensaje: e.message })),
    });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejarErrores };

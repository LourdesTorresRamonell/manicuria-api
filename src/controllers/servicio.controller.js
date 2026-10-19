const { Servicio } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');

// GET /api/servicios            (público)  ?activo=true|false
const listar = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.activo !== undefined) where.activo = req.query.activo === 'true';

  const servicios = await Servicio.findAll({ where, order: [['nombre', 'ASC']] });
  res.json({ total: servicios.length, data: servicios });
});

// GET /api/servicios/:id        (público)
const obtener = asyncHandler(async (req, res) => {
  const servicio = await Servicio.findByPk(req.params.id);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
  return res.json({ data: servicio });
});

// POST /api/servicios           (admin)
const crear = asyncHandler(async (req, res) => {
  const { nombre, descripcion, precio, duracion_minutos, activo } = req.body;

  const existente = await Servicio.findOne({ where: { nombre } });
  if (existente) return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });

  const servicio = await Servicio.create({ nombre, descripcion, precio, duracion_minutos, activo });
  return res.status(201).json({ message: 'Servicio creado', data: servicio });
});

// PUT /api/servicios/:id        (admin)
const actualizar = asyncHandler(async (req, res) => {
  const servicio = await Servicio.findByPk(req.params.id);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const { nombre, descripcion, precio, duracion_minutos, activo } = req.body;

  if (nombre && nombre !== servicio.nombre) {
    const repetido = await Servicio.findOne({ where: { nombre } });
    if (repetido) return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });
  }

  await servicio.update({
    ...(nombre !== undefined && { nombre }),
    ...(descripcion !== undefined && { descripcion }),
    ...(precio !== undefined && { precio }),
    ...(duracion_minutos !== undefined && { duracion_minutos }),
    ...(activo !== undefined && { activo }),
  });

  return res.json({ message: 'Servicio actualizado', data: servicio });
});

// DELETE /api/servicios/:id     (admin)
const eliminar = asyncHandler(async (req, res) => {
  const servicio = await Servicio.findByPk(req.params.id);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  // Si tiene turnos asociados, la FK (RESTRICT) responde 409 desde el errorHandler
  await servicio.destroy();
  return res.json({ message: 'Servicio eliminado' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };

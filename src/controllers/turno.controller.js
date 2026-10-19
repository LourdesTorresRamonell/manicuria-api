const { Op } = require('sequelize');
const { Turno, Servicio, User } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');

const HORA_APERTURA = process.env.HORA_APERTURA || '09:00';
const HORA_CIERRE = process.env.HORA_CIERRE || '20:00';

const INCLUDE = [
  { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'precio', 'duracion_minutos'] },
  { model: User, as: 'cliente', attributes: ['id', 'nombre', 'email', 'telefono'] },
];

const aMinutos = (hora) => {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
};

const hoy = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en la zona horaria del servidor

// Un turno ocupa [inicio, inicio + duración). Hay conflicto si se pisa con otro activo.
async function hayConflicto({ fecha, hora, duracion, excluirId }) {
  const inicio = aMinutos(hora);
  const fin = inicio + duracion;

  const where = { fecha, estado: { [Op.in]: ['pendiente', 'confirmado'] } };
  if (excluirId) where.id = { [Op.ne]: excluirId };

  const delDia = await Turno.findAll({
    where,
    include: [{ model: Servicio, as: 'servicio', attributes: ['duracion_minutos'] }],
  });

  return delDia.some((t) => {
    const i = aMinutos(t.hora);
    const f = i + t.servicio.duracion_minutos;
    return inicio < f && i < fin;
  });
}

// Valida horario de atención y que la fecha no sea pasada. Devuelve un mensaje de error o null.
function validarAgenda({ fecha, hora, duracion }) {
  if (fecha < hoy()) return 'No se pueden reservar turnos en fechas pasadas';

  const inicio = aMinutos(hora);
  const fin = inicio + duracion;
  if (inicio < aMinutos(HORA_APERTURA) || fin > aMinutos(HORA_CIERRE)) {
    return `El turno debe estar dentro del horario de atención (${HORA_APERTURA} a ${HORA_CIERRE})`;
  }
  return null;
}

// Una clienta solo opera sobre sus turnos; la admin sobre todos
const esDuenioOAdmin = (req, turno) => req.user.rol === 'admin' || turno.usuario_id === req.user.id;

// GET /api/turnos   ?estado=&fecha=&usuario_id=(solo admin)
const listar = asyncHandler(async (req, res) => {
  const where = {};
  if (req.user.rol !== 'admin') where.usuario_id = req.user.id;
  else if (req.query.usuario_id) where.usuario_id = req.query.usuario_id;

  if (req.query.estado) where.estado = req.query.estado;
  if (req.query.fecha) where.fecha = req.query.fecha;

  const turnos = await Turno.findAll({
    where,
    include: INCLUDE,
    order: [['fecha', 'ASC'], ['hora', 'ASC']],
  });
  res.json({ total: turnos.length, data: turnos });
});

// GET /api/turnos/:id
const obtener = asyncHandler(async (req, res) => {
  const turno = await Turno.findByPk(req.params.id, { include: INCLUDE });
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
  if (!esDuenioOAdmin(req, turno)) {
    return res.status(403).json({ error: 'No tenés permisos para ver este turno' });
  }
  return res.json({ data: turno });
});

// POST /api/turnos
const crear = asyncHandler(async (req, res) => {
  const { servicio_id, fecha, hora, notas } = req.body;

  // La clienta reserva siempre para sí misma; la admin puede indicar usuario_id
  const usuarioId = req.user.rol === 'admin' && req.body.usuario_id ? req.body.usuario_id : req.user.id;

  const servicio = await Servicio.findByPk(servicio_id);
  if (!servicio) return res.status(404).json({ error: 'El servicio indicado no existe' });
  if (!servicio.activo) return res.status(400).json({ error: 'Ese servicio no está disponible actualmente' });

  const cliente = await User.findByPk(usuarioId);
  if (!cliente) return res.status(404).json({ error: 'El usuario indicado no existe' });

  const errorAgenda = validarAgenda({ fecha, hora, duracion: servicio.duracion_minutos });
  if (errorAgenda) return res.status(400).json({ error: errorAgenda });

  if (await hayConflicto({ fecha, hora, duracion: servicio.duracion_minutos })) {
    return res.status(409).json({ error: 'Ese horario ya está ocupado, elegí otro' });
  }

  const turno = await Turno.create({ usuario_id: usuarioId, servicio_id, fecha, hora, notas });
  const completo = await Turno.findByPk(turno.id, { include: INCLUDE });
  return res.status(201).json({ message: 'Turno reservado', data: completo });
});

// PUT /api/turnos/:id
const actualizar = asyncHandler(async (req, res) => {
  const turno = await Turno.findByPk(req.params.id);
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
  if (!esDuenioOAdmin(req, turno)) {
    return res.status(403).json({ error: 'No tenés permisos para modificar este turno' });
  }

  const { servicio_id, fecha, hora, notas, estado } = req.body;
  const esAdmin = req.user.rol === 'admin';

  // Una clienta solo puede cancelar su turno; confirmar/completar es cosa de la admin
  if (estado !== undefined && !esAdmin && estado !== 'cancelado') {
    return res.status(403).json({ error: 'Solo podés cancelar tu turno. Los demás estados los gestiona la administradora' });
  }

  if (['cancelado', 'completado'].includes(turno.estado) && !esAdmin) {
    return res.status(400).json({ error: `No se puede modificar un turno ${turno.estado}` });
  }

  const nuevoServicioId = servicio_id ?? turno.servicio_id;
  const nuevaFecha = fecha ?? turno.fecha;
  const nuevaHora = hora ?? turno.hora;
  const nuevoEstado = estado ?? turno.estado;

  const servicio = await Servicio.findByPk(nuevoServicioId);
  if (!servicio) return res.status(404).json({ error: 'El servicio indicado no existe' });

  const cambiaAgenda = servicio_id !== undefined || fecha !== undefined || hora !== undefined;
  if (cambiaAgenda && ['pendiente', 'confirmado'].includes(nuevoEstado)) {
    const errorAgenda = validarAgenda({ fecha: nuevaFecha, hora: nuevaHora, duracion: servicio.duracion_minutos });
    if (errorAgenda) return res.status(400).json({ error: errorAgenda });

    if (await hayConflicto({
      fecha: nuevaFecha, hora: nuevaHora, duracion: servicio.duracion_minutos, excluirId: turno.id,
    })) {
      return res.status(409).json({ error: 'Ese horario ya está ocupado, elegí otro' });
    }
  }

  await turno.update({
    servicio_id: nuevoServicioId,
    fecha: nuevaFecha,
    hora: nuevaHora,
    estado: nuevoEstado,
    ...(notas !== undefined && { notas }),
  });

  const completo = await Turno.findByPk(turno.id, { include: INCLUDE });
  return res.json({ message: 'Turno actualizado', data: completo });
});

// DELETE /api/turnos/:id
const eliminar = asyncHandler(async (req, res) => {
  const turno = await Turno.findByPk(req.params.id);
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
  if (!esDuenioOAdmin(req, turno)) {
    return res.status(403).json({ error: 'No tenés permisos para eliminar este turno' });
  }

  await turno.destroy();
  return res.json({ message: 'Turno eliminado' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };

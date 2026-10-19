const { body, param } = require('express-validator');

const idParam = param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo').toInt();

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// ---------- Auth / Usuarios ----------
const registro = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('email').trim().notEmpty().withMessage('El email es obligatorio').isEmail().withMessage('El formato del email no es válido').normalizeEmail(),
  body('password')
    .isString().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número'),
  body('telefono').optional({ values: 'falsy' }).trim().matches(/^[0-9+\-\s()]{6,30}$/).withMessage('El teléfono no es válido'),
];

const login = [
  body('email').trim().notEmpty().withMessage('El email es obligatorio').isEmail().withMessage('El formato del email no es válido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

const usuarioCrear = [
  ...registro,
  body('rol').optional().isIn(['cliente', 'admin']).withMessage('El rol debe ser "cliente" o "admin"'),
];

const usuarioActualizar = [
  idParam,
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío').isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('email').optional().trim().isEmail().withMessage('El formato del email no es válido').normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número'),
  body('telefono').optional({ values: 'falsy' }).trim().matches(/^[0-9+\-\s()]{6,30}$/).withMessage('El teléfono no es válido'),
  body('rol').optional().isIn(['cliente', 'admin']).withMessage('El rol debe ser "cliente" o "admin"'),
];

// ---------- Servicios ----------
const servicioCrear = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('descripcion').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
  body('precio').isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor a 0'),
  body('duracion_minutos').isInt({ min: 5, max: 480 }).withMessage('La duración debe ser un entero entre 5 y 480 minutos'),
  body('activo').optional().isBoolean().withMessage('"activo" debe ser true o false'),
];

const servicioActualizar = [
  idParam,
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío').isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('descripcion').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
  body('precio').optional().isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor a 0'),
  body('duracion_minutos').optional().isInt({ min: 5, max: 480 }).withMessage('La duración debe ser un entero entre 5 y 480 minutos'),
  body('activo').optional().isBoolean().withMessage('"activo" debe ser true o false'),
];

// ---------- Turnos ----------
const turnoCrear = [
  body('servicio_id').isInt({ min: 1 }).withMessage('servicio_id es obligatorio y debe ser un entero positivo').toInt(),
  body('fecha').isISO8601({ strict: true, strictSeparator: true }).withMessage('La fecha debe tener formato YYYY-MM-DD')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener formato YYYY-MM-DD'),
  body('hora').matches(REGEX_HORA).withMessage('La hora debe tener formato HH:MM (24 hs)'),
  body('notas').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
  body('usuario_id').optional().isInt({ min: 1 }).withMessage('usuario_id debe ser un entero positivo').toInt(),
];

const turnoActualizar = [
  idParam,
  body('servicio_id').optional().isInt({ min: 1 }).withMessage('servicio_id debe ser un entero positivo').toInt(),
  body('fecha').optional().isISO8601({ strict: true, strictSeparator: true }).withMessage('La fecha debe tener formato YYYY-MM-DD')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener formato YYYY-MM-DD'),
  body('hora').optional().matches(REGEX_HORA).withMessage('La hora debe tener formato HH:MM (24 hs)'),
  body('notas').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
  body('estado').optional().isIn(['pendiente', 'confirmado', 'cancelado', 'completado'])
    .withMessage('El estado debe ser: pendiente, confirmado, cancelado o completado'),
];

module.exports = {
  idParam,
  registro,
  login,
  usuarioCrear,
  usuarioActualizar,
  servicioCrear,
  servicioActualizar,
  turnoCrear,
  turnoActualizar,
};

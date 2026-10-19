const jwt = require('jsonwebtoken');
const { User } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');

function generarToken(user) {
  return jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
}

// POST /api/auth/register
const registrar = asyncHandler(async (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  const existente = await User.findOne({ where: { email } });
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
  }

  // El rol siempre es "cliente": nadie puede auto-asignarse admin desde el registro
  const user = await User.create({ nombre, email, password, telefono, rol: 'cliente' });

  return res.status(201).json({
    message: 'Usuario registrado correctamente',
    data: user,
    token: generarToken(user),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  // Mismo mensaje para email inexistente y password incorrecta (no revela cuál falló)
  if (!user || !(await user.validarPassword(password))) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  return res.json({
    message: 'Inicio de sesión exitoso',
    data: user,
    token: generarToken(user),
  });
});

// GET /api/auth/me
const perfil = asyncHandler(async (req, res) => {
  res.json({ data: req.user });
});

module.exports = { registrar, login, perfil };

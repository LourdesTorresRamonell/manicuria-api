const { User } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');

// Un usuario solo puede ver/modificar su propio perfil, salvo que sea admin
function puedeAccederAUsuario(req, id) {
  return req.user.rol === 'admin' || req.user.id === Number(id);
}

// GET /api/usuarios  (admin)
const listar = asyncHandler(async (req, res) => {
  const usuarios = await User.findAll({ order: [['id', 'ASC']] });
  res.json({ total: usuarios.length, data: usuarios });
});

// GET /api/usuarios/:id
const obtener = asyncHandler(async (req, res) => {
  if (!puedeAccederAUsuario(req, req.params.id)) {
    return res.status(403).json({ error: 'No tenés permisos para ver este usuario' });
  }
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json({ data: user });
});

// POST /api/usuarios  (admin: crea usuarios con cualquier rol)
const crear = asyncHandler(async (req, res) => {
  const { nombre, email, password, telefono, rol } = req.body;

  const existente = await User.findOne({ where: { email } });
  if (existente) return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

  const user = await User.create({ nombre, email, password, telefono, rol: rol || 'cliente' });
  return res.status(201).json({ message: 'Usuario creado', data: user });
});

// PUT /api/usuarios/:id
const actualizar = asyncHandler(async (req, res) => {
  if (!puedeAccederAUsuario(req, req.params.id)) {
    return res.status(403).json({ error: 'No tenés permisos para modificar este usuario' });
  }
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { nombre, email, password, telefono, rol } = req.body;

  if (email && email !== user.email) {
    const repetido = await User.findOne({ where: { email } });
    if (repetido) return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
  }

  // Solo un admin puede cambiar roles
  if (rol !== undefined && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo una administradora puede cambiar roles' });
  }

  await user.update({
    ...(nombre !== undefined && { nombre }),
    ...(email !== undefined && { email }),
    ...(password !== undefined && { password }),
    ...(telefono !== undefined && { telefono }),
    ...(rol !== undefined && { rol }),
  });

  return res.json({ message: 'Usuario actualizado', data: user });
});

// DELETE /api/usuarios/:id  (admin)
const eliminar = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (user.id === req.user.id) {
    return res.status(400).json({ error: 'No podés eliminar tu propia cuenta de administradora' });
  }

  await user.destroy();
  return res.json({ message: 'Usuario eliminado' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };

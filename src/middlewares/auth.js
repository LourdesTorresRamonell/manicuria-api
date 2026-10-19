const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verifica el token JWT y carga el usuario en req.user
async function autenticar(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Falta el token. Usá el header Authorization: Bearer <token>' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const mensaje = err.name === 'TokenExpiredError' ? 'El token expiró, iniciá sesión de nuevo' : 'Token inválido';
      return res.status(401).json({ error: mensaje });
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'El usuario del token ya no existe' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Restringe una ruta a ciertos roles
function requerirRol(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para realizar esta acción' });
    }
    return next();
  };
}

module.exports = { autenticar, requerirRol };

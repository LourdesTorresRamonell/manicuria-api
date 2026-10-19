const router = require('express').Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'manicuria-api', fecha: new Date().toISOString() });
});

// Datos públicos de configuración: el frontend los usa para armar el selector de hora
router.get('/config', (req, res) => {
  res.json({
    hora_apertura: process.env.HORA_APERTURA || '09:00',
    hora_cierre: process.env.HORA_CIERRE || '20:00',
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./user.routes'));
router.use('/servicios', require('./servicio.routes'));
router.use('/turnos', require('./turno.routes'));

module.exports = router;

const router = require('express').Router();
const ctrl = require('../controllers/servicio.controller');
const v = require('./validators');
const validar = require('../middlewares/validate');
const { autenticar, requerirRol } = require('../middlewares/auth');

// Lectura pública: cualquiera puede ver el catálogo de servicios
router.get('/', ctrl.listar);
router.get('/:id', v.idParam, validar, ctrl.obtener);

// Escritura solo para administradoras
router.post('/', autenticar, requerirRol('admin'), v.servicioCrear, validar, ctrl.crear);
router.put('/:id', autenticar, requerirRol('admin'), v.servicioActualizar, validar, ctrl.actualizar);
router.delete('/:id', autenticar, requerirRol('admin'), v.idParam, validar, ctrl.eliminar);

module.exports = router;

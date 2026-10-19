const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const v = require('./validators');
const validar = require('../middlewares/validate');
const { autenticar, requerirRol } = require('../middlewares/auth');

router.use(autenticar);

router.get('/', requerirRol('admin'), ctrl.listar);
router.get('/:id', v.idParam, validar, ctrl.obtener);
router.post('/', requerirRol('admin'), v.usuarioCrear, validar, ctrl.crear);
router.put('/:id', v.usuarioActualizar, validar, ctrl.actualizar);
router.delete('/:id', requerirRol('admin'), v.idParam, validar, ctrl.eliminar);

module.exports = router;

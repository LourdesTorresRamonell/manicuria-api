const router = require('express').Router();
const ctrl = require('../controllers/turno.controller');
const v = require('./validators');
const validar = require('../middlewares/validate');
const { autenticar } = require('../middlewares/auth');

router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/:id', v.idParam, validar, ctrl.obtener);
router.post('/', v.turnoCrear, validar, ctrl.crear);
router.put('/:id', v.turnoActualizar, validar, ctrl.actualizar);
router.delete('/:id', v.idParam, validar, ctrl.eliminar);

module.exports = router;

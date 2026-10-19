const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const v = require('./validators');
const validar = require('../middlewares/validate');
const { autenticar } = require('../middlewares/auth');
const { limiterAuth } = require('../middlewares/rateLimiter');

router.post('/register', limiterAuth, v.registro, validar, ctrl.registrar);
router.post('/login', limiterAuth, v.login, validar, ctrl.login);
router.get('/me', autenticar, ctrl.perfil);

module.exports = router;

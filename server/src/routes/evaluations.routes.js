const router = require('express').Router();
const ctrl   = require('../controllers/evaluations.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

/* Student */
router.get('/take/:moduleId', verifyToken, ctrl.getForStudent);
router.post('/:id/submit',    verifyToken, ctrl.submit);
router.get('/:id/attempts',   verifyToken, ctrl.myAttempts);

/* Admin */
router.get('/module/:moduleId', verifyToken, requireAdmin, ctrl.getByModuleAdmin);
router.post('/',                verifyToken, requireAdmin, ctrl.upsert);
router.delete('/:id',           verifyToken, requireAdmin, ctrl.remove);

module.exports = router;

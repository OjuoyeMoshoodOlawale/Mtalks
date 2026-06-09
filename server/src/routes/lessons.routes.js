const router = require('express').Router();
const ctrl   = require('../controllers/lessons.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/',              verifyToken, ctrl.getAll);
router.get('/progress',      verifyToken, ctrl.getProgress);
router.get('/:id',           verifyToken, ctrl.getOne);
router.post('/',             verifyToken, requireAdmin, ctrl.create);
router.put('/reorder',       verifyToken, requireAdmin, ctrl.reorder);
router.put('/:id',           verifyToken, requireAdmin, ctrl.update);
router.delete('/:id',        verifyToken, requireAdmin, ctrl.remove);
router.post('/:id/complete', verifyToken, ctrl.complete);
module.exports = router;

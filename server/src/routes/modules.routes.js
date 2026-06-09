const router = require('express').Router();
const ctrl   = require('../controllers/modules.controller');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/',           verifyToken, ctrl.getAll);
router.post('/',          verifyToken, requireAdmin, ctrl.create);
router.put('/reorder',    verifyToken, requireAdmin, ctrl.reorder);
router.put('/:id',        verifyToken, requireAdmin, ctrl.update);
router.delete('/:id',     verifyToken, requireAdmin, ctrl.remove);
module.exports = router;

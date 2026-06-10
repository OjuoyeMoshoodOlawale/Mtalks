const router = require('express').Router();
const ctrl   = require('../controllers/gallery.controller');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/',              optionalAuth, ctrl.getAll);
router.post('/import-folder', verifyToken, requireAdmin, ctrl.importFolder);
router.post('/',             verifyToken, requireAdmin, ctrl.create);
router.put('/:id',           verifyToken, requireAdmin, ctrl.update);
router.delete('/:id',        verifyToken, requireAdmin, ctrl.remove);
module.exports = router;

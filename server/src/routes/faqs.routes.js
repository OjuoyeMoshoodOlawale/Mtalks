const router = require('express').Router();
const ctrl   = require('../controllers/faqs.controller');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/',       optionalAuth, ctrl.getAll);
router.post('/',      verifyToken, requireAdmin, ctrl.create);
router.put('/:id',    verifyToken, requireAdmin, ctrl.update);
router.delete('/:id', verifyToken, requireAdmin, ctrl.remove);
module.exports = router;

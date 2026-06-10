const router = require('express').Router();
const ctrl   = require('../controllers/bot.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/ask', ctrl.ask);                                        // public
router.get('/knowledge',        verifyToken, requireAdmin, ctrl.getAll);
router.post('/knowledge',       verifyToken, requireAdmin, ctrl.create);
router.put('/knowledge/:id',    verifyToken, requireAdmin, ctrl.update);
router.delete('/knowledge/:id', verifyToken, requireAdmin, ctrl.remove);

module.exports = router;

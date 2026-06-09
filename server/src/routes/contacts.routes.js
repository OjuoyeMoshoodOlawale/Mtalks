const router = require('express').Router();
const ctrl   = require('../controllers/contacts.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/',                       ctrl.submit);               // public
router.get('/',  verifyToken, requireAdmin, ctrl.getAll);          // admin
router.get('/unread-count', verifyToken, requireAdmin, ctrl.unreadCount);
router.patch('/:id/read', verifyToken, requireAdmin, ctrl.markRead);
router.delete('/:id',     verifyToken, requireAdmin, ctrl.remove);

module.exports = router;

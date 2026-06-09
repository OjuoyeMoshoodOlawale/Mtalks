const router = require('express').Router();
const ctrl   = require('../controllers/certificates.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/verify/:code', ctrl.verify);                 // public
router.post('/claim',       verifyToken, ctrl.claim);     // student
router.get('/my',           verifyToken, ctrl.getMine);   // student

module.exports = router;

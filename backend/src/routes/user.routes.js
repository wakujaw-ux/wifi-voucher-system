const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

// Routes zote za users ni SUPER_ADMIN au ADMIN
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

router.get('/', userController.getAll);
router.get('/:id', userController.getOne);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.post('/:id/change-password', userController.changePassword);
router.delete('/:id', userController.remove);

module.exports = router;
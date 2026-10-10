const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
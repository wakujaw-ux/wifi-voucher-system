const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/sales', reportController.getSales);
router.get('/vouchers', reportController.getVouchers);
router.get('/revenue', reportController.getRevenue);
router.get('/sessions', reportController.getSessions);
router.get('/expenses', reportController.getExpenses);
router.get('/profit-loss', reportController.getProfitLoss);

module.exports = router;
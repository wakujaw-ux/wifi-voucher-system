const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use('/summary', dashboardController.getSummary);
router.get('/sales-chart', dashboardController.getSalesChart);
router.get('/voucher-stats', dashboardController.getVoucherStats);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/top-packages', dashboardController.getTopPackages);

module.exports = router;
const dashboardService = require('../services/dashboard.service');
const { success, error } = require('../utils/response');

// GET /api/dashboard/summary
const getSummary = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;

    const summary = await dashboardService.getSummary(filters);
    return success(res, { summary }, 'Dashboard summary imepatikana');
  } catch (err) {
    console.error('dashboard summary error:', err.message);
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

// GET /api/dashboard/sales-chart
const getSalesChart = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.days) filters.days = req.query.days;

    const chart = await dashboardService.getSalesChart(filters);
    return success(res, { chart }, 'Sales chart imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

// GET /api/dashboard/voucher-stats
const getVoucherStats = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;

    const stats = await dashboardService.getVoucherStats(filters);
    return success(res, { stats }, 'Voucher stats zimepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

// GET /api/dashboard/recent-activity
const getRecentActivity = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.limit) filters.limit = req.query.limit;

    const activity = await dashboardService.getRecentActivity(filters);
    return success(res, { count: activity.length, activity }, 'Recent activity imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

// GET /api/dashboard/top-packages
const getTopPackages = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.limit) filters.limit = req.query.limit;

    const top = await dashboardService.getTopPackages(filters);
    return success(res, { top_packages: top }, 'Top packages zimepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

module.exports = { getSummary, getSalesChart, getVoucherStats, getRecentActivity, getTopPackages };
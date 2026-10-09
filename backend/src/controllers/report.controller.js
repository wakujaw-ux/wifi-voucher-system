const reportService = require('../services/report.service');
const { success, error } = require('../utils/response');

const buildFilters = (query) => {
  const filters = {};
  if (query.site_id) filters.site_id = query.site_id;
  if (query.from_date) filters.from_date = query.from_date;
  if (query.to_date) filters.to_date = query.to_date;
  if (query.group_by) filters.group_by = query.group_by;
  return filters;
};

const getSales = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getSalesReport(filters);
    return success(res, { report }, 'Sales report imepatikana');
  } catch (err) {
    console.error('sales report error:', err.message);
    return error(res, err.message, err.code || 'REPORT_FAILED', err.status || 500);
  }
};

const getVouchers = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getVoucherReport(filters);
    return success(res, { report }, 'Voucher report imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'REPORT_FAILED', err.status || 500);
  }
};

const getRevenue = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getRevenueReport(filters);
    return success(res, { report }, 'Revenue report imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'REPORT_FAILED', err.status || 500);
  }
};

const getSessions = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getSessionReport(filters);
    return success(res, { report }, 'Session report imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'REPORT_FAILED', err.status || 500);
  }
};

const getExpenses = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getExpensesReport(filters);
    return success(res, { report }, 'Expenses report imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'REPORT_FAILED', err.status || 500);
  }
};

const getProfitLoss = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getProfitLossReport(filters);
    return success(res, { report }, 'Profit & Loss report imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'REPORT_FAILED', err.status || 500);
  }
};

module.exports = { getSales, getVouchers, getRevenue, getSessions, getExpenses, getProfitLoss };
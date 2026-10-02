const saleService = require('../services/sale.service');
const {success, error } = require('../utils/response');

// GET /api/sales
const getAll = async (req, res) => {
    try {
        const filters = {};
        if (req.query.site_id) filters.site_id = req.query.site_id;
        if (req.query.operator_id) filters.operator_id = req.query.operator_id;
        if (req.query.from_date) filters.from_date = req.query.from_date;
        if (req.query.to_date) filters.to_date = req.query.to_date;
        if (req.query.limit) filters.limit = req.query.limit;
        if (req.query.offset) filters.offset = req.query.offset;

        const result = await saleService.getAllSales(filters);
        return success(res, result, 'Sales zimepatikana');
    } catch (err) {
        console.error('getAll sales error:', err.message);
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

// GET /api/sales/summary
const getSummary = async (req, res) => {
    try {
        const filters = {};
        if (req.query.site_id) filters.site_id = req.query.site_id;
        if (req.query.from_date) filters.from_date = req.query.from_date;
        if (req.query.to_date) filters.to_date = req.query.to_date;

        const summary = await saleService.getSalesSummary(filters);
        return success(res, { summary }, 'Sales summary imepatikana');
    } catch (err) {
        console.error('getSummary sales error:', err.message);
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

// GET /api/sales/:id
const getOne = async (req, res) => {
    try {
        const sale = await saleService.getSaleById(req.params.id);
        return success(res, { sale }, 'Sale imepatikana');
    } catch (err) {
        console.error('getOne sale error:', err.message);
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

module.exports = {
    getAll,
    getSummary,
    getOne,
};
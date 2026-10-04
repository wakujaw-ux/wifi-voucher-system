const sessionService = require('../services/session.service');
const { validateDisconnect } = require('../validators/session.validator');
const { success, error } = require('../utils/response');

// GET /api/sessions/active
const getActive = async (req, res) => {
    try {
        const filters = {};
        if (req.query.site_id) filters.site_id = req.query.site_id;
        if (req.query.limit) filters.limit = req.query.limit;
        if (req.query.offset) filters.offset = req.query.offset;

        const result = await sessionService.getActiveSessions(filters);
        return success(res, result, 'Active session zimepatikana');
    } catch (err) {
        console.error('getActive sessions error:', err.message);
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

// GET /api/sessions
const getAll = async (req, res) => {
    try {
        const filters = [];
        if (req.query.site_id) filters.site_id = req.query.site_id;
        if (req.query.voucher_id) filters.voucher_id = req.query.voucher_id;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.from_date) filters.at.from_date = req.query.from_date;
        if (req.query.to_date) filters.to_date = req.query.to_date;
        if (req.query.limit) filters.limit = req.query.limit;
        if (req.query.offset) filters.offset = req.query.offset;

        const result = await sessionService.getAllSessions(filters);
        return success(res, result, 'Sessions zimepatikana');
    } catch (err) {
        console.error('getAll session error:', err.message);
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

// GET /api/sessions/stats
const getStats = async (req, res) => {
    try {
        const filters = {};
        if (req.query.site_id) filters.site_id = req.query.site_id;
        if (req.query.from_date) filters.from_date = req.query.from_date;
        if (req.query.to_date) filters.to_date = req.query.to_date;

        const stats = await sessionService.getSessionStats(filters);
        return success(res, { stats }, 'Session stats zimepatikana');
    } catch (err) {
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500)
    }
};

// GET /api/sessions/:id
const getOne = async (req, res) => {
    try {
        const session = await sessionService.getSessionById(req.params.id);
        return success(res, { session }, 'Session imepatikana');
    } catch (err) {
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

// POST /api/sessions/:id/disconnect
const disconnect = async (req, res) => {
    const errors = validateDisconnect(req.body);
    if (errors.length > 0) {
        return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
    }
    
    try {
        const result = await sessionService.disconnectSession(req.params.id, req.user.userId, req.body.reason);
        return success(res, result, 'Session imedisconnect');
    } catch (err) {
        console.error('disconnect session error:', err.message);
        return error(res, err.message, err.code || 'DISCONNECT_FAILED', err.status || 500);
    }
};

// POST /api/sessions/expire-stale
const expireStale = async (req, res) => {
    try {
        const result = await sessionService.expireStaleSessions();
        return success(res, result, `Sessions ${result.expired_count} zimeisha muda`);
    } catch (err) {
        return error(res, err.message, err.code || 'EXPIRE_FAILED', err.status || 500);
    }
};

module.exports = { getActive, getAll, getOne, getStats, disconnect, expireStale };
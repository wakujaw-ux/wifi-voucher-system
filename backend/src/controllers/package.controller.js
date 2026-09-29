const packageService = require('../services/package.service');
const { validateCreatePackage, validateUpdatePackage } = require('../validators/package.validator');
const { success, error } = require('../utils/response');
const getAll = async (req, res) => {
    try{
        const filters = {};
        if (req.query.site_id) filters.site_id = req.query.site_id;
        if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

        const packages = await packageService.getAllpackages(filters);
        return success(res, {count: packages.length, packages }, 'Packages zimepatikana');
    } catch (err) {
        console.error('getAll packages error:', err.message);
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

const getOne = async (req, res) => {
    try {
        const pkg = await packageService.getPackageById(req.params.id);
        return success(res, { package: pkg }, 'Package imepatikana');
    } catch (err) {
        return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
    }
};

const create = async (req, res) => {
    const errors = validateCreatePackage(req.body);
    if (errors.length > 0) {
        return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
    }

    try {
        const pkg = await packageService.createPackage(req.body, req.user.userId);
        return success(res, { package: pkg }, 'Package imeundwa', 201);
    } catch (err) {
        console.error('create package error:', err.message);
        return error(res, err.message, err.code || 'CREATE_FAILED', err.status || 500);
    }
};

const update = async (req, res) => {
    const errors = validateUpdatePackage(req.body);
    if (errors.length > 0) {
        return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
    }

    try {
        const pkg = await packageService.updatePackage(req.params.id, req.body);
        return success(res, { package: pkg }, 'package imesahihishwa');
    } catch (err) {
        return error(res, err.message, err.code || 'UPDATE_FAILED', err.status || 500);
    }
};

const remove = async (req, res) => {
    try { const pkg = await packageService.deletePackage(req.params.id);
        return success(res, { package: pkg }, 'package imefutwa');
    } catch (err) {
        return error( res, err.message, err.code || 'DELETE_FAILED', err.status || 500);
    }
};

module.exports = { getAll, getOne, create, update, remove};
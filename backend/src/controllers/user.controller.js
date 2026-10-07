const userService = require('../services/user.service');
const { validateCreateUser, validateUpdateUser, validateChangePassword } = require('../validators/user.validator');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.role) filters.role = req.query.role;
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';
    if (req.query.limit) filters.limit = req.query.limit;
    if (req.query.offset) filters.offset = req.query.offset;

    const result = await userService.getAllUsers(filters);
    return success(res, result, 'Users zimepatikana');
  } catch (err) {
    console.error('getAll users error:', err.message);
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

const getOne = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return success(res, { user }, 'User amepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

const create = async (req, res) => {
  const errors = validateCreateUser(req.body);
  if (errors.length > 0) {
    return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
  }

  try {
    const user = await userService.createUser(req.body, req.user.userId);
    return success(res, { user }, 'User ameundwa', 201);
  } catch (err) {
    console.error('create user error:', err.message);
    return error(res, err.message, err.code || 'CREATE_FAILED', err.status || 500);
  }
};

const update = async (req, res) => {
  const errors = validateUpdateUser(req.body);
  if (errors.length > 0) {
    return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
  }

  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return success(res, { user }, 'User amesasishwa');
  } catch (err) {
    return error(res, err.message, err.code || 'UPDATE_FAILED', err.status || 500);
  }
};

const changePassword = async (req, res) => {
  const errors = validateChangePassword(req.body);
  if (errors.length > 0) {
    return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
  }

  try {
    const user = await userService.changePassword(req.params.id, req.body.new_password);
    return success(res, { user }, 'Password imebadilishwa');
  } catch (err) {
    return error(res, err.message, err.code || 'PASSWORD_CHANGE_FAILED', err.status || 500);
  }
};

const remove = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id, req.user.userId);
    return success(res, { user }, 'User amefutwa');
  } catch (err) {
    return error(res, err.message, err.code || 'DELETE_FAILED', err.status || 500);
  }
};

module.exports = { getAll, getOne, create, update, changePassword, remove };
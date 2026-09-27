const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return error(res, 'Username na password zinahitajika', 'VALIDATION_ERROR', 400);
  }

  try {
    const result = await authService.login(username, password);
    return success(res, result, 'Umeingia kwa mafanikio');
  } catch (err) {
    return error(res, err.message, err.code || 'LOGIN_FAILED', err.status || 500);
  }
};

const me = async (req, res) => {
  return success(res, { user: req.user }, 'Taarifa zako');
};

module.exports = { login, me };
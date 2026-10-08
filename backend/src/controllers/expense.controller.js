const expenseService = require('../services/expense.service');
const { validateCreateExpense, validateUpdateExpense } = require('../validators/expense.validator');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.from_date) filters.from_date = req.query.from_date;
    if (req.query.to_date) filters.to_date = req.query.to_date;
    if (req.query.limit) filters.limit = req.query.limit;
    if (req.query.offset) filters.offset = req.query.offset;

    const result = await expenseService.getAllExpenses(filters);
    return success(res, result, 'Expenses zimepatikana');
  } catch (err) {
    console.error('getAll expenses error:', err.message);
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

const getOne = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    return success(res, { expense }, 'Expense imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

const getSummary = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.from_date) filters.from_date = req.query.from_date;
    if (req.query.to_date) filters.to_date = req.query.to_date;

    const summary = await expenseService.getExpensesSummary(filters);
    return success(res, { summary }, 'Expense summary imepatikana');
  } catch (err) {
    return error(res, err.message, err.code || 'FETCH_FAILED', err.status || 500);
  }
};

const create = async (req, res) => {
  const errors = validateCreateExpense(req.body);
  if (errors.length > 0) {
    return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
  }

  try {
    const expense = await expenseService.createExpense(req.body, req.user.userId);
    return success(res, { expense }, 'Expense imeundwa', 201);
  } catch (err) {
    console.error('create expense error:', err.message);
    return error(res, err.message, err.code || 'CREATE_FAILED', err.status || 500);
  }
};

const update = async (req, res) => {
  const errors = validateUpdateExpense(req.body);
  if (errors.length > 0) {
    return error(res, errors.join(', '), 'VALIDATION_ERROR', 400);
  }

  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    return success(res, { expense }, 'Expense imesasishwa');
  } catch (err) {
    return error(res, err.message, err.code || 'UPDATE_FAILED', err.status || 500);
  }
};

const remove = async (req, res) => {
  try {
    const expense = await expenseService.deleteExpense(req.params.id);
    return success(res, { expense }, 'Expense imefutwa');
  } catch (err) {
    return error(res, err.message, err.code || 'DELETE_FAILED', err.status || 500);
  }
};

module.exports = { getAll, getOne, getSummary, create, update, remove };
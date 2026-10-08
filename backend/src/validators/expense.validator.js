const ALLOWED_CATEGORIES = [
  'INTERNET',
  'ELECTRICITY',
  'MAINTENANCE',
  'TRANSPORT',
  'EQUIPMENT',
  'STAFF',
  'RENT',
  'OTHER',
];

const validateCreateExpense = (data) => {
  const errors = [];

  if (!data.category || !ALLOWED_CATEGORIES.includes(data.category)) {
    errors.push(`category lazima iwe mojawapo ya: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  if (data.amount === undefined || isNaN(data.amount) || data.amount <= 0) {
    errors.push('amount lazima iwe namba zaidi ya 0');
  }

  if (!data.expense_date) {
    errors.push('expense_date inahitajika (YYYY-MM-DD)');
  }

  if (data.expense_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.expense_date)) {
    errors.push('expense_date lazima iwe format YYYY-MM-DD');
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('description lazima iwe maandishi');
  }

  return errors;
};

const validateUpdateExpense = (data) => {
  const errors = [];

  if (data.category !== undefined && !ALLOWED_CATEGORIES.includes(data.category)) {
    errors.push(`category lazima iwe mojawapo ya: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
    errors.push('amount lazima iwe namba zaidi ya 0');
  }

  if (data.expense_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.expense_date)) {
    errors.push('expense_date lazima iwe format YYYY-MM-DD');
  }

  return errors;
};

module.exports = { validateCreateExpense, validateUpdateExpense, ALLOWED_CATEGORIES };
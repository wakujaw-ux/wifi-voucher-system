const db = require('../config/database');

// ============================================================
// GET ALL EXPENSES
// ============================================================
const getAllExpenses = async (filters = {}) => {
  const { site_id, category, from_date, to_date, limit = 100, offset = 0 } = filters;

  let sql = `
    SELECT
      e.id, e.site_id, e.category, e.description, e.amount, e.expense_date,
      e.recorded_by, e.created_at,
      u.username AS recorded_by_username,
      s.name AS site_name
    FROM expenses e
    LEFT JOIN users u ON u.id = e.recorded_by
    LEFT JOIN sites s ON s.id = e.site_id
    WHERE 1 = 1
  `;
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    sql += ` AND e.site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (category) {
    sql += ` AND e.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (from_date) {
    sql += ` AND e.expense_date >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    sql += ` AND e.expense_date <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  sql += ` ORDER BY e.expense_date DESC, e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await db.query(sql, params);
  return { expenses: result.rows, count: result.rowCount };
};

// ============================================================
// GET EXPENSE BY ID
// ============================================================
const getExpenseById = async (id) => {
  const sql = `
    SELECT
      e.id, e.site_id, e.category, e.description, e.amount, e.expense_date,
      e.recorded_by, e.created_at,
      u.username AS recorded_by_username,
      s.name AS site_name
    FROM expenses e
    LEFT JOIN users u ON u.id = e.recorded_by
    LEFT JOIN sites s ON s.id = e.site_id
    WHERE e.id = $1
  `;
  const result = await db.query(sql, [id]);

  if (result.rowCount === 0) {
    const err = new Error('Expense haipo');
    err.code = 'EXPENSE_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

// ============================================================
// CREATE EXPENSE
// ============================================================
const createExpense = async (data, userId) => {
  const { site_id, category, description, amount, expense_date } = data;

  const sql = `
    INSERT INTO expenses (site_id, category, description, amount, expense_date, recorded_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, site_id, category, description, amount, expense_date, recorded_by, created_at
  `;

  const params = [
    site_id || null,
    category,
    description || null,
    amount,
    expense_date,
    userId,
  ];

  const result = await db.query(sql, params);
  return result.rows[0];
};

// ============================================================
// UPDATE EXPENSE
// ============================================================
const updateExpense = async (id, data) => {
  await getExpenseById(id);

  const allowedFields = ['site_id', 'category', 'description', 'amount', 'expense_date'];
  const updates = [];
  const params = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      params.push(data[field]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    const err = new Error('Hakuna data ya kubadilisha');
    err.code = 'NO_UPDATE_DATA';
    err.status = 400;
    throw err;
  }

  params.push(id);

  const sql = `
    UPDATE expenses
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, site_id, category, description, amount, expense_date, created_at
  `;

  const result = await db.query(sql, params);
  return result.rows[0];
};

// ============================================================
// DELETE EXPENSE (hard delete — expenses hazina soft delete)
// ============================================================
const deleteExpense = async (id) => {
  await getExpenseById(id);

  const sql = 'DELETE FROM expenses WHERE id = $1 RETURNING id, category, amount';
  const result = await db.query(sql, [id]);
  return result.rows[0];
};

// ============================================================
// EXPENSES SUMMARY
// ============================================================
const getExpensesSummary = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  let whereSql = 'WHERE 1 = 1';
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    whereSql += ` AND site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (from_date) {
    whereSql += ` AND expense_date >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    whereSql += ` AND expense_date <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  // Jumla
  const totalSql = `
    SELECT
      COUNT(*)::int AS total_count,
      COALESCE(SUM(amount), 0)::numeric AS total_amount
    FROM expenses
    ${whereSql}
  `;
  const total = (await db.query(totalSql, params)).rows[0];

  // Kwa category
  const byCategorySql = `
    SELECT
      category,
      COUNT(*)::int AS count,
      COALESCE(SUM(amount), 0)::numeric AS amount
    FROM expenses
    ${whereSql}
    GROUP BY category
    ORDER BY amount DESC
  `;
  const byCategory = (await db.query(byCategorySql, params)).rows;

  return {
    total_count: total.total_count,
    total_amount: total.total_amount,
    by_category: byCategory,
  };
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary,
};
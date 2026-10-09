const db = require('../config/database');

// ============================================================
// SALES REPORT
// ============================================================
const getSalesReport = async (filters = {}) => {
  const { site_id, from_date, to_date, group_by = 'day' } = filters;

  let whereSql = 'WHERE 1 = 1';
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    whereSql += ` AND s.site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (from_date) {
    whereSql += ` AND s.created_at >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    whereSql += ` AND s.created_at <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  // Summary
  const summarySql = `
    SELECT
      COUNT(*)::int AS total_sales,
      COALESCE(SUM(s.amount), 0)::numeric AS total_revenue,
      COALESCE(AVG(s.amount), 0)::numeric AS average_sale
    FROM sales s
    ${whereSql}
  `;
  const summary = (await db.query(summarySql, params)).rows[0];

  // By day/month
  let groupExpr = "DATE(s.created_at)";
  if (group_by === 'month') groupExpr = "DATE_TRUNC('month', s.created_at)";
  if (group_by === 'week') groupExpr = "DATE_TRUNC('week', s.created_at)";

  const byPeriodSql = `
    SELECT
      ${groupExpr} AS period,
      COUNT(*)::int AS sales_count,
      COALESCE(SUM(s.amount), 0)::numeric AS revenue
    FROM sales s
    ${whereSql}
    GROUP BY ${groupExpr}
    ORDER BY period ASC
  `;
  const byPeriod = (await db.query(byPeriodSql, params)).rows;

  // By package
  const byPackageSql = `
    SELECT
      p.id AS package_id,
      p.name AS package_name,
      COUNT(s.id)::int AS sales_count,
      COALESCE(SUM(s.amount), 0)::numeric AS revenue
    FROM sales s
    JOIN packages p ON p.id = s.package_id
    ${whereSql}
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
  `;
  const byPackage = (await db.query(byPackageSql, params)).rows;

  // By operator
  const byOperatorSql = `
    SELECT
      u.id AS operator_id,
      u.username,
      u.full_name,
      COUNT(s.id)::int AS sales_count,
      COALESCE(SUM(s.amount), 0)::numeric AS revenue
    FROM sales s
    JOIN users u ON u.id = s.operator_id
    ${whereSql}
    GROUP BY u.id, u.username, u.full_name
    ORDER BY revenue DESC
  `;
  const byOperator = (await db.query(byOperatorSql, params)).rows;

  return {
    summary,
    by_period: byPeriod,
    by_package: byPackage,
    by_operator: byOperator,
  };
};

// ============================================================
// VOUCHER REPORT
// ============================================================
const getVoucherReport = async (filters = {}) => {
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
    whereSql += ` AND created_at >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    whereSql += ` AND created_at <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  const byStatusSql = `
    SELECT
      status,
      COUNT(*)::int AS count,
      COALESCE(SUM(price), 0)::numeric AS value
    FROM vouchers
    ${whereSql}
    GROUP BY status
    ORDER BY status
  `;
  const byStatus = (await db.query(byStatusSql, params)).rows;

  const byPackageSql = `
    SELECT
      p.name AS package_name,
      COUNT(v.id)::int AS total,
      COUNT(v.id) FILTER (WHERE v.status IN ('SOLD', 'ACTIVE', 'USED'))::int AS sold_or_used,
      COUNT(v.id) FILTER (WHERE v.status IN ('CREATED', 'AVAILABLE'))::int AS available
    FROM vouchers v
    JOIN packages p ON p.id = v.package_id
    ${whereSql.replace(/site_id/g, 'v.site_id').replace(/created_at/g, 'v.created_at')}
    GROUP BY p.name
    ORDER BY total DESC
  `;
  const byPackage = (await db.query(byPackageSql, params)).rows;

  return {
    by_status: byStatus,
    by_package: byPackage,
  };
};

// ============================================================
// REVENUE REPORT (by payment method)
// ============================================================
const getRevenueReport = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  let whereSql = 'WHERE 1 = 1';
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    whereSql += ` AND s.site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (from_date) {
    whereSql += ` AND s.created_at >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    whereSql += ` AND s.created_at <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  const sql = `
    SELECT
      p.method,
      COUNT(s.id)::int AS transaction_count,
      COALESCE(SUM(s.amount), 0)::numeric AS revenue
    FROM sales s
    JOIN payments p ON p.sale_id = s.id
    ${whereSql}
    GROUP BY p.method
    ORDER BY revenue DESC
  `;
  const byMethod = (await db.query(sql, params)).rows;

  const totalSql = `
    SELECT
      COUNT(*)::int AS total_transactions,
      COALESCE(SUM(p.amount), 0)::numeric AS total_revenue
    FROM sales s
    JOIN payments p ON p.sale_id = s.id
    ${whereSql}
  `;
  const total = (await db.query(totalSql, params)).rows[0];

  return { total, by_method: byMethod };
};

// ============================================================
// SESSION REPORT
// ============================================================
const getSessionReport = async (filters = {}) => {
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
    whereSql += ` AND login_at >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    whereSql += ` AND login_at <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  const summarySql = `
    SELECT
      COUNT(*)::int AS total_sessions,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_sessions,
      COUNT(*) FILTER (WHERE status = 'EXPIRED')::int AS expired_sessions,
      COUNT(*) FILTER (WHERE status = 'DISCONNECTED')::int AS disconnected_sessions,
      COALESCE(SUM(data_used_mb), 0)::numeric AS total_data_mb,
      COALESCE(AVG(duration_seconds), 0)::int AS avg_duration_seconds
    FROM sessions
    ${whereSql}
  `;
  const summary = (await db.query(summarySql, params)).rows[0];

  const byDaySql = `
    SELECT
      DATE(login_at) AS date,
      COUNT(*)::int AS sessions,
      COALESCE(SUM(data_used_mb), 0)::numeric AS data_mb
    FROM sessions
    ${whereSql}
    GROUP BY DATE(login_at)
    ORDER BY date ASC
  `;
  const byDay = (await db.query(byDaySql, params)).rows;

  return { summary, by_day: byDay };
};

// ============================================================
// EXPENSES REPORT
// ============================================================
const getExpensesReport = async (filters = {}) => {
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

  const totalSql = `
    SELECT
      COUNT(*)::int AS total_count,
      COALESCE(SUM(amount), 0)::numeric AS total_amount
    FROM expenses
    ${whereSql}
  `;
  const total = (await db.query(totalSql, params)).rows[0];

  return { total, by_category: byCategory };
};

// ============================================================
// PROFIT & LOSS
// ============================================================
const getProfitLossReport = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  // Revenue
  let revSql = 'WHERE 1 = 1';
  const revParams = [];
  let idx = 1;

  if (site_id) {
    revSql += ` AND site_id = $${idx}`;
    revParams.push(site_id);
    idx++;
  }
  if (from_date) {
    revSql += ` AND created_at >= $${idx}`;
    revParams.push(from_date);
    idx++;
  }
  if (to_date) {
    revSql += ` AND created_at <= $${idx}`;
    revParams.push(to_date);
    idx++;
  }

  const revenueSql = `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM sales ${revSql}`;
  const revenue = (await db.query(revenueSql, revParams)).rows[0];

  // Expenses
  let expSql = 'WHERE 1 = 1';
  const expParams = [];
  idx = 1;

  if (site_id) {
    expSql += ` AND site_id = $${idx}`;
    expParams.push(site_id);
    idx++;
  }
  if (from_date) {
    expSql += ` AND expense_date >= $${idx}`;
    expParams.push(from_date);
    idx++;
  }
  if (to_date) {
    expSql += ` AND expense_date <= $${idx}`;
    expParams.push(to_date);
    idx++;
  }

  const expensesSql = `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM expenses ${expSql}`;
  const expenses = (await db.query(expensesSql, expParams)).rows[0];

  const totalRevenue = parseFloat(revenue.total) || 0;
  const totalExpenses = parseFloat(expenses.total) || 0;
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : '0.00';

  return {
    period: { from_date: from_date || 'beginning', to_date: to_date || 'now' },
    revenue: totalRevenue.toFixed(2),
    expenses: totalExpenses.toFixed(2),
    profit: profit.toFixed(2),
    margin_percent: margin,
    status: profit > 0 ? 'PROFIT' : profit < 0 ? 'LOSS' : 'BREAK_EVEN',
  };
};

module.exports = {
  getSalesReport,
  getVoucherReport,
  getRevenueReport,
  getSessionReport,
  getExpensesReport,
  getProfitLossReport,
};
const { parse } = require('dotenv');
const db = require('../config/database');

// ============================================================
// SUMMARY - Muhtasari mmoja kwa dashboard
// ============================================================
const getSummary = async (filters = {}) => {
  const { site_id } = filters;
  const params = [];
  let whereSql = 'WHERE 1 = 1';

  if (site_id) {
    whereSql += ` AND site_id = $1`;
    params.push(site_id);
  }

  // Sales za leo
  const todaySalesSql = `
    SELECT
      COUNT(*)::int AS today_count,
      COALESCE(SUM(amount), 0)::numeric AS today_revenue
    FROM sales
    ${whereSql} AND created_at >= CURRENT_DATE
  `;
  const todaySales = (await db.query(todaySalesSql, params)).rows[0];

  // Sales zote
  const totalSalesSql = `
    SELECT
      COUNT(*)::int AS total_count,
      COALESCE(SUM(amount), 0)::numeric AS total_revenue
    FROM sales
    ${whereSql}
  `;
  const totalSales = (await db.query(totalSalesSql, params)).rows[0];

  // Voucher stats
  const voucherSql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status IN ('CREATED', 'AVAILABLE'))::int AS available,
      COUNT(*) FILTER (WHERE status = 'SOLD')::int AS sold,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
      COUNT(*) FILTER (WHERE status = 'USED')::int AS used,
      COUNT(*) FILTER (WHERE status = 'EXPIRED')::int AS expired,
      COUNT(*) FILTER (WHERE status = 'REVOKED')::int AS revoked
    FROM vouchers
    ${whereSql}
  `;
  const vouchers = (await db.query(voucherSql, params)).rows[0];

  // Active sessions
  const activeSessionsSql = `
    SELECT COUNT(*)::int AS online_users
    FROM sessions
    ${whereSql} AND status = 'ACTIVE'
  `;
  const sessions = (await db.query(activeSessionsSql, params)).rows[0];

  // Expenses
  const expensesSql = `
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE expense_date = CURRENT_DATE), 0)::numeric AS today_expenses,
      COALESCE(SUM(amount), 0)::numeric AS total_expenses
    FROM expenses
    ${whereSql}
  `;
  const expenses = (await db.query(expensesSql, params)).rows[0];

  // === FIX: Safe parseFloat ===
  const safeParseFloat = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const totalRevenue = safeParseFloat(totalSales.total_revenue);
  const totalExpenses = safeParseFloat(expenses.total_expenses);
  const totalProfit = totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0
    ? ((totalProfit / totalRevenue) * 100).toFixed(2)
    : '0.00';

  return {
    sales: {
      today_count: todaySales.today_count || 0,
      today_revenue: todaySales.today_revenue || '0',
      total_count: totalSales.total_count || 0,
      total_revenue: totalSales.total_revenue || '0',
    },
    vouchers,
    users: {
      online_users: sessions.online_users || 0,
    },
    expenses: {
      today: expenses.today_expenses || '0',
      total: expenses.total_expenses || '0',
    },
    profit: {
      total: totalProfit.toFixed(2),
      margin_percent: marginPercent,
    },
  };
};

// ===============================================================
// SALES CHART - Data ya chart (mauzo kwa siku)
// ===============================================================
const getSalesChart = async (filters = {}) => {
    const { site_id, days = 7 } = filters;
    const params = [];
    let whereSql = 'WHERE s.created_at >= NOW() - INTERVAL \'1 day\' *$1';

    params.push(parseInt(days, 10));

    if (site_id) {
        whereSql += `AND s.site_id = $2`;
        params.push(site_id);
    }

    const sql = `
    SELECT
    DATE(s.created_at) AS date,
    COUNT(*)::int AS sales_count,
    COALESCE(SUM(s.amount), 0)::numeric AS revenue
    FROM sales s
    ${whereSql}
    GROUP BY DATE(s.created_at)
    ORDER BY DATE(s.created_at) ASC`;

    const result = await db.query(sql, params);
    return result.rows;
};

// ================================================================
// VOUCHER STATS
// ================================================================
const getVoucherStats = async (filters = {}) => {
    const { site_id } = filters;
    const params = [];
    let whereSql = 'WHERE 1 = 1';

    if (site_id) {
        whereSql += ` AND site_id = $1`;
        params.push(site_id);
    }

    const sql = `SELECT
    status, COUNT(*)::int AS count,
    COALESCE(SUM(price), 0)::numeric AS value
    FROM vouchers
    ${whereSql}
    GROUP BY status
    ORDER BY status`;

    const result = await db.query(sql, params);
    return result.rows;
};

// =================================================================
// RECENT ACTIVITY - Matukio ya hivi karibuni
// =================================================================
const getRecentActivity = async (filters = {}) => {
    const { site_id, limit = 10 } = filters;
    const params = [];
    let whereSql = 'WHERE 1 = 1';

    if (site_id) {
        whereSql += ` AND s.site_id = $1`;
        params.push(site_id);
    }

    params.push(parseInt(limit, 10));

    const sql = `SELECT
    s.id,
    'SALE' AS type,
    s.amount,
    s.created_at,
    v.code AS voucher_code,
    p.name AS package_name,
    u.username AS operator_username,
    s.customer_phone
    FROM sales s
    JOIN vouchers v ON v.id = s.voucher_id
    JOIN packages p ON p.id = s.package_id
    LEFT JOIN users u ON u.id = s.operator_id
    ${whereSql}
    ORDER BY s.created_at DESC
    LIMIT $${params.length}`;

    const result = await db.query(sql, params);
    return result.rows;
};

// ========================================================
// TOP PACKAGES
// ========================================================
const getTopPackages = async (filters = {}) => {
    const { site_id, limit = 5 } = filters;
    const params = [];
    let whereSql = 'WHERE 1 = 1';

    if (site_id) {
        whereSql += `AND s.site_id = $1`;
        params.push(site_id);
    }

    params.push(parseInt(limit, 10));

    const sql = `SELECT
   p.id AS package_id,
   p.name AS package_name,
   COUNT(s.id)::int AS sales_count,
   COALESCE(SUM(s.amount), 0)::numeric AS revenue
   FROM sales s
   JOIN packages p ON p.id = s.package_id
   ${whereSql}
   GROUP BY p.id, p.name
   ORDER BY sales_count DESC
   LIMIT $${params.length}`;

   const result = await db.query(sql, params);
   return result.rows;
};

module.exports = {
    getSummary, getSalesChart, getVoucherStats, getRecentActivity, getTopPackages,
};
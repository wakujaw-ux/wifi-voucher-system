const ExcelJS = require("exceljs");
const db = require("../config/database");

// ============================================================
// 1. SALES REPORT (Mauzo)
// ============================================================
const getSalesReport = async (filters = {}) => {
  const { site_id, from_date, to_date, group_by = "day" } = filters;

  let whereSql = "WHERE 1 = 1";
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

  const summarySql = `
    SELECT
      COUNT(*)::int AS total_sales,
      COALESCE(SUM(s.amount), 0)::numeric AS total_revenue,
      COALESCE(AVG(s.amount), 0)::numeric AS average_sale
    FROM sales s
    ${whereSql}
  `;
  const summary = (await db.query(summarySql, params)).rows[0];

  let groupExpr = "DATE(s.created_at)";
  if (group_by === "month") groupExpr = "DATE_TRUNC('month', s.created_at)";
  if (group_by === "week") groupExpr = "DATE_TRUNC('week', s.created_at)";

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

  const byPackageSql = `
    SELECT
      p.id AS package_id,
      p.name AS package_name,
      TO_CHAR(DATE(s.created_at), 'YYYY-MM-DD') AS sale_date,
      COUNT(s.id)::int AS sales_count,
      COALESCE(SUM(s.amount), 0)::numeric AS revenue
    FROM sales s
    JOIN packages p ON p.id = s.package_id
    ${whereSql}
    GROUP BY p.id, p.name, DATE(s.created_at)
    ORDER BY DATE(s.created_at) DESC, revenue DESC
  `;
  const byPackage = (await db.query(byPackageSql, params)).rows;

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
// 2. VOUCHER REPORT (Voucha)
// ============================================================
const getVoucherReport = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  let whereSql = "WHERE 1 = 1";
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
    SELECT status, COUNT(*)::int AS count, COALESCE(SUM(price), 0)::numeric AS value
    FROM vouchers
    ${whereSql}
    GROUP BY status
    ORDER BY status
  `;
  const byStatus = (await db.query(byStatusSql, params)).rows;

  // Tumia alias sahihi kwa ajili ya query ya pili
  let whereSqlV = "WHERE 1 = 1";
  const paramsV = [];
  let paramIndexV = 1;
  if (site_id) {
    whereSqlV += ` AND v.site_id = $${paramIndexV}`;
    paramsV.push(site_id);
    paramIndexV++;
  }
  if (from_date) {
    whereSqlV += ` AND v.created_at >= $${paramIndexV}`;
    paramsV.push(from_date);
    paramIndexV++;
  }
  if (to_date) {
    whereSqlV += ` AND v.created_at <= $${paramIndexV}`;
    paramsV.push(to_date);
    paramIndexV++;
  }

  const byPackageSql = `
    SELECT
      p.name AS package_name,
      COUNT(v.id)::int AS total,
      COUNT(v.id) FILTER (WHERE v.status IN ('SOLD', 'ACTIVE', 'USED'))::int AS sold_or_used,
      COUNT(v.id) FILTER (WHERE v.status IN ('CREATED', 'AVAILABLE'))::int AS available
    FROM vouchers v
    JOIN packages p ON p.id = v.package_id
    ${whereSqlV}
    GROUP BY p.name
    ORDER BY total DESC
  `;
  const byPackage = (await db.query(byPackageSql, paramsV)).rows;

  return { by_status: byStatus, by_package: byPackage };
};

// ============================================================
// 3. REVENUE REPORT (Mapato)
// ============================================================
const getRevenueReport = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  let whereSql = "WHERE 1 = 1";
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
    SELECT p.method, COUNT(s.id)::int AS transaction_count, COALESCE(SUM(s.amount), 0)::numeric AS revenue
    FROM sales s
    JOIN payments p ON p.sale_id = s.id
    ${whereSql}
    GROUP BY p.method
    ORDER BY revenue DESC
  `;
  const byMethod = (await db.query(sql, params)).rows;

  const totalSql = `
    SELECT COUNT(*)::int AS total_transactions, COALESCE(SUM(p.amount), 0)::numeric AS total_revenue
    FROM sales s
    JOIN payments p ON p.sale_id = s.id
    ${whereSql}
  `;
  const total = (await db.query(totalSql, params)).rows[0];

  return { total, by_method: byMethod };
};

// ============================================================
// 4. SESSION REPORT (Sessions)
// ============================================================
const getSessionReport = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  let whereSql = "WHERE 1 = 1";
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
  return { summary };
};

// ============================================================
// 5. EXPENSES REPORT (Matumizi)
// ============================================================
const getExpensesReport = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  let whereSql = "WHERE 1 = 1";
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
    SELECT category, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::numeric AS amount
    FROM expenses ${whereSql} GROUP BY category ORDER BY amount DESC
  `;
  const byCategory = (await db.query(byCategorySql, params)).rows;

  const totalSql = `
    SELECT COUNT(*)::int AS total_count, COALESCE(SUM(amount), 0)::numeric AS total_amount
    FROM expenses ${whereSql}
  `;
  const total = (await db.query(totalSql, params)).rows[0];

  return { total, by_category: byCategory };
};

// ============================================================
// 6. PROFIT & LOSS REPORT (Faida/Hasara)
// ============================================================
const getProfitLossReport = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  // 1. Mapato (Revenue)
  let revSql = "WHERE 1 = 1";
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

  // 2. Matumizi (Expenses)
  let expSql = "WHERE 1 = 1";
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

  // 3. Hesabu
  const totalRevenue = parseFloat(revenue.total) || 0;
  const totalExpenses = parseFloat(expenses.total) || 0;
  const profit = totalRevenue - totalExpenses;
  const margin =
    totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : "0.00";

  return {
    period: { from_date: from_date || "beginning", to_date: to_date || "now" },
    revenue: totalRevenue.toFixed(2),
    expenses: totalExpenses.toFixed(2),
    profit: profit.toFixed(2),
    margin_percent: margin,
    status: profit > 0 ? "PROFIT" : profit < 0 ? "LOSS" : "BREAK_EVEN",
  };
};

// ============================================================
// 7. EXPORT TO EXCEL
// ============================================================
const exportReportToExcel = async (filters, type) => {
  const workbook = new ExcelJS.Workbook();

  try {
    if (type === "sales") {
      const data = await getSalesReport(filters);
      const worksheet = workbook.addWorksheet("Mauzo");

      worksheet.addRow([
        "Tarehe",
        "Jina la Kifurushi",
        "Idadi ya Mauzo",
        "Mapato (TZS)",
      ]);
      worksheet.getRow(1).font = { bold: true };

      if (data.by_package && data.by_package.length > 0) {
        data.by_package.forEach((row) => {
          worksheet.addRow([
            row.sale_date || "-",
            row.package_name,
            row.sales_count,
            parseFloat(row.revenue),
          ]);
        });
      } else {
        worksheet.addRow(["Hakuna data kwa kipindi hiki", "", "", ""]);
      }

      worksheet.addRow([]);
      const totalSales = data.summary?.total_sales || 0;
      const totalRevenue = parseFloat(data.summary?.total_revenue || 0);
      worksheet.addRow(["", "JUMLA KUU", totalSales, totalRevenue]);
      worksheet.lastRow.font = { bold: true };
    } else if (type === "vouchers") {
      const data = await getVoucherReport(filters);
      const worksheet = workbook.addWorksheet("Voucha");

      worksheet.addRow(["Hali (Status)", "Idadi", "Thamani (TZS)"]);
      worksheet.getRow(1).font = { bold: true };

      if (data.by_status && data.by_status.length > 0) {
        data.by_status.forEach((row) => {
          worksheet.addRow([row.status, row.count, parseFloat(row.value)]);
        });
      } else {
        worksheet.addRow(["Hakuna data kwa kipindi hiki", "", ""]);
      }
    } else if (type === "revenue") {
      const data = await getRevenueReport(filters);
      const worksheet = workbook.addWorksheet("Mapato");

      worksheet.addRow(["Njia ya Malipo", "Idadi ya Miamala", "Mapato (TZS)"]);
      worksheet.getRow(1).font = { bold: true };

      if (data.by_method && data.by_method.length > 0) {
        data.by_method.forEach((row) => {
          worksheet.addRow([
            row.method,
            row.transaction_count,
            parseFloat(row.revenue),
          ]);
        });
      } else {
        worksheet.addRow(["Hakuna data kwa kipindi hiki", "", ""]);
      }
    } else if (type === "profit-loss") {
      const plData = await getProfitLossReport(filters);
      const salesData = await getSalesReport(filters);
      const expenseData = await getExpensesReport(filters);

      // Sheet 1: Muhtasari
      const wsSummary = workbook.addWorksheet("Muhtasari");
      wsSummary.addRow(["RIPOTI YA FAIDA NA HASARA"]);
      wsSummary.getRow(1).font = { bold: true, size: 14 };
      wsSummary.addRow([
        "Kipindi:",
        `${filters.from_date || "Mwanzo"} hadi ${filters.to_date || "Leo"}`,
      ]);
      wsSummary.addRow([]);
      wsSummary.addRow(["Mapato Yote", parseFloat(plData.revenue || 0)]);
      wsSummary.addRow(["Matumizi Yote", parseFloat(plData.expenses || 0)]);
      wsSummary.addRow(["FAIDA / HASARA", parseFloat(plData.profit || 0)]);
      wsSummary.getRow(6).font = { bold: true };

      // Sheet 2: Mauzo
      const wsSales = workbook.addWorksheet("Mauzo");
      wsSales.addRow(["Tarehe", "Kifurushi", "Idadi", "Mapato (TZS)"]);
      wsSales.getRow(1).font = { bold: true };
      if (salesData.by_package && salesData.by_package.length > 0) {
        salesData.by_package.forEach((row) => {
          wsSales.addRow([
            row.sale_date || "-",
            row.package_name,
            row.sales_count,
            parseFloat(row.revenue),
          ]);
        });
      } else {
        wsSales.addRow(["Hakuna data", "", "", ""]);
      }

      // Sheet 3: Matumizi
      const wsExpenses = workbook.addWorksheet("Matumizi");
      wsExpenses.addRow(["Kategoria", "Idadi", "Kiasi (TZS)"]);
      wsExpenses.getRow(1).font = { bold: true };
      if (expenseData.by_category && expenseData.by_category.length > 0) {
        expenseData.by_category.forEach((row) => {
          wsExpenses.addRow([row.category, row.count, parseFloat(row.amount)]);
        });
      } else {
        wsExpenses.addRow(["Hakuna data", "", ""]);
      }
    }

    // Set column widths for all sheets
    workbook.eachSheet((sheet) => {
      sheet.columns.forEach((column) => {
        column.width = 20;
      });
    });

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error(`Error generating ${type} Excel:`, error);
    throw error;
  }
};

module.exports = {
  getSalesReport,
  getVoucherReport,
  getRevenueReport,
  getSessionReport,
  getExpensesReport,
  getProfitLossReport,
  exportReportToExcel,
};

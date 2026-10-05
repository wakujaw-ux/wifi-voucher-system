const db = require('../config/database');

// ============================================================
// SELL VOUCHER (transaction: sale + payment + voucher status)
// ============================================================
const sellVoucher = async (data, operatorId) => {
  const { voucher_id, customer_phone, notes, payment_method = 'CASH', payment_reference } = data;

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Pata voucher (FOR UPDATE — inazuia concurrent sales)
    const voucherResult = await client.query(
      `SELECT id, site_id, package_id, code, status, price
       FROM vouchers
       WHERE id = $1
       FOR UPDATE`,
      [voucher_id]
    );

    if (voucherResult.rowCount === 0) {
      const err = new Error('Voucher haipo');
      err.code = 'VOUCHER_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const voucher = voucherResult.rows[0];

    // 2. Angalia status
    if (voucher.status !== 'CREATED' && voucher.status !== 'AVAILABLE') {
      const err = new Error(`Voucher haiwezi kuuzwa. Status: ${voucher.status}`);
      err.code = 'VOUCHER_NOT_SELLABLE';
      err.status = 400;
      throw err;
    }

    // 3. Unda sale
    const saleResult = await client.query(
      `INSERT INTO sales (site_id, voucher_id, package_id, amount, operator_id, customer_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, site_id, voucher_id, package_id, amount, operator_id, customer_phone, notes, created_at`,
      [
        voucher.site_id,
        voucher.id,
        voucher.package_id,
        voucher.price,
        operatorId,
        customer_phone || null,
        notes || null,
      ]
    );

    const sale = saleResult.rows[0];

    // 4. Unda payment
    const paymentResult = await client.query(
      `INSERT INTO payments (sale_id, amount, method, reference, received_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sale_id, amount, method, reference, paid_at`,
      [sale.id, voucher.price, payment_method, payment_reference || null, operatorId]
    );

    const payment = paymentResult.rows[0];

    // 5. Update voucher status → SOLD
    const updateResult = await client.query(
      `UPDATE vouchers
       SET status = 'SOLD', sold_at = NOW(), sold_by = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, code, status, sold_at, sold_by`,
      [operatorId, voucher.id]
    );

    await client.query('COMMIT');

    return {
      sale,
      payment,
      voucher: updateResult.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ============================================================
// GET ALL SALES
// ============================================================
const getAllSales = async (filters = {}) => {
  const { site_id, operator_id, from_date, to_date, limit = 100, offset = 0 } = filters;

  let sql = `
    SELECT
      s.id, s.site_id, s.voucher_id, s.package_id, s.amount,
      s.operator_id, s.customer_phone, s.notes, s.created_at,
      v.code AS voucher_code,
      p.name AS package_name,
      u.username AS operator_username,
      pay.method AS payment_method,
      pay.reference AS payment_reference
    FROM sales s
    JOIN vouchers v ON v.id = s.voucher_id
    JOIN packages p ON p.id = s.package_id
    LEFT JOIN users u ON u.id = s.operator_id
    LEFT JOIN payments pay ON pay.sale_id = s.id
    WHERE 1 = 1
  `;
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    sql += ` AND s.site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (operator_id) {
    sql += ` AND s.operator_id = $${paramIndex}`;
    params.push(operator_id);
    paramIndex++;
  }

  if (from_date) {
    sql += ` AND s.created_at >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    sql += ` AND s.created_at <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  sql += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await db.query(sql, params);

  return {
    sales: result.rows,
    count: result.rowCount,
  };
};

// ============================================================
// GET SALE BY ID
// ============================================================
const getSaleById = async (id) => {
  const sql = `
    SELECT
      s.id, s.site_id, s.voucher_id, s.package_id, s.amount,
      s.operator_id, s.customer_phone, s.notes, s.created_at,
      v.code AS voucher_code,
      p.name AS package_name,
      u.username AS operator_username,
      pay.id AS payment_id,
      pay.method AS payment_method,
      pay.reference AS payment_reference,
      pay.paid_at
    FROM sales s
    JOIN vouchers v ON v.id = s.voucher_id
    JOIN packages p ON p.id = s.package_id
    LEFT JOIN users u ON u.id = s.operator_id
    LEFT JOIN payments pay ON pay.sale_id = s.id
    WHERE s.id = $1
  `;
  const result = await db.query(sql, [id]);

  if (result.rowCount === 0) {
    const err = new Error('Sale haipo');
    err.code = 'SALE_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

// ============================================================
// SALES SUMMARY (Dashboard)
// ============================================================
const getSalesSummary = async (filters = {}) => {
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
      COUNT(*)::int AS total_sales,
      COALESCE(SUM(s.amount), 0)::numeric AS total_revenue,
      COALESCE(AVG(s.amount), 0)::numeric AS average_sale
    FROM sales s
    ${whereSql}
  `;

  const result = await db.query(sql, params);
  return result.rows[0];
};

module.exports = {
  sellVoucher,
  getAllSales,
  getSaleById,
  getSalesSummary,
};
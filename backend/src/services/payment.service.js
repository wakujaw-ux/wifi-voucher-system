const db = require("../config/database");
const voucherService = require("./voucher.service");

const processMockPayment = async (phone, packageId, siteId, method) => {
  try {
    const pkgRes = await db.query(
      "SELECT * FROM packages WHERE id = $1 AND is_active = TRUE",
      [packageId],
    );
    if (pkgRes.rowCount === 0) throw new Error("Kifurushi hakipo");
    const pkg = pkgRes.rows[0];

    // Tengeneza Vocha
    const generateData = {
      site_id: siteId,
      package_id: packageId,
      quantity: 1,
      prefix: method.substring(0, 3),
      notes: `Malipo ya ${method} kutoka ${phone}`,
    };

    const result = await voucherService.generateVouchers(generateData, null);
    const voucher = result.vouchers[0];

    // Rekodi Sale na Payment
    const saleRes = await db.query(
      `INSERT INTO sales (site_id, voucher_id, package_id, amount, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [siteId, voucher.id, packageId, pkg.price, `${method} Auto-Sale`],
    );

    await db.query(
      `INSERT INTO payments (sale_id, amount, method, reference) 
       VALUES ($1, $2, $3, $4)`,
      [saleRes.rows[0].id, pkg.price, method, `${method}-${Date.now()}`],
    );

    return {
      success: true,
      voucher_code: voucher.code,
      package_name: pkg.name,
      amount: pkg.price,
    };
  } catch (err) {
    console.error(`❌ [Payment Error]:`, err.message);
    throw err;
  }
};

module.exports = { processMockPayment };

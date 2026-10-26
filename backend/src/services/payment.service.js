const db = require("../config/database");
const voucherService = require("./voucher.service");

const processMockPayment = async (
  phoneNumber,
  packageId,
  siteId,
  method = "MPESA",
) => {
  try {
    // 1. Angalia kifurushi kipo
    const pkgRes = await db.query(
      "SELECT * FROM packages WHERE id = $1 AND is_active = TRUE",
      [packageId],
    );
    if (pkgRes.rowCount === 0) throw new Error("Kifurushi hakipo");
    const pkg = pkgRes.rows[0];

    console.log(
      `📱 [Mock ${method}] Inatuma ombi la malipo kwa ${phoneNumber} kiasi TZS ${pkg.price}...`,
    );

    // 2. Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(
      `✅ [Mock ${method}] Malipo yamekamilika kutoka ${phoneNumber}!`,
    );
    // 3. Tengeneza Vocha (Hata kama MikroTik iko offline, vocha itaundwa kwenye Database)
    const generateData = {
      site_id: siteId,
      package_id: packageId,
      quantity: 1,
      prefix: method.substring(0, 3).toUpperCase(),
      notes: `Malipo ya ${method} kutoka ${phoneNumber}`,
    };

    let voucher;
    try {
      const result = await voucherService.generateVouchers(generateData, null);
      voucher = result.vouchers[0];
    } catch (voucherErr) {
      // Kama vocha ilishindwa kutengenezwa kabisa kwenye Database, ndio tunarudisha kosa
      throw new Error("Imeshindwa kutengeneza vocha kwenye mfumo.");
    }
    //const voucher = result.vouchers[0];

    // 4. Rekodi Sale na Payment
    const saleRes = await db.query(
      `INSERT INTO sales (site_id, voucher_id, package_id, amount, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [siteId, voucher.id, packageId, pkg.price, `${method} Auto-Sale`],
    );

    // Hapa tunatumia 'method' (MPESA, TIGO_PESA, AIRTEL_MONEY, HALOPESA)
    await db.query(
      `INSERT INTO payments (sale_id, amount, method, reference) 
       VALUES ($1, $2, $3, $4)`,
      [saleRes.rows[0].id, pkg.price, method, `${method}-${Date.now()}`],
    );

    return {
      success: true,
      message: "Malipo yamekamilika",
      voucher_code: voucher.code,
      package_name: pkg.name,
      amount: pkg.price,
      method: method,
    };
  } catch (err) {
    console.error(`❌ [Mock ${method}] Error:`, err.message);
    throw err;
  }
};

module.exports = { processMockPayment };

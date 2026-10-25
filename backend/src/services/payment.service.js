const db = require("../config/database");
const voucherService = require("./voucher.service");
const { generateVoucherCode } = require("../utils/voucherCode");

// ============================================================
// SIMULATE M-PESA PAYMENT (MOCK)
// ============================================================
const processMockPayment = async (phoneNumber, packageId, siteId) => {
  try {
    // 1. Angalia kifurushi kipo
    const pkgRes = await db.query(
      "SELECT * FROM packages WHERE id = $1 AND is_active = TRUE",
      [packageId],
    );
    if (pkgRes.rowCount === 0) {
      throw new Error("Kifurushi hakipo");
    }
    const pkg = pkgRes.rows[0];

    console.log(
      `📱 [Mock M-Pesa] Inatuma ombi la malipo kwa ${phoneNumber} kiasi TZS ${pkg.price}...`,
    );

    // 2. Simulate M-Pesa delay (Inachukua sekunde 2 kujifanya inasubiri mtandao)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`✅ [Mock M-Pesa] Malipo yamekamilika kutoka ${phoneNumber}!`);

    // 3. Tengeneza Vocha moja (Tunatumia generateVouchers tuliyoijenga awali)
    const generateData = {
      site_id: siteId,
      package_id: packageId,
      quantity: 1,
      prefix: "MPESA",
      notes: `Malipo ya M-Pesa kutoka ${phoneNumber}`,
    };

    // Tunatumia function ya generateVouchers lakini tuta-catch kama MikroTik iko offline
    const result = await voucherService.generateVouchers(generateData, null); // null kwa sababu si operator, ni mteja
    const voucher = result.vouchers[0];

    // 4. Rekodi Sale na Payment kwenye Database (Ili Dashboard ionyeshe mauzo)
    const saleRes = await db.query(
      `INSERT INTO sales (site_id, voucher_id, package_id, amount, notes)
       VALUES ($1, $2, $3, $4, 'M-Pesa Auto-Sale') RETURNING id`,
      [siteId, voucher.id, packageId, pkg.price],
    );

    await db.query(
      `INSERT INTO payments (sale_id, amount, method, reference) 
       VALUES ($1, $2, 'MPESA', $3)`,
      [saleRes.rows[0].id, pkg.price, `MPESA-${Date.now()}`],
    );

    // 5. Rudisha code ya vocha kwa mteja
    return {
      success: true,
      message: "Malipo yamekamilika",
      voucher_code: voucher.code,
      package_name: pkg.name,
      amount: pkg.price,
    };
  } catch (err) {
    console.error("❌ [Mock M-Pesa] Error:", err.message);
    throw err;
  }
};

module.exports = { processMockPayment };

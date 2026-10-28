const db = require("../config/database");
const paymentService = require("../services/payment.service");
const { success, error } = require("../utils/response");

const getPublicPackages = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, price, duration_minutes FROM packages WHERE is_active = TRUE ORDER BY price ASC",
    );
    return success(res, { packages: result.rows }, "Packages zimepatikana");
  } catch (err) {
    return error(res, err.message, "FETCH_FAILED", 500);
  }
};

const mockPay = async (req, res) => {
  const { phone, package_id, site_id, method } = req.body;

  if (!phone || !package_id || !site_id) {
    return error(res, "Taarifa hazijakamilika", "VALIDATION_ERROR", 400);
  }

  try {
    const result = await paymentService.processMockPayment(
      phone,
      package_id,
      site_id,
      method || "MPESA",
    );
    return success(res, result, "Malipo yamekamilika");
  } catch (err) {
    return error(res, err.message, "PAYMENT_FAILED", 500);
  }
};

module.exports = { getPublicPackages, mockPay };

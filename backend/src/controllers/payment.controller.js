const paymentService = require("../services/payment.service");
const { success, error } = require("../utils/response");

const mockPay = async (req, res) => {
  const { phone, package_id, site_id } = req.body;

  if (!phone || !package_id || !site_id) {
    return error(
      res,
      "phone, package_id na site_id vinahitajika",
      "VALIDATION_ERROR",
      400,
    );
  }

  try {
    const result = await paymentService.processMockPayment(
      phone,
      package_id,
      site_id,
    );
    return success(res, result, "Malipo yamekamilika kwa mafanikio");
  } catch (err) {
    return error(res, err.message, "PAYMENT_FAILED", 500);
  }
};

module.exports = { mockPay };

const paymentService = require('../services/payment.service');
const { success, error } = require('../utils/response');

const mockPay = async (req, res) => {
  const { phone, package_id, site_id, method } = req.body;

  if (!phone || !package_id || !site_id) {
    return error(res, 'phone, package_id na site_id vinahitajika', 'VALIDATION_ERROR', 400);
  }

  // Chagua method, kama haipo tumia MPESA kama default
  const paymentMethod = method || 'MPESA';
  const allowedMethods = ['CASH', 'MPESA', 'AIRTEL_MONEY', 'TIGO_PESA', 'HALOPESA', 'BANK'];

  if (!allowedMethods.includes(paymentMethod)) {
    return error(res, 'Njia ya malipo haijulikani', 'VALIDATION_ERROR', 400);
  }

  try {
    const result = await paymentService.processMockPayment(phone, package_id, site_id, paymentMethod);
    return success(res, result, 'Malipo yamekamilika kwa mafanikio');
  } catch (err) {
    return error(res, err.message, 'PAYMENT_FAILED', 500);
  }
};

module.exports = { mockPay };
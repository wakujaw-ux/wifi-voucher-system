const saleService = require("../services/sale.service");
const {
  validateGenerateVouchers,
  validateSellVoucher,
  validateRevokeVoucher,
} = require("../validators/voucher.validator");
const voucherService = require("../services/voucher.service");
const { success, error } = require("../utils/response");
const { query } = require("../config/database");


// POST /api/vouchers/generate
const generate = async (req, res) => {
  const errors = validateGenerateVouchers(req.body);
  if (errors.length > 0) {
    return error(res, errors.join(", "), "VALIDATION_ERROR", 400);
  }

  try {
    const result = await voucherService.generateVouchers(
      req.body,
      req.user.userId,
    );
    return success(
      res,
      {
        batch: result.batch,
        count: result.vouchers.length,
        vouchers: result.vouchers,
      },
      `Vouchers ${result.vouchers.length} zimezalishwa`,
      201,
    );
  } catch (err) {
    console.error("generate vouchers error:", err.message);
    return error(
      res,
      err.message,
      err.code || "GENERATE_FAILED",
      err.status || 500,
    );
  }
};

// GET  /api/vouchers
const getAll = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.package_id) filters.package_id = req.query.package_id;
    if (req.query.batch_id) filters.batch_id = req.query.batch_id;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.limit) filters.limit = req.query.limit;
    if ((req, query.offset)) filters.offset = req.query.offset;

    const result = await voucherService.getAllVouchers(filters);
    return success(res, result, "Vouchers zimepatikana");
  } catch (err) {
    console.error("getAll vouchers error:", err.message);
    return error(
      res,
      err.message,
      err.code || "FETCH_FAILED",
      err.status || 500,
    );
  }
};

// GET /api/vouchers/stats
const getStats = async (req, res) => {
  try {
    const filters = {};
    if (req.query.site_id) filters.site_id = req.query.site_id;
    if (req.query.package_id) filters.package_id = req.query.package_id;

    const stats = await voucherService.getVoucherStats(filters);
    return success(res, { stats }, "Vouchers stats zimepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "FETCH_FAILED",
      err.status || 500,
    );
  }
};

// GET /api/vouchers/:id
const getOne = async (req, res) => {
  try {
    const voucher = await voucherService.getVoucherById(req.params.id);
    return success(res, { voucher }, "Voucher imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "FETCH_FAILED",
      err.status || 500,
    );
  }
};

// GET /api/vouchers/code/:code
const getByCode = async (req, res) => {
  try {
    const voucher = await voucherService.getVoucherByCode(req.params.code);
    return success(res, { voucher }, "Voucher imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "FETCH_FAILED",
      err.status || 500,
    );
  }
};

// POST /api/vouchers/:id/sell
const sell = async (req, res) => {
  const data = { voucher_id: req.params.id, ...req.body };
  const errors = validateSellVoucher(data);
  if (errors.length > 0) {
    return error(res, errors.join(", "), "VALIDATION_ERROR", 400);
  }

  try {
    const result = await saleService.sellVoucher(data, req.user.userId);
    return success(res, result, "Voucher imeuzwa kwa mafanikio", 201);
  } catch (err) {
    console.error("sell voucher error:", err.message);
    return error(
      res,
      err.message,
      err.code || "SELL_FAILED",
      err.status || 500,
    );
  }
};

// POST /api/vouchers/:id/revoke
const revoke = async (req, res) => {
  const errors = validateRevokeVoucher(req.body);
  if (errors.length > 0) {
    return error(res, errors.join(", "), "VALIDATION_ERROR", 400);
  }

  try {
    const voucher = await voucherService.revokeVoucher(
      req.params.id,
      req.user.userId,
      req.body.reason,
    );
    return success(res, { voucher }, "Voucher imerevoked");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "REVOKE_FAILED",
      err.status || 500,
    );
  }
};

module.exports = {
  generate,
  getAll,
  getOne,
  getByCode,
  getStats,
  sell,
  revoke,
};

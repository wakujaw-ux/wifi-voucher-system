const settingsService = require("../services/settings.service");
const { success, error } = require("../utils/response");
const db = require("../config/database");

// GET /api/settings
const getAll = async (req, res) => {
  try {
    const result = await settingsService.getAllSettings();
    return success(res, result, "Settings zimepatikana");
  } catch (err) {
    console.error("getAll settings error:", err.message);
    return error(
      res,
      err.message,
      err.code || "FETCH_FAILED",
      err.status || 500,
    );
  }
};

// GET /api/settings/:key
const getOne = async (req, res) => {
  try {
    const setting = await settingsService.getSettingByKey(req.params.key);
    return success(res, { setting }, "Setting imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "FETCH_FAILED",
      err.status || 500,
    );
  }
};

// PUT /api/settings/:key
const update = async (req, res) => {
  const { value } = req.body;

  if (value === undefined || value === null) {
    return error(res, "Value inahitajika", "VALIDATION_ERROR", 400);
  }

  try {
    const setting = await settingsService.updateSetting(
      req.params.key,
      String(value),
      req.user.userId,
    );
    return success(res, { setting }, "Setting imesasishwa");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "UPDATE_FAILED",
      err.status || 500,
    );
  }
};

// PUT /api/settings (bulk)
const updateBulk = async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== "object") {
    return error(res, "settings object inahitajika", "VALIDATION_ERROR", 400);
  }

  try {
    const result = await settingsService.updateMultipleSettings(
      settings,
      req.user.userId,
    );
    return success(res, result, `Settings ${result.count} zimesasishwa`);
  } catch (err) {
    console.error("updateBulk settings error:", err.message);
    return error(
      res,
      err.message,
      err.code || "UPDATE_FAILED",
      err.status || 500,
    );
  }
};
const getDefaultSite = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, code FROM sites WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1",
    );

    if (result.rowCount === 0) {
      return error(res, "Hakuna site iliyosajiliwa", "SITE_NOT_FOUND", 404);
    }

    return success(res, { site: result.rows[0] }, "Site imepatikana");
  } catch (err) {
    return error(res, err.message, "FETCH_FAILED", 500);
  }
};

module.exports = { getAll, getOne, update, updateBulk, getDefaultSite };

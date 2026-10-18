const db = require("../config/database");

// ============================================================
// GET ALL SETTINGS
// ============================================================
const getAllSettings = async () => {
  const sql = `
    SELECT id, key, value, description, updated_at
    FROM settings
    ORDER BY key ASC
  `;
  const result = await db.query(sql);

  // Convert kwa object kwa urahisi
  const settingsObject = {};
  for (const row of result.rows) {
    settingsObject[row.key] = row.value;
  }

  return {
    settings: result.rows,
    as_object: settingsObject,
  };
};

// ============================================================
// GET SETTING BY KEY
// ============================================================
const getSettingByKey = async (key) => {
  const sql =
    "SELECT id, key, value, description, updated_at FROM settings WHERE key = $1";
  const result = await db.query(sql, [key]);

  if (result.rowCount === 0) {
    const err = new Error("Setting haipo");
    err.code = "SETTING_NOT_FOUND";
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

// ============================================================
// UPDATE SETTING (single key)
// ============================================================
const updateSetting = async (key, value, userId) => {
  const sql = `
    UPDATE settings
    SET value = $1, updated_by = $2, updated_at = NOW()
    WHERE key = $3
    RETURNING id, key, value, description, updated_at
  `;
  const result = await db.query(sql, [value, userId, key]);

  if (result.rowCount === 0) {
    const err = new Error("Setting haipo");
    err.code = "SETTING_NOT_FOUND";
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

// ============================================================
// UPDATE MULTIPLE SETTINGS (bulk)
// ============================================================
const updateMultipleSettings = async (settingsObject, userId) => {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const updated = [];

    for (const [key, value] of Object.entries(settingsObject)) {
      const result = await client.query(
        `UPDATE settings
         SET value = $1, updated_by = $2, updated_at = NOW()
         WHERE key = $3
         RETURNING id, key, value, description, updated_at`,
        [value, userId, key],
      );

      if (result.rowCount > 0) {
        updated.push(result.rows[0]);
      }
    }

    await client.query("COMMIT");
    return { updated, count: updated.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
};

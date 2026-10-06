const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { success, error } = require("../utils/response");
const mikrotikService = require('../services/mikrotik/mikrotik.service');

// GET /api/health - Health check
router.get("/", (req, res) => {
  return success(
    res,
    {
      service: "Wifi Voucher Backend",
      version: "1.0.0",
      environment: process.env.NODE_ENV,
    },
    "Service is healthy",
  );
});

// GET /api/health/db - Database connection test
router.get("/db", async (req, res) => {
  try {
    const result = await db.query(
      'SELECT NOW() as current_time, version() as version',
    );
    return success(
      res,
      {
        connected: true,
        service_time: result.rows[0].current_time,
        postgres_version: result.rows[0].version.split(",")[0],
      },
      "Database connection successful",
    );
  } catch (err) {
    console.error("DB Health check failed:", err.message);
    return error(
      res,
      "Database connection failed:" + err.message,
      "DB_CONNECTION_FAILED",
      500,
    );
  }
});

// GET /api/health/db/tables - Count tables
router.get("/db/tables", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    );

    return success(
      res,
      {
        count: result.rowCount,
        tables: result.rows.map((r) => r.table_name),
      },
      "Tables retrieved successfully",
    );
  } catch (err) {
    return error(res, err.message, "QUERY_FAILED", 500);
  }
});

// GET /api/health/db/packages - Sample query
router.get("/db/packages", async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, duration_minutes FROM packages ORDER BY price',
    );
    return success(
      res,
      {
        count: result.rowCount,
        packages: result.rows,
      },
      "Packages retrieved",
    );
  } catch (err) {
    return error(res, err.message, "QUERY_FAILED", 500);
  }
});

// GET /api/health/mikrotik
router.get('/mikrotik', async (req, res) => {
  try {
    const health = await mikrotikService.healthCheck();
    return success(res, health, health.online ? 'MikroTik iko online' : 'MikroTik iko offline');
  } catch (err) {
    return error(res, err.message, 'MIKROTIK_ERROR', 500);
  }
});

module.exports = router;

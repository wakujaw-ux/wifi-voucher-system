const express = require("express");
const router = express.Router();
const db = require("../config/database");
const mikrotikService = require("../services/mikrotik/mikrotik.service");
const { success, error } = require("../utils/response");

// GET /api/health — Simple health
router.get("/", (req, res) => {
  return success(
    res,
    {
      service: "Wifi Voucher Backend",
      version: "1.0.0",
      environment: process.env.NODE_ENV,
      request_id: req.id,
    },
    "Service is healthy",
  );
});

// GET /api/health/db — Database
router.get("/db", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT NOW() as current_time, version() as version",
    );
    return success(
      res,
      {
        connected: true,
        server_time: result.rows[0].current_time,
        postgres_version: result.rows[0].version.split(",")[0],
      },
      "Database connection successful",
    );
  } catch (err) {
    console.error("DB Health check failed:", err.message);
    return error(
      res,
      "Database connection failed: " + err.message,
      "DB_CONNECTION_FAILED",
      500,
    );
  }
});

// GET /api/health/db/tables
router.get("/db/tables", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
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

// GET /api/health/db/packages
router.get("/db/packages", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, price, duration_minutes FROM packages ORDER BY price ASC",
    );
    return success(
      res,
      { count: result.rowCount, packages: result.rows },
      "Packages retrieved",
    );
  } catch (err) {
    return error(res, err.message, "QUERY_FAILED", 500);
  }
});

// GET /api/health/mikrotik
router.get("/mikrotik", async (req, res) => {
  try {
    const health = await mikrotikService.healthCheck();
    return success(
      res,
      health,
      health.online ? "MikroTik iko online" : "MikroTik iko offline",
    );
  } catch (err) {
    return error(res, err.message, "MIKROTIK_ERROR", 500);
  }
});

// ============================================================
// GET /api/health/full — Deep health check
// ============================================================
router.get("/full", async (req, res) => {
  const startTime = Date.now();

  const checks = {
    service: {
      status: "UP",
      name: "Wifi Voucher Backend",
      version: "1.0.0",
      environment: process.env.NODE_ENV,
      uptime_seconds: Math.floor(process.uptime()),
    },
    database: { status: "UNKNOWN" },
    mikrotik: { status: "UNKNOWN" },
    memory: {
      status: "UP",
      used_mb: parseFloat(
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      ),
      total_mb: parseFloat(
        (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
      ),
      rss_mb: parseFloat((process.memoryUsage().rss / 1024 / 1024).toFixed(2)),
    },
  };

  // Database check
  try {
    const dbStart = Date.now();
    await db.query("SELECT 1");
    checks.database = {
      status: "UP",
      response_time_ms: Date.now() - dbStart,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    };
  } catch (err) {
    checks.database = {
      status: "DOWN",
      error: err.message,
    };
  }

  // MikroTik check
  try {
    const mtStart = Date.now();
    const mtHealth = await mikrotikService.healthCheck();
    if (mtHealth.online) {
      checks.mikrotik = {
        status: "UP",
        response_time_ms: Date.now() - mtStart,
        mode: process.env.MIKROTIK_MODE,
        identity: mtHealth.identity,
        version: mtHealth.version,
      };
    } else {
      checks.mikrotik = {
        status: "DOWN",
        mode: process.env.MIKROTIK_MODE,
        error: mtHealth.error,
      };
    }
  } catch (err) {
    checks.mikrotik = {
      status: "DOWN",
      error: err.message,
    };
  }

  // Overall status
  const overallStatus =
    checks.database.status === "UP" && checks.mikrotik.status === "UP"
      ? "HEALTHY"
      : checks.database.status === "UP"
        ? "DEGRADED"
        : "UNHEALTHY";

  const statusCode =
    overallStatus === "HEALTHY"
      ? 200
      : overallStatus === "DEGRADED"
        ? 200
        : 503;

  return res.status(statusCode).json({
    success: overallStatus !== "UNHEALTHY",
    message: `System is ${overallStatus}`,
    data: {
      status: overallStatus,
      total_response_time_ms: Date.now() - startTime,
      checks,
      request_id: req.id,
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;

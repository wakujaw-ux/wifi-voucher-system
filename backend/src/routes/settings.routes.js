const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

router.use(authenticate);

// Kusoma settings — ADMIN au SUPER_ADMIN tu
router.get("/", requireRole("ADMIN", "SUPER_ADMIN"), settingsController.getAll);
router.get(
  "/:key",
  requireRole("ADMIN", "SUPER_ADMIN"),
  settingsController.getOne,
);

// Kuandika settings — SUPER_ADMIN tu (kwa usalama)
router.put("/", requireRole("SUPER_ADMIN"), settingsController.updateBulk);
router.put("/:key", requireRole("SUPER_ADMIN"), settingsController.update);

module.exports = router;

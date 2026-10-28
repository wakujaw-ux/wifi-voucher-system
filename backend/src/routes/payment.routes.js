const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.get("/packages", paymentController.getPublicPackages);
router.post("/mock-pay", paymentController.mockPay);

module.exports = router;

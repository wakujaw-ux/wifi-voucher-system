const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Public route kwa ajili ya wateja wa Wi-Fi
router.post("/mock-pay", paymentController.mockPay);

module.exports = router;

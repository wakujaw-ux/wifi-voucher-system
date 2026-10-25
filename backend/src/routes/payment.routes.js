const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Hii ni public route (Mteja hajaingia kama admin, ni mteja wa Wi-Fi)
router.post("/mock-mpesa", paymentController.mockPay);

module.exports = router;

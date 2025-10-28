const express = require('express');

const { PaymentController } = require('../../controllers');
const { validate } = require('../../middlewares/validation');
const { paymentLimiter } = require('../../middlewares/security');

const router = express.Router();

// Apply payment-specific rate limiting
router.use(paymentLimiter);

router.post("/create-order", validate('createPayment'), PaymentController.createPayment);
router.post("/payment-verify", validate('verifyPayment'), PaymentController.verifyPayment);
router.post("/payment-verify-webhook", PaymentController.paymentWebhook); 
router.post("/cancel-payment", validate('cancelPayment'), PaymentController.cancelPayment);

module.exports = router;
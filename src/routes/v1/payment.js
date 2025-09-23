const express = require('express');

const { PaymentController } = require('../../controllers');


const router = express.Router();


 router.post("/create-order",PaymentController.createPayment )

 router.post("/payment-verify",PaymentController.verifyPayment )

 router.post("/payment-verify-webhook",PaymentController.paymentWebhook )

module.exports = router;
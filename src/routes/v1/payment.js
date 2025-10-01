const express = require('express');

const { PaymentController } = require('../../controllers');


const router = express.Router();


 router.post("/create-order",PaymentController.createPayment )

 router.post("/payment-verify",PaymentController.verifyPayment )

  router.post("/payment-verify-webhook",PaymentController.paymentWebhook )
  router.post("/cancel-payment",PaymentController.cancelPayment )

module.exports = router;
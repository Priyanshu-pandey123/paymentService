const express = require('express');
const { PaymentDashController } = require("../../controllers");
const { validate } = require('../../middlewares/validation');
const { dashboardLimiter } = require('../../middlewares/security');

const router = express.Router();

// Apply dashboard-specific rate limiting
router.use(dashboardLimiter);
 console.log(dashboardLimiter,'from the  payment  dash')

router.get("/getAllPayment", validate('getAllPayment'), PaymentDashController.getAllPayment);
router.get("/getPaymentByUserId", validate('getPaymentByUserId'), PaymentDashController.getPaymentByUserId);

module.exports = router;
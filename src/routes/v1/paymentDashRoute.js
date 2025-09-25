const express = require('express');
const {PaymentDashController}= require("../../controllers")


const router = express.Router();


 router.get("/getAllPayment",PaymentDashController.getAllPayment)

 router.get("/getPaymentByUserId",PaymentDashController.getPaymentByUserId )


module.exports = router;
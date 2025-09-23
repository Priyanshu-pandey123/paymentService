const express = require('express');

const { PaymentController } = require('../../controllers');


const router = express.Router();


 router.get("/create-sms",PaymentController.createSms )


module.exports = router;
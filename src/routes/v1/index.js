const express = require('express');

const { InfoController } = require('../../controllers');

// const bookingRoutes = require('./booking');
const  paymentRoutes= require('./payment')

const router = express.Router();

router.get('/info', InfoController.info);
router.use("/payment", paymentRoutes);
router.use("/sms", paymentRoutes);

// router.use('/bookings', bookingRoutes);

module.exports = router;
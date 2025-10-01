const express = require('express');

const { InfoController } = require('../../controllers');
const paymentRoutes = require('./payment')
const  paymentDashRoute= require('./paymentDashRoute')
const {logger} = require('../../config')

const router = express.Router();

router.get('/info', InfoController.info);
router.get('/harshit', InfoController.harshit);
router.use("/payment", paymentRoutes);
router.use("/sms", paymentRoutes);
router.use("/dash", paymentDashRoute);



module.exports = router;
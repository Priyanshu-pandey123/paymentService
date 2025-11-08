const express = require('express');

const { InfoController } = require('../../controllers');
const paymentRoutes = require('./payment')
const  paymentDashRoute= require('./paymentDashRoute')
const UrlRoute =  require("./urlGenerator")
const webhookRoute = require('./webhookRoute')
const {logger} = require('../../config')

const router = express.Router();

router.get('/info', InfoController.info);
router.use("/payment", paymentRoutes);
router.use("/sms", paymentRoutes);
router.use("/dash", paymentDashRoute);
router.use("/url", UrlRoute)
router.use("/webhook", webhookRoute);


module.exports = router;
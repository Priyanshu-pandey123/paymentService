const express = require('express');
const { route } = require('./paymentDashRoute');
const {UrlController }= require("../../controllers")

const router = express.Router();


router.post("/getEncryptUrl",UrlController.getEncryptedUrl)
router.post("/decodeUrl",UrlController.decodeUrl)


module.exports = router;
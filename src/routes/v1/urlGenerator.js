const express = require('express');
const { UrlController } = require("../../controllers");
const { validate } = require('../../middlewares/validation');

const router = express.Router();

router.post("/getEncryptUrl", validate('getEncryptedUrl'), UrlController.getEncryptedUrl);
router.post("/decodeUrl", validate('decodeUrl'), UrlController.decodeUrl);

module.exports = router;
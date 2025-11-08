const express = require('express');
const { logger } = require('../../config');
const WebhookController = require('../../controllers/webhook-controller');

const router = express.Router();
const webhookController = new WebhookController();

// GET /api/v1/webhook - Get all webhooks with pagination and filtering
router.get('/', (req, res) => webhookController.getAllWebhooks(req, res));

// GET /api/v1/webhook/stats - Get webhook statistics
router.get('/stats', (req, res) => webhookController.getWebhookStats(req, res));

// GET /api/v1/webhook/:id - Get webhook by ID
router.get('/:id', (req, res) => webhookController.getWebhookById(req, res));

module.exports = router;
const { StatusCodes } = require('http-status-codes');
const { logger } = require('../config');
const WebhookRepository = require('../repositories/webhook-repository');

class WebhookController {
    constructor() {
        this.webhookRepository = new WebhookRepository();
    }

    async getAllWebhooks(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                payment_uuid,  // Changed from payment_order_id
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            // Validate inputs
            const validStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'RETRYING'];
            if (status && !validStatuses.includes(status.toUpperCase())) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                    error: {},
                    data: {}
                });
            }

            const validSortFields = ['id', 'createdAt', 'updatedAt', 'status', 'attempt_count', 'last_attempt_at'];
            if (!validSortFields.includes(sortBy)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`,
                    error: {},
                    data: {}
                });
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                status: status ? status.toUpperCase() : undefined,
                payment_uuid,  // Changed from payment_order_id
                sortBy,
                sortOrder
            };

            const result = await this.webhookRepository.findAll(options);

            logger.info('Fetched webhooks', { 
                count: result.webhooks.length, 
                page: options.page,
                status: options.status 
            });

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Webhooks retrieved successfully',
                error: {},
                data: result
            });

        } catch (error) {
            logger.error('Error fetching webhooks', { error: error.message });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve webhooks',
                error: error.message,
                data: {}
            });
        }
    }

    async getWebhookById(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Valid webhook ID is required',
                    error: {},
                    data: {}
                });
            }

            const webhook = await this.webhookRepository.findById(parseInt(id));

            if (!webhook) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Webhook not found',
                    error: {},
                    data: {}
                });
            }

            logger.info('Fetched webhook by ID', { id });

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Webhook retrieved successfully',
                error: {},
                data: { webhook }
            });

        } catch (error) {
            logger.error('Error fetching webhook by ID', { id: req.params.id, error: error.message });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve webhook',
                error: error.message,
                data: {}
            });
        }
    }

    async getWebhookStats(req, res) {
        try {
            const stats = await this.webhookRepository.getWebhookStats();

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Webhook statistics retrieved successfully',
                error: {},
                data: { stats }
            });

        } catch (error) {
            logger.error('Error fetching webhook stats', { error: error.message });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve webhook statistics',
                error: error.message,
                data: {}
            });
        }
    }

    async getWebhooksByUserAndUuid(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                userId,
                uuid,
                status,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            // Validate required parameters
            if (!userId && !uuid) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'At least one of userId or uuid is required',
                    error: {},
                    data: {}
                });
            }

            // Validate inputs
            const validStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'RETRYING'];
            if (status && !validStatuses.includes(status.toUpperCase())) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                    error: {},
                    data: {}
                });
            }

            const validSortFields = ['id', 'createdAt', 'updatedAt', 'status', 'attempt_count', 'last_attempt_at'];
            if (!validSortFields.includes(sortBy)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`,
                    error: {},
                    data: {}
                });
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                status: status ? status.toUpperCase() : undefined,
                sortBy,
                sortOrder
            };

            const result = await this.webhookRepository.findByUserAndUuid(userId, uuid, options);

            logger.info('Fetched webhooks by user and uuid', { 
                userId,
                uuid,
                count: result.webhooks.length, 
                page: options.page,
                status: options.status 
            });

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Webhooks retrieved successfully',
                error: {},
                data: result
            });

        } catch (error) {
            logger.error('Error fetching webhooks by user and uuid', { 
                userId: req.query.userId,
                uuid: req.query.uuid,
                error: error.message 
            });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve webhooks',
                error: error.message,
                data: {}
            });
        }
    }
}

module.exports = WebhookController;
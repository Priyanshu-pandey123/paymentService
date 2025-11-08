const { WebhookLog } = require('../models');
const { logger } = require('../config');

class WebhookRepository {
    async create(webhookData) {
        try {
            const webhookLog = await WebhookLog.create(webhookData);
            logger.info('Webhook log created', { id: webhookLog.id, orderId: webhookData.payment_order_id });
            return webhookLog;
        } catch (error) {
            logger.error('Failed to create webhook log', { error: error.message, data: webhookData });
            throw error;
        }
    }

    async findById(id) {
        try {
            return await WebhookLog.findByPk(id);
        } catch (error) {
            logger.error('Failed to find webhook by ID', { id, error: error.message });
            throw error;
        }
    }

    async findPendingRetries() {
        try {
            return await WebhookLog.findAll({
                where: {
                    status: ['PENDING', 'FAILED', 'RETRYING'],
                    attempt_count: {
                        [require('sequelize').Op.lt]: require('sequelize').col('max_attempts')
                    },
                    next_retry_at: {
                        [require('sequelize').Op.lte]: new Date()
                    }
                },
                order: [['next_retry_at', 'ASC']]
            });
        } catch (error) {
            logger.error('Failed to find pending retries', { error: error.message });
            throw error;
        }
    }

    async updateAttempt(id, status, attemptCount, nextRetryAt, responseData = null, errorMessage = null) {
        try {
            const updateData = {
                status,
                attempt_count: attemptCount,
                last_attempt_at: new Date(),
                next_retry_at: nextRetryAt,
            };

            if (responseData) {
                updateData.response_status = responseData.status;
                updateData.response_data = responseData.data;
            }

            if (errorMessage) {
                updateData.error_message = errorMessage;
            }

            const [affectedRows] = await WebhookLog.update(updateData, { where: { id } });
            logger.info('Webhook attempt updated', { id, status, attemptCount, nextRetryAt });
            return affectedRows > 0;
        } catch (error) {
            logger.error('Failed to update webhook attempt', { id, error: error.message });
            throw error;
        }
    }

    async markAsSuccess(id, responseData) {
        try {
            const [affectedRows] = await WebhookLog.update({
                status: 'SUCCESS',
                response_status: responseData.status,
                response_data: responseData.data,
                last_attempt_at: new Date()
            }, { where: { id } });
            logger.info('Webhook marked as success', { id });
            return affectedRows > 0;
        } catch (error) {
            logger.error('Failed to mark webhook as success', { id, error: error.message });
            throw error;
        }
    }

    async markAsFailed(id, errorMessage) {
        try {
            const [affectedRows] = await WebhookLog.update({
                status: 'FAILED',
                error_message: errorMessage,
                last_attempt_at: new Date()
            }, { where: { id } });
            logger.info('Webhook marked as failed', { id, errorMessage });
            return affectedRows > 0;
        } catch (error) {
            logger.error('Failed to mark webhook as failed', { id, error: error.message });
            throw error;
        }
    }
}

module.exports = WebhookRepository;
const { WebhookLog } = require('../models');
const { logger } = require('../config');

class WebhookRepository {
    async create(webhookData) {
        try {
            const webhookLog = await WebhookLog.create(webhookData);
            logger.info('Webhook log created', { id: webhookLog.id, paymentUuid: webhookData.payment_uuid });
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

    async findByOrderIdAndStatus(orderId, status) {
        try {
            return await WebhookLog.findOne({
                where: {
                    payment_uuid: orderId,
                    status: status
                }
            });
        } catch (error) {
            logger.error('Failed to find webhook by order ID and status', { orderId, status, error: error.message });
            throw error;
        }
    }

    async findAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                payment_uuid,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const whereClause = {};

            if (status) {
                whereClause.status = status;
            }

            if (payment_uuid) {
                whereClause.payment_uuid = payment_uuid;
            }

            const { count, rows } = await WebhookLog.findAndCountAll({
                where: whereClause,
                limit: limit,
                offset: offset,
                order: [[sortBy, sortOrder.toUpperCase()]]
            });

            return {
                webhooks: rows,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            };
        } catch (error) {
            logger.error('Failed to find webhooks with pagination', { options, error: error.message });
            throw error;
        }
    }

    async getWebhookStats() {
        try {
            const stats = await WebhookLog.findAll({
                attributes: [
                    'status',
                    [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
                ],
                group: ['status']
            });

            const result = {
                total: 0,
                pending: 0,
                success: 0,
                failed: 0,
                retrying: 0
            };

            stats.forEach(stat => {
                const status = stat.dataValues.status.toLowerCase();
                const count = parseInt(stat.dataValues.count);
                result[status] = count;
                result.total += count;
            });

            return result;
        } catch (error) {
            logger.error('Failed to get webhook stats', { error: error.message });
            throw error;
        }
    }

    async findByUserAndUuid(userId, uuid, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const whereClause = {};

            // Add filters for userId and uuid from JSON payload
            if (userId) {
                whereClause[require('sequelize').Op.and] = whereClause[require('sequelize').Op.and] || [];
                whereClause[require('sequelize').Op.and].push(
                    require('sequelize').where(
                        require('sequelize').fn('JSON_EXTRACT', require('sequelize').col('payload'), '$.UserId'),
                        userId
                    )
                );
            }

            if (uuid) {
                whereClause[require('sequelize').Op.and] = whereClause[require('sequelize').Op.and] || [];
                whereClause[require('sequelize').Op.and].push(
                    require('sequelize').where(
                        require('sequelize').fn('JSON_EXTRACT', require('sequelize').col('payload'), '$.Uuid'),
                        uuid
                    )
                );
            }

            if (status) {
                whereClause.status = status;
            }

            const { count, rows } = await WebhookLog.findAndCountAll({
                where: whereClause,
                limit: limit,
                offset: offset,
                order: [[sortBy, sortOrder.toUpperCase()]]
            });

            return {
                webhooks: rows,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            };
        } catch (error) {
            logger.error('Failed to find webhooks by user and uuid', { userId, uuid, options, error: error.message });
            throw error;
        }
    }
}

module.exports = WebhookRepository;
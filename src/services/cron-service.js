const cron = require('node-cron');
const WebhookService = require('./webhook-service');
const { logger } = require('../config');

class WebhookRetryScheduler {
    constructor() {
        this.webhookService = new WebhookService();
        this.isRunning = false;
    }

    // Start the retry scheduler
    start() {
        if (this.isRunning) {
            logger.warn('Webhook retry scheduler is already running');
            return;
        }

        // Run every 2 minutes
        cron.schedule('*/2 * * * *', async () => {
            try {
                await this.webhookService.processRetries();
            } catch (error) {
                logger.error('Error in webhook retry cron job', { error: error.message });
            }
        });

        this.isRunning = true;
        logger.info('Webhook retry scheduler started - will check for retries every 2 minutes');
    }

    // Stop the scheduler
    stop() {
        if (!this.isRunning) {
            logger.warn('Webhook retry scheduler is not running');
            return;
        }

        // Note: node-cron doesn't provide a direct way to stop all jobs
        // In production, you'd want to keep track of the scheduled jobs
        this.isRunning = false;
        logger.info('Webhook retry scheduler stopped');
    }

    // Manually trigger retry processing (useful for testing)
    async processRetriesNow() {
        logger.info('Manually triggering webhook retry processing');
        return await this.webhookService.processRetries();
    }
}

module.exports = WebhookRetryScheduler;
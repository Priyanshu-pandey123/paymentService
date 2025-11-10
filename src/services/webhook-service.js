
const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../config');
const WebhookRepository = require('../repositories/webhook-repository');

class WebhookService {
    constructor() {
        this.webhookRepository = new WebhookRepository();
        this.WEBHOOK_URL = 'http://182.70.127.254:44346/api/webhook/payment-status';
        this.WEBHOOK_SECRET = 'OMf1AZ8ULqqfr4RQlcq7';
        this.DOMAIN = "bull8pay.com";
    }

    // Calculate next retry time with exponential backoff
    calculateNextRetry(attemptCount) {
        // Exponential backoff: 1min, 5min, 15min, 45min, 2hr, 6hr, 18hr, 24hr max
        const delays = [1, 5, 15, 45, 120, 360, 1080, 1440]; // minutes
        const delayMinutes = delays[Math.min(attemptCount, delays.length - 1)] || 1440;
        return new Date(Date.now() + delayMinutes * 60 * 1000);
    }

    // Send webhook synchronously (for immediate sending)
    async sendWebhook(paymentData, maxRetries = 3) {
        const payload = this.preparePayload(paymentData);
        const signature = this.generateSignature(payload);

        // Create webhook log entry
        const webhookLog = await this.webhookRepository.create({
            payment_uuid: paymentData.uuid || paymentData.Uuid,
            webhook_url: this.WEBHOOK_URL,
            payload: payload,
            max_attempts: maxRetries,
            signature: signature
        });

        // Attempt to send immediately
        return await this.attemptWebhook(webhookLog.id, payload, signature);
    }

    // Prepare webhook payload
    preparePayload(paymentData) {
        return {
            Uuid: paymentData.uuid,
            UserId: paymentData.userId,
            UserDomainUrl: paymentData.userDomainUrl,
            CtclId: paymentData.ctclId,
            BrokerId: paymentData.brokerId,
            Name: paymentData.name,
            Plan: paymentData.plan,
            Email: paymentData.email,
            Contact: paymentData.contact,
            Amount: paymentData.amount,
            Currency: paymentData.currency || 'INR',
            Description: paymentData.description,
            PaymentGateway: paymentData.payment_gateway || 'Razorpay',
            TransactionStatus: paymentData.transaction_status,
            PaymentVerified: paymentData.payment_verified,
            PaymentMethod: paymentData.payment_method || paymentData.method,
            OrderId: paymentData.order_id,
            PaymentId: paymentData.payment_id,
            Vpa: paymentData.vpa,
            Fee: paymentData.fee,
            Tax: paymentData.tax,
            AcquirerData: paymentData.acquirer_data || {},
            Notes: paymentData.notes || {},
            UserAgent: paymentData.user_agent,
            IpAddress: paymentData.ip_address,
            PaymentAttemptedAt: paymentData.payment_attempted_at,
            PgWebhookReceivedAt: paymentData.pg_webhook_received_at,
            Logged: paymentData.logged,
            LoggedAt: paymentData.logged_at,
            RedirectedToBroker: paymentData.redirected_to_broker,
            TimestampForRedirectedToBroker: paymentData.timestamp_for_redirected_to_broker,
            WebhookCalled: paymentData.webhook_called,
            TimestampWebhookCalled: paymentData.timestamp_webhook_called,
            IsPlanValid: paymentData.is_plan_valid,
            PlanValidTill: paymentData.plan_valid_till,
            CreatedAt: paymentData.createdAt,
            UpdatedAt: paymentData.updatedAt
        };
    }

    // Generate webhook signature
    generateSignature(payload) {
        return crypto
            .createHmac("sha256", this.WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest("hex");
    }

    // Attempt to send webhook
    async attemptWebhook(webhookLogId, payload, signature) {
        try {
            logger.info("Attempting webhook send", { webhookLogId });

            const headers = {
                "Content-Type": "application/json",
                "X-Domain": this.DOMAIN,
                "X-Payment-Signature": signature,
            };

            const response = await axios.post(this.WEBHOOK_URL, payload, { 
                headers,
                timeout: 10000 // 10 second timeout
            });
            await this.webhookRepository.markAsSuccess(webhookLogId, {
                status: response.status,
                data: response.data
            });

            logger.info("Webhook sent successfully", {
                webhookLogId,
                status: response.status,
                statusText: response.statusText
            });

            return { success: true, response: response.data };

        } catch (error) {
            logger.error("Webhook send failed", {
                webhookLogId,
                error: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data
            });

            // Update attempt count and schedule next retry
            const webhookLog = await this.webhookRepository.findById(webhookLogId);
            const newAttemptCount = webhookLog.attempt_count + 1;
            const nextRetryAt = newAttemptCount >= webhookLog.max_attempts 
                ? null 
                : this.calculateNextRetry(newAttemptCount);

            const newStatus = nextRetryAt ? 'RETRYING' : 'FAILED';

            await this.webhookRepository.updateAttempt(
                webhookLogId,
                newStatus,
                newAttemptCount,
                nextRetryAt,
                error.response ? { status: error.response.status, data: error.response.data } : null,
                error.message
            );

            return { 
                success: false, 
                error: error.message, 
                willRetry: !!nextRetryAt,
                nextRetryAt 
            };
        }
    }

    // Process pending retries (to be called by cron job)
    async processRetries() {
        try {
            const pendingWebhooks = await this.webhookRepository.findPendingRetries();
            
            logger.info(`Processing ${pendingWebhooks.length} pending webhook retries`);

            for (const webhook of pendingWebhooks) {
                try {
                    const payload = webhook.payload;
                    const signature = webhook.signature || this.generateSignature(payload);
                    
                    await this.attemptWebhook(webhook.id, payload, signature);
                    
                    // Small delay between retries to avoid overwhelming the target server
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    logger.error('Error processing webhook retry', { 
                        webhookId: webhook.id, 
                        error: error.message 
                    });
                }
            }

            logger.info('Webhook retry processing completed');
            
        } catch (error) {
            logger.error('Failed to process webhook retries', { error: error.message });
        }
    }
}

module.exports = WebhookService;
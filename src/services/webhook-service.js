
const axios = require('axios');
const crypto = require('crypto');
const { logger, WebhookConfig } = require('../config');
const WebhookRepository = require('../repositories/webhook-repository');
const { time } = require('console');

class WebhookService {
    constructor() {
        this.webhookRepository = new WebhookRepository();
        this.WEBHOOK_URL = WebhookConfig.WEBHOOK_URL;
        this.WEBHOOK_SECRET = WebhookConfig.WEBHOOK_SECRET;
        this.DOMAIN = WebhookConfig.WEBHOOK_DOMAIN;
        
        logger.debug("WebhookService initialized", {
            webhookUrl: this.WEBHOOK_URL,
            domain: this.DOMAIN,
            hasSecret: !!this.WEBHOOK_SECRET
        });
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
        // Replace console with logger for better tracking
        logger.info("Starting webhook send process", { 
            paymentUuid: paymentData.uuid || paymentData.Uuid,
            userId: paymentData.userId,
            orderId: paymentData.order_id,
            amount: paymentData.amount
        });
        
        const payload = this.preparePayload(paymentData);
        logger.debug("Webhook payload prepared", { payload });
        
        const signature = this.generateSignature(payload);
        logger.debug("Webhook signature generated", { signatureLength: signature.length });

        // Create webhook log entry
        let webhookLog;
        try {
            webhookLog = await this.webhookRepository.create({
                payment_uuid: paymentData.uuid || paymentData.Uuid,
                webhook_url: this.WEBHOOK_URL,
                payload: payload,
                max_attempts: maxRetries,
                signature: signature
            });
            logger.info("Webhook log entry created", { 
                webhookLogId: webhookLog.id,
                paymentUuid: paymentData.uuid || paymentData.Uuid 
            });
        } catch (dbError) {
            logger.error("Failed to create webhook log entry", {
                paymentUuid: paymentData.uuid || paymentData.Uuid,
                error: dbError.message,
                stack: dbError.stack
            });
            throw dbError;
        }

        // Attempt to send immediately
        return await this.attemptWebhook(webhookLog.id, payload, signature);
    }

    // Prepare webhook payload
    preparePayload(paymentData) {
        console.log(paymentDatax);
        logger.info(paymentData)
        return {
            Uuid: paymentData.uuid,
            Id:paymentData.id,
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
            logger.info("Attempting webhook send", { 
                webhookLogId,
                webhookUrl: this.WEBHOOK_URL,
                payloadSize: JSON.stringify(payload).length
            });

            const headers = {
                "Content-Type": "application/json",
                "X-Domain": this.DOMAIN,
                "X-Payment-Signature": signature,
            };

            logger.debug("Webhook request headers prepared", { 
                headers: { ...headers, "X-Payment-Signature": "[REDACTED]" },
                timeout: 10000
            });

            const response = await axios.post(this.WEBHOOK_URL, payload, { 
                headers,
                timeout: 10000 // 10 second timeout
            });
            
            // Log successful response
            logger.info("Webhook sent successfully", {
                webhookLogId,
                status: response.status,
                statusText: response.statusText,
                responseSize: JSON.stringify(response.data).length
            });

            // Update database with success
            try {
                await this.webhookRepository.markAsSuccess(webhookLogId, {
                    status: response.status,
                    data: response.data
                });
                logger.debug("Webhook log marked as successful in database", { webhookLogId });
            } catch (dbError) {
                logger.error("Failed to update webhook log as successful", {
                    webhookLogId,
                    dbError: dbError.message
                });
            }

            return { success: true, response: response.data };

        } catch (error) {
            logger.error("Webhook send failed", {
                webhookLogId,
                webhookUrl: this.WEBHOOK_URL,
                error: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                isTimeout: error.code === 'ECONNABORTED',
                stack: error.stack
            });

            // Update attempt count and schedule next retry
            try {
                const webhookLog = await this.webhookRepository.findById(webhookLogId);
                logger.debug("Retrieved webhook log for retry calculation", {
                    webhookLogId,
                    currentAttempts: webhookLog.attempt_count,
                    maxAttempts: webhookLog.max_attempts
                });
                
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

                logger.info("Webhook retry scheduled", {
                    webhookLogId,
                    newAttemptCount,
                    maxAttempts: webhookLog.max_attempts,
                    nextRetryAt,
                    status: newStatus
                });

            } catch (dbError) {
                logger.error("Failed to update webhook retry information", {
                    webhookLogId,
                    dbError: dbError.message
                });
            }

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
            logger.info("Starting webhook retry processing");
            
            const pendingWebhooks = await this.webhookRepository.findPendingRetries();
            logger.info(`Found ${pendingWebhooks.length} pending webhook retries`);
            
            if (pendingWebhooks.length === 0) {
                logger.info("No pending webhooks to retry");
                return;
            }

            for (const webhook of pendingWebhooks) {
                try {
                    logger.info("Processing webhook retry", {
                        webhookId: webhook.id,
                        paymentUuid: webhook.payment_uuid,
                        attemptCount: webhook.attempt_count,
                        maxAttempts: webhook.max_attempts,
                        nextRetryAt: webhook.next_retry_at
                    });
                    
                    const payload = webhook.payload;
                    const signature = webhook.signature || this.generateSignature(payload);
                    
                    const result = await this.attemptWebhook(webhook.id, payload, signature);
                    
                    if (result.success) {
                        logger.info("Webhook retry successful", { webhookId: webhook.id });
                    } else {
                        logger.warn("Webhook retry failed", { 
                            webhookId: webhook.id,
                            error: result.error,
                            willRetry: result.willRetry
                        });
                    }
                    
                    // Small delay between retries to avoid overwhelming the target server
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    logger.error('Error processing webhook retry', { 
                        webhookId: webhook.id,
                        paymentUuid: webhook.payment_uuid,
                        error: error.message,
                        stack: error.stack
                    });
                }
            }

            logger.info('Webhook retry processing completed');
            
        } catch (error) {
            logger.error('Failed to process webhook retries', { 
                error: error.message,
                stack: error.stack
            });
        }
    }
}

module.exports = WebhookService;
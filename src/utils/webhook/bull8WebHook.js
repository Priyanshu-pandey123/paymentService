const crypto = require("crypto");
const axios = require("axios");
const { logger } = require("../../config");

async function sendPaymentStatusWebhook(paymentData) {
  try {
    const WEBHOOK_URL = 'http://182.70.127.254:44346/api/webhook/payment-status'; 
    const WEBHOOK_SECRET = 'OMf1AZ8ULqqfr4RQlcq7';
    if (!WEBHOOK_URL) {
      logger.error("PAYMENT_STATUS_WEBHOOK_URL environment variable is not set");
      return;
    }
    
    if (!WEBHOOK_SECRET) {
      logger.error("PAYMENT_STATUS_WEBHOOK_SECRET environment variable is not set");
      return;
    }
          const DOMAIN = "bull8pay.com";
          const transformedData = {
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
            Currency: paymentData.currency,
            Description: paymentData.description,
            PaymentGateway: paymentData.payment_gateway,
            TransactionStatus: paymentData.transaction_status,
            PaymentVerified: paymentData.payment_verified,
            PaymentMethod: paymentData.payment_method,
            OrderId: paymentData.order_id,
            PaymentId: paymentData.payment_id,
            Vpa: paymentData.vpa,
            Fee: paymentData.fee,
            Tax: paymentData.tax,
            AcquirerData: paymentData.acquirer_data,
            Notes: paymentData.notes,
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

    // Create signature
    const payload = JSON.stringify(transformedData);
    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    const headers = {
      "Content-Type": "application/json",
      "X-Domain": DOMAIN,
      "X-Payment-Signature": signature,
    };

    logger.info("Sending Payment Status Webhook", { 
      WEBHOOK_URL,
      payloadSize: payload.length,
      hasSignature: !!signature 
    });

    const response = await axios.post(WEBHOOK_URL, payload, { 
      headers,
      timeout: 10000 // 10 second timeout
    });

    console.log(response, 'from the webhook');

    logger.info("Payment Status Webhook Sent Successfully", {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {

    console.log(error, 'from the webhook')
    logger.error("Failed to Send Payment Status Webhook", {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      webhookUrl: WEBHOOK_URL,
      stack: error.stack,
    });
  }
}

module.exports = { sendPaymentStatusWebhook };

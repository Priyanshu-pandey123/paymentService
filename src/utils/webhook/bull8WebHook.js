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
            Uuid: paymentData.Uuid || paymentData.uuid || null,
            Id: paymentData.Id || paymentData.id || null,
            UserId: paymentData.UserId || paymentData.userId,
            UserDomainUrl: paymentData.UserDomainUrl || paymentData.userDomainUrl || paymentData.domainName,
            CtclId: paymentData.CtclId || paymentData.ctclId,
            BrokerId: paymentData.BrokerId || paymentData.brokerId,
            Name: paymentData.Name || paymentData.name,
            Plan: paymentData.Plan || paymentData.plan,
            Email: paymentData.Email || paymentData.email,
            Contact: paymentData.Contact || paymentData.contact,
            Amount: paymentData.Amount || paymentData.amount,
            Currency: paymentData.Currency || paymentData.currency || 'INR',
            Description: paymentData.Description || paymentData.description,
            PaymentGateway: paymentData.PaymentGateway || paymentData.payment_gateway || 'Razorpay',
            TransactionStatus: paymentData.TransactionStatus || paymentData.transaction_status,
            PaymentVerified: paymentData.PaymentVerified || paymentData.payment_verified,
            PaymentMethod: paymentData.PaymentMethod || paymentData.payment_method || paymentData.method || null,
            OrderId: paymentData.OrderId || paymentData.order_id || null,
            PaymentId: paymentData.PaymentId || paymentData.payment_id || null,
            Vpa: paymentData.Vpa || paymentData.vpa || null,
            Fee: paymentData.Fee || paymentData.fee || null,
            Tax: paymentData.Tax || paymentData.tax || null,
            AcquirerData: paymentData.AcquirerData || paymentData.acquirer_data || {},
            Notes: paymentData.Notes || paymentData.notes || {},
            UserAgent: paymentData.UserAgent || paymentData.user_agent || null,
            IpAddress: paymentData.IpAddress || paymentData.ip_address || paymentData.ip,
            PaymentAttemptedAt: paymentData.PaymentAttemptedAt || paymentData.payment_attempted_at || null,
            PgWebhookReceivedAt: paymentData.PgWebhookReceivedAt || paymentData.pg_webhook_received_at || null,
            Logged: paymentData.Logged || paymentData.logged || null,
            LoggedAt: paymentData.LoggedAt || paymentData.logged_at || null,
            RedirectedToBroker: paymentData.RedirectedToBroker || paymentData.redirected_to_broker || null,
            TimestampForRedirectedToBroker: paymentData.TimestampForRedirectedToBroker || paymentData.timestamp_for_redirected_to_broker || null,
            WebhookCalled: paymentData.WebhookCalled || paymentData.webhook_called || null,
            TimestampWebhookCalled: paymentData.TimestampWebhookCalled || paymentData.timestamp_webhook_called || null,
            IsPlanValid: paymentData.IsPlanValid !== undefined ? paymentData.IsPlanValid : (paymentData.is_plan_valid !== undefined ? paymentData.is_plan_valid : false),
            PlanValidTill: paymentData.PlanValidTill || paymentData.plan_valid_till || null,
            CreatedAt: paymentData.CreatedAt || paymentData.createdAt || new Date(),
            UpdatedAt: paymentData.UpdatedAt || paymentData.updatedAt || new Date()
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
      timeout: 10000 
    });


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
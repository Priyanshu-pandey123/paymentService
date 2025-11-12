const crypto = require("crypto");
const axios = require("axios");
const { logger, WebhookConfig } = require("../../config");
const { resolve } = require("path");
const { response } = require("express");

async function sendPaymentStatusWebhook(paymentData) {
  let WEBHOOK_URL, WEBHOOK_SECRET, DOMAIN; // Declare variables outside try block
  
  try {
    WEBHOOK_URL = WebhookConfig.WEBHOOK_URL || 'http://182.70.127.254:44346/api/webhook/payment-status';
    WEBHOOK_SECRET = WebhookConfig.WEBHOOK_SECRET || 'OMf1AZ8ULqqfr4RQlcq7';
    DOMAIN = WebhookConfig.WEBHOOK_DOMAIN || 'bull8pay.com';
    
    if (!WEBHOOK_URL) {
      logger.error("PAYMENT_STATUS_WEBHOOK_URL environment variable is not set");
      return;
    }
    
    if (!WEBHOOK_SECRET) {
      logger.error("PAYMENT_STATUS_WEBHOOK_SECRET environment variable is not set");
      return;
    }
          
    const transformedData = {
            Uuid: paymentData.Uuid || paymentData.uuid || null,
            Id: paymentData.Id || paymentData.id || null,
            UserId: paymentData.UserId || paymentData.userId,
            UserDomainUrl: paymentData.UserDomainUrl || paymentData.userDomainUrl || paymentData.domainName,
            CtclId: paymentData.CtclId || paymentData.ctclId,
            OrderId: paymentData.OrderId || paymentData.order_id || null,
            BrokerId: paymentData.BrokerId || paymentData.brokerId,
            Name: paymentData.Name || paymentData.name,
            Email: paymentData.Email || paymentData.email,
            Contact: paymentData.Contact || paymentData.contact,
            Amount: (paymentData.Amount ?? paymentData.amount)?.toString() ?? null,
            Currency: paymentData.Currency || paymentData.currency || 'INR',
            Description: paymentData.Description || paymentData.description,
            PaymentGateway: paymentData.PaymentGateway || paymentData.payment_gateway || 'Razorpay',
            IpAddress: paymentData.IpAddress || paymentData.ip_address || paymentData.ip,
            TransactionStatus: "PENDING",
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
      response
    });
  } catch (error) {

    // console.log(error, 'from the webhook')
    logger.error("Failed to Send Payment Status Webhook", {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      webhookUrl: WEBHOOK_URL,
      stack: error.stack,
      response
    });
  }
}
module.exports = { sendPaymentStatusWebhook };
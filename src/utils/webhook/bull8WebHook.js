import crypto from "crypto";
import axios from "axios";
import logger from "../utils/logger.js"; // your logger if available

export async function sendPaymentStatusWebhook(paymentData) {
  try {
    const WEBHOOK_URL = process.env.PAYMENT_STATUS_WEBHOOK_URL; 
    const WEBHOOK_SECRET = process.env.PAYMENT_STATUS_WEBHOOK_SECRET; 
    const DOMAIN =  "bull8pay.com";

    // Create signature
    const payload = JSON.stringify(paymentData);
    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    const headers = {
      "Content-Type": "application/json",
      "X-Domain": DOMAIN,
      "X-Payment-Signature": signature,
    };

    logger.info("Sending Payment Status Webhook", { WEBHOOK_URL });

    const response = await axios.post(WEBHOOK_URL, payload, { headers });

    logger.info("Payment Status Webhook Sent Successfully", {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    logger.error("Failed to Send Payment Status Webhook", {
      error: error.message,
      stack: error.stack,
    });
  }
}

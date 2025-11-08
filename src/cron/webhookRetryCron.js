const cron = require("node-cron");
const WebhookService = require("../services/webhook-service");
const { logger } = require("../config");

const webhookService = new WebhookService();

// Runs every 2 minutes
cron.schedule("*/2 * * * *", async () => {
  try {
    logger.info("⏳ Cron started: checking for webhook retries...");
    await webhookService.processRetries();
    logger.info("✅ Cron finished");
  } catch (err) {
    logger.error("❌ Cron failed", { error: err.message });
  }
});

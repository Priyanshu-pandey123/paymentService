const cron = require("node-cron");
const fs = require('fs').promises;
const path = require('path');
const WebhookService = require("../services/webhook-service");
const { logger } = require("../config");

const LOCK_FILE = path.join(__dirname, '../../webhook-cron.lock');

async function acquireLock() {
  try {
    await fs.access(LOCK_FILE);
    return false; // Lock file exists
  } catch {
    await fs.writeFile(LOCK_FILE, process.pid.toString());
    return true;
  }
}

async function releaseLock() {
  try {
    await fs.unlink(LOCK_FILE);
  } catch (error) {
    logger.warn("Failed to release lock file", { error: error.message });
  }
}

// Runs every 2 minutes
cron.schedule("*/2 * * * *", async () => {
  if (!(await acquireLock())) {
    logger.info("⏳ Cron skipped: another instance is running");
    return;
  }
  
  try {
    logger.info("⏳ Cron started: checking for webhook retries...");
    const webhookService = new WebhookService();
    await webhookService.processRetries();
    logger.info("✅ Cron finished");
  } catch (err) {
    logger.error("❌ Cron failed", { error: err.message });
  } finally {
    await releaseLock();
  }
});
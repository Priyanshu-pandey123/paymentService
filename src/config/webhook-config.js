const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    WEBHOOK_URL: process.env.WEBHOOK_URL || 'http://182.70.127.254:44346/api/webhook/payment-status',
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'OMf1AZ8ULqqfr4RQlcq7',
    WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN || 'bull8pay.com'
};
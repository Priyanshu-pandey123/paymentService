const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    WEBHOOK_URL: process.env.WEBHOOK_URL ,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET ,
    WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN
};
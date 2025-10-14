const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_SECRET:process.env.RAZORPAY_SECRET,
    RAZORPAY_WEBHOOK_SECRET:process.env.RAZORPAY_WEBHOOK_SECRET

}
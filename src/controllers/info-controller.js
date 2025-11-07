const { StatusCodes } = require('http-status-codes');
const { sendPaymentStatusWebhook } = require('../utils/webhook/bull8WebHook');

const info = async (req, res) => {
    const paymentStatusData = {
        uuid: "6067ad32-dd11-4413-98ec-8aed02ed3d2f",
        userId: "YASH",
        userDomainUrl: "http://localhost:3002/dashboard/subscriptionplan/status",
        ctclId: "d2bcde75-a382-4a8b-a0d2-b0e58483fbb0",
        brokerId: "BLITZ0001",
        name: "Yash 11/07/2025 05:42:34",
        plan: "STARTER",
        email: "yashdev@quantxpress.com",
        contact: "8569741023",
        amount: "2.00",
        currency: "INR",
        description: "starter payment",
        payment_gateway: "RAZORPAY",
        transaction_status: "SUCCESS",
        payment_verified: "YES",
        payment_method: null,
        order_id: "order_RcjwspxR5zIOsM",
        payment_id: "pay_RcjxQ2upekxDKn",
        vpa: "8964803072@ybl",
        fee: "0.04",
        tax: "0.00",
        acquirer_data: {
          rrn: "397449076218",
        },
        notes: {
          plan: "STARTER",
          email: "yashdev@quantxpress.com",
          description: "starter payment",
        },
        user_agent: null,
        ip_address: "::ffff:127.0.0.1",
        payment_attempted_at: null,
        pg_webhook_received_at: "2025-11-07T05:48:31.000Z",
        logged: 0,
        logged_at: null,
        redirected_to_broker: null,
        timestamp_for_redirected_to_broker: null,
        webhook_called: 1,
        timestamp_webhook_called: "2025-11-07T05:48:31.000Z",
        is_plan_valid: true,
        plan_valid_till: "2025-12-07T05:48:31.000Z",
        createdAt: "2025-11-07T05:47:58.000Z",
        updatedAt: "2025-11-07T05:48:31.000Z",
      };
      

      await sendPaymentStatusWebhook(paymentStatusData);
      
    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'API is live',
        error: {},
        data: {},
    });
}

module.exports = {
    info,
  
}


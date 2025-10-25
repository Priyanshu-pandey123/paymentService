const axios = require('axios');
const {StatusCodes} = require('http-status-codes');
const Razorpay = require("razorpay");
const { PaymentRepository } = require('../repositories');
const { ServerConfig, Queue } = require('../config')
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const crypto = require('crypto');
// const {Enums} = require('../utils/common');
 const {planData}= require("../utils/plan")
const {logger,RazorConfig}= require('../config');
const { ErrorResponse } = require('../utils/common');


 const paymentRepository=new PaymentRepository();

const razorpay = new Razorpay({
    key_id: RazorConfig.RAZORPAY_KEY_ID,
    key_secret:RazorConfig.RAZORPAY_SECRET,
  });

async function createPayment(data,ip) {
    try {
      const { plan, userData } = data;
    const { name, email, contact, userId, domainName, ctclId,brokerId} = userData || {};


    if (!plan || !userData) {
      logger.error("Payment creation failed - missing fields", { ip, plan, userData });
      throw new AppError("Select the plan for payment", StatusCodes.BAD_REQUEST);
    }


     const selectedPlan = planData.find((p) => p.plan === plan);

       if (!selectedPlan) {
      logger.error("Invalid plan selected", { plan });
      throw new AppError("Invalid plan selected", StatusCodes.BAD_REQUEST);
    }
      const { amount, plan: planName ,description} = selectedPlan;
      const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        plan: planName,
        email,
        description,
      },
    };

      const order = await razorpay.orders.create(options);
      const payment= await paymentRepository.createPayment(
        {
            name,
            email,
            contact,
            userId,
            userDomainUrl:domainName,
            amount: amount, 
            description,
            order_id: order.id,
            payment_status: "PENDING",
            plan:plan,
            ctclId,
            brokerId,
            ip_address:ip

        }
      );
   
    logger.info("Payment order created successfully", {
      userId,
      brokerId,
      orderId: order.id,
      amount,
      plan,
    });

      return { order, payment };
       
    } catch(error) {
     logger.error("Payment creation error", { 
      ip: data?.ip || "unknown", 
      userId: data?.userData?.userId, 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
    }
    
}

async function verifyPayment(data) {
 try {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;


  logger.info("Verify payment request received", { orderId: razorpay_order_id, paymentId: razorpay_payment_id });

  const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
  .createHmac("sha256", RazorConfig.RAZORPAY_SECRET)
  .update(dataToSign)
  .digest("hex");

  const isValid = expectedSignature === razorpay_signature;
    if (isValid) {
      logger.info("Payment verified successfully", { orderId: razorpay_order_id, paymentId: razorpay_payment_id });
    } else {
      logger.warn("Invalid payment signature detected", { orderId: razorpay_order_id, paymentId: razorpay_payment_id });
    }

  const updates = {
    payment_id: razorpay_payment_id,
    payment_verified: isValid ? "YES" : "NO"
  };

  const updatedPayment = await paymentRepository.updatePaymentByOrderId(razorpay_order_id, updates);

       if (!updatedPayment) {
      logger.error("Failed to update payment record", { orderId: razorpay_order_id });
      throw new AppError("Failed to update payment record", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    logger.info("Payment record updated", { orderId: razorpay_order_id, payment: updatedPayment });

  return {
    success: isValid,
    message: isValid ? "Payment verified" : "Invalid signature",
    payment: updatedPayment
  };
 } catch(error) {
   logger.error("Payment verification error", { orderId: razorpay_order_id, error: error.message, stack: error.stack });
    throw error;
 }
}


function validateWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}


async function paymentWebhook(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");
    logger.info("Webhook invoked", { ip, hasSignature: Boolean(webhookSignature) });

   if (!webhookSignature) {
      logger.warn("Webhook signature missing", { ip });
    ErrorResponse.message="Signature missing"
      return res
              .status(StatusCodes.BAD_REQUEST)
              .json(ErrorResponse)
    }

    console.log("******************************* Webhook Data *******************************");
    console.log(JSON.stringify(req.body, null, 2));
    logger.info("webhook  data ",JSON.stringify(req.body ));
    console.log("***************************************************************************");

    const rawBody = JSON.stringify(req.body);
    const isWebhookValid = validateWebhookSignature(
      rawBody,
      webhookSignature,
      RazorConfig.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isWebhookValid) {
      logger.warn("Invalid webhook signature");
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }
   
    
    const payload = req.body;
    const paymentDetails = payload?.payload?.payment?.entity;


    if (!paymentDetails) {
      logger.warn("No payment details found in webhook payload", { ip });
      return res.status(400).json({ success: false, error: "No payment details found" });
    }

   
    const updates = {
      payment_id: paymentDetails.id,
       raw_payload: payload,
       pg_webhook_received_at: new Date(),
       payment_verified: "YES",// check if wanted 
       transaction_status: "PENDING",
      status: paymentDetails.status || null,
      method: paymentDetails.method || null,
      currency: paymentDetails.currency || null,
      vpa: paymentDetails.vpa || paymentDetails?.upi?.vpa || null,
      fee: paymentDetails.fee || 0,
      tax: paymentDetails.tax || 0,
      acquirer_data: paymentDetails.acquirer_data || {},
      notes: paymentDetails.notes || {},
      ip_address: ip,
      webhook_called: 1,
      timestamp_webhook_called: new Date(),
    };


      // Handle event types
    switch (payload.event) {
      case "payment.captured":
        updates.transaction_status = "SUCCESS";
        updates.payment_verified = "YES";
        break;

      case "payment.failed":
        updates.transaction_status = "FAILED";
        updates.payment_verified = "NO";
        break;

      case "payment.authorized":
        updates.transaction_status = "PENDING";
        break;

      default:
        logger.info("Unhandled Razorpay event type", { event: payload.event });
        break;
    }


    await paymentRepository.updatePaymentByOrderId(paymentDetails.order_id, updates);
    logger.info("Webhook processed successfully", {
      ip,
      event: payload.event,
      paymentId: paymentDetails.id,
      orderId: paymentDetails.order_id,
      amount: paymentDetails.amount,
      status: updates.transaction_status
    });

    return res.status(200).json({ success: true });

  } catch (error) {
   logger.error("Webhook handler error", {
      ip,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

async function cancelPayment(orderId) {
 try {

 logger.info("Cancelling payment in service", { orderId });
    const updates = {
     payment_status:"CANCELLED"
    }
   const response = await paymentRepository.updatePaymentByOrderId(orderId,updates)
       logger.info("Payment cancelled successfully in service", { orderId, updatedRecord: response });
   return response;

 } catch(error) {
    logger.error("Payment cancellation service error", { orderId, error: error.message, stack: error.stack });
    throw error;
 }
}







module.exports = {
    createPayment,
    verifyPayment,
    paymentWebhook,
    cancelPayment

}


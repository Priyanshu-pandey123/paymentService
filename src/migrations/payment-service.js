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
const {logger,RazorConfig,amountConfig}= require('../config');
const { ErrorResponse } = require('../utils/common');


 const paymentRepository=new PaymentRepository();

const razorpay = new Razorpay({
    key_id: RazorConfig.RAZORPAY_KEY_ID,
    key_secret:RazorConfig.RAZORPAY_SECRET,
  });



  async function createPayment(data, ip) {
    try {
      const { plan, userData } = data;
      const { name, email, contact, userId, domainName, ctclId, brokerId ,amount } = userData || {};
  
      // INPUT VALIDATION: Validate required fields exist
      if (!plan || !userData) {
        logger.error("Payment creation failed - missing required fields", { ip, plan, userData });
        throw new AppError("Plan and user data are required", StatusCodes.BAD_REQUEST);
      }
  
      // CONSISTENCY VALIDATION: Validate plan exists in our system
      const validPlans = ["STARTER", "GROWTH", "PRO", "ELITE"];
      if (!validPlans.includes(plan)) {
        logger.error("Invalid plan selected", { plan, ip, validPlans });
        throw new AppError(`Invalid plan. Valid plans are: ${validPlans.join(', ')}`, StatusCodes.BAD_REQUEST);
      }
  
      // Get selected plan and extract details
      const selectedPlan = planData.find((p) => p.plan === plan);
      if (!selectedPlan) {
        logger.error("Plan not found in system", { plan, ip });
        throw new AppError("Selected plan is not available", StatusCodes.BAD_REQUEST);
      }
      
      const {  description } = selectedPlan;
      
      // CONSISTENCY VALIDATION: Validate amount constraints (business rules)
      // Convert from paisa to rupees for validation
      if (amount > amountConfig.MAX_AMOUNT) {
        logger.error("Amount exceeds business limit", { amount, maxAmount: amountConfig.MAX_AMOUNT, ip });
        throw new AppError(`Amount exceeds the maximum limit of ₹${amountConfig.MAX_AMOUNT}`, StatusCodes.BAD_REQUEST);
      }
  
      if (amount < amountConfig.MIN_AMOUNT) {
        logger.error("Amount below business minimum", { amount, minAmount: amountConfig.MIN_AMOUNT, ip });
        throw new AppError(`Amount is below the minimum limit of ₹${amountConfig.MIN_AMOUNT}`, StatusCodes.BAD_REQUEST);
      }
  
      // CONSISTENCY VALIDATION: Check user payment status (business rule - one successful payment per user)
      const existingSuccessfulPayment = await paymentRepository.checkSuccessfulPaymentByUserId(userId);
      if (existingSuccessfulPayment) {
        logger.warn("Payment creation blocked - user already has successful payment", { 
          userId, 
          existingPaymentId: existingSuccessfulPayment.id,
          ip 
        });
  
        return {
          success: false,
          message: "User already has a successful payment",
          data: {
            userId: userId,
            existingPaymentId: existingSuccessfulPayment.id,
            transactionStatus: existingSuccessfulPayment.transaction_status,
            paymentDate: existingSuccessfulPayment.createdAt,
            plan: existingSuccessfulPayment.plan
          },
          code: "USER_ALREADY_EXISTS"
        };
      }
  
      // CONSISTENCY VALIDATION: Check for existing pending/failed payments (retry logic)
      const existingUser = await paymentRepository.findByUserId(userId);
      if (existingUser) {
        logger.info("Existing user found", { 
          userId, 
          ip,
          status: existingUser.payment_status
        });
  
        // Business rule: If payment already SUCCESS — block new payment
        if (existingUser.payment_status === "SUCCESS") {
          logger.warn("User already has successful payment", { userId, ip });
          return {
            success: false,
            message: "User already completed payment successfully",
            data: {
              userId,
              existingPaymentId: existingUser.id,
              plan: existingUser.plan,
              paymentStatus: existingUser.payment_status,
              paymentDate: existingUser.createdAt
            },
            code: "USER_ALREADY_PAID"
          };
        }
  
        // Business rule: Allow retry for pending/failed payments
        logger.info("User has pending/failed payment - allowing retry", {
          userId,
          orderId: existingUser.order_id,
          status: existingUser.payment_status
        });
  
        return {
          success: true,
          message: "User has an unfinished payment. Use this order ID to retry.",
          data: {
            userId,
            id: existingUser.order_id,
            paymentStatus: existingUser.payment_status,
            plan: existingUser.plan,
            amount: existingUser.amount
          },
          code: "RETRY_PAYMENT"
        };
      }
  
      // Create new payment order with Razorpay
      const options = {
        amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          plan, // Fixed: use planName instead of plan
          description: description, // Fixed: use description instead of email
          email: email // Keep email for reference
        },
      };
  
      const order = await razorpay.orders.create(options);
  
      // Create payment record in database
      const payment = await paymentRepository.createPayment({
        name,
        email,
        contact,
        userId,
        userDomainUrl: domainName,
        amount, // Fixed: Convert from paisa to rupees
        description, // Fixed: Include description field
        order_id: order.id,
        payment_status: "INITIATED",
        plan,
        ctclId,
        brokerId,
        ip_address: ip
      });
   
      logger.info("Payment order created successfully", {
        userId,
        brokerId,
        orderId: order.id,
        amount: amountInRupees,
        plan,
      });
  
      return { 
        success: true,
        order, 
        payment 
      };
       
    } catch(error) {
      console.log(error)
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

  logger.info("Processing webhook for order", {
    ip,
    event: payload.event,
    orderId: paymentDetails.order_id,
    paymentId: paymentDetails.id,
    amount: paymentDetails.amount,
    status: paymentDetails.status
  });
 
  const updates = {
     payment_id: paymentDetails.id,
     raw_payload: payload,
     pg_webhook_received_at: new Date(),
     payment_verified: "YES",
     transaction_status: "PENDING",
     status: paymentDetails.status || null,
     method: paymentDetails.method || null,
    currency: paymentDetails.currency || null,
    vpa: paymentDetails.vpa || paymentDetails?.upi?.vpa || null,
    fee: (paymentDetails.fee || 0),
    tax: (paymentDetails.tax || 0),
    acquirer_data: paymentDetails.acquirer_data || {},
    notes: paymentDetails.notes || {},
    ip_address: ip,
    webhook_called: 1,
    timestamp_webhook_called: new Date(),
    is_plan_valid: false,
  };

  logger.info("Initial updates object created", {
    orderId: paymentDetails.order_id,
    initialStatus: updates.transaction_status,
    initialPlanValid: updates.is_plan_valid
  });

    // Handle event types
    switch (payload.event) {
      case "payment.captured":
        console.log("PAID")
        logger.info("Processing payment.captured event", {
          orderId: paymentDetails.order_id,
          paymentId: paymentDetails.id,
          amount: paymentDetails.amount
        });
        updates.transaction_status = "SUCCESS";
        updates.payment_verified = "YES";
        updates.is_plan_valid = true;
        updates.plan_valid_till = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        logger.info("Updated for payment.captured", {
          orderId: paymentDetails.order_id,
          newStatus: updates.transaction_status,
          planValid: updates.is_plan_valid,
          planValidTill: updates.plan_valid_till
        });
        break;

      case "order.paid":
        console.log("PAIDb 2")
        logger.info("Processing order.paid event", {
          orderId: paymentDetails.order_id,
          paymentId: paymentDetails.id,
          amount: paymentDetails.amount
        });
        updates.transaction_status = "SUCCESS";
        updates.payment_verified = "YES";
        updates.is_plan_valid = true;
        updates.plan_valid_till = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        logger.info("Updated for order.paid", {
          orderId: paymentDetails.order_id,
          newStatus: updates.transaction_status,
          planValid: updates.is_plan_valid,
          planValidTill: updates.plan_valid_till
        });
        break;

      case "payment.failed":
         console.log("failed")
        logger.info("Processing payment.failed event", {
          orderId: paymentDetails.order_id,
          paymentId: paymentDetails.id
        });
        updates.transaction_status = "FAILED";
        updates.payment_verified = "NO";
        logger.info("Updated for payment.failed", {
          orderId: paymentDetails.order_id,
          newStatus: updates.transaction_status
        });
        break;

      case "payment.authorized":
         console.log("authrized")
        logger.info("Processing payment.authorized event", {
          orderId: paymentDetails.order_id,
          paymentId: paymentDetails.id
        });
        updates.transaction_status = "PENDING";
        logger.info("Updated for payment.authorized", {
          orderId: paymentDetails.order_id,
          newStatus: updates.transaction_status
        });
        break;

      default:
        logger.info("Unhandled Razorpay event type", { 
          event: payload.event,
          orderId: paymentDetails.order_id 
        });
        break;
    }

  logger.info("About to update payment in database", {
    orderId: paymentDetails.order_id,
    finalUpdates: {
      transaction_status: updates.transaction_status,
      payment_verified: updates.payment_verified,
      is_plan_valid: updates.is_plan_valid,
      plan_valid_till: updates.plan_valid_till ? updates.plan_valid_till.toISOString() : null
    }
  });

  const updatedPayment = await paymentRepository.updatePaymentByOrderId(paymentDetails.order_id, updates);
  
  if (updatedPayment) {
    logger.info("Webhook processed successfully - database updated", {
      ip,
      event: payload.event,
      paymentId: paymentDetails.id,
      orderId: paymentDetails.order_id,
      amount: paymentDetails.amount,
      status: updates.transaction_status,
      planValid: updates.is_plan_valid,
      planValidTill: updates.plan_valid_till
    });
  } else {
    logger.error("Webhook processed but database update failed", {
      ip,
      event: payload.event,
      orderId: paymentDetails.order_id,
      updates: Object.keys(updates)
    });
  }

  return res.status(200).json({ success: true });

} catch (error) {
 logger.error("Webhook handler error", {
    ip,
    error: error.message,
    stack: error.stack,
    event: req.body?.event,
    orderId: req.body?.payload?.payment?.entity?.order_id
  });
  return res.status(500).json({ success: false, error: "Server error" });
}
}

async function cancelPayment(orderId) {
  try {
 
  logger.info("Cancelling payment in service", { orderId });
  
  // First, find the payment to check its current status
  const existingPayment = await paymentRepository.findByOrderId(orderId);
  if (!existingPayment) {
    logger.warn("Payment not found for cancellation", { orderId });
    throw new AppError("Payment not found", StatusCodes.NOT_FOUND);
  }
 
  // Check if payment is already successful
  if (existingPayment.transaction_status === "SUCCESS") {
    logger.warn("Cannot cancel successful payment", { 
      orderId, 
      paymentId: existingPayment.id,
      currentStatus: existingPayment.transaction_status 
    });
    
    // Return the existing payment without updating
    return {
      success: false,
      message: "Cannot cancel a successful payment",
      payment: existingPayment,
      code: "CANNOT_CANCEL_SUCCESSFUL_PAYMENT"
    };
  }
 
     const updates = {
      transaction_status:"CANCELLED"
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


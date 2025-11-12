const axios = require('axios');
const {StatusCodes} = require('http-status-codes');
const Razorpay = require("razorpay");
const { PaymentRepository } = require('../repositories');
const { ServerConfig, amountConfig } = require('../config')
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const crypto = require('crypto');
const {planData}= require("../utils/plan")
const {logger,RazorConfig}= require('../config');
const { ErrorResponse } = require('../utils/common');
const WebhookService = require('./webhook-service');
const WebhookRepository = require('../repositories/webhook-repository');
const { sendPaymentStatusWebhook } = require('../utils/webhook/bull8WebHook');

const paymentRepository=new PaymentRepository();
const razorpay = new Razorpay({
    key_id: RazorConfig.RAZORPAY_KEY_ID,
    key_secret:RazorConfig.RAZORPAY_SECRET,
});
async function createPayment(data,ip) {
  try {
    const { plan, userData } = data;
  const { name, email, contact, userId, domainName, ctclId,brokerId,amount,id} = userData || {};
  if (!plan || !userData) {
    logger.error("Payment creation failed - missing fields", { ip, plan, userData });
    throw new AppError("Select the plan for payment", StatusCodes.BAD_REQUEST);
  }

     const selectedPlan = planData.find((p) => p.plan === plan);
   if (!selectedPlan) {
    logger.error("Invalid plan selected", { plan });
    throw new AppError("Invalid plan selected", StatusCodes.BAD_REQUEST);
  }
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount)) {
    logger.error("Invalid amount format", { amount });
    throw new AppError("Amount must be a valid number", StatusCodes.BAD_REQUEST);
  }
  
  if (numericAmount < amountConfig.MIN_AMOUNT) {
    logger.error("Payment amount too low", { amount: numericAmount, minAllowed: amountConfig.MIN_AMOUNT });
    throw new AppError(`Minimum payment amount is ₹${amountConfig.MIN_AMOUNT}`, StatusCodes.BAD_REQUEST);
  }
  
  if (numericAmount > amountConfig.MAX_AMOUNT) {
    logger.error("Payment amount too high", { amount: numericAmount, maxAllowed: amountConfig.MAX_AMOUNT });
    throw new AppError(`Maximum payment amount is ₹${amountConfig.MAX_AMOUNT}`, StatusCodes.BAD_REQUEST);
  }


  // Check if user already has a successful payment
// const existingSuccessfulPayment = await paymentRepository.checkSuccessfulPaymentByUserId(userId);
//   if (existingSuccessfulPayment) {
//     logger.warn("Payment creation blocked - user already has successful payment", { 
//       userId, 
//       existingPaymentId: existingSuccessfulPayment.id,
//       ip 
//     });
    

    
//     return {
//       success: false,
//       message: "User already exists with successful payment",
//       data: {
//         userId: userId,
//         existingPaymentId: existingSuccessfulPayment.id,
//         transactionStatus: existingSuccessfulPayment.transaction_status,
//         paymentDate: existingSuccessfulPayment.createdAt,
//         plan: existingSuccessfulPayment.plan
//       },
//       code: "USER_ALREADY_EXISTS"
//     };
//   }

// const existingUser = await paymentRepository.findByUserId(userId);

// if (existingUser) {
//   logger.info("Existing user found in DB", { 
//     userId, 
//     ip,
//     status: existingUser.payment_status
//   });

//   // Case 1: If payment already SUCCESS — block new payment
//   if (existingUser.payment_status === "SUCCESS") {
//     logger.warn("User already has a successful payment", { userId, ip });
//     return {
//       success: false,
//       message: "User already completed payment successfully",
//       data: {
//         userId,
//         existingPaymentId: existingUser.id,
//         plan: existingUser.plan,
//         paymentStatus: existingUser.payment_status,
//         paymentDate: existingUser.createdAt
//       },
//       code: "USER_ALREADY_PAID"
//     };
//   }

//   // Case 2: If payment not successful — allow retry with existing order_id
//   logger.info("User has pending/failed payment - returning existing order ID", {
//     userId,
//     orderId: existingUser.order_id,
//     status: existingUser.payment_status
//   });

//   return {
//     success: true,
//     message: "User has an unfinished payment. Use this order ID to retry.",
//     data: {
//       userId,
//       id: existingUser.order_id,
//       paymentStatus: existingUser.payment_status,
//       plan: existingUser.plan,
//       amount: existingUser.amount
//     },
//     code: "RETRY_PAYMENT"
//   };
// }


    const { description} = selectedPlan;
    const options = {
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    notes: {
      plan,
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
          amount,
          description,
          order_id: order.id,
          payment_status: "INITIATED",
          plan,
          ctclId,
          brokerId,
          id:id,
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
  // Fire-and-forget webhook (non-blocking)
Promise.resolve()
.then(() => sendPaymentStatusWebhook(payment))
.then(() => {
  logger.info("Payment creation webhook sent successfully", {
    userId,
    paymentUuid: payment.uuid,
    orderId: order.id,
  });
})
.catch((webhookError) => {
  logger.error("Failed to send payment creation webhook", {
    userId,
    paymentUuid: payment.uuid,
    orderId: order.id,
    error: webhookError.message,
  });
});


    return { order, payment };

     
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
        fee: (paymentDetails.fee || 0)/100,
        tax: (paymentDetails.tax || 0)/100,
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

      switch (payload.event) {
          case "payment.captured":
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
   
   

    const updatedPayment = await paymentRepository.updatePaymentByOrderId(
      paymentDetails.order_id,
      updates
    );
    

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
    
    }

  
    res.status(200).json({ success: true });
    // res.on("finish", async () => {
    //   try {
    //     const webhookService = new WebhookService();
    //     const webhookRepository = new WebhookRepository();
  
    //     // Check if a successful webhook has already been sent for this order
    //     const existingSuccessfulWebhook = await webhookRepository.findByOrderIdAndStatus(
    //       updatedPayment.uuid, 
    //       'SUCCESS'
    //     );
  
    //     if (existingSuccessfulWebhook) {
    //       logger.info("Webhook already successfully sent for this order, skipping", {
    //         orderId: updatedPayment.order_id,
    //         existingWebhookId: existingSuccessfulWebhook.id
    //       });
    //       return;
    //     }
        
    //     // Use updatedPayment instead of fetching fresh data
    //     console.log("******************************* Webhook Data *******************************");
    //     console.log(JSON.stringify(updatedPayment, null, 2));
    //     logger.info("payload   data ",JSON.stringify(updatedPayment));
    //     console.log("***************************************************************************");
  
  
    //     const payload = webhookService.preparePayload(updatedPayment)
    //     console.log(payload,'from the webhook')
    //     const signature = webhookService.generateSignature(payload);
  
    //     const log = await webhookRepository.create({
    //       payment_uuid: updatedPayment.uuid,
    //       webhook_url: webhookService.WEBHOOK_URL,
    //       payload,
    //       signature,
    //       status: "PENDING",
    //       attempt_count: 0,
    //       max_attempts: 5,
    //       next_retry_at: new Date()
    //     });
  
    //     await webhookService.attemptWebhook(log.id, payload, signature);
    //   } catch (err) {
    //     logger.error("Failed to queue + send webhook", { error: err.message });
    //   }
    // });
    res.on("finish", async () => {
      try {
        const webhookService = new WebhookService();
        const webhookRepository = new WebhookRepository();
  
        // ✅ FIX: Always fetch fresh payment data from DB to avoid stale data
        console.log("🔄 FETCHING FRESH PAYMENT DATA FROM DB...");
        console.log("Order ID:", paymentDetails.order_id);
        
        const freshPaymentData = await paymentRepository.findByOrderId(paymentDetails.order_id);
        
        console.log("✅ FRESH PAYMENT DATA FETCHED");
        console.log("freshPaymentData exists:", !!freshPaymentData);
        
        if (freshPaymentData) {
          console.log("📊 DATABASE PAYMENT RECORD:");
          console.log("UUID:", freshPaymentData.uuid);
          console.log("Order ID:", freshPaymentData.order_id);
          console.log("Transaction Status:", freshPaymentData.transaction_status);
          console.log("Payment Verified:", freshPaymentData.payment_verified);
          console.log("Payment ID:", freshPaymentData.payment_id);
          console.log("Amount:", freshPaymentData.amount);
          console.log("Currency:", freshPaymentData.currency);
          console.log("Plan:", freshPaymentData.plan);
          console.log("User ID:", freshPaymentData.userId);
          console.log("Created At:", freshPaymentData.createdAt);
          console.log("Updated At:", freshPaymentData.updatedAt);
          
          logger.info("Fresh payment data from DB", {
            uuid: freshPaymentData.uuid,
            orderId: freshPaymentData.order_id,
            transactionStatus: freshPaymentData.transaction_status,
            paymentVerified: freshPaymentData.payment_verified,
            paymentId: freshPaymentData.payment_id,
            amount: freshPaymentData.amount,
            createdAt: freshPaymentData.createdAt,
            updatedAt: freshPaymentData.updatedAt
          });
        }
        
        if (!freshPaymentData) {
          console.log("❌ PAYMENT NOT FOUND IN DATABASE!");
          logger.error("Payment not found when sending webhook", { orderId: paymentDetails.order_id });
          return;
        }
  
        console.log("🔍 CHECKING FOR EXISTING SUCCESSFUL WEBHOOK...");
        // Check if a successful webhook has already been sent for this order
        const existingSuccessfulWebhook = await webhookRepository.findByUuidAndStatus(
          freshPaymentData.uuid, 
          'SUCCESS'
        );
        
        console.log("Existing successful webhook:", existingSuccessfulWebhook ? "FOUND" : "NOT FOUND");
        if (existingSuccessfulWebhook) {
          console.log("Webhook ID:", existingSuccessfulWebhook.id);
          console.log("Skipping webhook send - already successful");
        }
  
        if (existingSuccessfulWebhook) {
          logger.info("Webhook already successfully sent for this order, skipping", {
            orderId: freshPaymentData.order_id,
            existingWebhookId: existingSuccessfulWebhook.id
          });
          return;
        }
        
        console.log("📤 PREPARING WEBHOOK PAYLOAD...");
        // ✅ Use fresh payment data instead of stale updatedPayment
        console.log("******************************* Fresh Webhook Data *******************************");
        console.log(JSON.stringify(freshPaymentData, null, 2));
        logger.info("Fresh payload data", JSON.stringify(freshPaymentData));
        console.log("***************************************************************************");
  
        try {
          console.log("🔧 Preparing webhook payload...");
          const payload = webhookService.preparePayload(freshPaymentData);
          console.log("✅ Payload prepared successfully");
          console.log("📋 WEBHOOK PAYLOAD:");
          console.log(JSON.stringify(payload, null, 2));
          
          console.log("🔐 Generating webhook signature...");
          const signature = webhookService.generateSignature(payload);
          console.log("✅ Signature generated:", signature.substring(0, 20) + "...");
  
          console.log("💾 Creating webhook log in database...");
          const log = await webhookRepository.create({
            payment_uuid: freshPaymentData.uuid,
            webhook_url: webhookService.WEBHOOK_URL,
            payload,
            signature,
            status: "PENDING",
            attempt_count: 0,
            max_attempts: 5,
            next_retry_at: new Date()
          });
          
          console.log("✅ Webhook log created with ID:", log.id);
          logger.info("Webhook log created", { 
            webhookLogId: log.id,
            paymentUuid: freshPaymentData.uuid,
            webhookUrl: webhookService.WEBHOOK_URL
          });

          console.log("📡 Attempting to send webhook...");
          console.log("Webhook URL:", webhookService.WEBHOOK_URL);
          console.log("Payment UUID:", freshPaymentData.uuid);
          console.log("Transaction Status in payload:", payload.TransactionStatus);
          
          await webhookService.attemptWebhook(log.id, payload, signature);
          
          console.log("✅ Webhook attempt completed");
          
        } catch (webhookCreateError) {
          console.log("❌ WEBHOOK CREATION/ATTEMPT FAILED!");
          console.log("Error:", webhookCreateError.message);
          logger.error("Failed to create webhook log", { 
            error: webhookCreateError.message,
            paymentUuid: freshPaymentData.uuid,
            stack: webhookCreateError.stack
          });
        }
      } catch (err) {
        console.log("❌ CRITICAL WEBHOOK ERROR!");
        console.log("Error:", err.message);
        logger.error("Failed to queue + send webhook", { 
          error: err.message,
          stack: err.stack
        });
      }
    });
  } catch (error) {
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
    
    // Send webhook notification to root server
    try {
      const webhookService = new WebhookService();
      await webhookService.sendWebhook(response);
      logger.info("Webhook notification sent for cancelled payment", { orderId, paymentUuid: response.uuid });
    } catch (webhookError) {
      logger.error("Failed to send webhook notification for cancelled payment", { 
        orderId, 
        paymentUuid: response.uuid, 
        error: webhookError.message 
      });
      // Don't fail the cancellation if webhook fails
    }
    
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


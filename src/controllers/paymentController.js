
const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');
const {PaymentService}= require("../services")
 const {logger} = require("../config")

 async function createPayment(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
       const {plan , userData }= req.body;
         logger.info('Create Payment request received', { ip, body: req.body });
      try{
        if (!plan || !userData) {
      ErrorResponse.message = 'Missing data';
      ErrorResponse.error = 'Missing required fields: plan or userData';
      logger.warn('Payment creation failed - missing data', { ip, body: req.body });
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }


           const response = await PaymentService.createPayment(req.body);
            SuccessResponse.data = response.order;
              SuccessResponse.message = 'Payment created successfully';
              logger.info('Payment created successfully', { ip, orderId: response.order.id });

              return res.status(StatusCodes.OK).json(SuccessResponse);

      }catch(error){
       ErrorResponse.error = error.explanation || 'Something went wrong';
    ErrorResponse.message = 'Payment creation failed';
    logger.error('Payment creation error', { ip, error: error.message, stack: error.stack });

    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ErrorResponse);
      }
 }


 async function verifyPayment(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger.info('Verify payment request received', { ip, body: req.body });
   try{
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
   if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      ErrorResponse.message = 'Missing required signature fields';
      logger.warn('Payment verification failed - missing signature', { ip, body: req.body });
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

       const response = await PaymentService.verifyPayment(req.body);
   
    if (response.success) {
      SuccessResponse.message = response.message;
      SuccessResponse.data = response.payment;
      logger.info('Payment verified successfully', { ip, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } else {
      ErrorResponse.message = response.message;
      ErrorResponse.data = response.payment;
      logger.warn('Payment verification failed', { ip, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

   }catch(error){
   ErrorResponse.error = error.explanation || 'Something went wrong';
    logger.error('Error during payment verification', { ip, error: error.message, stack: error.stack });
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
   }
}
async function paymentWebhook(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      logger.info('Payment webhook received', { ip, body: req.body });
   try{
       await PaymentService.paymentWebhook(req, res);
           logger.info('Webhook processed successfully', { ip });
   }catch(error){
    logger.error("Webhook controller error", { error: error.message, stack: error.stack });
    ErrorResponse.error = error.explanation || 'Something went wrong';
    return  res
                .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse)
   }
}

 async function cancelPayment(req, res) {
  
   try{
      const {orderId}= req.body;
      if(!orderId){
          ErrorResponse.message="Order Id Missing"
          ErrorResponse.error="Order id is missing"
        return res
                 .status(StatusCodes.BAD_REQUEST)
                 .json(ErrorResponse)


      }
      logger.info("payment cancelled for  this order ",orderId)
       const response = await PaymentService.cancelPayment(orderId);
       SuccessResponse.data = response;
        return res
                 .status(StatusCodes.OK)
                 .json(SuccessResponse)

   }catch(error){
  logger.error('Webhook controller error', { ip, error: error.message, stack: error.stack });
    ErrorResponse.error = error.explanation || 'Something went wrong';
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ErrorResponse);
   }
}

 module.exports={
    createPayment,
    verifyPayment,
    paymentWebhook,
     cancelPayment,

 }

const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');
const {PaymentService}= require("../services")
 const {logger} = require("../config")

 async function createPayment(req, res) {
      try{
         
       const {plan , userData }= req.body;
        if(!plan, !userData){
          
         ErrorResponse.message="Missing Data ";
         ErrorResponse.error="Missing Data "
         return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse)
        }

           const response = await PaymentService.createPayment(req.body);
           SuccessResponse.data = response.order;
           return res 
                    .status(StatusCodes.OK)
                    .json(SuccessResponse)

      }catch(error){
       ErrorResponse.error = error.explanation || 'Something went wrong';
       return  res
                   .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                   .json(ErrorResponse)
      }
 }


 async function verifyPayment(req, res) {
   try{


  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
    ErrorResponse.message="Missing Signature "
    return res 
            .status(StatusCodes.BAD_REQUEST)
            .json(ErrorResponse)
  }

         
       const response = await PaymentService.verifyPayment(req.body);
      if (response.success) {
      SuccessResponse.message = response.message;
      SuccessResponse.data = response.payment;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } else {
      ErrorResponse.message = response.message;
      ErrorResponse.data = response.payment;
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

   }catch(error){
    ErrorResponse.error = error.explanation || 'Something went wrong';
    return  res
                .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse)
   }
}
async function paymentWebhook(req, res) {
   try{
       await PaymentService.paymentWebhook(req, res);
     
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
    ErrorResponse.error = error.explanation || 'Something went wrong';
    return  res
                .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse)
   }
}

 module.exports={
    createPayment,
    verifyPayment,
    paymentWebhook,
     cancelPayment,

 }
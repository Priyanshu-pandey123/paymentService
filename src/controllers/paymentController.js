
const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');
const {PaymentService}= require("../services")
 const {logger} = require("../config")

 async function createPayment(req, res) {
      try{

        console.log("in  the controller")

            
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

    logger.info("payment  verify hit")

         
       const response = await PaymentService.verifyPayment(req.body);
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
async function paymentWebhook(req, res) {

   console.log("webhook is called")

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

 module.exports={
    createPayment,
    verifyPayment,
    paymentWebhook

 }
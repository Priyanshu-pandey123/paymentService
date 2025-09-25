
const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');
const {PaymentDashService}= require("../services")
 const {logger} = require("../config")


 async function getAllPayment(req, res) {
      try{


     
           const response = await PaymentDashService.getAllPayment();
    
           SuccessResponse.data = response;
           return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse)

      }catch(error){
       ErrorResponse.error = error.explanation || 'Something went wrong';
       console.log(error)
       return  res
                   .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                   .json(ErrorResponse)
      }
 }
  async function getPaymentByUserId(req, res) {

      try{            
        const { id, status } = req.query;
        console.log(id, status, " from the controller")
           const response = await PaymentDashService.getPaymentByUserId({id,status});
          
           SuccessResponse.data = response;
           return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse)

      }catch(error){
       ErrorResponse.error = error.explanation || 'Something went wrong';
       console.log(error)
       return  res
                   .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                   .json(ErrorResponse)
      }
 }


  module.exports={
  getAllPayment,
  getPaymentByUserId

 }
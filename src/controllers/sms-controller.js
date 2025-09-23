
const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');

 const {logger} = require("../config")

 async function createSms(req, res) {
      try{

        

  
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




 module.exports={
  createSms
 }
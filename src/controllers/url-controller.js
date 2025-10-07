
const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');
 const {logger} = require("../config")
 const {UrlService}= require("../services")


 async function getEncryptedUrl(req, res) {
      try{

       const {email , name , contact, userId, domainName,ctclId} = req.body;
   
       if(!email || !name || !contact  || !userId || !domainName || !ctclId){

     console.log(req.body,'fromthe url controller ')


        ErrorResponse.message="Misssing Feild  all data  : email, name , contact, userId, domainName  needed "

        return res
                .status(StatusCodes.BAD_REQUEST)
                .json(ErrorResponse)
       }


        const response =await UrlService.generateUrl(req)

       
         
           SuccessResponse.message = "Suceessfully url generated";
           SuccessResponse.data={
             url:response
           } 
           return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse)

      }catch(error){
       ErrorResponse.error =  'Something went wrong';
       console.log(error)
       return  res
                   .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                   .json(ErrorResponse)
      }
 }
async function decodeUrl(req, res) {
      try{

       const {data, sig} = req.body;
       if(!data || !sig) {
        ErrorResponse.message="Hey  bro you are not get complete data  "

        return res
                .status(StatusCodes.BAD_REQUEST)
                .json(ErrorResponse)
       }


        const response =await UrlService.decodeUrl(data, sig)

       
         
           SuccessResponse.message = "Suceessfully Data Reterived";
           SuccessResponse.data={
             userData:response
           } 
           return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse)

      }catch(error){
       ErrorResponse.error = error.message;
       return  res
                   .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
                   .json(ErrorResponse)
      }
 }



  module.exports={
  getEncryptedUrl,
  decodeUrl
 }
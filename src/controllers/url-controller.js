
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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      try{

       const {data, sig} = req.body;
    logger.info("Decode URL request received", { ip, hasData: Boolean(data), hasSig: Boolean(sig) });

    if (!data || !sig) {
      ErrorResponse.message = "Incomplete data received";
      logger.warn("Decode URL failed - missing data or signature", { ip, body: req.body });
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
        const response =await UrlService.decodeUrl(data, sig)
           SuccessResponse.message = "Suceessfully Data Reterived";
           SuccessResponse.data={
             userData:response
           } 
         logger.info("Decode URL successful", { ip, userData: response?.userId || "N/A" });
           return res
                    .status(StatusCodes.OK)
                    .json(SuccessResponse)

      }catch(error){
        logger.error("Decode URL error", { ip, error: error.message, stack: error.stack });
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
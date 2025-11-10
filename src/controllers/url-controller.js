
const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');
 const {logger, amountConfig} = require("../config")
 const {UrlService}= require("../services")
 const { extractIP } = require("../utils/helpers/ip-helper")
 const AppError = require('../utils/errors/app-error');
const HttpStatusCode = require('http-status-codes');



 async function getEncryptedUrl(req, res) {
    const ip = extractIP(req);
    const {email, name, contact, userId, domainName, ctclId, plan,brokerId,amount, id} = req.body;
    
    logger.info('URL Generation request received', { 
        ip, 
        userId,
        domainName,
        ctclId,
        hasEmail: Boolean(email),
        hasName: Boolean(name),
        hasContact: Boolean(contact),
        userAgent: req.headers['user-agent']
    });
    
    try{
        if(!email || !name || !contact || !userId || !domainName || !ctclId || !plan || !brokerId || !amount || !id){
            logger.warn('URL Generation failed - missing fields', { 
                ip, 
                userId,
                missingFields: {
                    email: !email,
                    name: !name,
                    contact: !contact,
                    userId: !userId,
                    domainName: !domainName,
                    ctclId: !ctclId,
                    plan:!plan,
                    id:!id
                }
            });
            
            ErrorResponse.message="Missing Field: email, name, contact, userId,plan,brokerId, domainName,id needed"
            return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
        }
       

             if (amount > amountConfig.MAX_AMOUNT) {
           logger.error("Amount exceeds business limit", { amount, maxAmount: amountConfig.MAX_AMOUNT, ip });
           ErrorResponse.message=`Amount exceeds the maximum limit of ₹${amountConfig.MAX_AMOUNT}`;
           return res.status(HttpStatusCode.BAD_REQUEST).json(ErrorResponse)
          }
  
      if (amount <= amountConfig.MIN_AMOUNT) {
           logger.error("Amount below business minimum", { amount, minAmount: amountConfig.MIN_AMOUNT, ip });
           ErrorResponse.message=`Amount is below the minimum limit of ₹${amountConfig.MIN_AMOUNT}`;
           return res.status(HttpStatusCode.BAD_REQUEST).json(ErrorResponse)
      }


        const response = await UrlService.generateUrl(req);
        
        logger.info('URL Generation successful', { 
            ip, 
            userId,
            domainName,
            ctclId,
            urlGenerated: Boolean(response)
        });
        
        SuccessResponse.message = "Successfully URL generated";
        SuccessResponse.data = { url: response };
        
        return res.status(StatusCodes.OK).json(SuccessResponse);

    }catch(error){
        logger.error('URL Generation error', { 
            ip, 
            userId,
            domainName,
            ctclId,
            error: error.message, 
            stack: error.stack
        });
        
        ErrorResponse.error = 'Something went wrong';
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
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
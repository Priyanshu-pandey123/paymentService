
const {ErrorResponse,SuccessResponse}= require('../utils/common')
const { StatusCodes } = require('http-status-codes');
const {PaymentDashService}= require("../services")
const {logger} = require("../config")
const { extractIP } = require("../utils/helpers/ip-helper")

async function getAllPayment(req, res) {
    const ip = extractIP(req);
    const { limit, page } = req.query;
    
    logger.info('Dashboard: Get all payments request', { 
        ip, 
        limit: limit || 'default', 
        page: page || 'default',
        userAgent: req.headers['user-agent']
    });
    
    try{
        const response = await PaymentDashService.getAllPayment(limit, page);
        
        logger.info('Dashboard: Get all payments successful', { 
            ip, 
            recordCount: response?.length || 0,
            limit,
            page
        });
        
        SuccessResponse.data = response;
        return res.status(StatusCodes.OK).json(SuccessResponse);

    }catch(error){
        logger.error('Dashboard: Get all payments failed', { 
            ip, 
            error: error.message, 
            stack: error.stack,
            limit,
            page
        });
        
        ErrorResponse.error = error.explanation || 'Something went wrong';
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

async function getPaymentByUserId(req, res) {
    const ip = extractIP(req);
    const { userId } = req.query;
    
    logger.info('Dashboard: Get payments by user ID request', { 
        ip, 
        userId,
        userAgent: req.headers['user-agent']
    });

    try{            
        const response = await PaymentDashService.getPaymentByUserId(userId);
        
        logger.info('Dashboard: Get payments by user ID successful', { 
            ip, 
            userId,
            recordCount: response?.length || 0
        });
        
        SuccessResponse.data = response;
        return res.status(StatusCodes.OK).json(SuccessResponse);

    }catch(error){
        logger.error('Dashboard: Get payments by user ID failed', { 
            ip, 
            userId,
            error: error.message, 
            stack: error.stack
        });
        
        ErrorResponse.error = error.explanation || 'Something went wrong';
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

module.exports={
    getAllPayment,
    getPaymentByUserId
}
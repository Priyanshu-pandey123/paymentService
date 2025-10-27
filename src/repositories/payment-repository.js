
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const {Payment} = require("../models")
const CrudRepository = require('./crud-repository');
const {Enums} = require('../utils/common');
const {logger} = require('../config');

class PaymentRepository extends CrudRepository {
    constructor() {
        super(Payment);
    }
    
    async createPayment(data) {
        try {
            logger.info('Repository: Creating payment record', { 
                userId: data.userId,
                orderId: data.order_id,
                amount: data.amount,
                plan: data.plan
            });
            
            const payment = await Payment.create(data);
            
            logger.info('Repository: Payment record created', { 
                paymentId: payment.id,
                orderId: payment.order_id,
                userId: payment.userId
            });
            
            return payment;
        } catch(error) {
            logger.error('Repository: Payment creation failed', { 
                userId: data.userId,
                orderId: data.order_id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async findByUserId(userId){

        console.log(userId,'*&^%$#%^&*()*&^%$E%^&*(&^%$%^&*&^%$#%^&*(&^%$')
         try {
            logger.debug('Repository: Finding payment by user ID', { userId });
            const payment = await Payment.findOne({ where: { userId: userId } });
            return payment;
        } catch(error) {
            logger.error('Repository: Payment lookup failed', { 
                orderId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    async findByOrderId(orderId){
        try {
            logger.debug('Repository: Finding payment by order ID', { orderId });
            const payment = await Payment.findOne({ where: { order_id: orderId } });
            
            logger.debug('Repository: Payment lookup result', { 
                orderId, 
                found: Boolean(payment),
                paymentId: payment?.id
            });
            
            return payment;
        } catch(error) {
            logger.error('Repository: Payment lookup failed', { 
                orderId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async updatePaymentByOrderId(orderId, updates){
        try {
            logger.info('Repository: Updating payment by order ID', { 
                orderId, 
                updates: Object.keys(updates)
            });
            
            const payment = await this.findByOrderId(orderId);
            if(!payment) {
                logger.warn('Repository: Payment not found for update', { orderId });
                return null;
            }
            
            await payment.update(updates);
            
            logger.info('Repository: Payment updated successfully', { 
                orderId,
                paymentId: payment.id,
                status: updates.payment_status,
                verified: updates.payment_verified
            });
            
            return payment;
        } catch(error) {
            logger.error('Repository: Payment update failed', { 
                orderId,
                updates: Object.keys(updates),
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    async checkSuccessfulPaymentByUserId(userId) {
        try {
            logger.debug('Repository: Checking for successful payment by user ID', { userId });
            
            const existingPayment = await Payment.findOne({
                where: {
                    userId: userId,
                    transaction_status: 'SUCCESS'
                }
            });
            
            logger.debug('Repository: Successful payment check result', { 
                userId,
                hasSuccessfulPayment: Boolean(existingPayment),
                paymentId: existingPayment?.id
            });
            
            return existingPayment;
        } catch(error) {
            logger.error('Repository: Failed to check successful payment', { 
                userId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}



module.exports = PaymentRepository;



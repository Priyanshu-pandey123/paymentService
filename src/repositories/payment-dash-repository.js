
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const {Payment} = require("../models")
const CrudRepository = require('./crud-repository');
const {Enums} = require('../utils/common');
const {logger} = require('../config');

class PaymentDashRepository extends CrudRepository {
    constructor() {
        super(Payment);
    }
    
    async getAllPayment(limit = 20, page = 1) {
        try {
            // Validate and sanitize inputs
            limit = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Max 100 records per page
            page = Math.max(parseInt(page) || 1, 1);
            
            const offset = (page - 1) * limit;
            
            const { count, rows } = await Payment.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['raw_payload'] // Don't expose sensitive data
                },
              
            });

            const totalPayments = count;
            const totalPages = Math.ceil(count / limit);

            logger.info('Dashboard: Retrieved payments', {
                totalPayments,
                totalPages,
                currentPage: page,
                limit,
                recordsReturned: rows.length
            });

            return {
                totalPayments,
                totalPages,
                currentPage: page,
                limit,
                data: rows,
            };
        } catch(error) {
            logger.error('Dashboard: Error retrieving payments', {
                error: error.message,
                stack: error.stack,
                limit,
                page
            });
            throw error;
        }
    } 
    
    async getPaymentByUserId(userId) {
        try {
            // Validate userId format (should be UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
                logger.warn('Dashboard: Invalid userId format', { userId });
                return null;
            }

            const userPayments = await Payment.findAll({
                where: { 
                    userId,
                    payment_verified: 'YES' // Only show verified payments
                },
                order: [["createdAt", "DESC"]],
                attributes: {
                    exclude: ['raw_payload'] // Don't expose sensitive webhook data
                }
            });

            logger.info('Dashboard: Retrieved user payments', {
                userId,
                paymentsFound: userPayments.length
            });

            return userPayments;
        } catch(error) {
            logger.error('Dashboard: Error retrieving user payments', {
                userId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = PaymentDashRepository;

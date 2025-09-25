
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const {Payment} = require("../models")
const CrudRepository = require('./crud-repository');
const {Enums} = require('../utils/common');

class PaymentRepository extends CrudRepository {
    constructor() {
        super(Payment);
    }
    async createPayment(data) {
         const   payment = await Payment.create(data)
         return  payment;
       
    } 
    async findByOrderId(orderId){
        return await Payment.findOne({ where: { order_id: orderId } });
    }

    async updatePaymentByOrderId(orderId, updates){
        const payment = await this.findByOrderId(orderId);
        if(!payment) return null;
        await payment.update(updates);
        return payment;
    }
 
}

module.exports = PaymentRepository;

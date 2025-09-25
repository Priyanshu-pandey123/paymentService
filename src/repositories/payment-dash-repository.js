
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const {Payment} = require("../models")
const CrudRepository = require('./crud-repository');
const {Enums} = require('../utils/common');

class PaymentDashRepository extends CrudRepository {
    constructor() {
        super(Payment);
    }
    async getAllPayment() {
         const   allPayment = await this.getAll()
         return  allPayment;
       
    } 
    async getPaymentByUserId(filters = {}) {
    const { id, status } = filters;
     const whereCondition = {};
    if (id) whereCondition.id = id;
    if (status) whereCondition.payment_status = status;
    const userPayments = await Payment.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    return userPayments;
  }
  


 
}

module.exports = PaymentDashRepository;

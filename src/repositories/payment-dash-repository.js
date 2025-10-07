
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const {Payment} = require("../models")
const CrudRepository = require('./crud-repository');
const {Enums} = require('../utils/common');

class PaymentDashRepository extends CrudRepository {
    constructor() {
        super(Payment);
    }
    async getAllPayment(limit,page) {
         const   allPayment = await this.getAll(limit,page)
         return  allPayment;
       
    } 
    async getPaymentByUserId(userId) {


    const userPayments = await Payment.findOne({
      where: {userId},
      order: [["createdAt", "DESC"]],
    });

    return userPayments;
  }
  


 
}

module.exports = PaymentDashRepository;

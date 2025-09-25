
const {StatusCodes} = require('http-status-codes');

const {PaymentDashRepository}  = require('../repositories');

const db = require('../models');
const AppError = require('../utils/errors/app-error');





const paymentDashRepository=new PaymentDashRepository();




async function getAllPayment() {

    try {
      

      const response =await paymentDashRepository.getAllPayment(); 

 
      return  response;
       
    } catch(error) {
      console.log(error)
      throw error;
    }
    
}
async function getPaymentByUserId(filter) {
    try {

      const response =await paymentDashRepository.getPaymentByUserId(filter); 
      
      return  response;
       
    } catch(error) {
      console.log(error)
      throw error;
    }
    
}




module.exports = {
getAllPayment,
getPaymentByUserId
}

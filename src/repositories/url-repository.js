
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const {Payment} = require("../models")
const CrudRepository = require('./crud-repository');
const {Enums} = require('../utils/common');

class UrlRepository extends CrudRepository {
    constructor() {
        super(Payment);
    }
      async createUserData(data) {


         const {userId, domainName,contact,email ,name}= data
         const   response  = await this.create({
            userId,
            contact,
            name,
            email,
             userDomainUrl:domainName
         })
         return  response;
       
    } 
 
  


 
}

module.exports = UrlRepository;

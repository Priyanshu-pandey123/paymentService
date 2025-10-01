const { StatusCodes } = require('http-status-codes');

const { Logger } = require('../config');
const AppError = require('../utils/errors/app-error');

class CrudRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        const response = await this.model.create(data);
        return response;
    }

    async destroy(data) {
        const response = await this.model.destroy({
            where: {
                id: data
            }
        });
        if(!response) {
            throw new AppError('Not able to fund the resource', StatusCodes.NOT_FOUND);
        }
        return response;
    }

 async getAll(limit=20,page=1) {
  limit = Number(limit);
  page = Number(page);
  const offset = (page - 1) * limit;
  const { count, rows } = await this.model.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  const totalPayments = count;
  const totalPages = Math.ceil(count / limit);



  return {
    totalPayments,
    totalPages,
    currentPage: page,
    limit,
    data: rows,
  };
}


    async update(id, data) { 
        const response = await this.model.update(data, {
            where: {
                id: id
            }
        })
        return response;
    }
}

module.exports = CrudRepository;
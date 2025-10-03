'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Payment extends Model {
    static associate(models) {
    
    }
  }

  Payment.init(
    {

       uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false,
        primaryKey: true
      },

        userId:{
       type: DataTypes.UUID,
        allowNull: false,
       
      },
        userDomainUrl: {
        type: DataTypes.STRING(350),
        allowNull: false,
        validate: {
          isUrl: true   
        }
      },
      ctlId:{
          type: DataTypes.STRING(100),
           allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
          plan: {
        type: DataTypes.ENUM('STARTER', 'GROWTH', 'PRO', 'ELITE'),
        allowNull: false,
        defaultValue: 'STARTER',
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      contact: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      order_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      payment_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      method: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      vpa: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      fee: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
      },
      tax: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
      },
      payment_verified: {
        type: DataTypes.ENUM('YES', 'NO'),
        allowNull: false,
        defaultValue: 'NO'
      },
      payment_status: {
        type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED','CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      acquirer_data: {
        type: DataTypes.JSON, 
        allowNull: true
      },
      notes: {
        type: DataTypes.JSON,
        allowNull: true
      },
      raw_payload: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      }
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: true
    }
  );

  return Payment;
};

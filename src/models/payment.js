'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Payment extends Model {
    static associate(models) {
      // Example: Payment.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  Payment.init(
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
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
        allowNull: false
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
        type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
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

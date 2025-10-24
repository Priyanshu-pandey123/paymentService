'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Payment extends Model {
    static associate(models) {
      // Define associations here if needed
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      userDomainUrl: {
        type: DataTypes.STRING(350),
        allowNull: false,
        validate: {
          isUrl: true
        }
      },
      ctclId: {
        type: DataTypes.STRING(36),
        allowNull: true
      },
      brokerId: {
        type: DataTypes.STRING(36),
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      plan: {
        type: DataTypes.ENUM('STARTER', 'GROWTH', 'PRO', 'ELITE'),
        allowNull: false,
        defaultValue: 'STARTER'
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
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Payment gateway & status
      payment_gateway: {
        type: DataTypes.ENUM('RAZORPAY'),
        allowNull: false,
        defaultValue: 'RAZORPAY'
      },
      transaction_status: {
        type: DataTypes.ENUM('INITIATED', 'PENDING', 'CANCELLED', 'SUCCESS', 'FAILED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'INITIATED'
      },
      payment_verified: {
        type: DataTypes.ENUM('YES', 'NO'),
        allowNull: false,
        defaultValue: 'NO'
      },
      payment_method: {
        type: DataTypes.STRING(50),
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

      // Optional/extra payment info
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
      },

      // Meta & tracking
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      payment_attempted_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      pg_webhook_received_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      logged: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      logged_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      redirected_to_broker: {
        type: DataTypes.TINYINT,
        allowNull: true
      },
      timestamp_for_redirected_to_broker: {
        type: DataTypes.DATE,
        allowNull: true
      },
      webhook_called: {
        type: DataTypes.TINYINT,
        allowNull: true
      },
      timestamp_webhook_called: {
        type: DataTypes.DATE,
        allowNull: true
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

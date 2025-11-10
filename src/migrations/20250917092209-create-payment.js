'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userDomainUrl: {
        type: Sequelize.STRING(350),
        allowNull: false,
        validate: {
          isUrl: true
        }
      },
      
      ctclId: {
        type: Sequelize.STRING(36), 
        allowNull: false
      },
      brokerId: {
        type: Sequelize.STRING(36),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      plan: {
        type: Sequelize.ENUM('STARTER', 'GROWTH', 'PRO', 'ELITE'),
        allowNull: false,
        defaultValue: 'STARTER'
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      contact: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'INR'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Payment gateway & status
      payment_gateway: {
        type: Sequelize.ENUM('RAZORPAY'),
        allowNull: false,
        defaultValue: 'RAZORPAY'
      },
      transaction_status: {
        type: Sequelize.ENUM('INITIATED', 'PENDING', 'CANCELLED', 'SUCCESS', 'FAILED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'INITIATED'
      },
      payment_verified: {
        type: Sequelize.ENUM('YES', 'NO'),
        allowNull: false,
        defaultValue: 'NO'
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: false,
        index: true
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },

      // Optional/extra payment info
      vpa: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      fee: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      tax: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      acquirer_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      notes: {
        type: Sequelize.JSON,
        allowNull: true
      },
      raw_payload: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      is_plan_valid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      defaultValue: false

      },
      plan_valid_till: {
        type: Sequelize.DATE,
        allowNull: true 
      },


      // Meta & Tracking
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      payment_attempted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      pg_webhook_received_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      logged: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      logged_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      redirected_to_broker: {
        type: Sequelize.TINYINT,
        allowNull: true
      },
      timestamp_for_redirected_to_broker: {
        type: Sequelize.DATE,
        allowNull: true
      },
      webhook_called: {
        type: Sequelize.TINYINT,
        allowNull: true
      },
      timestamp_webhook_called: {
        type: Sequelize.DATE,
        allowNull: true
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};

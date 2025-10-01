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

      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
        plan: {
      type: Sequelize.ENUM('STARTER', 'GROWTH', 'PRO', 'ELITE'),
      allowNull: false,
      defaultValue: 'STARTER',
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
        type: Sequelize.STRING(10),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: true,
        index: true
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      method: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
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
      payment_verified: {
        type: Sequelize.ENUM('YES', 'NO'),
        allowNull: false,
        defaultValue: 'NO'
      },
      payment_status: {
        type: Sequelize.ENUM('PENDING', 'SUCCESS', 'FAILED',"CANCELLED"),
        allowNull: false,
        defaultValue: 'PENDING'
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

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};

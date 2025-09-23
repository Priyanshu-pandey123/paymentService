'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
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
        type: Sequelize.ENUM('PENDING', 'SUCCESS', 'FAILED'),
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

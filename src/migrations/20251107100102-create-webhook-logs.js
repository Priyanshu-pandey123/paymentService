'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('webhook_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      payment_uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true, 
        references: {
          model: 'payments',
          key: 'uuid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      webhook_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      payload: {
        type: Sequelize.JSON, 
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'SUCCESS', 'FAILED', 'RETRYING'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      attempt_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      max_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
      },
      last_attempt_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response_status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'HTTP status code from webhook endpoint'
      },
      response_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Response from webhook endpoint'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      signature: {
        type: Sequelize.STRING(200),
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

    // Add indexes for performance
    await queryInterface.addIndex('webhook_logs', ['payment_uuid']);
    await queryInterface.addIndex('webhook_logs', ['status']);
    await queryInterface.addIndex('webhook_logs', ['next_retry_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('webhook_logs');
  }
};

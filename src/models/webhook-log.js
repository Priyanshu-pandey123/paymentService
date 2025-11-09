'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WebhookLog extends Model {
    static associate(models) {
      WebhookLog.belongsTo(models.Payment, {
        foreignKey: 'payment_order_id',
        targetKey: 'order_id',
        as: 'payment'
      });
    }
  }

  WebhookLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      payment_order_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      webhook_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'RETRYING'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      attempt_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      max_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      last_attempt_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      next_retry_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      response_status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      response_data: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'WebhookLog',
      tableName: 'webhook_logs',
      timestamps: true,
    }
  );

  return WebhookLog;
};

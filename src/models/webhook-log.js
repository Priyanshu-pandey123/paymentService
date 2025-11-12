'use strict';
const { Model, DataTypes } = require('sequelize');
const TimezoneHelper = require('../utils/helpers/timezone-helpers');

module.exports = (sequelize) => {
  class WebhookLog extends Model {
    static associate(models) {
      WebhookLog.belongsTo(models.Payment, {
        foreignKey: 'payment_uuid',
        targetKey: 'uuid',
        as: 'payment'
      });
    }

    // Getter methods for IST timestamps
    get createdAtIST() {
      return TimezoneHelper.formatIST(this.createdAt, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
    }

    get updatedAtIST() {
      return TimezoneHelper.formatIST(this.updatedAt, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
    }

    // Override toJSON to return IST timestamps
    toJSON() {
      const values = { ...this.get() };
      
      // Convert timestamp fields to IST format
      const timestampFields = ['last_attempt_at', 'next_retry_at'];
      
      timestampFields.forEach(field => {
        if (values[field]) {
          values[field] = TimezoneHelper.formatIST(values[field], 'YYYY-MM-DDTHH:mm:ss.SSSZ');
        }
      });

      // Ensure createdAt and updatedAt are in IST
      values.createdAt = this.createdAtIST;
      values.updatedAt = this.updatedAtIST;
      
      return values;
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
      payment_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'uuid'
        }
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
      
      // Override createdAt and updatedAt getters
      createdAt: {
        type: DataTypes.DATE,
        get() {
          const rawValue = this.getDataValue('createdAt');
          return rawValue ? TimezoneHelper.formatIST(rawValue, 'YYYY-MM-DDTHH:mm:ss.SSSZ') : null;
        }
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          const rawValue = this.getDataValue('updatedAt');
          return rawValue ? TimezoneHelper.formatIST(rawValue, 'YYYY-MM-DDTHH:mm:ss.SSSZ') : null;
        }
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

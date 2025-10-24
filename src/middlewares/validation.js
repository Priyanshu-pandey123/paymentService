const Joi = require('joi');
const { StatusCodes } = require('http-status-codes');
const { ErrorResponse } = require('../utils/common');
const { logger } = require('../config');

// Validation schemas
const schemas = {
  // Payment schemas
  createPayment: Joi.object({
    plan: Joi.string()
      .valid('STARTER', 'GROWTH', 'PRO', 'ELITE')
      .required()
      .messages({
        'any.required': 'Plan is required',
        'any.only': 'Plan must be one of: STARTER, growth, pro, elite'
      }),
    userData: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.empty': 'Name is required',
          'string.min': 'Name must be at least 2 characters',
          'string.max': 'Name must not exceed 100 characters'
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'string.empty': 'Email is required'
        }),
      contact: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
          'string.pattern.base': 'Contact must be a valid 10-digit Indian mobile number starting with 6-9',
          'string.empty': 'Contact is required'
        }),
      userId: Joi.string()
        .required()
        .messages({
          'string.empty': 'User ID is required'
        }),
      domainName: Joi.string()
        .required()
        .messages({
          'string.empty': 'Domain name is required'
        }),
      ctclId: Joi.string()
        .required()
        .messages({
          'string.empty': 'CTCL ID is required'
        })
    }).required().messages({
      'any.required': 'User data is required'
    })
  }),

  verifyPayment: Joi.object({
    razorpay_order_id: Joi.string()
      .required()
      .messages({
        'string.empty': 'Razorpay order ID is required'
      }),
    razorpay_payment_id: Joi.string()
      .required()
      .messages({
        'string.empty': 'Razorpay payment ID is required'
      }),
    razorpay_signature: Joi.string()
      .required()
      .messages({
        'string.empty': 'Razorpay signature is required'
      })
  }),

  cancelPayment: Joi.object({
    orderId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Order ID is required'
      })
  }),

  // Dashboard schemas
  getAllPayment: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      })
  }),

  getPaymentByUserId: Joi.object({
    userId: Joi.string()
      .required()
      .messages({
        'string.empty': 'User ID is required'
      })
  }),

  // URL schemas
  getEncryptedUrl: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 100 characters'
      }),
    contact: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': 'Contact must be a valid 10-digit Indian mobile number starting with 6-9',
        'string.empty': 'Contact is required'
      }),
    userId: Joi.string()
      .required()
      .messages({
        'string.empty': 'User ID is required'
      }),
    domainName: Joi.string()
      .required()
      .messages({
        'string.empty': 'Domain name is required'
      }),
    ctclId: Joi.string()
      .required()
      .messages({
        'string.empty': 'CTCL ID is required'
      }),
      plan: Joi.string()
      .valid('STARTER', 'growth', 'pro', 'elite')
      .required()
      .messages({
        'any.required': 'Plan is required',
        'any.only': 'Plan must be one of: STARTER, growth, pro, elite'
      }),
    brokerId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Broker ID is required'
      })
  }),

  decodeUrl: Joi.object({
    data: Joi.string()
      .required()
      .messages({
        'string.empty': 'Data is required'
      }),
    sig: Joi.string()
      .required()
      .messages({
        'string.empty': 'Signature is required'
      })
  })
};

// Validation middleware function
const validate = (schemaName) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`, { ip });
      ErrorResponse.message = 'Validation configuration error';
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }

    // Determine where to validate based on HTTP method
    let dataToValidate;
    if (req.method === 'GET') {
      dataToValidate = req.query;
    } else {
      dataToValidate = req.body;
    }

    const { error, value } = schema.validate(dataToValidate, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      logger.warn(`Validation failed for ${schemaName}`, { 
        ip, 
        errors: errorMessages,
        data: dataToValidate 
      });
      
      ErrorResponse.message = 'Validation failed';
      ErrorResponse.error = errorMessages;
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    // Update req with validated data
    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }

    logger.info(`Validation passed for ${schemaName}`, { ip });
    next();
  };
};

module.exports = { validate };

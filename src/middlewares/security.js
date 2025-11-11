const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger } = require('../config');

// Rate limiting configurations
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      logger.warn('Rate limit exceeded', {
        ip,
        url: req.url,
        userAgent: req.headers['user-agent'],
        limit: max,
        windowMs: windowMs
      });
      res.status(429).json({ error: message });
    }
  });
};

// Different rate limits for different endpoints
const paymentLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many payment requests, please try again later');
const dashboardLimiter = createLimiter(30 * 60 * 1000, 300, 'Too many dashboard requests, please try again later'); 
const generalLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later');

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potential script tags and other dangerous content
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = sanitizeObject(obj[key]);
        }
      }
    } else if (typeof obj === 'string') {
      return sanitizeValue(obj);
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

// SQL injection detection middleware
const detectSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\#)|(\\x23)|(\-\-)|(\;)|(\%3B)|(\%27)|(\%22)|(\%2D\\x2D))/i,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /(\bEXEC\b|\bEXECUTE\b|\bXP_CMDSHELL\b|\bSP_EXECUTESQL\b)/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (checkObject(obj[key])) return true;
        }
      }
    } else if (typeof obj === 'string') {
      return checkValue(obj);
    }
    return false;
  };

  const hasSQLInjection = 
    checkObject(req.body) || 
    checkObject(req.query) || 
    checkObject(req.params);

  if (hasSQLInjection) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger.warn('Potential SQL injection detected', {
      ip,
      url: req.url,
      userAgent: req.headers['user-agent'],
      body: req.body,
      query: req.query,
      params: req.params
    });
    return res.status(400).json({ 
      error: 'Invalid input detected. Request blocked for security reasons.' 
    });
  }

  next();
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<input\b[^<]*(?:(?!<\/input>)<[^<]*)*<\/input>/gi
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (checkObject(obj[key])) return true;
        }
      }
    } else if (typeof obj === 'string') {
      return checkValue(obj);
    }
    return false;
  };

  const hasXSS = 
    checkObject(req.body) || 
    checkObject(req.query) || 
    checkObject(req.params);

  if (hasXSS) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger.warn('Potential XSS attack detected', {
      ip,
      url: req.url,
      userAgent: req.headers['user-agent'],
      body: req.body,
      query: req.query,
      params: req.params
    });
    return res.status(400).json({ 
      error: 'Invalid input detected. Request blocked for security reasons.' 
    });
  }

  next();
};

// Request size limiting
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);
  const maxSize = 1024 * 1024; // 1MB limit

  if (contentLength && contentLength > maxSize) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger.warn('Request size limit exceeded', {
      ip,
      url: req.url,
      contentLength,
      maxSize
    });
    return res.status(413).json({ 
      error: 'Request too large' 
    });
  }

  next();
};

module.exports = {
  helmet,
  paymentLimiter,
  dashboardLimiter,
  generalLimiter,
  sanitizeInput,
  detectSQLInjection,
  xssProtection,
  requestSizeLimit
};

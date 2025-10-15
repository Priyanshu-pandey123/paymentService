
const { logger } = require('../config');
const { logUserActivity } = require('../utils/helpers/user-activity-logger');

const logRequest = (req, res, next) => {
  const startTime = Date.now();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.connection.remoteAddress ||
             req.socket.remoteAddress ||
             req.ip ||
             'unknown';

  // Extract user data from request if available
  const userData = extractUserDataFromRequest(req);

  // Log request start with user context
  logger.info(`🌐 REQUEST: ${req.method} ${req.originalUrl}`, {
    requestId: generateRequestId(),
    ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    userId: userData?.userId || 'anonymous',
    email: userData?.email || 'N/A',
    sessionId: req.headers['x-session-id'] || 'N/A',
    timestamp: new Date().toISOString(),
    body: sanitizeRequestBody(req.body), // Remove sensitive data
    query: req.query,
    params: req.params
  });

  // Log user activity if user data is available
  if (userData?.userId) {
    logUserActivity('PAGE_ACCESS', {
      ...userData,
      ip,
      action: `${req.method} ${req.originalUrl}`,
      sessionId: req.headers['x-session-id']
    });
  }

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const responseData = parseResponseData(data);

    logger.info(`✅ RESPONSE: ${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      requestId: generateRequestId(),
      ip,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? Buffer.byteLength(data.toString()) : 0,
      userId: userData?.userId || 'anonymous',
      success: res.statusCode < 400,
      responseType: getResponseType(data),
      timestamp: new Date().toISOString()
    });

    originalSend.call(this, data);
  };

  next();
};

// Helper functions
function extractUserDataFromRequest(req) {
  // Try to extract user data from various places
  const body = req.body || {};
  const userData = body.userData || body.user || {};

  return {
    userId: userData.userId || userData.id || req.headers['x-user-id'],
    email: userData.email || req.headers['x-user-email'],
    name: userData.name,
    contact: userData.contact,
    domainName: userData.domainName,
    ctclId: userData.ctclId
  };
}

function sanitizeRequestBody(body) {
  if (!body) return body;

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'razorpay_signature'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function parseResponseData(data) {
  try {
    return JSON.parse(data.toString());
  } catch {
    return { raw: true, size: data?.length || 0 };
  }
}

function getResponseType(data) {
  try {
    const parsed = JSON.parse(data.toString());
    if (parsed.success !== undefined) return 'api_response';
    if (parsed.error) return 'error_response';
    return 'data_response';
  } catch {
    return 'raw_response';
  }
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = logRequest;

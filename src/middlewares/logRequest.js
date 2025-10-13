
const {logger} = require('../config'); 

const logRequest = (req, res, next) => {
  const startTime = Date.now();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             req.ip || 
             'unknown';
  
  // Log request start
  logger.info('Request started', { 
    ip,
    method: req.method, 
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    timestamp: new Date().toISOString()
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      ip,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? Buffer.byteLength(data.toString()) : 0,
      timestamp: new Date().toISOString()
    });
    
    originalSend.call(this, data);
  };

  next();
};

module.exports = logRequest;


const {logger} = require('../config'); 
const logRequest = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const date = new Date().toISOString(); 
  logger.info(`Incoming request from IP: ${ip}`, { date, method: req.method, url: req.originalUrl });
  next();
};

module.exports = logRequest;

function extractIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip || 
         'unknown';
}

module.exports = { extractIP };

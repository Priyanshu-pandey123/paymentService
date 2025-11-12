const { createLogger, format, transports } = require("winston");
const path = require("path");
const logFilePath = path.resolve(__dirname, "../../payment.log");
const logger = createLogger({
  level: "info", 
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    // Remove colorize() since it's not needed for file logs
    format.printf(({ timestamp, level, message, ...meta }) => {
      let log = `[${timestamp}] [${level}]: ${message}`;
      if (Object.keys(meta).length) {
        // Safe JSON stringify that handles circular references
        const safeStringify = (obj) => {
          try {
            return JSON.stringify(obj);
          } catch (error) {
            // If circular reference error, create a safe version
            const safeObj = {};
            for (const key in obj) {
              try {
                JSON.stringify(obj[key]); // Test if serializable
                safeObj[key] = obj[key];
              } catch {
                safeObj[key] = '[Circular Reference]';
              }
            }
            return JSON.stringify(safeObj);
          }
        };
        log += ` | meta: ${safeStringify(meta)}`;
      }
      return log;
    })
  ),
  transports: [
    // Remove Console transport to stop terminal logging
    new transports.File({
      filename: logFilePath,
      level: "info",
      maxsize: 5 * 1024 * 1024, 
      maxFiles: 7, 
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: logFilePath })
  ],
  rejectionHandlers: [
    new transports.File({ filename: logFilePath })
  ]
});

module.exports = logger;

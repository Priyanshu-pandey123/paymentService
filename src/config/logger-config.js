const { createLogger, format, transports } = require("winston");
const path = require("path");

// Resolve log file to project root to avoid permission issues (was "/payment.log")
const logFilePath = path.resolve(__dirname, "../../payment.log");

const logger = createLogger({
  level: "info", // levels: error, warn, info, http, verbose, debug, silly
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.colorize(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      let log = `[${timestamp}] [${level}]: ${message}`;
      if (Object.keys(meta).length) {
        log += ` | meta: ${JSON.stringify(meta)}`;
      }
      return log;
    })
  ),
  transports: [
    new transports.Console({
      level: "info",
    }),
    new transports.File({
      filename: logFilePath,
      level: "info",
      maxsize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: 7, // keep last 7 rotated files
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

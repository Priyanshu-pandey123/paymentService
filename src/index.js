require('dotenv').config(); 
const express = require('express');
const cors = require("cors");
const { ServerConfig, logger } = require('./config');
const apiRoutes = require('./routes');
const { logRequest } = require('./middlewares');
const { testDatabaseConnection } = require("./config/dbConnect");
const {
  helmet,
  generalLimiter,
  sanitizeInput,
  detectSQLInjection,
  xssProtection,
  requestSizeLimit
} = require('./middlewares/security');

const app = express();
app.set('trust proxy', 1); 


logger.info('🔄 Starting server initialization...', { 
    port: ServerConfig.PORT,
    environment: process.env.NODE_ENV || 'development'
});

(async () => {
    const dbConnected = await testDatabaseConnection();
  
    if (!dbConnected) {
      logger.error(' Server startup aborted due to database connection failure', {
        port: ServerConfig.PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      });
      process.exit(1);
    }

    logger.info('All prerequisites check passed', {
        databaseConnected: true,
        timestamp: new Date().toISOString()
    });

    // Security middleware - order matters!
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    app.use(generalLimiter);
    app.use(logRequest);
    
    // CORS configuration with restrictions
    // app.use(cors({
    //   origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    //   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    //   credentials: true,
    //   maxAge: 86400 // 24 hours
    // }));

app.use(cors({
  origin: '*',           
  methods: '*',          
  allowedHeaders: '*',   
  credentials: false  
}));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Security middleware
    app.use(requestSizeLimit);
    app.use(sanitizeInput);
    app.use(detectSQLInjection);
    app.use(xssProtection);

    app.use('/api', apiRoutes);

    // Global error handler for security
    app.use((err, req, res, next) => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      logger.error('Unhandled error occurred', {
        ip,
        url: req.url,
        error: err.message,
        stack: err.stack
      });
      
      // Don't leak error details in production
      res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message 
      });
    });

    app.listen(ServerConfig.PORT, async (err) => {
        if (err) {
            logger.error(` Server failed to start on port ${ServerConfig.PORT}: ${err.message}`, { 
                port: ServerConfig.PORT,
                error: err.message,
                stack: err.stack
            });
            process.exit(1);
        }
        console.log(`Server is running successfully on port ${ServerConfig.PORT}`)
    });

})().catch((error) => {
    logger.error('Critical server startup error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    process.exit(1);
});

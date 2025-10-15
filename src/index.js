require('dotenv').config(); 
const express = require('express');
const cors = require("cors");
const { ServerConfig, logger } = require('./config');
const apiRoutes = require('./routes');
const {logRequest}= require('./middlewares')
const {testDatabaseConnection}= require("./config/dbConnect")

const app = express();

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

    app.use(logRequest);
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use('/api', apiRoutes);

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
        // logger.info(`Server is running successfully on port ${ServerConfig.PORT}`, { 
        //     port: ServerConfig.PORT,
        //     environment: process.env.NODE_ENV || 'development',
        //     corsEnabled: true,
        //     routesMounted: ['/api'],
        //     databaseConnected: true,
        //     timestamp: new Date().toISOString()
        // });
    });

})().catch((error) => {
    logger.error('Critical server startup error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    process.exit(1);
});

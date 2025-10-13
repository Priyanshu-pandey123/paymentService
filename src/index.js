const express = require('express');
const cors = require("cors");
const { ServerConfig, logger } = require('./config');
const apiRoutes = require('./routes');
const {logRequest}= require('./middlewares')

const app = express();

logger.info('Server initialization started', { 
    port: ServerConfig.PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
});

app.use(logRequest);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/api', apiRoutes);

app.listen(ServerConfig.PORT, async (err) => {
    if (err) {
        logger.error('Server failed to start', { 
            port: ServerConfig.PORT,
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    }
    
    logger.info('Server started successfully', { 
        port: ServerConfig.PORT,
        environment: process.env.NODE_ENV || 'development',
        corsEnabled: true,
        routesMounted: ['/api'],
        timestamp: new Date().toISOString()
    });
});

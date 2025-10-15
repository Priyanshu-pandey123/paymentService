const { Sequelize } = require('sequelize');
const logger = require('./logger-config'); // Keep for file logging

// Hardcoded DB credentials
const DB_USERNAME = 'root';
const DB_PASSWORD = 'rootpassword';
const DB_NAME = 'bull8payment'; // use DEV DB since NODE_ENV=development
const DB_HOST = '127.0.0.1';
const DB_DIALECT = 'mysql';
const DB_TIMEZONE = '+05:30';

// Initialize Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT,
  timezone: DB_TIMEZONE,
  logging: false, // disable raw SQL logs
});

// Test DB connection
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    // Show in terminal
    console.log(` Database connected successfully - ${DB_NAME}@${DB_HOST}`);
    
    // Also log to file
    logger.info(`Database connected successfully - ${DB_NAME}@${DB_HOST}`, {
      database: DB_NAME,
      host: DB_HOST,
      user: DB_USERNAME,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    // Show in terminal
    console.log(` Database connection failed - ${DB_NAME}@${DB_HOST}: ${error.message}`);
    
    // Also log to file
    logger.error(`Database connection failed - ${DB_NAME}@${DB_HOST}: ${error.message}`, {
      error: error.message,
      database: DB_NAME,
      host: DB_HOST,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

module.exports = { sequelize, testDatabaseConnection };

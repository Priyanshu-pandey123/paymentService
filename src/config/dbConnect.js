const { Sequelize } = require('sequelize');
const logger = require('./logger-config'); 
const dbConfig= require("./db-config");



const DB_TIMEZONE = '+05:30';

// Add defaults to prevent undefined values
const {DB_USERNAME = 'root', DB_PASSWORD = 'rootpassword', DB_NAME = 'bull8payment', DB_HOST = '127.0.0.1', DB_DIALECT = 'mysql'} = dbConfig;


const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
  timezone: DB_TIMEZONE,
  logging: false, 
});


async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();

    console.log(` Database connected successfully - ${DB_NAME}@${DB_HOST}`);
    

    logger.info(`Database connected successfully - ${DB_NAME}@${DB_HOST}`, {
      database: DB_NAME,
      host: DB_HOST,
      user: DB_USERNAME,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    
    console.log(` Database connection failed - ${DB_NAME}@${DB_HOST}: ${error.message}`);
    

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

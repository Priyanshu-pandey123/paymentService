const { Sequelize } = require('sequelize');
const logger = require('./logger-config'); 
const dbConfig= require("./db-config");



const DB_TIMEZONE = '+05:30';

const {DB_USERNAME, DB_PASSWORD, DB_NAME_PROD, DB_HOST,DB_DIALECT}=dbConfig;


const sequelize = new Sequelize(DB_NAME_PROD, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT,
  timezone: DB_TIMEZONE,
  logging: false, 
});


async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();

    console.log(` Database connected successfully - ${DB_NAME_PROD}@${DB_HOST}`);
    

    logger.info(`Database connected successfully - ${DB_NAME_PROD}@${DB_HOST}`, {
      database: DB_NAME_PROD,
      host: DB_HOST,
      user: DB_USERNAME,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    
    console.log(` Database connection failed - ${DB_NAME_PROD}@${DB_HOST}: ${error.message}`);
    

    logger.error(`Database connection failed - ${DB_NAME_PROD}@${DB_HOST}: ${error.message}`, {
      error: error.message,
      database: DB_NAME_PROD,
      host: DB_HOST,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

module.exports = { sequelize, testDatabaseConnection };

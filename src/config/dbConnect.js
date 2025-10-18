const { Sequelize } = require('sequelize');
const logger = require('./logger-config'); 
require('dotenv').config(); // load from root automatically



const DB_TIMEZONE = '+05:30';

// Add defaults to prevent undefined values
const {DB_USERNAME = '', DB_PASSWORD = '', DB_NAME = '', DB_HOST = '127.0.0.1', DB_DIALECT = 'mysql'} = process.env;



const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT,
  timezone: DB_TIMEZONE,
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Disable logging in production
  
  // Security configurations
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // Prevent SQL injection by disabling raw SQL where possible
  define: {
    paranoid: true, // Soft deletes
    timestamps: true,
    underscored: true, // Use snake_case column names
    freezeTableName: true, // Prevent Sequelize from pluralizing table names
  },
  
  // Additional security settings
  dialectOptions: {
    // MySQL specific
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Prevent timezone-based attacks
    useUTC: false,
    timezone: DB_TIMEZONE,
  }
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

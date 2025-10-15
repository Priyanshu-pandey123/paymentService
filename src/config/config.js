

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || "rootpassword",
    database: process.env.DB_NAME || 'bull8payment',
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  test: {
    username: process.env.DB_USERNAME  || 'root',
    password: process.env.DB_PASSWORD || "rootpassword",
    database: process.env.DB_NAME || 'bull8payment',
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  production: {
    username: process.env.DB_USERNAME  || 'root',
    password: process.env.DB_PASSWORD || "rootpassword",
    database: process.env.DB_NAME || 'bull8payment',
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
};

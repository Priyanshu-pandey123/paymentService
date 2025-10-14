// // config/config.js
// require('dotenv').config();

// module.exports = {
//   development: {
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME_DEV,
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT || 'mysql',
//     timezone: process.env.DB_TIMEZONE || '+05:30',
//   },
//   test: {
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME_TEST,
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT || 'mysql',
//     timezone: process.env.DB_TIMEZONE || '+05:30',
//   },
//   production: {
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME_PROD,
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT || 'mysql',
//     timezone: process.env.DB_TIMEZONE || '+05:30',
//   },
// };
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_DEV,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
};

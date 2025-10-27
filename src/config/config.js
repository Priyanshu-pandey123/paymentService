const path = require('path');
// require('dotenv').config({
//   path: path.resolve(__dirname, '../../.env'), // ✅ explicit path to root .env
// });

require('dotenv').config({
 path: path.resolve(__dirname, '../.env'),
});


module.exports = {
  development: {
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_DEV || '',
    host: process.env.DB_HOST || "",
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  test: {
    username: process.env.DB_USERNAME  || '',
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_DEV || '',
    host: process.env.DB_HOST || "",
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  production: {
    username: process.env.DB_USERNAME  || '',
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_DEV || '',
    host: process.env.DB_HOST || "",
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
};

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });



module.exports = {
  development: {
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_DEV || '',
    host: '127.0.0.1', // ✅ Hardcoded DB host
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  test: {
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_DEV || '',
    host: '127.0.0.1', // ✅ Hardcoded DB host
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
  production: {
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_DEV || '',
    host: '127.0.0.1', // ✅ Hardcoded DB host
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+05:30',
  },
};

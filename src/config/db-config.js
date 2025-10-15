const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD:process.env.DB_PASSWORD,
    DB_NAME:process.env.DB_NAME,
    DB_HOST:process.env.DB_HOST,
    DB_DIALECT:process.env.DB_DIALECT
}
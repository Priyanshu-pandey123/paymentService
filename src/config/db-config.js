const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD:process.env.DB_PASSWORD,
    DB_NAME_PROD:process.env.DB_NAME_PROD,
    DB_HOST:process.env.DB_HOST

}
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
   MAX_AMOUNT:process.env.MAX_AMOUNT,
   MIN_AMOUNT:process.env.MIN_AMOUNT
}
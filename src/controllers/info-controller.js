const { StatusCodes } = require('http-status-codes');

const info = (req, res) => {
    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'API is live',
        error: {},
        data: {},
    });
}
const harshit = (req, res) => {
    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Harshit is live',
        error: {},
        data: {},
    });
}
module.exports = {
    info,
    harshit
}
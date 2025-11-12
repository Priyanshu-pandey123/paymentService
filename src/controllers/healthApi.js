const TimezoneHelper = require('../utils/helpers/timezone-helpers');

const healthCheck = async (req, res) => {
  try {
    const now = TimezoneHelper.now();
    
    res.status(200).json({
      status: 'OK',
      timestamp: now.format('YYYY-MM-DDTHH:mm:ss.SSS+05:30'),
      timezone: TimezoneHelper.IST_TIMEZONE,
      offset: '+05:30',
      message: 'Server is healthy'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

module.exports = {
  healthCheck
};
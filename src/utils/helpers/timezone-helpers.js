const moment = require('moment-timezone');

class TimezoneHelper {
  static IST_TIMEZONE = 'Asia/Kolkata';
  
  // Get current time in IST
  static now() {
    return moment().tz(this.IST_TIMEZONE);
  }
  
  // Convert any date to IST
  static toIST(date) {
    return moment(date).tz(this.IST_TIMEZONE);
  }
  
  // Format date in IST with timezone offset (+05:30)
  static formatIST(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return null;
    const istMoment = this.toIST(date);
    if (format.includes('Z')) {
      // Return ISO string with IST offset instead of Z
      return istMoment.format('YYYY-MM-DDTHH:mm:ss.SSS+05:30');
    }
    return istMoment.format(format);
  }
  
  // Get JavaScript Date object in IST
  static toISTDate(date) {
    return this.toIST(date).toDate();
  }
  
  // Add time duration and return IST date
  static addIST(duration, unit = 'minutes') {
    return this.now().add(duration, unit);
  }
  
  // Calculate next retry time in IST
  static calculateNextRetry(attemptCount) {
    const delays = [1, 5, 15, 45, 120, 360, 1080, 1440]; // minutes
    const delayMinutes = delays[Math.min(attemptCount, delays.length - 1)] || 1440;
    return this.addIST(delayMinutes, 'minutes').toDate();
  }

  // Convert IST formatted string back to Date object
  static parseIST(dateString) {
    if (!dateString) return null;
    return moment.tz(dateString, 'YYYY-MM-DDTHH:mm:ss.SSS+05:30', this.IST_TIMEZONE).toDate();
  }
}

module.exports = TimezoneHelper;

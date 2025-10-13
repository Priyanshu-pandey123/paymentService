const {logger} = require('../../config');

function logUserActivity(action, userData, additionalData = {}) {
  logger.info(`User Activity: ${action}`, {
    userId: userData.userId,
    email: userData.email,
    ip: userData.ip,
    userAgent: userData.userAgent,
    action,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
}

function logPaymentJourney(stage, data) {
  const stages = {
    'PAYMENT_INITIATED': 'Payment creation started',
    'PAYMENT_ORDER_CREATED': 'Razorpay order created',
    'PAYMENT_VERIFICATION_REQUESTED': 'Payment verification requested',
    'PAYMENT_VERIFIED': 'Payment signature verified',
    'PAYMENT_FAILED': 'Payment verification failed',
    'PAYMENT_WEBHOOK_RECEIVED': 'Webhook notification received',
    'PAYMENT_COMPLETED': 'Payment process completed'
  };

  logger.info(`Payment Journey: ${stages[stage] || stage}`, {
    stage,
    orderId: data.orderId,
    paymentId: data.paymentId,
    userId: data.userId,
    amount: data.amount,
    status: data.status,
    ip: data.ip,
    timestamp: new Date().toISOString()
  });
}

module.exports = { 
  logUserActivity, 
  logPaymentJourney 
};

const crypto = require('crypto');

function generateUnsubscribeToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateUnsubscribeToken };

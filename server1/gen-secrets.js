const c = require('crypto');
console.log('JWT_SECRET      = ' + c.randomBytes(64).toString('hex'));
console.log('AES_SESSION_KEY = ' + c.randomBytes(32).toString('hex'));
console.log('AGENT_SECRET    = ' + c.randomBytes(32).toString('hex'));

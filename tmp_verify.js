const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'c:\\Users\\DELL\\Antigravity\\Talvix\\branch-server1\\.env' });

const fs = require('fs');
const path = require('path');

const secret = process.env.JWT_SECRET || 'dummy_jwt_secret_minimum_64_chars_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const userId = '00000000-0000-0000-0000-000000000000'; // Mock UUID

const payload = {
  sub: userId,
  email: 'test@talvix.ai',
  tier: 'professional'
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log('---TOKEN_START---');
console.log(token);
console.log('---TOKEN_END---');

// Also create a mock PDF here
const mockPdf = Buffer.concat([
  Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  Buffer.from('-1.4\n1 0 obj\n<< /Title (Mock) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
]);

fs.writeFileSync('c:\\Users\\DELL\\Antigravity\\Talvix\\mock_resume.pdf', mockPdf);
console.log('Created c:\\Users\\DELL\\Antigravity\\Talvix\\mock_resume.pdf');

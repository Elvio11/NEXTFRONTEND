const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'c:\\Users\\DELL\\Antigravity\\Talvix\\branch-server1\\.env' });

const S1_URL = 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET;
const userId = '22222222-2222-2222-2222-222222222222';

async function runTest() {
  console.log('--- E2E STORAGE TEST START ---');

  // 1. Generate JWT
  const token = jwt.sign({ sub: userId, email: 'test@talvix.ai', tier: 'professional' }, JWT_SECRET);
  console.log('Generated JWT for test.');

  // 2. Prepare Mock PDF (Minimal valid PDF injected via base64)
  const mockPdfPath = path.join(__dirname, 'mock_resume.pdf');
  const pdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU31jBQK0osSQKzEyrhSHQC+BgdNCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKMzEKZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEgMCBSPj4+Pi9Db250ZW50cyAyIDAgUi9QYXJlbnQgNSAwIFI+PgplbmRvYmoKCjEgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCgo1IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzQgMCBSXT4+CmVuZG9iagoKNiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNSAwIFI+PgplbmRvYmoKCjcgMCBvYmoKPDwvUHJvZHVjZXIoRlBERiAxLjcpL0NyZWF0aW9uRGF0ZShEOjIwMjQwMTAxMDAwMDAwKzAwJzAwJyk+PgplbmRvYmoKCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI1OCAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxMjAgMDAwMDAgbiAKMDAwMDAwMDEzOSAwMDAwMCBuIAowMDAwMDAwMzQ2IDAwMDAwIG4gCjAwMDAwMDA0MDMgMDAwMDAgbiAKMDAwMDAwMDQ1MyAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgOC9Sb290IDYgMCBSL0luZm8gNyAwIFI+PgpzdGFydHhyZWYKNTE5CiUlRU9GCg==";
  const mockPdf = Buffer.from(pdfBase64, 'base64');
  fs.writeFileSync(mockPdfPath, mockPdf);
  console.log(`Using real mock PDF at ${mockPdfPath}`);

  // 3. Upload via Server 1
  console.log(`Uploading to ${S1_URL}/api/resume/upload...`);
  
  const FormData = require('form-data');
  const form = new FormData();
  form.append('resume', fs.createReadStream(mockPdfPath), {
    filename: 'mock_resume.pdf',
    contentType: 'application/pdf',
  });

  try {
    const response = await axios.post(`${S1_URL}/api/resume/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('--- UPLOAD RESPONSE ---');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'success') {
      console.log('✅ E2E Upload Test Passed (Server 1 side).');
    } else {
      console.log('❌ E2E Upload Test Failed.');
    }
  } catch (err) {
    console.error('❌ E2E Upload Test Error:', err.response?.data || err.message);
  }

  console.log('--- E2E STORAGE TEST END ---');
}

runTest();

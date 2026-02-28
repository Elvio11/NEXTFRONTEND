/**
 * audit.js — Server 1 security audit (run once, then delete)
 * Checks: no service_role, no dotenv, no .env files,
 *         stripSensitive registered before express.json,
 *         AES reads from process.env.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function collectJs(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && e.name !== 'node_modules') collectJs(full, out);
        else if (e.isFile() && e.name.endsWith('.js')) out.push(full);
    }
    return out;
}

const srcFiles = collectJs(path.join(__dirname, 'src'));
const rootFiles = fs.readdirSync(__dirname);

const checks = [];
const fail = (msg) => checks.push({ pass: false, msg });
const pass = (msg) => checks.push({ pass: true, msg });

// helper: strip JS comment lines before checking
function stripComments(src) {
    return src
        .split('\n')
        .filter(line => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//'))
        .join('\n');
}

// 1. No service_role key in any src file (excl. test files which legitimately reference it)
const prodFiles = srcFiles.filter(f => !f.includes('__tests__'));
const svcRoleBad = prodFiles.filter(f => stripComments(fs.readFileSync(f, 'utf8')).includes('SERVICE_ROLE_KEY'));
svcRoleBad.length === 0
    ? pass('No SUPABASE_SERVICE_ROLE_KEY references in src/ production code')
    : fail(`SERVICE_ROLE_KEY found in: ${svcRoleBad.join(', ')}`);

// 2. No dotenv references (excl. test files)
const dotenvBad = prodFiles.filter(f => {
    const c = fs.readFileSync(f, 'utf8');
    return c.includes("require('dotenv')") || c.includes('require("dotenv")');
});
dotenvBad.length === 0
    ? pass('No dotenv imports in src/ production code')
    : fail(`dotenv found in: ${dotenvBad.join(', ')}`);

// 3. No .env files in server1/
const envFiles = rootFiles.filter(n => n === '.env' || n.startsWith('.env.'));
envFiles.length === 0
    ? pass('No .env files in server1/')
    : fail(`.env files found: ${envFiles.join(', ')}`);

// 4. stripSensitive registered before express.json in server.js
const serverContent = fs.readFileSync(path.join(__dirname, 'src', 'server.js'), 'utf8');
const idxStrip = serverContent.indexOf('stripSensitive');
const idxJson = serverContent.indexOf('express.json');
idxStrip < idxJson && idxStrip >= 0
    ? pass('stripSensitive registered BEFORE express.json in server.js')
    : fail('stripSensitive must come BEFORE express.json registration');

// 5. AES reads key from process.env
const aesContent = fs.readFileSync(path.join(__dirname, 'src', 'lib', 'aes.js'), 'utf8');
aesContent.includes('process.env.AES_SESSION_KEY')
    ? pass('AES key read from process.env.AES_SESSION_KEY (Doppler)')
    : fail('AES key not from process.env — possible hardcoding');

// 6. forwardToAgent attaches X-Agent-Secret
const fwdContent = fs.readFileSync(path.join(__dirname, 'src', 'lib', 'forwardToAgent.js'), 'utf8');
fwdContent.includes('X-Agent-Secret')
    ? pass('forwardToAgent attaches X-Agent-Secret header on every call')
    : fail('forwardToAgent missing X-Agent-Secret header');

// Report
console.log('\n=== TALVIX SERVER 1 — SECURITY AUDIT ===\n');
let allPass = true;
for (const c of checks) {
    const icon = c.pass ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${c.msg}`);
    if (!c.pass) allPass = false;
}
console.log('\n' + (allPass ? '✅ AUDIT PASSED — cleared for Doppler handoff' : '❌ AUDIT FAILED — fix issues above'));
process.exit(allPass ? 0 : 1);

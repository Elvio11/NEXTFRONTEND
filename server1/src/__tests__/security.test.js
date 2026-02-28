/**
 * security.test.js
 * Automated QA: no service_role key, no .env files, no hardcoded secrets.
 * These tests catch human error — accidentally adding service_role to Server 1.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..');
const SERVER1_DIR = path.join(__dirname, '..', '..'); // server1/

/** Recursively collect all .js files under a directory */
function collectJsFiles(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
            collectJsFiles(full, files);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(full);
        }
    }
    return files;
}

describe('Security audit — Server 1 source code', () => {
    const srcFiles = collectJsFiles(SRC_DIR);

    test('SUPABASE_SERVICE_ROLE_KEY never referenced in src/', () => {
        const violations = srcFiles.filter(f => {
            const content = fs.readFileSync(f, 'utf8');
            return content.includes('SERVICE_ROLE_KEY') || content.includes('service_role_key');
        });
        expect(violations).toEqual([]);
    });

    test('No hardcoded JWT secrets or AES keys in src/', () => {
        const violations = srcFiles.filter(f => {
            const content = fs.readFileSync(f, 'utf8');
            // Detect patterns like: JWT_SECRET = "abc..." or AES_SESSION_KEY = 'abc...'
            return /(?:JWT_SECRET|AES_SESSION_KEY)\s*=\s*['"][a-zA-Z0-9+/=]{20,}/.test(content);
        });
        expect(violations).toEqual([]);
    });

    test('No .env files exist in server1/', () => {
        const violations = fs.readdirSync(SERVER1_DIR)
            .filter(name => name === '.env' || name.startsWith('.env.'));
        expect(violations).toEqual([]);
    });

    test('No dotenv import/require in src/', () => {
        const violations = srcFiles.filter(f => {
            const content = fs.readFileSync(f, 'utf8');
            return content.includes("require('dotenv')") || content.includes('require("dotenv")');
        });
        expect(violations).toEqual([]);
    });

    test('AES key read from process.env, not hardcoded in aes.js', () => {
        const aesFile = path.join(SRC_DIR, 'lib', 'aes.js');
        const content = fs.readFileSync(aesFile, 'utf8');
        expect(content).toContain('process.env.AES_SESSION_KEY');
        expect(content).not.toMatch(/AES_SESSION_KEY\s*=\s*['"][0-9a-f]{64}/);
    });
});

describe('Security audit — AES round-trip', () => {
    beforeAll(() => {
        process.env.AES_SESSION_KEY = 'a'.repeat(64); // 32 bytes (for testing only)
    });

    test('encrypt → decrypt returns original plaintext', () => {
        const { encrypt, decrypt } = require('../lib/aes');
        const plain = JSON.stringify({ li_at: 'test_cookie_value', jsessionid: 'abc123' });
        const { encrypted, iv } = encrypt(plain);
        expect(encrypted).not.toBe(plain);
        expect(iv).toHaveLength(32);   // 16 bytes = 32 hex chars
        const decrypted = decrypt(encrypted, iv);
        expect(decrypted).toBe(plain);
    });

    test('two encrypts of same plaintext produce different ciphertexts (random IV)', () => {
        const { encrypt } = require('../lib/aes');
        const plain = 'same_value';
        const a = encrypt(plain);
        const b = encrypt(plain);
        expect(a.encrypted).not.toBe(b.encrypted);
        expect(a.iv).not.toBe(b.iv);
    });

    test('decrypt throws on wrong key', () => {
        const { encrypt, decrypt } = require('../lib/aes');
        const { encrypted, iv } = encrypt('secret');
        process.env.AES_SESSION_KEY = 'b'.repeat(64); // change key
        expect(() => decrypt(encrypted, iv)).toThrow();
        process.env.AES_SESSION_KEY = 'a'.repeat(64); // restore
    });
});

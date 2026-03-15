/**
 * aes.js
 * AES-256-CBC encryption/decryption for Vault session cookies.
 *
 * Key:  AES_SESSION_KEY from Doppler — must be exactly 64 hex chars (32 bytes).
 * IV:   Random 16 bytes generated fresh per encrypt call.
 *       Stored alongside the ciphertext, never separately.
 *
 * SECURITY RULES (non-negotiable):
 *   1. Never log the plaintext, the encrypted blob, and the IV together.
 *   2. Delete decrypted session data from memory immediately after use.
 *   3. The key is read from process.env every call — never module-level cached
 *      so a Doppler key rotation takes effect without restart.
 */

'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_BYTES = 32; // 256-bit
const IV_BYTES = 16; // 128-bit block size

/**
 * Encrypts plaintext with AES-256-CBC.
 *
 * @param {string} plaintext - UTF-8 string to encrypt (e.g. JSON.stringify(cookies))
 * @returns {{ encrypted: string, iv: string }} - both as hex strings
 */
function encrypt(plaintext) {
    const keyHex = process.env.AES_SESSION_KEY;
    if (!keyHex || keyHex.length !== 64) {
        throw new Error('AES_SESSION_KEY must be exactly 64 hex chars (32 bytes). Set it in Doppler.');
    }
    const key = Buffer.from(keyHex, 'hex');
    const iv = crypto.randomBytes(IV_BYTES);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    return {
        encrypted: encrypted.toString('hex'),
        iv: iv.toString('hex'),
    };
}

/**
 * Decrypts AES-256-CBC ciphertext.
 *
 * @param {string} encryptedHex - hex-encoded ciphertext
 * @param {string} ivHex        - hex-encoded IV (16 bytes)
 * @returns {string}            - decrypted UTF-8 plaintext
 */
function decrypt(encryptedHex, ivHex) {
    const keyHex = process.env.AES_SESSION_KEY;
    if (!keyHex || keyHex.length !== 64) {
        throw new Error('AES_SESSION_KEY must be exactly 64 hex chars (32 bytes). Set it in Doppler.');
    }
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };

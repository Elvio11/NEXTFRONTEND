/**
 * stripSensitive.js
 * Middleware: monkey-patches res.json() to recursively hard-delete
 * sensitive database columns before ANY response leaves the server.
 *
 * Protected fields (must NEVER appear in any API response):
 *   session_encrypted, session_iv, oauth_access_token, oauth_refresh_token
 *
 * Applied ONCE globally in server.js — every route and error handler
 * is automatically covered. No route can accidentally bypass it.
 */

'use strict';

const BLOCKED_KEYS = new Set([
    'session_encrypted',
    'session_iv',
    'oauth_access_token',
    'oauth_refresh_token',
]);

/**
 * Recursively strips blocked keys from any plain object or array.
 * Works on deeply nested structures (e.g. dashboard response with
 * user_connections array inside a user object).
 *
 * @param {unknown} value
 * @returns {unknown} cleaned value
 */
function strip(value) {
    if (Array.isArray(value)) {
        return value.map(strip);
    }
    if (value !== null && typeof value === 'object') {
        const cleaned = {};
        for (const [k, v] of Object.entries(value)) {
            if (!BLOCKED_KEYS.has(k)) {
                cleaned[k] = strip(v);
            }
        }
        return cleaned;
    }
    return value;
}

/**
 * Express middleware — patches res.json on every request so the strip
 * runs automatically regardless of which route handles the response.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function stripSensitive(_req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        return originalJson(strip(body));
    };

    next();
}

module.exports = stripSensitive;

/**
 * rateLimiter.js — Simple in-memory rate limiter
 *
 * No Redis. No external dependencies. Resets on server restart.
 * Sufficient for single-instance Server 1.
 *
 * Used by:
 *   - commandRouter.js: 10 commands/user/minute (constraint M1)
 *   - apply.js: 1 manual trigger per 4 hours
 *   - coach.js: 1 on-demand per 6 hours
 */
'use strict';

const buckets = new Map(); // key → { count, resetAt }

/**
 * Check if a key has exceeded its rate limit.
 * @param {string} key - Unique identifier (e.g., 'telegram:123456')
 * @param {number} maxCalls - Maximum calls allowed in the window
 * @param {number} windowSecs - Window size in seconds
 * @returns {boolean} true if rate limited (should be blocked)
 */
function checkRateLimit(key, maxCalls, windowSecs) {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) return false; // no bucket or expired = not limited
    return bucket.count >= maxCalls;
}

/**
 * Increment the rate limit counter for a key.
 * Creates a new bucket if none exists or the window has expired.
 * @param {string} key
 * @param {number} [windowSecs=60] - Window size in seconds
 */
function incrementRateLimit(key, windowSecs = 60) {
    const now = Date.now();
    const existing = buckets.get(key);
    if (!existing || now > existing.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowSecs * 1000 });
    } else {
        existing.count++;
    }
}

/**
 * Check a per-action cooldown (e.g., APPLY_NOW every 4 hours).
 * @param {string} key - Unique cooldown key
 * @param {number} cooldownMs - Cooldown duration in milliseconds
 * @returns {{ limited: boolean, remainingMs: number }} remaining time if limited
 */
function checkCooldown(key, cooldownMs) {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
        return { limited: false, remainingMs: 0 };
    }
    return { limited: true, remainingMs: bucket.resetAt - now };
}

/**
 * Set a cooldown for a specific action.
 * @param {string} key
 * @param {number} cooldownMs - Duration in milliseconds
 */
function setCooldown(key, cooldownMs) {
    buckets.set(key, { count: 1, resetAt: Date.now() + cooldownMs });
}

// Cleanup old buckets every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
        if (now > bucket.resetAt) buckets.delete(key);
    }
}, 5 * 60 * 1000).unref(); // .unref() so this doesn't keep the process alive

module.exports = { checkRateLimit, incrementRateLimit, checkCooldown, setCooldown };

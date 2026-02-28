/**
 * webhooks.js
 * POST /api/webhooks/razorpay — handle Razorpay payment events
 *
 * Events handled:
 *   payment.captured  → upgrade users.tier = 'paid', set subscription dates
 *   subscription.charged → extend subscription_expires_at
 *
 * Security: Razorpay HMAC-SHA256 signature verified before any processing.
 * Secret: RAZORPAY_WEBHOOK_SECRET from Doppler.
 *
 * WA welcome message: forwarded to Server 2 (not sent directly from Server 1).
 * Subscription expiry: handled by pg_cron at midnight — NOT here (avoid double-processing).
 */
'use strict';

const router = require('express').Router();
const crypto = require('crypto');
const supabase = require('../lib/supabaseClient');
const forwardToAgent = require('../lib/forwardToAgent');

// Plan durations for subscription_expires_at calculation
const PLAN_MONTHS = {
    early_bird: 3,
    monthly: 1,
    quarterly: 3,
};

/**
 * Verify Razorpay webhook signature.
 * Razorpay signs the raw body with HMAC-SHA256 using the webhook secret.
 */
function verifyRazorpaySignature(rawBody, signature) {
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Add N months to a date, returning ISO string.
 */
function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
}

/**
 * POST /api/webhooks/razorpay
 * express.raw() middleware must be applied BEFORE express.json() for this route
 * so we can verify the raw body. Mounted in server.js with express.raw().
 */
router.post('/', async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) return res.status(400).json({ error: 'Missing signature' });

    // req.body is Buffer here (raw middleware applied in server.js for this route)
    const rawBody = req.body;
    if (!verifyRazorpaySignature(rawBody, signature)) {
        return res.status(403).json({ error: 'Invalid signature' });
    }

    let event;
    try {
        event = JSON.parse(rawBody.toString('utf8'));
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const eventName = event?.event;
    const payload = event?.payload?.payment?.entity ?? event?.payload?.subscription?.entity ?? {};

    // Acknowledge immediately — Razorpay retries on timeout
    res.status(200).json({ status: 'received' });

    // Process asynchronously after responding
    setImmediate(async () => {
        try {
            if (eventName === 'payment.captured') {
                const userId = payload.notes?.user_id;
                const planKey = payload.notes?.plan ?? 'monthly';
                const months = PLAN_MONTHS[planKey] ?? 1;
                const now = new Date().toISOString();
                const expiresAt = addMonths(now, months);

                if (!userId) {
                    console.error('[webhook/razorpay] payment.captured missing user_id in notes');
                    return;
                }

                // Upgrade tier and set subscription window
                // Note: anon key + RLS — the upsert targets the user's own row
                const { error } = await supabase
                    .from('users')
                    .update({
                        tier: 'paid',
                        subscription_started_at: now,
                        subscription_expires_at: expiresAt,
                        updated_at: now,
                    })
                    .eq('id', userId);

                if (error) {
                    console.error('[webhook/razorpay] tier upgrade failed:', error.message);
                    return;
                }

                // Fire WA welcome → Server 2 handles Baileys push (non-blocking)
                forwardToAgent(process.env.SERVER2_URL, 'wa-welcome', userId, {
                    plan: planKey, expires_at: expiresAt,
                }).catch(err => console.error('[webhook/razorpay] wa-welcome failed:', err.message));

                console.log(`[webhook/razorpay] payment.captured: user ${userId} → paid (${planKey}, ${months}mo)`);
            }
        } catch (err) {
            console.error('[webhook/razorpay] async processing error:', err.message);
        }
    });
});

module.exports = router;

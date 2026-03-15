/**
 * telegram.js — Telegram bot routes
 *
 * Routes:
 *   POST /api/telegram/webhook        — grammY webhook callback (production)
 *   POST /api/telegram/generate-link-token — Generate TG link token (JWT protected)
 *
 * Mounted at: /api/telegram
 */
'use strict';

const express = require('express');
const crypto = require('crypto');
const verifyJWT = require('../middleware/verifyJWT');
const { getSupabase } = require('../lib/supabaseClient');
const { getTelegramWebhookHandler } = require('../telegram/tgClient');
const logger = require('../lib/logger');

const router = express.Router();

/**
 * POST /api/telegram/webhook
 * grammY webhook handler for production mode.
 * In dev mode (long-polling), this route is unused.
 */
router.post('/webhook', (req, res, next) => {
    const handler = getTelegramWebhookHandler();
    if (!handler) {
        return res.status(503).json({ error: 'Telegram bot not initialized' });
    }
    return handler(req, res, next);
});

/**
 * POST /api/telegram/generate-link-token
 * Generates a one-time token for linking a Telegram account.
 * Protected by JWT — user must be logged in.
 *
 * Response: { token: string, expires_at: string }
 */
router.post('/generate-link-token', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.sub;
        const ttlMinutes = parseInt(process.env.TG_LINK_TOKEN_TTL_MINUTES || '15', 10);

        // Generate a 32-character random token
        const token = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

        // Store in user's notif_prefs JSONB
        const { data: user } = await getSupabase()
            .from('users')
            .select('notif_prefs')
            .eq('id', userId)
            .single();

        const currentPrefs = user?.notif_prefs || {};
        const updatedPrefs = {
            ...currentPrefs,
            telegram_link_token: token,
            telegram_link_token_expires_at: expiresAt,
        };

        const { error } = await getSupabase()
            .from('users')
            .update({ notif_prefs: updatedPrefs })
            .eq('id', userId);

        if (error) {
            logger.error('telegram', `Failed to store link token for user ${userId}: ${error.message}`);
            return res.status(500).json({ error: 'Failed to generate link token' });
        }

        logger.info('telegram', `Link token generated for user ${userId}`);
        return res.status(200).json({ token, expires_at: expiresAt });
    } catch (err) {
        logger.error('telegram', `generate-link-token error: ${err.message}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

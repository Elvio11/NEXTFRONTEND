/**
 * whatsapp.js — Server 1 WhatsApp onboarding routes
 *
 * Used by the frontend directly. Relies on the standard JWT verification.
 */
'use strict';

const express = require('express');
const { getSupabase } = require('../lib/supabaseClient');
const { connectWhatsApp } = require('../baileys/waClient');
const logger = require('../lib/logger');

const router = express.Router();

/**
 * GET /api/whatsapp/status
 * Fetches the bot health and pending QR code.
 */
router.get('/status', async (req, res) => {
    try {
        const { data: health, error } = await getSupabase()
            .from('wa_bot_health')
            .select('status, qr_code, last_ping_at')
            .eq('id', 1)
            .single();

        if (error || !health) {
            return res.status(500).json({ error: 'failed to fetch WhatsApp bot status' });
        }

        return res.status(200).json(health);
    } catch (err) {
        return res.status(500).json({ error: 'internal server error' });
    }
});

/**
 * POST /api/whatsapp/connect
 * Manually triggers a WhatsApp reconnect/QR generation attempt if disconnected.
 */
router.post('/connect', async (req, res) => {
    try {
        const { data: health } = await getSupabase()
            .from('wa_bot_health')
            .select('status')
            .eq('id', 1)
            .single();

        if (health && ['connected', 'qr_pending'].includes(health.status)) {
            return res.status(400).json({ status: 'ignored', note: 'bot is already connected or awaiting qr scan' });
        }

        logger.info('whatsapp', `User ${req.user.id} requested Baileys reconnect...`);

        // Spawn connection (do not await fully since it listens forever)
        connectWhatsApp().catch(err => {
            logger.error('whatsapp', `requested connection failed: ${err.message}`);
        });

        return res.status(202).json({ status: 'connecting', note: 'check /status endpoint for qr code' });
    } catch (err) {
        return res.status(500).json({ error: 'failed to spawn connection' });
    }
});

module.exports = router;

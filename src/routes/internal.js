/**
 * internal.js — Server 1 internal callback routes
 *
 * These routes are called by Server 2 and Server 3, never by the frontend.
 * All routes are guarded by verifyAgentSecret (X-Agent-Secret header).
 * JWT is NOT used here — this is machine-to-machine traffic only.
 *
 * Mounted at: /internal
 */
'use strict';

const express = require('express');
const verifyAgentSecret = require('../middleware/verifyAgentSecret');
const logger = require('../lib/logger');

const router = express.Router();

// Apply agent secret auth to ALL /internal routes
router.use(verifyAgentSecret);

/**
 * POST /internal/wa-send
 * Called by Server 2 (daily_coach, skill_gap) and Server 3 (auto_apply)
 * to trigger a WhatsApp push via Baileys.
 *
 * Body: { user_id: string, message: string, event_type?: string }
 * Response: { status: "sent" | "failed" }
 *
 * BACKWARD COMPAT: This route is preserved. New callers should use /internal/notify.
 */
router.post('/wa-send', async (req, res) => {
    const { user_id, message, event_type = 'agent_notification' } = req.body;

    if (!user_id || !message) {
        return res.status(400).json({ error: 'user_id and message are required' });
    }

    const { sendMessage } = require('../baileys/waClient');
    const sent = await sendMessage(user_id, message, event_type);

    if (sent) {
        return res.status(200).json({ status: 'sent' });
    } else {
        return res.status(500).json({ error: 'failed to send WhatsApp message' });
    }
});

/**
 * POST /internal/notify
 * Unified notification endpoint — routes to ALL active channels for a user.
 * Called by Server 2/3 agents via whatsapp_push.py send_notification().
 *
 * Body: {
 *   user_id: string,
 *   message_type: "job_alert"|"application_update"|"session_expiring_7d"|
 *                 "session_expiring_3d"|"session_expired"|"apply_paused"|
 *                 "coach"|"subscription_expiring"|"apply_submitted"|
 *                 "interview_scheduled",
 *   payload: { ...message-type specific data }
 * }
 *
 * Response: { status: "delivered"|"partial"|"failed", channels: { sent: [], failed: [] } }
 */
router.post('/notify', async (req, res) => {
    const { user_id, message_type, payload } = req.body;

    if (!user_id || !message_type) {
        return res.status(400).json({ error: 'user_id and message_type are required' });
    }

    try {
        const { routeNotification } = require('../messaging/notifyRouter');
        const result = await routeNotification(user_id, message_type, payload || {});

        if (result.sent.length > 0 && result.failed.length === 0) {
            return res.status(200).json({ status: 'delivered', channels: result });
        } else if (result.sent.length > 0) {
            return res.status(200).json({ status: 'partial', channels: result });
        } else {
            return res.status(200).json({ status: 'failed', channels: result });
        }
    } catch (err) {
        logger.error('internal', `notify error: ${err.message}`);
        return res.status(500).json({ error: 'notification delivery failed' });
    }
});

module.exports = router;

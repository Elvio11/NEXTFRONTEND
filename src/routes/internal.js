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

const router = express.Router();

// Apply agent secret auth to ALL /internal routes
router.use(verifyAgentSecret);

/**
 * POST /internal/wa-send
 * Called by Server 2 (daily_coach, skill_gap) and Server 3 (auto_apply)
 * to trigger a WhatsApp push via Baileys.
 *
 * Body: { user_id: string, message: string, event_type?: string }
 * Response: { status: "sent" | "deferred" }
 *
 * Phase 2: Outbound WA sending is deferred to Phase 3.
 *          We accept the request and return 200 so agents don't error.
 *          The message is logged for debugging.
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

module.exports = router;

/**
 * vault.js
 * POST /api/vault/capture — capture platform session cookies from browser extension
 * GET  /api/vault/status  — check connection validity per platform
 *
 * The Vault is how users connect LinkedIn/Indeed sessions to Talvix.
 * Flow: browser extension extracts cookies → POST here → AES-256-CBC encrypt →
 *       store { session_encrypted, session_iv } in user_connections.
 *
 * SECURITY:
 *   - Plaintext cookies are NEVER logged.
 *   - Encrypted blob and IV are never logged together.
 *   - session_encrypted is stripped by stripSensitive on every response.
 *   - Server 1 writes to user_connections via anon key + RLS (user_id = auth.uid()).
 */
'use strict';

const router = require('express').Router();
const supabase = require('../lib/supabaseClient');
const { encrypt } = require('../lib/aes');
const verifyJWT = require('../middleware/verifyJWT');

const ALLOWED_PLATFORMS = new Set(['linkedin', 'indeed']);

/**
 * POST /api/vault/capture
 * Body: { platform: 'linkedin'|'indeed', cookies: object, user_agent: string, viewport: string }
 */
router.post('/capture', verifyJWT, async (req, res) => {
    const { platform, cookies, user_agent, viewport } = req.body;

    if (!platform || !ALLOWED_PLATFORMS.has(platform)) {
        return res.status(400).json({ error: 'Invalid platform. Must be linkedin or indeed.' });
    }
    if (!cookies || typeof cookies !== 'object') {
        return res.status(400).json({ error: 'cookies must be a non-null object' });
    }

    try {
        // Encrypt — plaintext cleared from scope after this
        const { encrypted, iv } = encrypt(JSON.stringify(cookies));

        // Upsert user_connections — one row per (user_id, platform)
        // RLS: user_id = auth.uid() enforced — can only write own row
        const { error } = await supabase
            .from('user_connections')
            .upsert({
                user_id: req.user.id,
                platform,
                session_encrypted: encrypted,   // stripSensitive removes this from responses
                session_iv: iv,           // same
                is_valid: true,
                consecutive_failures: 0,
                user_agent: user_agent ?? null,
                viewport: viewport ?? null,
                created_at: new Date().toISOString(),
            }, { onConflict: 'user_id,platform' });

        if (error) throw error;

        // Return only safe status fields — session_encrypted stripped automatically
        return res.json({
            status: 'captured',
            platform,
            is_valid: true,
        });
    } catch (err) {
        console.error('[vault/capture] error (no session data logged):', err.message);
        return res.status(500).json({ error: 'Failed to store session' });
    }
});

/**
 * GET /api/vault/status
 * Returns connection health for each platform — no encrypted fields.
 */
router.get('/status', verifyJWT, async (req, res) => {
    try {
        // Explicitly select only safe columns — session_encrypted never fetched
        const { data, error } = await supabase
            .from('user_connections')
            .select('platform, is_valid, consecutive_failures, estimated_expires_at, created_at')
            .eq('user_id', req.user.id);

        if (error) throw error;

        return res.json({ connections: data ?? [] });
    } catch (err) {
        console.error('[vault/status]', err.message);
        return res.status(500).json({ error: 'Failed to fetch connection status' });
    }
});

module.exports = router;

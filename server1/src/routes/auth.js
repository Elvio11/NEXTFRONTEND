/**
 * auth.js
 * POST /api/auth/google   — Google OAuth code → JWT + httpOnly refresh cookie
 * POST /api/auth/refresh  — Rotate JWT using httpOnly refresh cookie
 * POST /api/auth/logout   — Clear refresh cookie
 *
 * JWT payload: { sub: user.id, email, tier }
 * JWT expiry:  15 minutes (matches architecture spec)
 * Refresh:     7 days, httpOnly, sameSite: strict
 *
 * All secrets from Doppler via process.env.
 * service_role key is NOT present on Server 1 — Supabase handles OAuth internally.
 */
'use strict';

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabaseClient');

const JWT_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

/** Issue a signed JWT for a verified user */
function signJWT(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, tier: user.tier ?? 'free' },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

/** Issue a refresh token (separate secret namespace) */
function signRefresh(userId) {
    return jwt.sign(
        { sub: userId, purpose: 'refresh' },
        process.env.JWT_SECRET + '_refresh',
        { expiresIn: REFRESH_EXPIRY }
    );
}

/**
 * POST /api/auth/google
 * Body: { code: string }  — Google OAuth authorization code
 */
router.post('/google', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    try {
        // Exchange code with Supabase Auth (handles Google OAuth internally)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
            return res.status(401).json({ error: error?.message ?? 'OAuth failed' });
        }

        const { user, session } = data;

        // Fetch tier from users table (Supabase session doesn't carry it)
        const { data: profile } = await supabase
            .from('users')
            .select('tier, onboarding_completed, full_name')
            .eq('id', user.id)
            .single();

        const tier = profile?.tier ?? 'free';
        const accessToken = signJWT({ id: user.id, email: user.email, tier });
        const refreshToken = signRefresh(user.id);

        // Refresh token in httpOnly cookie — never accessible to frontend JS
        res.cookie('talvix_refresh', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_MS,
        });

        // stripSensitive will fire on this before it leaves — belt-and-suspenders
        return res.json({
            access_token: accessToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: profile?.full_name ?? user.user_metadata?.full_name ?? '',
                tier,
                onboarding_completed: profile?.onboarding_completed ?? false,
            },
        });
    } catch (err) {
        console.error('[auth/google]', err.message);
        return res.status(500).json({ error: 'Authentication error' });
    }
});

/**
 * POST /api/auth/refresh
 * Reads httpOnly cookie, returns new access token.
 */
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies?.talvix_refresh;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET + '_refresh');
        if (payload.purpose !== 'refresh') throw new Error('Invalid token purpose');

        // Fetch current profile to get up-to-date tier (may have been upgraded)
        const { data: profile } = await supabase
            .from('users')
            .select('email, tier')
            .eq('id', payload.sub)
            .single();

        if (!profile) return res.status(401).json({ error: 'User not found' });

        const newAccessToken = signJWT({ id: payload.sub, email: profile.email, tier: profile.tier });
        return res.json({ access_token: newAccessToken });
    } catch (err) {
        const msg = err.name === 'TokenExpiredError' ? 'Refresh token expired' : 'Invalid refresh token';
        return res.status(401).json({ error: msg });
    }
});

/**
 * POST /api/auth/logout
 * Clears the httpOnly refresh cookie.
 */
router.post('/logout', (_req, res) => {
    res.clearCookie('talvix_refresh');
    return res.json({ status: 'ok' });
});

module.exports = router;

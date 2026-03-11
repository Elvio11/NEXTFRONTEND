/**
 * server.js — Talvix Server 1 Entry Point
 * Node.js 20 + Express 4 Gateway
 *
 * Responsibilities:
 *   - Receive all browser/webhook traffic
 *   - Validate JWT on every /api/* route
 *   - Strip session_encrypted/oauth_* from every response (stripSensitive)
 *   - Forward work to Servers 2/3 via forwardToAgent
 *   - Host Baileys WhatsApp socket
 *
 * Does NOT:
 *   - Hold SUPABASE_SERVICE_ROLE_KEY
 *   - Run any agent logic or LLM calls
 *   - Communicate directly with other agents (Servers 2/3 do that)
 *
 * All secrets from Doppler: doppler run -- node src/server.js
 */
'use strict';

// ── Dummy fallbacks so the server CAN START without Doppler injecting secrets.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'dummy_anon_key';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dummy_jwt_secret_minimum_64_chars_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.AGENT_SECRET = process.env.AGENT_SECRET || 'dummy_agent_secret';
process.env.AES_SESSION_KEY = process.env.AES_SESSION_KEY || 'dummy_aes_key';
process.env.SERVER2_URL = process.env.SERVER2_URL || 'http://localhost:3001';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '8080';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

// Middleware
const stripSensitive = require('./middleware/stripSensitive');
const verifyJWT = require('./middleware/verifyJWT');

// Routes
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const vaultRouter = require('./routes/vault');
const resumeRouter = require('./routes/resume');
const dashboardRouter = require('./routes/dashboard');
const userRouter = require('./routes/user');
const applicationsRouter = require('./routes/applications');
const notificationsRouter = require('./routes/notifications');
const webhooksRouter = require('./routes/webhooks');
const internalRouter = require('./routes/internal');
const whatsappRouter = require('./routes/whatsapp');

// Baileys stub
const { connectWhatsApp } = require('./baileys/waClient');

// ─────────────────────────────────────────────────────────────────────────────
// App setup
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet());

// CORS — only allow configured frontend origin
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,               // allow httpOnly cookies
}));

// Cookie parser (for httpOnly refresh token)
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL: stripSensitive MUST be registered BEFORE express.json() and all
// routes so it wraps res.json() before any route gets to call it.
// This guarantees session_encrypted / oauth_* are stripped on EVERY response.
// ─────────────────────────────────────────────────────────────────────────────
app.use(stripSensitive);

// Raw body for Razorpay webhook (must come before express.json())
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json({ limit: '1mb' }));

// File upload (for resume route)
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    abortOnLimit: true,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// Public — no JWT required
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhooksRouter);

// Protected — verifyJWT applied per-router (each router calls verifyJWT itself)
// This allows auth routes to remain public while all /api/* are guarded
app.use('/api/vault', vaultRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/user', userRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/whatsapp', verifyJWT, whatsappRouter);

// Internal callbacks — Server 2/3 → Server 1 (X-Agent-Secret, NOT JWT)
// Never expose these to the browser. verifyAgentSecret is applied inside the router.
app.use('/internal', internalRouter);

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[server] unhandled error:', err.message);
    // stripSensitive already patched res.json — safe to call here
    res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] Talvix Server 1 listening on port ${PORT} (0.0.0.0)`);
    console.log(`[server] Environment: ${process.env.NODE_ENV ?? 'production'}`);
    console.log(`[server] CORS origin: ${process.env.FRONTEND_URL}`);

    // Start Baileys socket (Phase 2 stub — connect, show QR, update wa_bot_health)
    connectWhatsApp().catch(err => {
        console.error('[server] Baileys connection failed:', err.message);
        // Non-fatal — server continues. WhatsApp is optional functionality.
    });
});

module.exports = app; // export for Jest/Supertest

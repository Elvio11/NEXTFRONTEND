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
app.use('/health', healthRouter);
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
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen(PORT, () => {
    console.log(`[server] Talvix Server 1 listening on port ${PORT}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`[server] CORS origin: ${process.env.FRONTEND_URL}`);

    // Start Baileys socket (Phase 2 stub — connect, show QR, update wa_bot_health)
    connectWhatsApp().catch(err => {
        console.error('[server] Baileys connection failed:', err.message);
        // Non-fatal — server continues. WhatsApp is optional functionality.
    });
});

module.exports = app; // export for Jest/Supertest

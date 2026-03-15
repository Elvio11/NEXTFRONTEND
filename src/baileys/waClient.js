/**
 * waClient.js — Baileys WhatsApp socket stub (Phase 2)
 *
 * Phase 2 scope:
 *   ✅ Connect Baileys socket
 *   ✅ Display QR in console + update wa_bot_health
 *   ✅ Track connected/disconnected state in DB
 *   ❌ Outbound WA message sending — Phase 3
 *
 * The socket object is exported so server.js can shut it down cleanly.
 * Inbound message handling is logged only — no command routing in Phase 2.
 */
'use strict';

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const { getSupabase } = require('../lib/supabaseClient');
const logger = require('../lib/logger');

// Auth state stored locally during dev. In prod: stored on FluxShare shared disk.
const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');

let sock = null;

async function updateBotHealth(status, qrCode = null) {
    try {
        // wa_bot_health is a singleton (id = 1). Use service_role on Servers 2/3.
        // Here we update via anon key — must have appropriate policy or use service_role.
        // For Phase 2 dev: RLS policy allows Server 1 to update id=1 row.
        await getSupabase()
            .from('wa_bot_health')
            .update({
                status,
                qr_code: qrCode,
                last_ping_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', 1);
    } catch (err) {
        logger.error('waClient', `DB health update failed: ${err.message}`);
    }
}

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,   // Shows QR in terminal during dev
        browser: ['Talvix', 'Chrome', '120.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            logger.info('waClient', 'QR ready — scan with WhatsApp');
            await updateBotHealth('qr_pending', qr);
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            logger.info('waClient', `connection closed (reason: ${reason}). reconnect: ${shouldReconnect}`);
            await updateBotHealth('disconnected');
            if (shouldReconnect) {
                // Simple backoff — reconnect after 5 seconds
                setTimeout(connectWhatsApp, 5_000);
            }
        }

        if (connection === 'open') {
            logger.info('waClient', 'WhatsApp connected');
            await updateBotHealth('connected');
        }
    });

    // Phase 2/3: log inbound messages and apply 3-layer security gate
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
                const from = msg.key.remoteJid;
                const text = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? '[media]';
                logger.info('waClient', `inbound from ${from}: ${text.slice(0, 80)}`);

                // --- 3-Layer Security Gate for Inbound Commands ---
                try {
                    // Extract phone number from JID (e.g., '919876543210@s.whatsapp.net' -> '919876543210')
                    const phone = from.split('@')[0];

                    const { data: user, error } = await getSupabase()
                        .from('users')
                        .select('id, wa_opted_in, tier')
                        .eq('wa_phone', phone)
                        .single();

                    // Gate 1: Phone exists?
                    if (error || !user) {
                        logger.info('waClient', `Gate 1 failed: unrecognised phone ${phone}`);
                        continue; // Silently ignore
                    }

                    // Gate 2: Opted in?
                    if (!user.wa_opted_in) {
                        logger.info('waClient', `Gate 2 failed: user ${user.id} not opted in`);
                        await sock.sendMessage(from, { text: "Please connect WhatsApp via the Talvix dashboard to enable commands." });
                        continue;
                    }

                    // Gate 3: Core commands are premium. (If command requires paid tier)
                    const isPremiumCommand = text.toLowerCase().startsWith('/apply') || text.toLowerCase().startsWith('/coach');
                    if (isPremiumCommand && user.tier !== 'paid') {
                        logger.info('waClient', `Gate 3 failed: user ${user.id} is free tier attempting premium command`);
                        await sock.sendMessage(from, { text: "This command requires a premium subscription. Upgrade at talvix.in." });
                        continue;
                    }

                    // Handled: Valid command passed all gates.
                    logger.info('waClient', `User ${user.id} authenticated for command: ${text}`);
                    // Future: Route to agent executor
                } catch (err) {
                    logger.error('waClient', `Inbound gate error: ${err.message}`);
                }
            }
        }
    });

    return sock;
}

/**
 * Send a WhatsApp message to a specific user_id.
 * Queries Supabase using anon key implicitly, handled via API routes.
 */
async function sendMessage(userId, message, eventType = 'notification') {
    if (!sock) {
        logger.error('waClient', 'Cannot send message, socket not connected.');
        return false;
    }

    try {
        const { data: user, error } = await getSupabase()
            .from('users')
            .select('wa_phone, wa_opted_in')
            .eq('id', userId)
            .single();

        if (error || !user) {
            logger.error('waClient', `sendMessage failed: user ${userId} not found`);
            return false;
        }

        if (!user.wa_opted_in || !user.wa_phone) {
            logger.error('waClient', `sendMessage aborted: user ${userId} missing phone or opt-in`);
            return false;
        }

        // WhatsApp JID format
        const jid = `${user.wa_phone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });

        logger.info('waClient', `Sent ${eventType} to user ${userId}`);
        return true;
    } catch (err) {
        logger.error('waClient', `sendMessage error for user ${userId}: ${err.message}`);
        return false;
    }
}

module.exports = { connectWhatsApp, getSocket: () => sock, sendMessage };

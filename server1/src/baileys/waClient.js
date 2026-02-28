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
const supabase = require('../lib/supabaseClient');

// Auth state stored locally during dev. In prod: stored on FluxShare shared disk.
const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');

let sock = null;

async function updateBotHealth(status, qrCode = null) {
    try {
        // wa_bot_health is a singleton (id = 1). Use service_role on Servers 2/3.
        // Here we update via anon key — must have appropriate policy or use service_role.
        // For Phase 2 dev: RLS policy allows Server 1 to update id=1 row.
        await supabase
            .from('wa_bot_health')
            .update({
                status,
                qr_code: qrCode,
                last_ping_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', 1);
    } catch (err) {
        console.error('[waClient] DB health update failed:', err.message);
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
            console.log('[waClient] QR ready — scan with WhatsApp');
            await updateBotHealth('qr_pending', qr);
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            console.log(`[waClient] connection closed (reason: ${reason}). reconnect: ${shouldReconnect}`);
            await updateBotHealth('disconnected');
            if (shouldReconnect) {
                // Simple backoff — reconnect after 5 seconds
                setTimeout(connectWhatsApp, 5_000);
            }
        }

        if (connection === 'open') {
            console.log('[waClient] ✅ WhatsApp connected');
            await updateBotHealth('connected');
        }
    });

    // Phase 2: log inbound messages only — no command routing yet
    sock.ev.on('messages.upsert', ({ messages }) => {
        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
                const from = msg.key.remoteJid;
                const text = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? '[media]';
                console.log(`[waClient] inbound from ${from}: ${text.slice(0, 80)}`);
                // Phase 3: parse command, 3-gate security, route to agent
            }
        }
    });

    return sock;
}

module.exports = { connectWhatsApp, getSocket: () => sock };

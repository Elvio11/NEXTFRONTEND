/**
 * watchdog.js — TalvixGuard Standalone Watchdog Process
 * 
 * Responsibilities:
 * - Monitor Server 5 (OpenFang) heartbeats.
 * - Alert via @TalvixWatchdogBot if S5 is down.
 * - Proxy @TalvixFounderBot messages to S5 (with queueing when S5 is dead).
 * - Handle direct commands for system status and health.
 */
'use strict';

const express = require('express');
const { Bot } = require('grammy');
const axios = require('axios');
const logger = require('./lib/logger');

// Config from Doppler
const S5_URL = process.env.SERVER5_URL || 'http://localhost:8005';
const WATCHDOG_BOT_TOKEN = process.env.TELEGRAM_WATCHDOG_BOT_TOKEN;
const FOUNDER_CHAT_ID = process.env.TELEGRAM_FOUNDER_CHAT_ID;
const AGENT_SECRET = process.env.AGENT_SECRET;
const PORT = process.env.WATCHDOG_PORT || 8081;

// State
let lastS5Heartbeat = Date.now();
const messageQueue = [];
let isS5Down = false;

// Initialize Watchdog Bot
const watchdogBot = new Bot(WATCHDOG_BOT_TOKEN);

// --- Watchdog Bot Commands ---
watchdogBot.command('status', async (ctx) => {
    const uptime = Math.floor(process.uptime() / 60);
    const s5Status = (Date.now() - lastS5Heartbeat < 10 * 60 * 1000) ? 'ONLINE' : 'OFFLINE';
    ctx.reply(`🛡️ TalvixGuard Status:\n- Watchdog Uptime: ${uptime}m\n- Server 5: ${s5Status}\n- Queued Messages: ${messageQueue.length}`);
});

watchdogBot.command('ping', (ctx) => ctx.reply('🏓 Pong! TalvixGuard is alive.'));

watchdogBot.command('restart', async (ctx) => {
    ctx.reply('🔄 Attempting to restart Server 5 via Docker...');
    try {
        const { exec } = require('child_process');
        exec('docker restart talvix-server5', (err) => {
            if (err) ctx.reply(`❌ Restart failed: ${err.message}`);
            else ctx.reply('✅ Restart command sent to Docker.');
        });
    } catch (err) {
        ctx.reply(`❌ Error: ${err.message}`);
    }
});

watchdogBot.start();

// --- Express App for Heartbeats and Webhooks ---
const app = express();
app.use(express.json());

// 1. Heartbeat from S5
app.post('/heartbeat', (req, res) => {
    lastS5Heartbeat = Date.now();
    if (isS5Down) {
        isS5Down = false;
        alertFounder('🟢 TalvixGuard: Server 5 (OpenFang) is BACK ONLINE. Replaying queued messages...');
        replayQueue();
    }
    res.sendStatus(200);
});

// 2. Proxy for @TalvixFounderBot messages (Webhooks should point here)
app.post('/founder-webhook', async (req, res) => {
    const update = req.body;
    
    if (Date.now() - lastS5Heartbeat < 10 * 60 * 1000) {
        // S5 is alive, forward immediately
        forwardToS5(update);
    } else {
        // S5 is dead, queue it
        messageQueue.push({ update, timestamp: Date.now() });
        if (!isS5Down) {
            isS5Down = true;
            alertFounder('🔴 TalvixGuard ALERT: Server 5 is DOWN. Messages are being queued.');
        }
    }
    res.sendStatus(200);
});

// 3. UptimeRobot Webhook
app.post('/uptimerobot', (req, res) => {
    const { alertType, alertFriendlyName } = req.body;
    if (alertType === '1') { // Down
        alertFounder(`⚠️ UptimeRobot Alert: ${alertFriendlyName} is DOWN.`);
    }
    res.sendStatus(200);
});

// Monitoring loop (Check for stale heartbeat)
setInterval(() => {
    if (Date.now() - lastS5Heartbeat > 10 * 60 * 1000 && !isS5Down) {
        isS5Down = true;
        alertFounder('🔴 TalvixGuard ALERT: Server 5 heartbeat stale (>10 min). system might be unresponsive.');
    }
}, 60000);

async function alertFounder(text) {
    try {
        await watchdogBot.api.sendMessage(FOUNDER_CHAT_ID, text);
    } catch (err) {
        logger.error('watchdog', `Failed to alert founder: ${err.message}`);
    }
}

async function forwardToS5(update) {
    try {
        await axios.post(`${S5_URL}/telegram/webhook`, update, {
            headers: { 'X-Agent-Secret': AGENT_SECRET }
        });
    } catch (err) {
        logger.error('watchdog', `Failed to forward to S5: ${err.message}`);
        messageQueue.push({ update, timestamp: Date.now() });
    }
}

async function replayQueue() {
    while (messageQueue.length > 0) {
        const item = messageQueue.shift();
        await forwardToS5(item.update);
    }
}

app.listen(PORT, () => {
    logger.info('watchdog', `TalvixGuard listening on port ${PORT}`);
});

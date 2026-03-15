/**
 * notifyRouter.js — Outbound notification routing
 *
 * Routes push notifications from Servers 2/3 to the correct channel(s)
 * for each user. Supports WhatsApp (Baileys) and Telegram (grammY).
 *
 * Called by:
 *   - /internal/notify route (new)
 *   - /internal/wa-send route (backward compat wrapper)
 *
 * Constraints:
 *   C4: No phone/chat_id in INFO logs — DEBUG only
 *   M4: WA outbound goes through existing rate-limited sendMessage
 */
'use strict';

const { getActiveChannels, touchChannel } = require('../db/channels');
const { formatMessage: formatWA } = require('./formatters/waFormatter');
const { formatMessage: formatTG } = require('./formatters/tgFormatter');
const { sendMessage: sendWA } = require('../baileys/waClient');
const logger = require('../lib/logger');

// Telegram send function — set by tgClient.js on init
let telegramSendFn = null;

/**
 * Register the Telegram send function (called from tgClient.js after init).
 * @param {Function} fn - async (chatId: string, message: string) => void
 */
function registerTelegramSender(fn) {
    telegramSendFn = fn;
}

/**
 * Route a notification to all active channels for a user.
 *
 * @param {string} userId - Supabase user UUID
 * @param {string} messageType - One of the 10 message types
 * @param {object} payload - Message-type-specific data
 * @returns {Promise<{ sent: string[], failed: string[] }>} delivery results
 */
async function routeNotification(userId, messageType, payload) {
    const sent = [];
    const failed = [];

    // Get all active channels for this user
    const channels = await getActiveChannels(userId);

    // Also check WA directly (WA uses users.wa_phone, not notification_channels)
    // This ensures backward compat — WA channel may not be in notification_channels table
    const hasWAChannel = channels.some(c => c.channel === 'whatsapp');

    if (!hasWAChannel) {
        // Try WA send directly via Baileys (existing behavior)
        try {
            const waMessage = formatWA(messageType, payload);
            const waSent = await sendWA(userId, waMessage, messageType);
            if (waSent) {
                sent.push('whatsapp');
            }
        } catch (err) {
            logger.debug('notifyRouter', `WA direct send failed for user ${userId}: ${err.message}`);
        }
    }

    for (const ch of channels) {
        try {
            if (ch.channel === 'whatsapp') {
                const message = formatWA(messageType, payload);
                const waSent = await sendWA(userId, message, messageType);
                if (waSent) {
                    sent.push('whatsapp');
                    await touchChannel(userId, 'whatsapp');
                } else {
                    failed.push('whatsapp');
                }
            } else if (ch.channel === 'telegram') {
                if (!telegramSendFn) {
                    logger.debug('notifyRouter', 'Telegram sender not registered — skipping');
                    failed.push('telegram');
                    continue;
                }
                const message = formatTG(messageType, payload);
                await telegramSendFn(ch.channel_id, message);
                sent.push('telegram');
                await touchChannel(userId, 'telegram');
            }
        } catch (err) {
            // C4: No channel_id in INFO logs
            logger.debug('notifyRouter', `${ch.channel} delivery failed for user ${userId}: ${err.message}`);
            failed.push(ch.channel);
        }
    }

    if (sent.length > 0) {
        logger.info('notifyRouter', `Delivered ${messageType} to user ${userId} via ${sent.join(', ')}`);
    }
    if (failed.length > 0) {
        logger.warn('notifyRouter', `Failed to deliver ${messageType} to user ${userId} on ${failed.join(', ')}`);
    }

    return { sent, failed };
}

/**
 * Send notification to a specific channel only (used by /internal/wa-send backward compat).
 */
async function routeToChannel(userId, channel, message) {
    if (channel === 'whatsapp') {
        return sendWA(userId, message, 'direct');
    } else if (channel === 'telegram' && telegramSendFn) {
        const channels = await getActiveChannels(userId);
        const tg = channels.find(c => c.channel === 'telegram');
        if (tg) {
            await telegramSendFn(tg.channel_id, message);
            return true;
        }
    }
    return false;
}

module.exports = { routeNotification, routeToChannel, registerTelegramSender };

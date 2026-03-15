/**
 * tgClient.js — grammY Telegram bot
 * Runs in same process as Baileys on Server 1.
 *
 * Modes:
 *   Development: long-polling (startTelegramPolling)
 *   Production:  webhook via Express (getTelegramWebhookHandler)
 *
 * Token: TELEGRAM_BOT_TOKEN (Doppler — constraint C1)
 * Webhook secret: TELEGRAM_WEBHOOK_SECRET (Doppler)
 *
 * Constraint M5: gracefully handles bot restart, deleted messages, user blocks.
 */
'use strict';

const { Bot, webhookCallback } = require('grammy');
const commandRouter = require('../messaging/commandRouter');
const { registerTelegramSender } = require('../messaging/notifyRouter');
const logger = require('../lib/logger');

let bot = null;

/**
 * Initialize the Telegram bot.
 * Returns the bot instance, or null if TELEGRAM_BOT_TOKEN is not set.
 */
function initTelegramBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        logger.warn('tgClient', 'TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
        return null;
    }

    bot = new Bot(token);

    // ── All text messages funnel through commandRouter ──
    bot.on('message:text', async (ctx) => {
        const text = ctx.message.text.trim();
        const chatId = String(ctx.chat.id);

        // Parse: /command args OR plain "COMMAND args"
        const isSlashCommand = text.startsWith('/');
        const parts = isSlashCommand ? text.slice(1).split(/\s+/) : text.split(/\s+/);
        const command = parts[0].toUpperCase();
        const args = parts.slice(1);

        const sendFn = async (message) => {
            try {
                await ctx.reply(message, { parse_mode: 'Markdown' });
            } catch (err) {
                // M5: Gracefully handle blocked bot, deleted chat, etc.
                logger.debug('tgClient', `Failed to reply to chat ${chatId}: ${err.message}`);
            }
        };

        await commandRouter.handle({
            channel: 'telegram',
            channel_id: chatId,
            command,
            args,
            sendFn,
            raw_text: text,
        });
    });

    // ── Error handler: never crash (constraint M5) ──
    bot.catch((err) => {
        logger.error('tgClient', `Bot error: ${err.message}`);
        // grammY will continue processing — we never rethrow
    });

    // ── Register TG sender for outbound push notifications ──
    registerTelegramSender(async (chatId, message) => {
        if (!bot) throw new Error('Telegram bot not initialized');
        await bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    logger.info('tgClient', 'Telegram bot initialized');
    return bot;
}

/**
 * Get Express webhook handler for production mode.
 * @returns {import('express').RequestHandler|null}
 */
function getTelegramWebhookHandler() {
    if (!bot) return null;
    return webhookCallback(bot, 'express', {
        secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    });
}

/**
 * Start long-polling for development mode.
 */
async function startTelegramPolling() {
    if (!bot) return;
    logger.info('tgClient', 'Starting Telegram long polling...');
    await bot.start();
}

/**
 * Stop the bot gracefully.
 */
async function stopTelegramBot() {
    if (!bot) return;
    await bot.stop();
    logger.info('tgClient', 'Telegram bot stopped');
}

module.exports = {
    initTelegramBot,
    getTelegramWebhookHandler,
    startTelegramPolling,
    stopTelegramBot,
    getBot: () => bot,
};

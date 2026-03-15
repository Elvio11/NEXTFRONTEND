/**
 * commandRouter.js — Unified command handler for WhatsApp + Telegram
 *
 * Both channels feed into this router. It applies:
 *   1. Rate limit (10 commands/user/minute — constraint M1)
 *   2. Pre-auth LINK command (Telegram only — constraint M6)
 *   3. Gate 1: channel registered?
 *   4. Gate 2: opted in?
 *   5. Gate 3: paid-only commands?
 *   6. Command dispatch
 *   7. Agent log write (constraint C8)
 *
 * Channel-specific send functions are injected by the caller (waClient/tgClient).
 */
'use strict';

const { getUserByChannelId, isChannelActive } = require('../db/channels');
const { checkRateLimit, incrementRateLimit } = require('./rateLimiter');
const logger = require('../lib/logger');
const { getSupabase } = require('../lib/supabaseClient');

// Command registry
const commands = {
    HELP:      require('./commands/help'),
    STATUS:    require('./commands/status'),
    JOBS:      require('./commands/jobs'),
    PAUSE:     require('./commands/pause'),
    RESUME:    require('./commands/pause'),   // RESUME is handled inside pause.js
    APPLY_NOW: require('./commands/apply'),
    REPORT:    require('./commands/report'),
    COACH:     require('./commands/coach'),
    STOP:      require('./commands/stop'),
    START:     require('./commands/stop'),     // START is handled inside stop.js
    LINK:      require('./commands/link'),
};

// Commands that require a paid tier
const PAID_COMMANDS = new Set(['STATUS', 'PAUSE', 'RESUME', 'APPLY_NOW', 'REPORT', 'COACH']);
// Note: JOBS is available to free users (top 3) — handled inside jobs.js

/**
 * Log command execution to agent_logs table (constraint C8).
 * Never crashes — best effort logging.
 */
async function logCommand(command, channel, userId, success) {
    try {
        await getSupabase()
            .from('agent_logs')
            .insert({
                agent_id: 'messaging_layer',
                input: { command, channel },
                output: { response_sent: success },
                status: success ? 'completed' : 'failed',
                user_id: userId || null,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            });
    } catch {
        // Non-critical — don't let logging failures break command handling
    }
}

module.exports = {
    /**
     * Handle an inbound command from either WA or TG.
     * @param {object} ctx
     * @param {'whatsapp'|'telegram'} ctx.channel
     * @param {string} ctx.channel_id - Phone (WA) or chat_id (TG)
     * @param {string} ctx.command - Uppercased command name
     * @param {string[]} ctx.args - Additional arguments
     * @param {Function} ctx.sendFn - Channel-specific send function
     * @param {string} ctx.raw_text - Original message text
     */
    async handle({ channel, channel_id, command, args, sendFn, raw_text }) {
        let userId = null;
        let success = false;

        try {
            // ── Rate limit (M1): 10 commands/user/minute ──
            const rateLimitKey = `cmd:${channel}:${channel_id}`;
            if (checkRateLimit(rateLimitKey, 10, 60)) {
                await sendFn('Slow down! Max 10 commands/minute. Try again shortly.');
                return;
            }
            incrementRateLimit(rateLimitKey, 60);

            // ── LINK is pre-auth (TG only — constraint M6) ──
            if (command === 'LINK') {
                if (channel !== 'telegram') {
                    await sendFn('This command is only available on Telegram. See talvix.in/settings.');
                    return;
                }
                await commands.LINK.execute({ channel_id, args, sendFn });
                success = true;
                return;
            }

            // ── Gate 1: phone/chat_id registered? ──
            const user = await getUserByChannelId(channel, channel_id);
            if (!user) {
                if (channel === 'telegram') {
                    await sendFn(
                        'Your Telegram is not linked to a Talvix account.\n' +
                        'Send /link <token> after generating a token at talvix.in/settings'
                    );
                }
                // WA: silently ignore unregistered numbers (existing behavior)
                return;
            }

            userId = user.id;

            // ── Gate 2: opted in? ──
            let channelActive;
            if (channel === 'whatsapp') {
                channelActive = user.wa_opted_in;
            } else {
                channelActive = await isChannelActive(user.id, 'telegram');
            }

            // Allow START and STOP through even if not opted in
            if (!channelActive && command !== 'START' && command !== 'STOP') {
                await sendFn('Your notifications are paused. Send START to re-enable.');
                return;
            }

            // ── Gate 3: paid-only commands ──
            if (PAID_COMMANDS.has(command) && user.tier !== 'paid') {
                await sendFn(
                    `🔒 *${command}* requires a Talvix paid plan.\n` +
                    'Upgrade at talvix.in for ₹499/month.\n\n' +
                    'Free commands: HELP, JOBS (top 3), STOP'
                );
                return;
            }

            // ── Dispatch ──
            const handler = commands[command];
            if (!handler) {
                await sendFn('Unknown command. Send HELP to see available commands.');
                return;
            }

            await handler.execute({ user, channel, channel_id, command, args, sendFn });
            success = true;

        } catch (err) {
            logger.error('commandRouter', `Error handling ${command} for ${channel}: ${err.message}`);
            try {
                await sendFn('Something went wrong. Please try again or visit talvix.in.');
            } catch {
                // Send failed — nothing we can do
            }
        } finally {
            // C8: Log every command execution
            await logCommand(command, channel, userId, success);
        }
    },
};

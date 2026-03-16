/**
 * stop.js — STOP / START command handlers
 * Available to: ALL users
 *
 * STOP: unsubscribe from notifications on this channel
 * START: re-subscribe (WhatsApp only — TG uses /link)
 */
'use strict';

const { getSupabase } = require('../../lib/supabaseClient');
const { deactivateChannel, activateChannel } = require('../../db/channels');

async function executeStop({ user, channel, sendFn }) {
    if (channel === 'whatsapp') {
        await getSupabase()
            .from('users')
            .update({ wa_opted_in: false })
            .eq('id', user.id);
    } else {
        // Telegram: deactivate the channel record (preserve for re-opt-in)
        await deactivateChannel(user.id, 'telegram');
    }

    await sendFn(
        '✅ You\'ve been unsubscribed from Talvix notifications on this channel.\n' +
        'Your account and data are preserved.\n' +
        'To re-enable, visit talvix.in/settings or send START.'
    );
}

async function executeStart({ user, channel, sendFn }) {
    if (channel === 'whatsapp') {
        await getSupabase()
            .from('users')
            .update({ wa_opted_in: true })
            .eq('id', user.id);

        await sendFn(
            '👋 Welcome back to Talvix!\n' +
            'Notifications re-enabled. Send HELP to see all commands.'
        );
    } else {
        // Telegram START — re-activate channel if it exists
        await activateChannel(user.id, 'telegram');

        await sendFn(
            '👋 Welcome back to Talvix!\n' +
            'Telegram notifications re-enabled. Send /help to see all commands.'
        );
    }
}

module.exports = {
    async execute(ctx) {
        if (ctx.command === 'START') {
            return executeStart(ctx);
        }
        return executeStop(ctx);
    },
    executeStop,
    executeStart,
};

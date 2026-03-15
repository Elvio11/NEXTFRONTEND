/**
 * link.js — LINK command handler (Telegram only)
 * Available to: ALL users (this IS the gate entry point for TG)
 *
 * Flow:
 * 1. User generates token on frontend (talvix.in/settings → Connect Telegram)
 * 2. User sends /link <token> to the Telegram bot
 * 3. Handler validates token, creates user_notification_channels record
 * 4. Invalidates token after use
 *
 * Constraint M6: LINK is ONLY available on Telegram.
 */
'use strict';

const { getSupabase } = require('../../lib/supabaseClient');
const { upsertChannel } = require('../../db/channels');
const logger = require('../../lib/logger');

module.exports = {
    /**
     * LINK is special: it runs PRE-AUTH (before gate lookup).
     * It receives channel_id and args directly, not a user object.
     * @param {{ channel_id: string, args: string[], sendFn: Function }} ctx
     */
    async execute({ channel_id, args, sendFn }) {
        const token = args[0];

        if (!token) {
            await sendFn(
                '❌ Usage: /link <token>\n' +
                'Generate a link token at talvix.in/settings → Connect Telegram'
            );
            return;
        }

        const supabase = getSupabase();

        // 1. Check if this chat_id is already linked
        const { data: existing } = await supabase
            .from('user_notification_channels')
            .select('id, is_active')
            .eq('channel', 'telegram')
            .eq('channel_id', channel_id)
            .single();

        if (existing && existing.is_active) {
            await sendFn("ℹ️ Your Telegram is already linked. Send /help to see commands.");
            return;
        }

        // 2. Look up token in users.notif_prefs JSONB
        // Token is stored as: notif_prefs.telegram_link_token
        // Expiry as: notif_prefs.telegram_link_token_expires_at
        const { data: users } = await supabase
            .from('users')
            .select('id, notif_prefs')
            .not('notif_prefs', 'is', null);

        // Find user with matching token
        let matchedUser = null;
        if (users) {
            for (const u of users) {
                const prefs = u.notif_prefs || {};
                if (prefs.telegram_link_token === token) {
                    matchedUser = u;
                    break;
                }
            }
        }

        if (!matchedUser) {
            await sendFn('❌ Invalid link token. Generate a new one at talvix.in/settings');
            return;
        }

        // 3. Check token expiry
        const prefs = matchedUser.notif_prefs || {};
        const expiresAt = prefs.telegram_link_token_expires_at;
        if (expiresAt && new Date(expiresAt) < new Date()) {
            await sendFn('❌ This link token has expired. Generate a new one at talvix.in/settings');
            return;
        }

        // 4. Create/update notification channel
        const success = await upsertChannel(matchedUser.id, 'telegram', channel_id);
        if (!success) {
            logger.error('link', `Failed to upsert channel for user ${matchedUser.id}`);
            await sendFn('Something went wrong. Please try again or contact support.');
            return;
        }

        // 5. Invalidate token (clear from notif_prefs)
        const updatedPrefs = { ...prefs };
        delete updatedPrefs.telegram_link_token;
        delete updatedPrefs.telegram_link_token_expires_at;

        await supabase
            .from('users')
            .update({ notif_prefs: updatedPrefs })
            .eq('id', matchedUser.id);

        logger.info('link', `Telegram linked for user ${matchedUser.id}`);

        await sendFn(
            '✅ Telegram linked to your Talvix account!\n' +
            "You'll now receive all notifications here.\n" +
            'Send /help to see available commands.'
        );
    },
};

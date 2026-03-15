/**
 * channels.js — DB helpers for user_notification_channels table
 *
 * All queries use the anon key Supabase client (Server 1 never holds service_role).
 * RLS policies must allow the relevant operations.
 *
 * WA lookups: via users.wa_phone (existing column)
 * TG lookups: via user_notification_channels.channel_id
 */
'use strict';

const { getSupabase } = require('../lib/supabaseClient');

/**
 * Look up a user by their channel identifier.
 * WA: channelId is phone number → users.wa_phone
 * TG: channelId is chat_id → user_notification_channels → users
 *
 * @param {'whatsapp'|'telegram'} channel
 * @param {string} channelId
 * @returns {Promise<object|null>} user record or null
 */
async function getUserByChannelId(channel, channelId) {
    if (channel === 'whatsapp') {
        const { data } = await getSupabase()
            .from('users')
            .select('id, tier, wa_opted_in, auto_apply_paused, monthly_apply_count, daily_apply_count, daily_apply_limit, notif_prefs, wa_phone')
            .eq('wa_phone', channelId)
            .single();
        return data;
    } else {
        // Telegram: look up via notification channels table, join users
        const { data } = await getSupabase()
            .from('user_notification_channels')
            .select('user_id, is_active, users(id, tier, wa_opted_in, auto_apply_paused, monthly_apply_count, daily_apply_count, daily_apply_limit, notif_prefs)')
            .eq('channel', 'telegram')
            .eq('channel_id', channelId)
            .eq('is_active', true)
            .single();
        return data?.users ?? null;
    }
}

/**
 * Check if a specific channel is active for a user.
 * @param {string} userId
 * @param {'whatsapp'|'telegram'} channel
 * @returns {Promise<boolean>}
 */
async function isChannelActive(userId, channel) {
    const { data } = await getSupabase()
        .from('user_notification_channels')
        .select('is_active')
        .eq('user_id', userId)
        .eq('channel', channel)
        .single();
    return data?.is_active ?? false;
}

/**
 * Create or update a channel link for a user.
 * Uses upsert on the (user_id, channel) unique constraint.
 * @param {string} userId
 * @param {'whatsapp'|'telegram'} channel
 * @param {string} channelId
 * @returns {Promise<boolean>} success
 */
async function upsertChannel(userId, channel, channelId) {
    const { error } = await getSupabase()
        .from('user_notification_channels')
        .upsert({
            user_id: userId,
            channel,
            channel_id: channelId,
            is_active: true,
            linked_at: new Date().toISOString(),
        }, { onConflict: 'user_id,channel' });
    return !error;
}

/**
 * Deactivate a channel (soft unsubscribe — preserves record for re-opt-in).
 * @param {string} userId
 * @param {'whatsapp'|'telegram'} channel
 * @returns {Promise<boolean>} success
 */
async function deactivateChannel(userId, channel) {
    const { error } = await getSupabase()
        .from('user_notification_channels')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('channel', channel);
    return !error;
}

/**
 * Activate a channel (re-subscribe).
 * @param {string} userId
 * @param {'whatsapp'|'telegram'} channel
 * @returns {Promise<boolean>} success
 */
async function activateChannel(userId, channel) {
    const { error } = await getSupabase()
        .from('user_notification_channels')
        .update({ is_active: true })
        .eq('user_id', userId)
        .eq('channel', channel);
    return !error;
}

/**
 * Get all active notification channels for a user (for outbound routing).
 * @param {string} userId
 * @returns {Promise<Array<{channel: string, channel_id: string}>>}
 */
async function getActiveChannels(userId) {
    const { data } = await getSupabase()
        .from('user_notification_channels')
        .select('channel, channel_id')
        .eq('user_id', userId)
        .eq('is_active', true);
    return data ?? [];
}

/**
 * Update last_used_at timestamp for a channel.
 * @param {string} userId
 * @param {'whatsapp'|'telegram'} channel
 */
async function touchChannel(userId, channel) {
    await getSupabase()
        .from('user_notification_channels')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('channel', channel);
}

module.exports = {
    getUserByChannelId,
    isChannelActive,
    upsertChannel,
    deactivateChannel,
    activateChannel,
    getActiveChannels,
    touchChannel,
};

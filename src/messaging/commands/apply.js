/**
 * apply.js — APPLY_NOW command handler
 * Available to: paid users only (gate enforced by commandRouter)
 *
 * Triggers an immediate apply cycle via Server 3.
 * Rate limited: max 1 manual trigger per user per 4 hours.
 * Checks LinkedIn kill switch (constraint C5) and valid sessions.
 */
'use strict';

const { getSupabase } = require('../../lib/supabaseClient');
const forwardToAgent = require('../../lib/forwardToAgent');
const { checkCooldown, setCooldown } = require('../rateLimiter');
const { formatIST } = require('../formatters/waFormatter');
const logger = require('../../lib/logger');

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

module.exports = {
    async execute({ user, sendFn }) {
        // 1. Check cooldown (M1-style per action, in-memory)
        const cooldownKey = `apply_now:${user.id}`;
        const { limited, remainingMs } = checkCooldown(cooldownKey, COOLDOWN_MS);

        if (limited) {
            const minutesAgo = Math.round((COOLDOWN_MS - remainingMs) / 60000);
            const nextAvailable = new Date(Date.now() + remainingMs);
            await sendFn(
                `⏳ You triggered a manual apply ${minutesAgo} minutes ago.\n` +
                `Next manual trigger available at ${formatIST(nextAvailable)}.\n` +
                `Auto-apply runs every night at 8 PM IST.`
            );
            return;
        }

        // 2. Check valid sessions
        const { data: connections } = await getSupabase()
            .from('user_connections')
            .select('is_valid, platform')
            .eq('user_id', user.id)
            .eq('is_valid', true);

        if (!connections || connections.length === 0) {
            await sendFn(
                '❌ No valid sessions found.\n' +
                'Connect LinkedIn or Indeed at talvix.in/settings first.'
            );
            return;
        }

        // 3. Check LinkedIn kill switch (constraint C5)
        // The actual kill switch check happens on Server 3, but we can check
        // if the user's daily limit is already hit to give instant feedback
        if (user.daily_apply_count >= user.daily_apply_limit) {
            await sendFn(
                '⏳ Daily apply limit reached.\n' +
                `You've used ${user.daily_apply_count}/${user.daily_apply_limit} applications today.\n` +
                'Auto-apply resumes tomorrow.'
            );
            return;
        }

        // 4. Set cooldown and trigger apply cycle
        setCooldown(cooldownKey, COOLDOWN_MS);

        // Send immediate acknowledgment
        await sendFn(
            '🚀 Apply cycle triggered!\n' +
            'Talvix will process your top matches now.\n' +
            "You'll receive updates as applications are submitted."
        );

        // 5. Fire-and-forget to Server 3 (30s timeout, don't await in command)
        const server3Url = process.env.SERVER3_URL || process.env.SERVER2_URL;
        forwardToAgent(server3Url, 'auto-apply', user.id, { immediate: true })
            .then(result => {
                if (result.status === 'failed') {
                    logger.warn('apply', `Server 3 apply cycle failed for user ${user.id}: ${result.error}`);
                }
            })
            .catch(err => {
                logger.error('apply', `Server 3 apply cycle error for user ${user.id}: ${err.message}`);
            });
    },
};

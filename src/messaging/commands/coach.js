/**
 * coach.js — COACH command handler
 * Available to: paid users only (gate enforced by commandRouter)
 *
 * Triggers Agent 8 (Daily Coach) on-demand via Server 2.
 * Rate limited: max 1 on-demand coach message per user per 6 hours.
 */
'use strict';

const forwardToAgent = require('../../lib/forwardToAgent');
const { checkCooldown, setCooldown } = require('../rateLimiter');
const { formatIST } = require('../formatters/waFormatter');
const logger = require('../../lib/logger');

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

module.exports = {
    async execute({ user, sendFn }) {
        // 1. Check cooldown
        const cooldownKey = `coach:${user.id}`;
        const { limited, remainingMs } = checkCooldown(cooldownKey, COOLDOWN_MS);

        if (limited) {
            const minutesAgo = Math.round((COOLDOWN_MS - remainingMs) / 60000);
            const nextAvailable = new Date(Date.now() + remainingMs);
            await sendFn(
                `🕐 You requested coaching ${minutesAgo} minutes ago.\n` +
                `Next available at ${formatIST(nextAvailable)}.\n` +
                'Your daily coaching message arrives at 7 AM IST automatically.'
            );
            return;
        }

        // 2. Set cooldown
        setCooldown(cooldownKey, COOLDOWN_MS);

        // 3. Send immediate acknowledgment
        await sendFn(
            '💬 Generating your coaching message...\n' +
            '_This usually takes 5–10 seconds._'
        );

        // 4. Call Server 2 Agent 8 (fire-and-forget with follow-up)
        const server2Url = process.env.SERVER2_URL;

        try {
            const result = await forwardToAgent(server2Url, 'coach', user.id, {
                trigger: 'manual',
            });

            if (result.status === 'success' && result.message) {
                await sendFn(result.message);
            } else if (result.status === 'failed') {
                await sendFn(
                    'Request sent but taking longer than expected.\n' +
                    'Check talvix.in shortly for your coaching message.'
                );
                logger.warn('coach', `Coach agent failed for user ${user.id}: ${result.error}`);
            }
        } catch (err) {
            await sendFn(
                'Request sent but taking longer than expected.\n' +
                'Check talvix.in shortly for your coaching message.'
            );
            logger.error('coach', `Coach agent error for user ${user.id}: ${err.message}`);
        }
    },
};

/**
 * pause.js — PAUSE / RESUME command handlers
 * Available to: paid users only (gate enforced by commandRouter)
 *
 * PAUSE: sets users.auto_apply_paused = true
 * RESUME: sets users.auto_apply_paused = false (checks valid sessions first)
 */
'use strict';

const { getSupabase } = require('../../lib/supabaseClient');

async function executePause({ user, sendFn }) {
    if (user.auto_apply_paused) {
        await sendFn('Auto-applying is already paused. Send RESUME to restart.');
        return;
    }

    await getSupabase()
        .from('users')
        .update({ auto_apply_paused: true })
        .eq('id', user.id);

    await sendFn(
        '⏸️ Auto-applying paused.\n' +
        'Your job matching and coaching will continue.\n' +
        'Send RESUME to restart.'
    );
}

async function executeResume({ user, sendFn }) {
    if (!user.auto_apply_paused) {
        await sendFn('Auto-applying is already active! No action needed.');
        return;
    }

    // Check if user has at least one valid session
    const { data: connections } = await getSupabase()
        .from('user_connections')
        .select('is_valid')
        .eq('user_id', user.id)
        .eq('is_valid', true);

    if (!connections || connections.length === 0) {
        await sendFn(
            '❌ Cannot resume — your session has expired.\n' +
            'Reconnect LinkedIn/Indeed at talvix.in/settings to restart.'
        );
        return;
    }

    await getSupabase()
        .from('users')
        .update({ auto_apply_paused: false })
        .eq('id', user.id);

    await sendFn(
        '▶️ Auto-applying resumed!\n' +
        "You're back in the queue for tonight's apply window (8 PM–6 AM IST)."
    );
}

module.exports = {
    async execute(ctx) {
        // commandRouter passes the original command name via ctx.command
        if (ctx.command === 'RESUME') {
            return executeResume(ctx);
        }
        return executePause(ctx);
    },
    // Also export individually for direct dispatch
    executePause,
    executeResume,
};

/**
 * status.js — STATUS command handler
 * Available to: paid users only (gate enforced by commandRouter)
 *
 * DB reads: users, job_applications, user_connections, job_fit_scores
 */
'use strict';

const { getSupabase } = require('../../lib/supabaseClient');
const { formatIST } = require('../formatters/waFormatter');

module.exports = {
    async execute({ user, sendFn }) {
        const supabase = getSupabase();
        const userId = user.id;

        // 1. Application pipeline counts (this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: apps } = await supabase
            .from('job_applications')
            .select('status')
            .eq('user_id', userId)
            .gte('created_at', startOfMonth.toISOString());

        const counts = { submitted: 0, callback: 0, interview: 0, offer: 0 };
        if (apps) {
            for (const app of apps) {
                if (app.status === 'submitted' || app.status === 'applied') counts.submitted++;
                else if (app.status === 'callback') counts.callback++;
                else if (app.status === 'interview') counts.interview++;
                else if (app.status === 'offer') counts.offer++;
            }
        }

        // 2. Session validity
        const { data: connections } = await supabase
            .from('user_connections')
            .select('platform, is_valid')
            .eq('user_id', userId);

        const sessionStatus = (platform) => {
            if (!connections) return '—';
            const conn = connections.find(c => c.platform === platform);
            if (!conn) return 'Not connected —';
            return conn.is_valid ? 'Valid ✅' : 'Expired ❌';
        };

        // 3. New matches since yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const { count: newMatches } = await supabase
            .from('job_fit_scores')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', yesterday.toISOString());

        // 4. Format response
        const autoStatus = user.auto_apply_paused ? 'PAUSED ⏸️' : 'ACTIVE ✅';
        const now = formatIST(new Date());

        const message = `📊 *Your Talvix Status*

Auto-Apply: ${autoStatus}
Applied this month: ${user.monthly_apply_count ?? 0}/250
Today's limit: ${user.daily_apply_count ?? 0}/${user.daily_apply_limit ?? 10}

Applications pipeline:
▸ Submitted: ${counts.submitted}
▸ Callbacks: ${counts.callback}
▸ Interviews: ${counts.interview}
▸ Offers: ${counts.offer}

Sessions:
▸ LinkedIn: ${sessionStatus('linkedin')}
▸ Indeed: ${sessionStatus('indeed')}

New matches since yesterday: ${newMatches ?? 0}

_Last updated: ${now}_`;

        await sendFn(message);
    },
};

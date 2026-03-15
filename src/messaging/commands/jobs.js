/**
 * jobs.js — JOBS command handler
 * Available to: free (top 3) + paid (top 5 via WA/TG; full 25 on dashboard)
 *
 * DB reads: job_fit_scores JOIN jobs
 */
'use strict';

const { getSupabase } = require('../../lib/supabaseClient');

const SEPARATOR = '\n─────────────────\n';

function fitLabel(score) {
    if (score >= 75) return 'Strong Match 🟢';
    if (score >= 55) return 'Good Match 🟡';
    return 'Consider 🟠';
}

module.exports = {
    async execute({ user, sendFn }) {
        const supabase = getSupabase();
        const isPaid = user.tier === 'paid';
        const limit = isPaid ? 5 : 3;

        const { data: scores } = await supabase
            .from('job_fit_scores')
            .select(`
                fit_score,
                jobs (
                    id,
                    title,
                    company,
                    city,
                    employment_type,
                    salary_min_lpa,
                    salary_max_lpa,
                    apply_tier
                )
            `)
            .eq('user_id', user.id)
            .order('fit_score', { ascending: false })
            .limit(limit);

        if (!scores || scores.length === 0) {
            await sendFn('No job matches found yet. Talvix is still scanning for roles that fit your profile.');
            return;
        }

        const cards = scores.map(s => {
            const job = s.jobs;
            if (!job) return null;

            const salary = job.salary_min_lpa && job.salary_max_lpa
                ? `₹${job.salary_min_lpa}–${job.salary_max_lpa} LPA`
                : 'Salary not listed';

            const tierNote = job.apply_tier === 1
                ? 'Apply auto-queued ✅'
                : `Apply at: talvix.in/jobs/${job.id}`;

            return `🎯 *${s.fit_score}% match* — ${job.title}
🏢 ${job.company} · 📍 ${job.city || 'Remote'}
💼 ${job.employment_type || 'Full-time'} · ${salary}
${fitLabel(s.fit_score)}

_(${tierNote})_`;
        }).filter(Boolean);

        const footer = isPaid
            ? '\nFull list at talvix.in/dashboard'
            : '\nSee all matches at talvix.in 🔒';

        const message = cards.join(SEPARATOR) + footer;
        await sendFn(message);
    },
};

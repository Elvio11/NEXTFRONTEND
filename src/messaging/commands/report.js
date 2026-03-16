/**
 * report.js — REPORT command handler
 * Available to: paid users only (gate enforced by commandRouter)
 *
 * Generates a weekly summary from last 7 days:
 * job_applications, job_fit_scores, skill_gap_results
 */
'use strict';

const { getSupabase } = require('../../lib/supabaseClient');
const { formatDateIST } = require('../formatters/waFormatter');

module.exports = {
    async execute({ user, sendFn }) {
        const supabase = getSupabase();
        const userId = user.id;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoISO = weekAgo.toISOString();

        const now = new Date();

        // 1. Applications in last 7 days
        const { data: apps } = await supabase
            .from('job_applications')
            .select('status, platform')
            .eq('user_id', userId)
            .gte('created_at', weekAgoISO);

        let submitted = 0;
        let callbacks = 0;
        let interviews = 0;
        const platformCounts = {};

        if (apps) {
            for (const app of apps) {
                if (app.status === 'submitted' || app.status === 'applied') {
                    submitted++;
                    const p = app.platform || 'Unknown';
                    platformCounts[p] = (platformCounts[p] || 0) + 1;
                }
                if (app.status === 'callback') callbacks++;
                if (app.status === 'interview') interviews++;
            }
        }

        const platformBreakdown = Object.entries(platformCounts)
            .map(([p, c]) => `${c} ${p}`)
            .join(', ') || 'None';

        const callbackRate = submitted > 0
            ? Math.round((callbacks / submitted) * 100)
            : 0;

        // 2. Job matching stats
        const { data: scores } = await supabase
            .from('job_fit_scores')
            .select('fit_score, jobs(role_family)')
            .eq('user_id', userId)
            .gte('created_at', weekAgoISO);

        let newMatches = 0;
        let avgFitScore = 0;
        const roleFamilyCounts = {};

        if (scores && scores.length > 0) {
            newMatches = scores.length;
            avgFitScore = Math.round(
                scores.reduce((sum, s) => sum + (s.fit_score || 0), 0) / scores.length
            );
            for (const s of scores) {
                const rf = s.jobs?.role_family || 'Unknown';
                roleFamilyCounts[rf] = (roleFamilyCounts[rf] || 0) + 1;
            }
        }

        const topRole = Object.entries(roleFamilyCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // 3. Top skill gap
        const { data: skillGap } = await supabase
            .from('skill_gap_results')
            .select('top_gaps')
            .eq('user_id', userId)
            .single();

        let skillGapLine = 'No skill gap data available yet';
        if (skillGap?.top_gaps && Array.isArray(skillGap.top_gaps) && skillGap.top_gaps.length > 0) {
            const gap = skillGap.top_gaps[0];
            skillGapLine = `${gap.skill || gap.name || 'Unknown'} — estimated ${gap.learning_time || 'varies'} to close`;
        }

        // 4. Format response
        const dateRange = `${formatDateIST(weekAgo)} – ${formatDateIST(now)}`;

        const message = `📈 *Your Weekly Report*
_Week of ${dateRange}_

*Applications*
▸ Submitted: ${submitted} (${platformBreakdown})
▸ Callbacks received: ${callbacks} (${callbackRate}% rate)
▸ Interviews scheduled: ${interviews}

*Job Matching*
▸ New jobs matched: ${newMatches}
▸ Avg fit score: ${avgFitScore}%
▸ Top role family: ${topRole}

*Top Skill Gap*
▸ ${skillGapLine}

_Full report at talvix.in/dashboard_`;

        await sendFn(message);
    },
};

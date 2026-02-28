/**
 * dashboard.js
 * GET /api/dashboard — fetch all data needed for the user's dashboard in one call
 *
 * Returns:
 *   - user profile (safe fields only — stripSensitive fires on response)
 *   - top fit scores (≤25 for paid, ≤3 for free)
 *   - skill gap top_gaps (top 3 from DB)
 *   - career intelligence summary
 *   - recent job applications (last 30)
 *   - unread notification count
 *   - connection status per platform (no session_encrypted — explicit column list)
 *
 * All queries use SUPABASE_ANON_KEY + RLS: data is scoped to auth.uid().
 * stripSensitive middleware provides an additional safety layer on res.json().
 */
'use strict';

const router = require('express').Router();
const supabase = require('../lib/supabaseClient');
const verifyJWT = require('../middleware/verifyJWT');

router.get('/', verifyJWT, async (req, res) => {
    const userId = req.user.id;

    try {
        // Run all queries in parallel — no sequential blocking
        const [
            profileResult,
            scoresResult,
            skillGapResult,
            careerIntelResult,
            applicationsResult,
            notificationsResult,
            connectionsResult,
        ] = await Promise.all([

            // User profile — safe fields only (oauth_* stripped by stripSensitive anyway)
            supabase
                .from('users')
                .select(`
          id, email, full_name, tier, onboarding_completed,
          experience_years, current_title, city_canonical, work_mode_pref,
          daily_apply_count, daily_apply_limit, monthly_apply_count,
          auto_apply_enabled, auto_apply_paused, dashboard_ready,
          wa_opted_in, fit_scores_stale, created_at
        `)
                .eq('id', userId)
                .single(),

            // Fit scores — paid gets 25, free gets 3
            supabase
                .from('job_fit_scores')
                .select(`
          id, fit_score, fit_label, recommendation,
          fit_reasons, missing_skills, strengths,
          created_at,
          jobs ( id, title, company, city_canonical, work_mode, apply_url, jd_summary )
        `)
                .eq('user_id', userId)
                .order('fit_score', { ascending: false })
                .limit(req.user.tier === 'paid' ? 25 : 3),

            // Skill gap — top 3 from DB column (full report on FluxShare for paid)
            supabase
                .from('skill_gap_results')
                .select('top_gaps, next_refresh_at')
                .eq('user_id', userId)
                .single(),

            // Career intelligence summary
            supabase
                .from('career_intelligence')
                .select(`
          career_score, score_components, market_demand_score,
          salary_p25_lpa, salary_p50_lpa, salary_p75_lpa,
          salary_role_category, next_refresh_at
        `)
                .eq('user_id', userId)
                .single(),

            // Recent applications — last 30
            supabase
                .from('job_applications')
                .select(`
          id, status, auto_status, method, fit_score_at_apply,
          applied_at, fu_email_1_sent_at, fu_email_2_sent_at,
          jobs ( title, company, city_canonical, apply_url )
        `)
                .eq('user_id', userId)
                .order('applied_at', { ascending: false })
                .limit(30),

            // Unread notification count only (not full list — separate route)
            supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'unread'),

            // Connection status — EXPLICIT column list, never select session_encrypted
            supabase
                .from('user_connections')
                .select('platform, is_valid, consecutive_failures, estimated_expires_at')
                .eq('user_id', userId),
        ]);

        // Surface any Supabase errors
        const errors = [profileResult, scoresResult, skillGapResult,
            careerIntelResult, applicationsResult, notificationsResult, connectionsResult]
            .map(r => r.error).filter(Boolean);
        if (errors.length) console.error('[dashboard] Supabase errors:', errors);

        // stripSensitive will recursively clean this before it leaves the server
        return res.json({
            user: profileResult.data ?? null,
            fit_scores: scoresResult.data ?? [],
            skill_gap: skillGapResult.data ?? null,
            career_intelligence: careerIntelResult.data ?? null,
            applications: applicationsResult.data ?? [],
            unread_notifications: notificationsResult.count ?? 0,
            connections: connectionsResult.data ?? [],
        });
    } catch (err) {
        console.error('[dashboard]', err.message);
        return res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

module.exports = router;

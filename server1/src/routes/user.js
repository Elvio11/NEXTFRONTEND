/**
 * user.js
 * PATCH /api/user/roles   — update target roles, set fit_scores_stale = TRUE
 * GET   /api/user/profile — lightweight profile fetch
 * PATCH /api/user/profile — update preferences (city, work mode, salary, notif prefs)
 */
'use strict';

const router = require('express').Router();
const supabase = require('../lib/supabaseClient');
const verifyJWT = require('../middleware/verifyJWT');

const MAX_ROLES = 5;

/**
 * PATCH /api/user/roles
 * Body: { roles: [{ role_family: string, priority: 1-5 }] }
 * Effect: replaces user_target_roles rows + sets fit_scores_stale = TRUE
 */
router.patch('/roles', verifyJWT, async (req, res) => {
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'roles must be a non-empty array' });
    }
    if (roles.length > MAX_ROLES) {
        return res.status(400).json({ error: `Maximum ${MAX_ROLES} target roles allowed` });
    }

    const userId = req.user.id;

    try {
        // Delete existing roles for this user, then insert new set
        const { error: delError } = await supabase
            .from('user_target_roles')
            .delete()
            .eq('user_id', userId);
        if (delError) throw delError;

        const newRows = roles.map((r, idx) => ({
            user_id: userId,
            role_family: r.role_family,
            priority: r.priority ?? idx + 1,
        }));

        const { error: insError } = await supabase
            .from('user_target_roles')
            .insert(newRows);
        if (insError) throw insError;

        // Mark fit scores as stale — triggers Agent 6 full scan on next run
        const { error: staleError } = await supabase
            .from('users')
            .update({ fit_scores_stale: true, updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (staleError) throw staleError;

        return res.json({ status: 'updated', roles_count: newRows.length, fit_scores_stale: true });
    } catch (err) {
        console.error('[user/roles]', err.message);
        return res.status(500).json({ error: 'Failed to update target roles' });
    }
});

/**
 * GET /api/user/profile
 * Lightweight profile — safe fields only.
 */
router.get('/profile', verifyJWT, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
        id, email, full_name, tier, onboarding_completed,
        experience_years, current_title, city_canonical, work_mode_pref,
        current_salary_lpa, target_salary_lpa, persona, wa_opted_in,
        auto_apply_enabled, daily_apply_limit, notif_prefs, created_at
      `)
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        return res.json({ user: data });
    } catch (err) {
        console.error('[user/profile GET]', err.message);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * PATCH /api/user/profile
 * Body: subset of safe user fields (no tier, no apply counts — system-managed)
 */
router.patch('/profile', verifyJWT, async (req, res) => {
    const SAFE_FIELDS = new Set([
        'full_name', 'city_canonical', 'work_mode_pref',
        'current_salary_lpa', 'target_salary_lpa', 'notif_prefs',
        'auto_apply_enabled', 'daily_apply_limit',
    ]);

    const updates = {};
    for (const [k, v] of Object.entries(req.body)) {
        if (SAFE_FIELDS.has(k)) updates[k] = v;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    try {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user.id);
        if (error) throw error;
        return res.json({ status: 'updated', fields: Object.keys(updates) });
    } catch (err) {
        console.error('[user/profile PATCH]', err.message);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;

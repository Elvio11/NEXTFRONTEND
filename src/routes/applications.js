/**
 * applications.js
 * POST /api/applications  — submit a manual job application
 * GET  /api/applications  — list user's applications
 *
 * Manual applies are Tier 2 (external sites) or ad-hoc. Auto-applies
 * are written directly by Agent 12 on Server 3 via service_role.
 *
 * On POST: inserts job_applications row, then fires learning signal
 * to Server 2 so Agent 15 Layer 1 captures it in real time.
 */
'use strict';

const router = require('express').Router();
const supabase = require('../lib/supabaseClient');
const forwardToAgent = require('../lib/forwardToAgent');
const verifyJWT = require('../middleware/verifyJWT');

/**
 * POST /api/applications
 * Body: { job_id: uuid, method: 'manual', platform: string, cover_letter_text?: string }
 */
router.post('/', verifyJWT, async (req, res) => {
    const { job_id, platform, cover_letter_text } = req.body;

    if (!job_id) return res.status(400).json({ error: 'job_id is required' });
    if (!platform) return res.status(400).json({ error: 'platform is required' });

    const userId = req.user.id;

    try {
        // Dedup check — has user already applied to this job?
        const { data: existing } = await supabase
            .from('job_applications')
            .select('id')
            .eq('user_id', userId)
            .eq('job_id', job_id)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'Already applied to this job' });
        }

        // Insert application record
        const { data: application, error: insError } = await supabase
            .from('job_applications')
            .insert({
                user_id: userId,
                job_id,
                status: 'applied',
                auto_status: 'not_applicable',
                method: 'manual',
                platform,
                applied_at: new Date().toISOString(),
            })
            .select('id, status, method, applied_at')
            .single();

        if (insError) throw insError;

        // Fire learning signal to Server 2 — non-blocking, don't wait
        forwardToAgent(process.env.SERVER2_URL, 'learning-signal', userId, {
            signal_type: 'application_submitted',
            context: {
                platform,
                app_id: application.id,
                method: 'manual',
            },
        }).catch(err => console.error('[applications] signal fire failed:', err.message));

        return res.status(201).json({ status: 'applied', application });
    } catch (err) {
        console.error('[applications POST]', err.message);
        return res.status(500).json({ error: 'Failed to record application' });
    }
});

/**
 * GET /api/applications
 * Query params: ?status=applied&limit=20&offset=0
 */
router.get('/', verifyJWT, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 50);
    const offset = parseInt(req.query.offset ?? '0', 10);
    const status = req.query.status; // optional filter

    try {
        let query = supabase
            .from('job_applications')
            .select(`
        id, status, auto_status, method, fit_score_at_apply, platform,
        applied_at, fu_email_1_sent_at, fu_email_2_sent_at, fu_close_loop_sent_at,
        retry_count, failure_note,
        jobs ( id, title, company, company_canonical, city_canonical, apply_url )
      `)
            .eq('user_id', req.user.id)
            .order('applied_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({ applications: data ?? [], total: count });
    } catch (err) {
        console.error('[applications GET]', err.message);
        return res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

module.exports = router;

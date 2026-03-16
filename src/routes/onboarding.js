/**
 * onboarding.js
 * Handles the 7-step onboarding flow for new users.
 * 
 * Step 1: Persona selection
 * Step 3: Target roles
 * Step 4: AI persona selection
 * Step 5: Preferences
 * Step 6: Verification status
 */
'use strict';

const router = require('express').Router();
const { getSupabase } = require('../lib/supabaseClient');
const verifyJWT = require('../middleware/verifyJWT');
const logger = require('../lib/logger');

/**
 * POST /api/onboarding/persona
 * Step 1: Selection of user persona
 */
router.post('/persona', verifyJWT, async (req, res) => {
    const { persona } = req.body;
    const validPersonas = [
        'Student', 'Early Career', 'Professional', 
        'Switcher', 'Returning', 'Freelancer'
    ];

    if (!validPersonas.includes(persona)) {
        return res.status(400).json({ error: 'Invalid persona selected' });
    }

    try {
        const { error } = await getSupabase()
            .from('users')
            .update({ persona, updated_at: new Date().toISOString() })
            .eq('id', req.user.id);

        if (error) throw error;
        return res.json({ status: 'success', persona });
    } catch (err) {
        logger.error('onboarding/persona', err.message);
        return res.status(500).json({ error: 'Failed to save persona' });
    }
});

/**
 * GET /api/onboarding/status
 * Returns current onboarding progress
 */
router.get('/status', verifyJWT, async (req, res) => {
    try {
        const { data, error } = await getSupabase()
            .from('users')
            .select('persona, onboarding_completed, onboarding_step')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        return res.json({ status: 'success', data });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch onboarding status' });
    }
});

/**
 * POST /api/onboarding/complete
 * Marks onboarding as complete
 */
router.post('/complete', verifyJWT, async (req, res) => {
    try {
        const { error } = await getSupabase()
            .from('users')
            .update({ 
                onboarding_completed: true, 
                onboarding_completed_at: new Date().toISOString() 
            })
            .eq('id', req.user.id);

        if (error) throw error;
        return res.json({ status: 'success' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to complete onboarding' });
    }
});

module.exports = router;

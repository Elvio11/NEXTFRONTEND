/**
 * orchestrator.js
 * POST /api/orchestrate — proxy to Server 2 /orchestrate endpoint
 *
 * This allows the frontend to trigger intelligence/execution crews
 * through the secure Server 1 gateway.
 */
'use strict';

const router = require('express').Router();
const axios = require('axios');
const verifyJWT = require('../middleware/verifyJWT');
const logger = require('../lib/logger');

/**
 * POST /api/orchestrate
 * Body: { trigger: string, user_id?: uuid, payload: {} }
 */
router.post('/', verifyJWT, async (req, res) => {
    const { trigger, payload = {} } = req.body;
    const userId = req.user.id;

    if (!trigger) {
        return res.status(400).json({ error: 'trigger is required' });
    }

    const url = `${process.env.SERVER2_URL}/orchestrate`;

    try {
        const { data } = await axios.post(
            url,
            { trigger, user_id: userId, payload },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Secret': process.env.AGENT_SECRET,
                },
                timeout: 120_000, // 2 minutes
            }
        );

        return res.json(data);
    } catch (err) {
        const message = err.response?.data?.error ?? err.message ?? 'Orchestrator error';
        logger.error('orchestrator', `forward failed: ${message}`);
        
        return res.status(err.response?.status ?? 500).json({
            status: 'failed',
            error: message,
        });
    }
});

module.exports = router;

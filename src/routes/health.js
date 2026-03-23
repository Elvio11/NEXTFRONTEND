/**
 * health.js — GET /api/health
 * No auth required. Used by FluxCloud upstream health probe.
 */
'use strict';

const router = require('express').Router();

router.get('/', (_req, res) => {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'AGENT_SECRET',
        'JWT_SECRET',
        'S4_URL',
        'MINIO_ROOT_USER',
        'MINIO_ROOT_PASSWORD',
        'MINIO_BUCKET'
    ];
    
    const env = {};
    required.forEach(k => {
        env[k] = (process.env[k] && !process.env[k].includes('placeholder')) ? 'SET' : 'MISSING';
    });

    res.json({ 
        status: 'ok',
        server: 'server1',
        env 
    });
});

module.exports = router;

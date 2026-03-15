/**
 * health.js — GET /api/health
 * No auth required. Used by FluxCloud upstream health probe.
 */
'use strict';

const router = require('express').Router();

router.get('/', (_req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;

/**
 * health.js — GET /health
 * No auth required. Used by Nginx upstream health probe.
 */
'use strict';

const router = require('express').Router();

router.get('/', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
});

module.exports = router;

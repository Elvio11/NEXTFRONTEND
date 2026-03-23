/**
 * analytics.js
 * 14 REST Endpoints for product analytics and mission control.
 */
'use strict';

const router = require('express').Router();
const analyticsService = require('../lib/analyticsService');
const logger = require('../lib/logger');
const verifyJWT = require('../middleware/verifyJWT');

// All routes are protected by JWT (Admins only expected)
router.use(verifyJWT);

// 1. GET /api/metrics
router.get('/metrics', async (req, res) => {
    try {
        const data = await analyticsService.getMetrics(req.query.period);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. GET /api/agent-performance
router.get('/agent-performance', async (req, res) => {
    try {
        const data = await analyticsService.getAgentPerformance();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. GET /api/scraper-health
router.get('/scraper-health', async (req, res) => {
    try {
        const data = await analyticsService.getScraperHealth();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. GET /api/conversion-data
router.get('/conversion-data', async (req, res) => {
    try {
        const data = await analyticsService.getConversionData();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5-11. GET /api/* intel routes (using generic intel aggregator)
const intelRoutes = [
    'retention-data', 'bd-intelligence', 'product-intelligence', 
    'engineering-metrics', 'infra-metrics', 'behavior-analytics', 'support-themes'
];

intelRoutes.forEach(route => {
    router.get(`/${route}`, async (req, res) => {
        try {
            const data = await analyticsService.getIntel(route);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
});

// 9. GET /api/db-health (Specific implementation)
router.get('/db-health', async (req, res) => {
    try {
        const data = await analyticsService.getDBHealth();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 12. GET /api/user-status?user_id=hash123
router.get('/user-status', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ success: false, error: 'user_id required' });
        const data = await analyticsService.getIntel(`user-status-${user_id}`);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 14. GET /api/geo-distribution
router.get('/geo-distribution', async (req, res) => {
    try {
        const data = await analyticsService.getIntel('geo-distribution');
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

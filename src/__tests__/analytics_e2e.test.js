/**
 * analytics_e2e.test.js
 * Verifies all 14 analytics REST endpoints.
 */
'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock environment
process.env.JWT_SECRET = 'test_secret_123';
process.env.NODE_ENV = 'test';

const app = require('../server');

function generateAdminToken() {
    return jwt.sign({ id: 'admin-user', role: 'admin' }, process.env.JWT_SECRET);
}

describe('Analytics E2E Verification', () => {
    const token = generateAdminToken();

    const endpoints = [
        '/api/metrics', '/api/agent-performance', '/api/scraper-health', 
        '/api/conversion-data', '/api/retention-data', '/api/bd-intelligence',
        '/api/product-intelligence', '/api/engineering-metrics', '/api/db-health',
        '/api/infra-metrics', '/api/behavior-analytics', '/api/support-themes',
        '/api/geo-distribution'
    ];

    endpoints.forEach(path => {
        test(`GET ${path} returns success`, async () => {
            const res = await request(app)
                .get(path)
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    test('GET /api/user-status?user_id=hash123 returns success', async () => {
        const res = await request(app)
            .get('/api/user-status?user_id=hash123')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Reject analytics access without JWT', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(401);
    });
});

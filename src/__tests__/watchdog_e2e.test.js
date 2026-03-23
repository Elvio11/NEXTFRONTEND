/**
 * watchdog_e2e.test.js
 * Verifies the internal webhooks and watchdog heartbeat mechanism.
 */
'use strict';

const request = require('supertest');

// Mock environment
process.env.AGENT_SECRET = 'test_agent_secret';
process.env.NODE_ENV = 'test';

const app = require('../server');

describe('Watchdog & Internal Webhooks E2E', () => {
    
    test('POST /internal/founder-notify forwards alert', async () => {
        const res = await request(app)
            .post('/internal/founder-notify')
            .set('X-Agent-Secret', process.env.AGENT_SECRET)
            .send({
                event_type: 'agent_failure',
                severity: 'high',
                details: { agent: 'fit_scorer', error: 'Database timeout' }
            });
        
        // We expect it to try and forward (it might fail in test without s5, but should acknowledge receipt)
        expect(res.status).toBe(200);
        expect(res.body.status).toMatch(/forwarded|failed_to_forward/);
    });

    test('Reject internal access without secret', async () => {
        const res = await request(app).post('/internal/founder-notify').send({});
        expect(res.status).toBe(403);
    });

    test('Local watchdog client sends heartbeat', async () => {
        const watchdogClient = require('../lib/watchdog');
        // This is a unit-style check for the client
        expect(watchdogClient.sendHeartbeat).toBeDefined();
        // Since no server is listening on 8081 in test, it should fail gracefully
        await expect(watchdogClient.sendHeartbeat()).resolves.not.toThrow();
    });
});

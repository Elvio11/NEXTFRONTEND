/**
 * mcp.test.js
 * Integration test for Server 1 MCP Bridge (Phase 4).
 * Validates the SSE endpoint and JWT protection required by OpenFang.
 */
'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set dummy secrets for test environment before importing server
process.env.JWT_SECRET = 'dummy_test_secret_for_mcp_testing_only_1234567890abcdef';
process.env.MCP_MODE = 'true'; // Enable MCP for this test
process.env.NODE_ENV = 'test';

const app = require('../server');

function generateValidToken() {
    return jwt.sign(
        { id: '1234-5678-test-uuid', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

describe('MCP Bridge Integration /api/mcp', () => {
    
    test('1. Reject GET /api/mcp without a JWT token', async () => {
        const response = await request(app).get('/api/mcp');
        // Because of verifyJWT, we expect 401 Unauthorized
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
    });

    test('2. Establish SSE connection on GET /api/mcp with valid JWT', async () => {
        const token = generateValidToken();
        const response = await request(app)
            .get('/api/mcp')
            .set('Authorization', `Bearer ${token}`);
            
        // SSE should return a 200 OK and text/event-stream content type
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/text\/event-stream/i);
        
        // SSE endpoints shouldn't close immediately (they hold). Supertest handles this okay if it flushes headers.
    });

    test('3. Reject POST /api/mcp/message without active SSE transport', async () => {
        const token = generateValidToken();
        const response = await request(app)
            .post('/api/mcp/message')
            .set('Authorization', `Bearer ${token}`)
            .send({
                jsonrpc: "2.0",
                method: "ping"
            });
            
        // Since we didn't establish an SSE transport via GET first in this request context,
        // it should error out indicating no active transport.
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/No active SSE connection/i);
    });
});

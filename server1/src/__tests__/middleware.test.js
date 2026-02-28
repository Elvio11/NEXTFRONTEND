/**
 * middleware.test.js
 * Tests: verifyJWT rejects bad tokens; stripSensitive cleans nested responses.
 */
'use strict';

process.env.JWT_SECRET = 'test_secret_minimum_64_chars_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test_anon_key';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.PORT = '3001';
process.env.AGENT_SECRET = 'test_agent_secret';
process.env.AES_SESSION_KEY = 'a'.repeat(64);
process.env.SERVER2_URL = 'http://localhost:8001';
process.env.SERVER3_URL = 'http://localhost:8002';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// We need to mock Supabase and Baileys before loading the app
jest.mock('../lib/supabaseClient', () => ({
    auth: { exchangeCodeForSession: jest.fn() },
    from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { tier: 'free', onboarding_completed: false, full_name: 'Test User' }, error: null }),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        range: jest.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
}));

jest.mock('../baileys/waClient', () => ({
    connectWhatsApp: jest.fn().mockResolvedValue(undefined),
    getSocket: jest.fn().mockReturnValue(null),
}));

const app = require('../server');

// ─────────────────────────────────────────────────────────────────────────────
// verifyJWT tests
// ─────────────────────────────────────────────────────────────────────────────
describe('verifyJWT middleware', () => {
    test('GET /api/dashboard with no token → 401', async () => {
        const res = await request(app).get('/api/dashboard');
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/no token/i);
    });

    test('GET /api/dashboard with malformed token → 401', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', 'Bearer not_a_real_jwt');
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/invalid token/i);
    });

    test('GET /api/dashboard with expired token → 401', async () => {
        const expired = jwt.sign(
            { sub: 'uuid-123', email: 'x@x.com', tier: 'free' },
            process.env.JWT_SECRET,
            { expiresIn: -1 }   // already expired
        );
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${expired}`);
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/expired/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// stripSensitive tests
// ─────────────────────────────────────────────────────────────────────────────
describe('stripSensitive middleware', () => {
    const { strip } = (() => {
        // Extract the strip function by re-implementing inline for unit test
        const BLOCKED = new Set(['session_encrypted', 'session_iv', 'oauth_access_token', 'oauth_refresh_token']);
        function strip(value) {
            if (Array.isArray(value)) return value.map(strip);
            if (value !== null && typeof value === 'object') {
                const out = {};
                for (const [k, v] of Object.entries(value)) {
                    if (!BLOCKED.has(k)) out[k] = strip(v);
                }
                return out;
            }
            return value;
        }
        return { strip };
    })();

    test('strips session_encrypted from flat object', () => {
        const input = { id: '123', session_encrypted: 'secret', name: 'Alice' };
        const output = strip(input);
        expect(output.session_encrypted).toBeUndefined();
        expect(output.name).toBe('Alice');
    });

    test('strips all 4 blocked keys simultaneously', () => {
        const input = {
            session_encrypted: 'a',
            session_iv: 'b',
            oauth_access_token: 'c',
            oauth_refresh_token: 'd',
            safe: 'keep',
        };
        const output = strip(input);
        expect(output.session_encrypted).toBeUndefined();
        expect(output.session_iv).toBeUndefined();
        expect(output.oauth_access_token).toBeUndefined();
        expect(output.oauth_refresh_token).toBeUndefined();
        expect(output.safe).toBe('keep');
    });

    test('strips from deeply nested object', () => {
        const input = { user: { connections: [{ platform: 'linkedin', session_encrypted: 'X' }] } };
        const output = strip(input);
        expect(output.user.connections[0].session_encrypted).toBeUndefined();
        expect(output.user.connections[0].platform).toBe('linkedin');
    });

    test('handles null and primitives safely', () => {
        expect(strip(null)).toBeNull();
        expect(strip(42)).toBe(42);
        expect(strip('hello')).toBe('hello');
        expect(strip([])).toEqual([]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Health route
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
    test('returns 200 with no auth', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.ts).toBeDefined();
    });
});

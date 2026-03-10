const request = require('supertest');
const express = require('express');
const { setTestEnv, makeAccessToken, makeExpiredAccessToken } = require('../setup/testHelpers');

jest.mock('../../sql/database.js', () => ({
    pool: { query: jest.fn(), execute: jest.fn() },
    getAllSalons: jest.fn(),
    getSalonById: jest.fn(),
    getProvidersBySalonId: jest.fn(),
    getServicesBySalonId: jest.fn(),
    getServicesByProviderId: jest.fn(),
    getDistinctSalonTypes: jest.fn(),
    getTopRatedSalons: jest.fn(),
    expandTimeBlocks: jest.fn()
}));

const { pool } = require('../../sql/database.js');
const AuthMiddleware = require('../../api/auth/AuthMiddleware.js');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.get('/protected', AuthMiddleware, (req, res) => {
        res.json({ success: true, user: req.user });
    });
    return app;
}

beforeAll(() => setTestEnv());
beforeEach(() => jest.clearAllMocks());

describe('AuthMiddleware', () => {
    test('returns 401 when no Authorization header is provided', async () => {
        const res = await request(buildApp()).get('/protected');
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Nincs token megadva');
    });

    test('returns 401 when token is expired', async () => {
        const token = makeExpiredAccessToken({ role: 'customer' });
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(401);
        expect(res.body.tokenExpired).toBe(true);
    });

    test('returns 403 when token has invalid signature', async () => {
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', 'Bearer not.a.valid.token');
        expect(res.status).toBe(403);
    });

    test('returns 403 and banned:true when customer account is banned', async () => {
        pool.query.mockResolvedValueOnce([[{ status: 'banned' }]]);

        const token = makeAccessToken({ role: 'customer', userId: 42 });
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.banned).toBe(true);
        expect(res.body.reason).toBe('banned');
    });

    test('returns 403 when customer account is deleted (GDPR)', async () => {
        pool.query.mockResolvedValueOnce([[{ status: 'deleted' }]]);

        const token = makeAccessToken({ role: 'customer', userId: 42 });
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.reason).toBe('gdpr');
    });

    test('returns 403 when customer is not found in DB', async () => {
        pool.query.mockResolvedValueOnce([[]]); // empty rows

        const token = makeAccessToken({ role: 'customer', userId: 99 });
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.banned).toBe(true);
    });

    test('returns 403 when provider account is banned', async () => {
        pool.query.mockResolvedValueOnce([[{ status: 'banned' }]]);

        const token = makeAccessToken({ role: 'provider', userId: 7 });
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.reason).toBe('banned');
    });

    test('allows active customer through and sets req.user', async () => {
        pool.query.mockResolvedValueOnce([[{ status: 'active' }]]);

        const token = makeAccessToken({ role: 'customer', userId: 1 });
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.user.userId).toBe(1);
        expect(res.body.user.role).toBe('customer');
    });

    test('allows active provider through', async () => {
        pool.query.mockResolvedValueOnce([[{ status: 'active' }]]);

        const token = makeAccessToken({ role: 'provider', userId: 3 });
        const res = await request(buildApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
});

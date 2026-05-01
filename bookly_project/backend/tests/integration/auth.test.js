const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { setTestEnv, makeRefreshToken } = require('../setup/testHelpers');

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

jest.mock('../../sql/users.js', () => ({
    getUserByEmail: jest.fn(),
    addUser: jest.fn(),
    getUsers: jest.fn()
}));

jest.mock('../../services/logService.js', () => ({
    logEvent: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../services/emailService.js', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined)
}));

const { pool } = require('../../sql/database.js');
const { getUserByEmail, addUser } = require('../../sql/users.js');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    const loginRouter = require('../../api/auth/LoginApi.js');
    app.use('/auth', loginRouter);
    return app;
}

beforeAll(() => setTestEnv());
beforeEach(() => jest.clearAllMocks());

// ─── POST /auth/register ───────────────────────────────────────────────────

describe('POST /auth/register', () => {
    test('returns 400 when name is missing', async () => {
        const res = await request(buildApp())
            .post('/auth/register')
            .send({ email: 'a@b.com', password: 'secret123' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when password is shorter than 6 characters', async () => {
        const res = await request(buildApp())
            .post('/auth/register')
            .send({ name: 'Ana', email: 'a@b.com', password: '123' });
        expect(res.status).toBe(400);
    });

    test('returns 409 when email already exists', async () => {
        getUserByEmail.mockResolvedValueOnce({ id: 1, email: 'a@b.com' });

        const res = await request(buildApp())
            .post('/auth/register')
            .send({ name: 'Ana', email: 'a@b.com', password: 'secret123' });
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    test('returns 201 on successful registration', async () => {
        getUserByEmail.mockResolvedValueOnce(null);
        addUser.mockResolvedValueOnce(5);

        const res = await request(buildApp())
            .post('/auth/register')
            .send({ name: 'Ana', email: 'new@b.com', password: 'secret123' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });
});

// ─── POST /auth/login ──────────────────────────────────────────────────────

describe('POST /auth/login', () => {
    test('returns 400 when email is missing', async () => {
        const res = await request(buildApp())
            .post('/auth/login')
            .send({ password: 'secret123' });
        expect(res.status).toBe(400);
    });

    test('returns 422 when user does not exist', async () => {
        getUserByEmail.mockResolvedValueOnce(null);

        const res = await request(buildApp())
            .post('/auth/login')
            .send({ email: 'ghost@b.com', password: 'secret123' });
        expect(res.status).toBe(422);
    });

    test('returns 422 when password is wrong', async () => {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('correctpassword', 10);
        getUserByEmail.mockResolvedValueOnce({ id: 1, email: 'a@b.com', password_hash: hash, status: 'active', name: 'Ana' });

        const res = await request(buildApp())
            .post('/auth/login')
            .send({ email: 'a@b.com', password: 'wrongpassword' });
        expect(res.status).toBe(422);
    });

    test('returns 403 when user is banned', async () => {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('mypassword', 10);
        getUserByEmail.mockResolvedValueOnce({ id: 2, email: 'b@b.com', password_hash: hash, status: 'banned', name: 'Bob' });

        const res = await request(buildApp())
            .post('/auth/login')
            .send({ email: 'b@b.com', password: 'mypassword' });
        expect(res.status).toBe(403);
        expect(res.body.banned).toBe(true);
        expect(res.body.reason).toBe('banned');
    });

    test('returns 200 with needsReactivation when account is deleted but has email', async () => {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('mypassword', 10);
        getUserByEmail.mockResolvedValueOnce({
            id: 3, email: 'deleted@b.com', password_hash: hash, status: 'deleted', name: 'Del'
        });

        const res = await request(buildApp())
            .post('/auth/login')
            .send({ email: 'deleted@b.com', password: 'mypassword' });
        expect(res.status).toBe(200);
        expect(res.body.needsReactivation).toBe(true);
        expect(res.body.reactivationToken).toBeDefined();
    });

    test('returns 200 with accessToken and sets refresh cookie on success', async () => {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('mypassword', 10);
        getUserByEmail.mockResolvedValueOnce({ id: 4, email: 'ok@b.com', password_hash: hash, status: 'active', name: 'OK' });
        pool.query.mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);

        const res = await request(buildApp())
            .post('/auth/login')
            .send({ email: 'ok@b.com', password: 'mypassword' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.accessToken).toBeDefined();
        expect(res.headers['set-cookie']).toBeDefined();
        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken/);
    });
});

// ─── POST /auth/refresh ────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
    test('returns 400 when no refresh cookie is present', async () => {
        const res = await request(buildApp())
            .post('/auth/refresh');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 401 when token is not found in DB', async () => {
        const refreshToken = makeRefreshToken({ role: 'customer', userId: 1 });
        pool.query.mockResolvedValueOnce([[]]); // empty RefTokens result

        const res = await request(buildApp())
            .post('/auth/refresh')
            .set('Cookie', `refreshToken=${refreshToken}`);
        expect(res.status).toBe(401);
    });

    test('returns 401 when customer is banned', async () => {
        const refreshToken = makeRefreshToken({ role: 'customer', userId: 1 });
        pool.query.mockResolvedValueOnce([[{ id: 10, user_id: 1, provider_id: null, admin_id: null }]]);
        pool.query.mockResolvedValueOnce([[{ id: 1, status: 'banned' }]]);
        pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE RefTokens

        const res = await request(buildApp())
            .post('/auth/refresh')
            .set('Cookie', `refreshToken=${refreshToken}`);
        expect(res.status).toBe(401);
        expect(res.body.banned).toBe(true);
    });

    test('returns 200 with new accessToken on success', async () => {
        const refreshToken = makeRefreshToken({ role: 'customer', userId: 1 });
        pool.query.mockResolvedValueOnce([[{ id: 10, user_id: 1, provider_id: null, admin_id: null }]]);
        pool.query.mockResolvedValueOnce([[{ id: 1, status: 'active' }]]);

        const res = await request(buildApp())
            .post('/auth/refresh')
            .set('Cookie', `refreshToken=${refreshToken}`);
        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
    });
});

// ─── POST /auth/logout ─────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
    test('returns 200 even when no refresh cookie is present', async () => {
        const res = await request(buildApp())
            .post('/auth/logout');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('deletes token from DB and clears cookie when valid cookie is present', async () => {
        const refreshToken = makeRefreshToken({ role: 'customer', userId: 1 });
        pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(buildApp())
            .post('/auth/logout')
            .set('Cookie', `refreshToken=${refreshToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['set-cookie']).toBeDefined();
    });
});

const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { setTestEnv } = require('../setup/testHelpers');

// ─── Mocks ────────────────────────────────────────────────────────────
jest.mock('../../sql/database.js', () => ({
    pool: {
        query: jest.fn(),
        execute: jest.fn(),
        getConnection: jest.fn()
    }
}));

jest.mock('../../services/locationService.js', () => ({
    placeToCoordinate: jest.fn().mockResolvedValue({ latitude: 47.5, longitude: 19.0 }),
    calculateDistance: jest.fn().mockReturnValue(5)
}));

jest.mock('../../services/emailService.js', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined)
}));

// ─── Setup ────────────────────────────────────────────────────────────
const { pool } = require('../../sql/database.js');

const mockConnection = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn()
};

let app;
let correctPasswordHash;

beforeAll(async () => {
    setTestEnv();
    correctPasswordHash = await bcrypt.hash('correctpassword', 1);
    const a = express();
    a.use(express.json());
    a.use(cookieParser());
    a.use('/prov-auth', require('../../api/auth/ProvLoginApi'));
    app = a;
});

beforeEach(() => {
    jest.clearAllMocks();
    pool.getConnection.mockResolvedValue(mockConnection);
    mockConnection.beginTransaction.mockResolvedValue(undefined);
    mockConnection.commit.mockResolvedValue(undefined);
    mockConnection.rollback.mockResolvedValue(undefined);
    mockConnection.release.mockReturnValue(undefined);
});

// ─── validate-salon-code ──────────────────────────────────────────────
describe('POST /prov-auth/validate-salon-code', () => {
    it('returns 400 when code is missing', async () => {
        const res = await request(app).post('/prov-auth/validate-salon-code').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 404 when code is not found', async () => {
        pool.query.mockResolvedValueOnce([[], []]);
        const res = await request(app).post('/prov-auth/validate-salon-code').send({ code: 'ABCDEF' });
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('returns 200 with salon info on valid code', async () => {
        pool.query.mockResolvedValueOnce([[{ id: 3, name: 'Glam Salon' }]]);
        const res = await request(app).post('/prov-auth/validate-salon-code').send({ code: 'ABCDEF' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.salonId).toBe(3);
        expect(res.body.salonName).toBe('Glam Salon');
    });
});

// ─── register ─────────────────────────────────────────────────────────
describe('POST /prov-auth/register', () => {
    const joinBody = {
        name: 'Anna',
        email: 'anna@salon.hu',
        password: 'password123',
        phone: '+36301234567',
        registrationType: 'join',
        salonId: 5
    };

    it('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/prov-auth/register').send({ name: 'Anna' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is shorter than 8 chars', async () => {
        const res = await request(app).post('/prov-auth/register').send({ ...joinBody, password: 'short' });
        expect(res.status).toBe(400);
    });

    it('returns 409 when email/phone already registered', async () => {
        // connection.query #1: duplicate provider check returns a row
        mockConnection.query.mockResolvedValueOnce([[{ id: 99 }]]);
        const res = await request(app).post('/prov-auth/register').send(joinBody);
        expect(res.status).toBe(409);
        expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('returns 201 on success: join existing salon', async () => {
        mockConnection.query
            .mockResolvedValueOnce([[], []])       // #1 no duplicate provider
            .mockResolvedValueOnce([[{ id: 5 }]])  // #2 salon exists
            .mockResolvedValueOnce([{ insertId: 1 }]); // #3 insert provider
        const res = await request(app).post('/prov-auth/register').send(joinBody);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.isManager).toBe(false);
    });

    it('returns 201 on success: create new salon (becomes manager)', async () => {
        const createBody = {
            name: 'Bob',
            email: 'bob@salon.hu',
            password: 'securepassword',
            phone: '+36309999999',
            registrationType: 'create',
            salon: {
                companyName: 'Bob Hair',
                address: 'Budapest, Kossuth 1',
                description: 'Best salon',
                salonType: 'hair'
            }
        };
        mockConnection.query
            .mockResolvedValueOnce([[], []])       // #1 no duplicate provider
            .mockResolvedValueOnce([[], []])       // #2 no duplicate salon name+address
            .mockResolvedValueOnce([[], []])       // #3 share code uniqueness check (first attempt unique)
            .mockResolvedValueOnce([{ insertId: 10 }]) // #4 insert salon
            .mockResolvedValueOnce([{ insertId: 2 }]); // #5 insert provider
        const res = await request(app).post('/prov-auth/register').send(createBody);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.isManager).toBe(true);
    });
});

// ─── login ────────────────────────────────────────────────────────────
describe('POST /prov-auth/login', () => {
    it('returns 400 when email or password is missing', async () => {
        const res = await request(app).post('/prov-auth/login').send({ email: 'x@x.com' });
        expect(res.status).toBe(400);
    });

    it('returns 422 when provider is not found', async () => {
        pool.query.mockResolvedValueOnce([[], []]);
        const res = await request(app).post('/prov-auth/login').send({ email: 'nobody@x.com', password: 'pass' });
        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
    });

    it('returns 422 when password is wrong', async () => {
        pool.query.mockResolvedValueOnce([[{
            id: 1, name: 'Test', email: 'p@p.com',
            password_hash: correctPasswordHash,
            salon_id: 1, isManager: 0, status: 'active', salon_name: 'Salon'
        }]]);
        const res = await request(app).post('/prov-auth/login').send({ email: 'p@p.com', password: 'wrongpassword' });
        expect(res.status).toBe(422);
    });

    it('returns 403 when provider is banned', async () => {
        pool.query.mockResolvedValueOnce([[{
            id: 1, status: 'banned', password_hash: correctPasswordHash, salon_id: 1, salon_name: 'Salon'
        }]]);
        const res = await request(app).post('/prov-auth/login').send({ email: 'p@p.com', password: 'correctpassword' });
        expect(res.status).toBe(403);
        expect(res.body.reason).toBe('banned');
    });

    it('returns 403 when provider is deleted (GDPR)', async () => {
        pool.query.mockResolvedValueOnce([[{
            id: 1, status: 'deleted', password_hash: correctPasswordHash, salon_id: 1, salon_name: 'Salon'
        }]]);
        const res = await request(app).post('/prov-auth/login').send({ email: 'p@p.com', password: 'correctpassword' });
        expect(res.status).toBe(403);
        expect(res.body.reason).toBe('gdpr');
    });

    it('returns 200 with accessToken and provider info on success', async () => {
        pool.query
            .mockResolvedValueOnce([[{
                id: 1, name: 'Provider', email: 'p@p.com',
                password_hash: correctPasswordHash,
                salon_id: 1, isManager: 1, status: 'active', salon_name: 'Test Salon'
            }]])
            .mockResolvedValueOnce([{ insertId: 1 }])   // #2 insert refresh token
            .mockResolvedValueOnce([{ affectedRows: 1 }]); // #3 update last_login
        const res = await request(app).post('/prov-auth/login').send({ email: 'p@p.com', password: 'correctpassword' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.provider.id).toBe(1);
        expect(res.body.provider.salonName).toBe('Test Salon');
    });
});

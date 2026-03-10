const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { setTestEnv, makeAccessToken } = require('../setup/testHelpers');

// ─── Mocks ────────────────────────────────────────────────────────────

jest.mock('../../sql/users.js', () => ({
    getUserById: jest.fn(),
    updateUserProfile: jest.fn(),
    updateUserPassword: jest.fn(),
    getUserPasswordHash: jest.fn(),
    checkEmailExists: jest.fn(),
    deleteUser: jest.fn(),
    restoreUser: jest.fn(),
    createRating: jest.fn(),
    getRatingByAppointment: jest.fn()
}));

jest.mock('../../sql/database.js', () => ({
    pool: {
        query: jest.fn(),
        execute: jest.fn(),
        getConnection: jest.fn()
    },
    getSavedSalonsByUserId: jest.fn(),
    saveSalon: jest.fn(),
    unsaveSalon: jest.fn(),
    getSavedSalonIds: jest.fn(),
    getProvidersBySalonId: jest.fn(),
    getUserAppointments: jest.fn(),
    getServiceById: jest.fn(),
    getAvailableTimeSlots: jest.fn(),
    getAppointmentById: jest.fn(),
    getProviderById: jest.fn(),
    getSalonById: jest.fn()
}));

jest.mock('../../services/locationService.js', () => ({
    calculateDistance: jest.fn().mockReturnValue(5)
}));

jest.mock('../../services/emailService.js', () => ({
    sendAppointmentConfirmation: jest.fn().mockResolvedValue(undefined),
    sendPasswordChangeConfirmation: jest.fn().mockResolvedValue(undefined),
    sendAppointmentCancellation: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../services/waitlistService.js', () => ({
    notifyWaitlistForCancelledSlot: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../middleware/uploadMiddleware.js', () => ({
    upload: { single: jest.fn().mockReturnValue((req, res, next) => next()) },
    processAndSaveImage: jest.fn().mockResolvedValue('/uploads/test.jpg'),
    deleteOldImage: jest.fn()
}));

// ─── Setup ────────────────────────────────────────────────────────────

const { pool, getServiceById, getProviderById, getSalonById, getAppointmentById } = require('../../sql/database.js');
const { getUserById, updateUserProfile, updateUserPassword, getUserPasswordHash, checkEmailExists, deleteUser, createRating } = require('../../sql/users.js');

const mockConnection = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn()
};

let app;
let customerToken;

beforeAll(() => {
    setTestEnv();
    customerToken = makeAccessToken({ userId: 1, role: 'customer', name: 'Test User' });
    const a = express();
    a.use(express.json());
    a.use(cookieParser());
    a.use('/user', require('../../api/userApi'));
    app = a;
});

beforeEach(() => {
    jest.clearAllMocks();
    pool.getConnection.mockResolvedValue(mockConnection);
    mockConnection.query.mockReset();
    mockConnection.beginTransaction.mockResolvedValue(undefined);
    mockConnection.commit.mockResolvedValue(undefined);
    mockConnection.rollback.mockResolvedValue(undefined);
});

// Helper: mock AuthMiddleware's user status check for customer tokens
function mockAuthMiddleware() {
    pool.query.mockResolvedValueOnce([[{ status: 'active' }]]); // AuthMiddleware: SELECT status FROM users WHERE id = ?
}

// ─── GET /user/profile ────────────────────────────────────────────────

describe('GET /user/profile', () => {
    it('returns user profile (200)', async () => {
        mockAuthMiddleware();
        getUserById.mockResolvedValueOnce({
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            phone: '0612345678',
            address: '123 Main St',
            role: 'customer',
            status: 'active',
            created_at: '2026-01-01T00:00:00.000Z',
            deleted_at: null,
            profile_picture_url: null
        });

        const res = await request(app)
            .get('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.name).toBe('Test User');
        expect(res.body.user.email).toBe('test@example.com');
    });

    it('returns 404 when user not found', async () => {
        mockAuthMiddleware();
        getUserById.mockResolvedValueOnce(null);

        const res = await request(app)
            .get('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

// ─── PUT /user/profile ────────────────────────────────────────────────

describe('PUT /user/profile', () => {
    it('returns 400 when name is empty', async () => {
        mockAuthMiddleware();

        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: '', email: 'test@example.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when email is already taken by another user', async () => {
        mockAuthMiddleware();
        checkEmailExists.mockResolvedValueOnce(true);

        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: 'Test User', email: 'taken@example.com', phone: '0612345678' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/e-mail/i);
    });

    it('returns 200 and updated user on success', async () => {
        mockAuthMiddleware();
        checkEmailExists.mockResolvedValueOnce(false);
        updateUserProfile.mockResolvedValueOnce(true);
        getUserById.mockResolvedValueOnce({
            id: 1,
            name: 'Updated Name',
            email: 'updated@example.com',
            phone: '0612345678',
            address: '123 Main St',
            role: 'customer',
            status: 'active',
            profile_picture_url: null,
            created_at: '2026-01-01T00:00:00.000Z'
        });

        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: 'Updated Name', email: 'updated@example.com', phone: '0612345678', address: '123 Main St' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.name).toBe('Updated Name');
    });
});

// ─── PUT /user/password ───────────────────────────────────────────────

describe('PUT /user/password', () => {
    it('returns 400 when fields are missing (no db mocks needed)', async () => {
        // No token provided at all — will get 401, but with a bad token it's 403
        // The instructions say "no db mocks needed" — this implies validation fires before DB hit
        // However AuthMiddleware runs first. Let's provide the token but missing body fields
        mockAuthMiddleware();
        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'pass' }); // missing newPassword and confirmPassword

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when new password is too short (< 6 chars)', async () => {
        mockAuthMiddleware();
        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'mypassword', newPassword: 'abc', confirmPassword: 'abc' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when current password is wrong', async () => {
        mockAuthMiddleware();
        const hash = await bcrypt.hash('mypassword', 10);
        getUserPasswordHash.mockResolvedValueOnce(hash);

        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'wrongpassword', newPassword: 'newpass123', confirmPassword: 'newpass123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/jelszó/i);
    });

    it('returns 200 on successful password change', async () => {
        mockAuthMiddleware();
        const hash = await bcrypt.hash('mypassword', 10);
        getUserPasswordHash.mockResolvedValueOnce(hash);
        updateUserPassword.mockResolvedValueOnce(true);
        getUserById.mockResolvedValueOnce({ email: 'test@example.com', name: 'Test User' });

        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'mypassword', newPassword: 'newpass123', confirmPassword: 'newpass123' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── POST /user/appointments ──────────────────────────────────────────

describe('POST /user/appointments', () => {
    const baseBody = {
        provider_id: 1,
        service_id: 1,
        appointment_date: '2026-12-15',
        appointment_time: '10:00',
        comment: 'Test comment'
    };

    it('returns 400 when required fields are missing', async () => {
        mockAuthMiddleware();
        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ provider_id: 1 }); // missing service_id, appointment_date, appointment_time

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 404 when service is not found', async () => {
        mockAuthMiddleware();
        getServiceById.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(baseBody);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('returns 409 when provider slot has a conflict', async () => {
        mockAuthMiddleware();
        getServiceById.mockResolvedValueOnce({
            id: 1,
            provider_id: 1,
            duration_minutes: 60,
            price: 5000,
            opening_hours: 8,
            closing_hours: 20
        });
        getProviderById.mockResolvedValueOnce({ id: 1, status: 'active', salon_id: 10 });
        getSalonById.mockResolvedValueOnce({
            id: 10,
            name: 'Test Salon',
            latitude: 47.0,
            longitude: 19.0
        });

        // Transaction: user's day appointments (empty - no user conflict)
        mockConnection.query
            .mockResolvedValueOnce([[], []]) // user's day appointments FOR UPDATE
            .mockResolvedValueOnce([[{ id: 99 }]]); // provider slot conflict FOR UPDATE

        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(baseBody);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it('returns 201 on successful appointment creation', async () => {
        mockAuthMiddleware();
        getServiceById.mockResolvedValueOnce({
            id: 1,
            provider_id: 1,
            duration_minutes: 60,
            price: 5000,
            opening_hours: 8,
            closing_hours: 20
        });
        getProviderById.mockResolvedValueOnce({ id: 1, status: 'active', salon_id: 10 });
        getSalonById.mockResolvedValueOnce({
            id: 10,
            name: 'Test Salon',
            latitude: 47.0,
            longitude: 19.0
        });

        // Transaction connection queries
        mockConnection.query
            .mockResolvedValueOnce([[], []]) // user's day appointments FOR UPDATE (no conflicts)
            .mockResolvedValueOnce([[], []]) // provider conflict check FOR UPDATE (no conflicts)
            .mockResolvedValueOnce([{ insertId: 55 }]); // INSERT appointment

        // After commit: pool.query for final SELECT to build response
        pool.query.mockResolvedValueOnce([[{
            id: 55,
            appointment_start: '2026-12-15 10:00:00',
            appointment_end: '2026-12-15 11:00:00',
            comment: 'Test comment',
            price: 5000,
            status: 'scheduled',
            created_at: '2026-12-15T09:00:00.000Z',
            provider_name: 'Test Provider',
            service_name: 'Haircut',
            salon_name: 'Test Salon',
            customer_email: 'test@example.com',
            customer_name: 'Test User'
        }]]);

        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(baseBody);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.appointment.id).toBe(55);
    });
});

// ─── DELETE /user/appointments/:id ───────────────────────────────────

describe('DELETE /user/appointments/:id', () => {
    it('returns 403 when appointment belongs to a different user', async () => {
        mockAuthMiddleware();
        getAppointmentById.mockResolvedValueOnce({
            id: 10,
            user_id: 999, // different user
            status: 'scheduled'
        });

        const res = await request(app)
            .delete('/user/appointments/10')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when appointment status is not scheduled', async () => {
        mockAuthMiddleware();
        getAppointmentById.mockResolvedValueOnce({
            id: 10,
            user_id: 1, // same user
            status: 'canceled'
        });

        const res = await request(app)
            .delete('/user/appointments/10')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 200 on successful appointment cancellation', async () => {
        mockAuthMiddleware();
        getAppointmentById.mockResolvedValueOnce({
            id: 10,
            user_id: 1, // same user
            status: 'scheduled'
        });

        // pool.query for detail SELECT
        pool.query.mockResolvedValueOnce([[{
            appointment_start: '2026-12-15 10:00:00',
            service_id: 1,
            provider_id: 1,
            customer_email: 'test@example.com',
            customer_name: 'Test User',
            salon_name: 'Test Salon',
            service_name: 'Haircut',
            provider_name: 'Test Provider'
        }]]);

        // pool.query for UPDATE status to canceled
        pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .delete('/user/appointments/10')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── POST /user/ratings ───────────────────────────────────────────────

describe('POST /user/ratings', () => {
    const baseRating = {
        appointmentId: 10,
        salonId: 1,
        providerId: 1,
        salonRating: 5,
        providerRating: 4,
        salonComment: 'Great salon',
        providerComment: 'Great provider'
    };

    it('returns 400 when required fields are missing', async () => {
        mockAuthMiddleware();
        const res = await request(app)
            .post('/user/ratings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ appointmentId: 10 }); // missing salonId, providerId, salonRating, providerRating

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when appointment is not completed', async () => {
        mockAuthMiddleware();
        getAppointmentById.mockResolvedValueOnce({
            id: 10,
            user_id: 1,
            status: 'scheduled' // not completed
        });

        const res = await request(app)
            .post('/user/ratings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(baseRating);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 200 on successful rating submission', async () => {
        mockAuthMiddleware();
        getAppointmentById.mockResolvedValueOnce({
            id: 10,
            user_id: 1, // matches token userId
            status: 'completed'
        });
        createRating.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/user/ratings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(baseRating);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── DELETE /user/account ─────────────────────────────────────────────

describe('DELETE /user/account', () => {
    it('returns 400 when password is missing', async () => {
        mockAuthMiddleware();
        const res = await request(app)
            .delete('/user/account')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({}); // no password

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is wrong', async () => {
        mockAuthMiddleware();
        const hash = await bcrypt.hash('mypassword', 10);
        getUserPasswordHash.mockResolvedValueOnce(hash);

        const res = await request(app)
            .delete('/user/account')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ password: 'wrongpassword' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 200 on successful account deletion', async () => {
        mockAuthMiddleware();
        const hash = await bcrypt.hash('mypassword', 10);
        getUserPasswordHash.mockResolvedValueOnce(hash);

        // 3 pool.execute calls (cancel appointments, delete saved_salons, delete RefTokens)
        pool.execute
            .mockResolvedValueOnce([{ affectedRows: 0 }]) // cancel scheduled appointments
            .mockResolvedValueOnce([{ affectedRows: 0 }]) // delete saved_salons
            .mockResolvedValueOnce([{ affectedRows: 0 }]); // delete RefTokens

        deleteUser.mockResolvedValueOnce(true);

        const res = await request(app)
            .delete('/user/account')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ password: 'mypassword' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

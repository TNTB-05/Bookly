const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const { setTestEnv, makeAccessToken } = require('../setup/testHelpers');

// ─── Mocks ────────────────────────────────────────────────────────────
jest.mock('../../sql/database.js', () => ({
    pool: { query: jest.fn(), execute: jest.fn() },
    getSalonHoursByProviderId: jest.fn(),
    getExpandedTimeBlocksForDate: jest.fn(),
    getFullyBookedDays: jest.fn()
}));

jest.mock('../../services/emailService.js', () => ({
    sendAppointmentCancellation: jest.fn().mockResolvedValue(undefined),
    sendCustomerReminder: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../services/waitlistService.js', () => ({
    notifyWaitlistForCancelledSlot: jest.fn().mockResolvedValue(undefined)
}));

// uploadMiddleware is imported by calendarApi for service image routes; mock to prevent file system access
jest.mock('../../middleware/uploadMiddleware.js', () => ({
    upload: { single: jest.fn().mockReturnValue((req, res, next) => next()) },
    processServiceImage: jest.fn().mockResolvedValue('/uploads/service-img.jpg'),
    deleteOldSalonImage: jest.fn()
}));

// ─── Setup ────────────────────────────────────────────────────────────
const { pool, getSalonHoursByProviderId, getExpandedTimeBlocksForDate } = require('../../sql/database.js');

let app;
let providerToken;

beforeAll(() => {
    setTestEnv();
    providerToken = makeAccessToken({ userId: 1, role: 'provider', name: 'Test Provider' });
    const a = express();
    a.use(express.json());
    a.use(cookieParser());
    a.use('/calendar', require('../../api/calendarApi'));
    app = a;
});

beforeEach(() => {
    jest.clearAllMocks();
    // Default: getSalonHoursByProviderId returns standard hours
    getSalonHoursByProviderId.mockResolvedValue({ opening_hours: 8, closing_hours: 20 });
    // Default: no time block conflicts
    getExpandedTimeBlocksForDate.mockResolvedValue([]);
});

// Helper: mock both AuthMiddleware provider check AND verifyProvider check
// AuthMiddleware calls pool.query for providers first, then verifyProvider calls it again
function mockVerifyProvider() {
    pool.query
        .mockResolvedValueOnce([[{ status: 'active' }]])       // AuthMiddleware: SELECT status FROM providers
        .mockResolvedValueOnce([[{ id: 1, status: 'active' }]]); // verifyProvider: SELECT id, status FROM providers
}

// ─── GET /statistics ──────────────────────────────────────────────────
describe('GET /calendar/statistics', () => {
    it('returns dashboard statistics (200)', async () => {
        mockVerifyProvider();
        pool.query
            .mockResolvedValueOnce([[{ count: 3 }]])    // today's appointments
            .mockResolvedValueOnce([[{ total: 15000 }]]) // weekly revenue
            .mockResolvedValueOnce([[{ count: 2 }]])    // new customers this month
            .mockResolvedValueOnce([[{ id: 1, appointment_start: '2026-03-06 10:00:00' }]]); // upcoming

        const res = await request(app)
            .get('/calendar/statistics')
            .set('Authorization', `Bearer ${providerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.statistics.todayAppointments).toBe(3);
        expect(res.body.statistics.weeklyRevenue).toBe(15000);
    });
});

// ─── GET /appointments ────────────────────────────────────────────────
describe('GET /calendar/appointments', () => {
    it('returns appointments array (200)', async () => {
        mockVerifyProvider();
        pool.query.mockResolvedValueOnce([[
            { id: 1, appointment_start: '2026-03-10 10:00:00', status: 'scheduled' }
        ]]);

        const res = await request(app)
            .get('/calendar/appointments')
            .set('Authorization', `Bearer ${providerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.appointments).toHaveLength(1);
    });
});

// ─── POST /appointments ───────────────────────────────────────────────
describe('POST /calendar/appointments', () => {
    const baseBody = {
        is_guest: true,
        user_name: 'Guest Name',
        user_email: 'guest@test.com',
        service_id: 1,
        appointment_date: '2026-12-15',
        appointment_time: '10:00'
    };

    it('returns 400 when required fields are missing', async () => {
        mockVerifyProvider();
        const res = await request(app)
            .post('/calendar/appointments')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({ service_id: 1 }); // missing user_name, appointment_date, appointment_time
        expect(res.status).toBe(400);
    });

    it('returns 404 when service not found or not owned by provider', async () => {
        mockVerifyProvider();
        pool.query.mockResolvedValueOnce([[], []]); // no service found
        const res = await request(app)
            .post('/calendar/appointments')
            .set('Authorization', `Bearer ${providerToken}`)
            .send(baseBody);
        expect(res.status).toBe(404);
    });

    it('returns 400 when appointment is outside salon hours', async () => {
        mockVerifyProvider();
        pool.query.mockResolvedValueOnce([[{ id: 1, duration_minutes: 60, price: 5000 }]]); // service found
        getSalonHoursByProviderId.mockResolvedValue({ opening_hours: 8, closing_hours: 20 });
        const res = await request(app)
            .post('/calendar/appointments')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({ ...baseBody, appointment_time: '21:00' }); // outside hours
        expect(res.status).toBe(400);
    });

    it('returns 409 on slot conflict with existing appointment', async () => {
        mockVerifyProvider();
        pool.query
            .mockResolvedValueOnce([[{ id: 1, duration_minutes: 60, price: 5000 }]]) // service
            .mockResolvedValueOnce([[{ id: 99 }]]); // conflict found
        const res = await request(app)
            .post('/calendar/appointments')
            .set('Authorization', `Bearer ${providerToken}`)
            .send(baseBody);
        expect(res.status).toBe(409);
    });

    it('returns 201 on success: guest booking', async () => {
        mockVerifyProvider();
        pool.query
            .mockResolvedValueOnce([[{ id: 1, duration_minutes: 60, price: 5000 }]]) // service
            .mockResolvedValueOnce([[], []])                                           // no conflict
            .mockResolvedValueOnce([{ insertId: 42 }]);                               // insert appointment
        getExpandedTimeBlocksForDate.mockResolvedValue([]); // no time block conflicts

        const res = await request(app)
            .post('/calendar/appointments')
            .set('Authorization', `Bearer ${providerToken}`)
            .send(baseBody);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.appointmentId).toBe(42);
    });

    it('returns 201 on success: registered user booking (user found by email)', async () => {
        mockVerifyProvider();
        pool.query
            .mockResolvedValueOnce([[{ id: 1, duration_minutes: 30, price: 3000 }]]) // service
            // getSalonHoursByProviderId is a named export mock (not pool.query)
            .mockResolvedValueOnce([[{ id: 5 }]])     // find user by email
            .mockResolvedValueOnce([{ affectedRows: 1 }]) // update user name/phone
            .mockResolvedValueOnce([[], []])           // no conflict
            .mockResolvedValueOnce([{ insertId: 43 }]); // insert appointment
        getExpandedTimeBlocksForDate.mockResolvedValue([]);

        const res = await request(app)
            .post('/calendar/appointments')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({ ...baseBody, is_guest: false, user_email: 'existing@user.com' });
        expect(res.status).toBe(201);
        expect(res.body.appointmentId).toBe(43);
    });
});

// ─── DELETE /appointments/:id ─────────────────────────────────────────
describe('DELETE /calendar/appointments/:id', () => {
    it('returns 404 when appointment is not found', async () => {
        mockVerifyProvider();
        pool.query.mockResolvedValueOnce([[], []]); // appointment not found
        const res = await request(app)
            .delete('/calendar/appointments/999')
            .set('Authorization', `Bearer ${providerToken}`);
        expect(res.status).toBe(404);
    });

    it('returns 400 when appointment is already canceled', async () => {
        mockVerifyProvider();
        pool.query.mockResolvedValueOnce([[{
            id: 5, status: 'canceled', provider_id: 1,
            user_id: null, customer_email: null
        }]]);
        const res = await request(app)
            .delete('/calendar/appointments/5')
            .set('Authorization', `Bearer ${providerToken}`);
        expect(res.status).toBe(400);
    });

    it('returns 403 when appointment belongs to a different provider', async () => {
        mockVerifyProvider();
        pool.query.mockResolvedValueOnce([[{
            id: 5, status: 'scheduled', provider_id: 999, // different provider
            user_id: null, customer_email: null
        }]]);
        const res = await request(app)
            .delete('/calendar/appointments/5')
            .set('Authorization', `Bearer ${providerToken}`);
        expect(res.status).toBe(403);
    });

    it('returns 200 on successful cancellation', async () => {
        mockVerifyProvider();
        pool.query
            .mockResolvedValueOnce([[{
                id: 5, status: 'scheduled', provider_id: 1,
                service_id: 1, user_id: null, appointment_start: '2026-12-15 10:00:00',
                customer_email: null, customer_name: null,
                salon_name: 'Test Salon', service_name: 'Haircut', provider_name: 'Test Provider'
            }]])
            .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE appointment
        const res = await request(app)
            .delete('/calendar/appointments/5')
            .set('Authorization', `Bearer ${providerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── POST /services ───────────────────────────────────────────────────
describe('POST /calendar/services', () => {
    it('returns 400 when name, duration or price is missing', async () => {
        mockVerifyProvider();
        const res = await request(app)
            .post('/calendar/services')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({ name: 'Haircut' }); // missing duration_minutes and price
        expect(res.status).toBe(400);
    });

    it('returns 201 on success', async () => {
        mockVerifyProvider();
        pool.query.mockResolvedValueOnce([{ insertId: 7 }]);
        const res = await request(app)
            .post('/calendar/services')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({ name: 'Haircut', duration_minutes: 45, price: 4000 });
        expect(res.status).toBe(201);
        expect(res.body.serviceId).toBe(7);
    });
});

// ─── DELETE /services/:id ─────────────────────────────────────────────
describe('DELETE /calendar/services/:id', () => {
    it('returns 400 when the service has active bookings', async () => {
        mockVerifyProvider();
        pool.query
            .mockResolvedValueOnce([[{ id: 1, provider_id: 1 }]]) // service belongs to provider
            .mockResolvedValueOnce([[{ count: 3 }]]);              // 3 active appointments
        const res = await request(app)
            .delete('/calendar/services/1')
            .set('Authorization', `Bearer ${providerToken}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/3/); // message includes the count
    });

    it('returns 200 on successful deletion', async () => {
        mockVerifyProvider();
        pool.query
            .mockResolvedValueOnce([[{ id: 1, provider_id: 1 }]]) // service belongs to provider
            .mockResolvedValueOnce([[{ count: 0 }]])               // no active appointments
            .mockResolvedValueOnce([{ affectedRows: 1 }]);         // DELETE service
        const res = await request(app)
            .delete('/calendar/services/1')
            .set('Authorization', `Bearer ${providerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

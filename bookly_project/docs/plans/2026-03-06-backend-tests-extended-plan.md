# Extended Backend Test Suite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ~36 integration tests covering `ProvLoginApi`, `calendarApi`, and `userApi` — the three highest-risk backend modules not yet covered by the existing 47-test suite.

**Architecture:** Follow the pattern in `tests/integration/auth.test.js`. Mock `sql/database.js`, `sql/users.js`, and service dependencies. Mount each router on a fresh `express()` app — never import `server.js` (it connects to MySQL on load).

**Tech Stack:** Jest 29, Supertest 7, CommonJS, bcryptjs.

**IMPORTANT:** Do NOT make any git commits at any step.

---

## Critical Pattern: mock return format

`pool.query` and `connection.query` both return `[rows, fields]`. Destructuring:
```js
const [rows] = await pool.query(...);
```

So mock as:
- Empty SELECT: `mockResolvedValueOnce([[], []])`
- Rows found: `mockResolvedValueOnce([[{ id: 1, name: 'X' }]])`
- INSERT/UPDATE/DELETE: `mockResolvedValueOnce([{ insertId: 1 }])` or `[{ affectedRows: 1 }]`

---

## Task 1: provAuth.test.js

**Files:**
- Create: `backend/tests/integration/provAuth.test.js`

**Run after creating:**
```bash
cd backend && npx jest tests/integration/provAuth.test.js --no-coverage
```
Expected: All tests pass.

**Step 1: Create the file with the content below**

```javascript
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
```

**Step 2: Run and verify all tests pass**

```bash
cd backend && npx jest tests/integration/provAuth.test.js --no-coverage --verbose
```

Expected output: `Tests: 14 passed, 14 total` (or close).

If a test fails, read the error carefully:
- `pool.query is not a mock function` → the jest.mock path is wrong. Double-check the relative path from the test file to `sql/database.js`.
- `Cannot find module` → check the path in `require('../../api/auth/ProvLoginApi')`.
- `Expected 200, received 500` → add a `console.error` spy or check if the mock has wrong number of return values. Use `pool.query.mock.calls` to see what was called.

---

## Task 2: calendar.test.js

**Files:**
- Create: `backend/tests/integration/calendar.test.js`

**Source under test:** `backend/api/calendarApi.js`

**Key middleware chain:** ALL routes go through `AuthMiddleware → requireRole(['provider']) → verifyProvider`.

`verifyProvider` calls `pool.query('SELECT id, status FROM providers WHERE id = ?', [providerId])` on every request. This means **every single test must mock `pool.query` for `verifyProvider` as the first call**, before any route-level mocks.

**Run after creating:**
```bash
cd backend && npx jest tests/integration/calendar.test.js --no-coverage
```

**Step 1: Create the file with the content below**

```javascript
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

// Helper: mock verifyProvider to pass (every test must call this first)
function mockVerifyProvider() {
    pool.query.mockResolvedValueOnce([[{ id: 1, status: 'active' }]]);
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
        expect(res.body.today_count).toBe(3);
        expect(res.body.weekly_revenue).toBe(15000);
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
```

**Step 2: Run and verify all tests pass**

```bash
cd backend && npx jest tests/integration/calendar.test.js --no-coverage --verbose
```

Expected: All tests pass.

**Common pitfall:** If `verifyProvider` tests fail with 403, check that the token has `role: 'provider'` (not `'customer'`). AuthMiddleware sets `req.user`, and `requireRole(['provider'])` checks `req.user.role`.

---

## Task 3: user.test.js

**Files:**
- Create: `backend/tests/integration/user.test.js`

**Source under test:** `backend/api/userApi.js`

**Key mocking detail:** userApi imports from BOTH `sql/users.js` (named functions like `getUserById`, `checkEmailExists`) AND `sql/database.js` (pool + named functions like `getServiceById`, `getAppointmentById`). Both modules must be mocked.

**Key transaction detail:** `POST /appointments` uses `pool.getConnection()` with a transaction. The `connection.query` calls (inside the transaction) are on `mockConnection.query`, NOT `pool.query`. After the transaction commits, `pool.query` is called once to fetch the new appointment details.

**Run after creating:**
```bash
cd backend && npx jest tests/integration/user.test.js --no-coverage
```

**Step 1: Create the file with the content below**

```javascript
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
const {
    getUserById, updateUserProfile, updateUserPassword,
    getUserPasswordHash, checkEmailExists, deleteUser, createRating, getAppointmentById: _unused
} = require('../../sql/users.js');

const {
    pool, getServiceById, getProviderById, getSalonById,
    getUserAppointments, getAppointmentById
} = require('../../sql/database.js');

const mockConnection = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn()
};

let app;
let customerToken;
let correctPasswordHash;

beforeAll(async () => {
    setTestEnv();
    customerToken = makeAccessToken({ userId: 1, role: 'customer', name: 'Test User' });
    correctPasswordHash = await bcrypt.hash('mypassword', 1);
    const a = express();
    a.use(express.json());
    a.use(cookieParser());
    a.use('/user', require('../../api/userApi'));
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

// ─── GET /profile ─────────────────────────────────────────────────────
describe('GET /user/profile', () => {
    it('returns user profile (200)', async () => {
        getUserById.mockResolvedValueOnce({
            id: 1, name: 'Test User', email: 'user@test.com',
            phone: '+36301234567', address: null, role: 'customer',
            status: 'active', profile_picture_url: null, created_at: '2026-01-01'
        });
        const res = await request(app)
            .get('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('user@test.com');
    });

    it('returns 404 when user not found', async () => {
        getUserById.mockResolvedValueOnce(null);
        const res = await request(app)
            .get('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(404);
    });
});

// ─── PUT /profile ─────────────────────────────────────────────────────
describe('PUT /user/profile', () => {
    it('returns 400 when name is empty', async () => {
        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: '', email: 'user@test.com' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when email is already taken by another user', async () => {
        checkEmailExists.mockResolvedValueOnce(true); // email taken
        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: 'Test', email: 'taken@test.com' });
        expect(res.status).toBe(400);
    });

    it('returns 200 on successful profile update', async () => {
        checkEmailExists.mockResolvedValueOnce(false);
        updateUserProfile.mockResolvedValueOnce(true);
        getUserById.mockResolvedValueOnce({
            id: 1, name: 'New Name', email: 'new@test.com',
            phone: '+36301234567', address: null, role: 'customer',
            status: 'active', profile_picture_url: null, created_at: '2026-01-01'
        });
        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: 'New Name', email: 'new@test.com', phone: '+36301234567' });
        expect(res.status).toBe(200);
        expect(res.body.user.name).toBe('New Name');
    });
});

// ─── PUT /password ────────────────────────────────────────────────────
describe('PUT /user/password', () => {
    it('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'old' }); // missing newPassword and confirmPassword
        expect(res.status).toBe(400);
    });

    it('returns 400 when new password is too short (< 6 chars)', async () => {
        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'mypassword', newPassword: 'abc', confirmPassword: 'abc' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when current password is wrong', async () => {
        getUserPasswordHash.mockResolvedValueOnce(correctPasswordHash);
        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });
        expect(res.status).toBe(400);
    });

    it('returns 200 on successful password change', async () => {
        getUserPasswordHash.mockResolvedValueOnce(correctPasswordHash);
        updateUserPassword.mockResolvedValueOnce(true);
        getUserById.mockResolvedValueOnce({ id: 1, name: 'Test', email: 'user@test.com' });
        const res = await request(app)
            .put('/user/password')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ currentPassword: 'mypassword', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── POST /appointments ───────────────────────────────────────────────
describe('POST /user/appointments', () => {
    it('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ provider_id: 1 }); // missing service_id, appointment_date, appointment_time
        expect(res.status).toBe(400);
    });

    it('returns 404 when service does not exist', async () => {
        getServiceById.mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ provider_id: 1, service_id: 999, appointment_date: '2026-12-15', appointment_time: '10:00' });
        expect(res.status).toBe(404);
    });

    it('returns 409 when provider has a conflicting appointment', async () => {
        // service.provider_id must match provider_id in body
        getServiceById.mockResolvedValueOnce({ id: 1, duration_minutes: 60, price: 5000, provider_id: 1, opening_hours: 8, closing_hours: 20 });
        getProviderById.mockResolvedValueOnce({ id: 1, status: 'active', salon_id: 1 });
        getSalonById.mockResolvedValueOnce({ id: 1, name: 'Test Salon', latitude: 47.5, longitude: 19.0 });

        // connection.query #1: user's own appointments on that day → empty (no travel conflict)
        mockConnection.query.mockResolvedValueOnce([[], []]);
        // connection.query #2: provider conflict check → conflict found
        mockConnection.query.mockResolvedValueOnce([[{ id: 99 }]]);

        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ provider_id: 1, service_id: 1, appointment_date: '2026-12-15', appointment_time: '10:00' });
        expect(res.status).toBe(409);
        expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('returns 201 on successful booking', async () => {
        getServiceById.mockResolvedValueOnce({ id: 1, duration_minutes: 60, price: 5000, provider_id: 1, opening_hours: 8, closing_hours: 20 });
        getProviderById.mockResolvedValueOnce({ id: 1, status: 'active', salon_id: 1 });
        getSalonById.mockResolvedValueOnce({ id: 1, name: 'Test Salon', latitude: 47.5, longitude: 19.0 });

        mockConnection.query
            .mockResolvedValueOnce([[], []])      // #1 no user appointment conflicts
            .mockResolvedValueOnce([[], []])      // #2 no provider conflicts
            .mockResolvedValueOnce([{ insertId: 55 }]); // #3 INSERT appointment

        // After commit: pool.query fetches the new appointment for the response
        pool.query.mockResolvedValueOnce([[{
            id: 55, appointment_start: '2026-12-15 10:00:00', appointment_end: '2026-12-15 11:00:00',
            comment: null, price: 5000, status: 'scheduled', created_at: '2026-03-06',
            provider_name: 'Provider', service_name: 'Haircut', salon_name: 'Test Salon',
            customer_email: 'user@test.com', customer_name: 'Test User'
        }]]);

        const res = await request(app)
            .post('/user/appointments')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ provider_id: 1, service_id: 1, appointment_date: '2026-12-15', appointment_time: '10:00' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.appointment.id).toBe(55);
    });
});

// ─── DELETE /appointments/:id ─────────────────────────────────────────
describe('DELETE /user/appointments/:id', () => {
    it('returns 403 when appointment belongs to another user', async () => {
        getAppointmentById.mockResolvedValueOnce({ id: 1, user_id: 999, status: 'scheduled' }); // user 999, not 1
        const res = await request(app)
            .delete('/user/appointments/1')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
    });

    it('returns 400 when appointment is not scheduled (already canceled)', async () => {
        getAppointmentById.mockResolvedValueOnce({ id: 1, user_id: 1, status: 'canceled' });
        const res = await request(app)
            .delete('/user/appointments/1')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(400);
    });

    it('returns 200 on successful cancellation', async () => {
        getAppointmentById.mockResolvedValueOnce({ id: 1, user_id: 1, status: 'scheduled' });
        pool.query
            .mockResolvedValueOnce([[{
                appointment_start: '2026-12-15 10:00:00', service_id: 1, provider_id: 1,
                customer_email: 'user@test.com', customer_name: 'Test User',
                salon_name: 'Test Salon', service_name: 'Haircut', provider_name: 'Provider'
            }]])
            .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE status = canceled
        const res = await request(app)
            .delete('/user/appointments/1')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── POST /ratings ────────────────────────────────────────────────────
describe('POST /user/ratings', () => {
    it('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/user/ratings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ appointmentId: 1 }); // missing salonId, providerId, salonRating, providerRating
        expect(res.status).toBe(400);
    });

    it('returns 400 when rating is out of range (0 is invalid, must be 1-5)', async () => {
        const res = await request(app)
            .post('/user/ratings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ appointmentId: 1, salonId: 1, providerId: 1, salonRating: 0, providerRating: 5 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when appointment is not completed', async () => {
        getAppointmentById.mockResolvedValueOnce({ id: 1, user_id: 1, status: 'scheduled' }); // not completed
        const res = await request(app)
            .post('/user/ratings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ appointmentId: 1, salonId: 1, providerId: 1, salonRating: 5, providerRating: 4 });
        expect(res.status).toBe(400);
    });

    it('returns 200 on successful rating submission', async () => {
        getAppointmentById.mockResolvedValueOnce({ id: 1, user_id: 1, status: 'completed' });
        createRating.mockResolvedValueOnce(true);
        const res = await request(app)
            .post('/user/ratings')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ appointmentId: 1, salonId: 1, providerId: 1, salonRating: 5, providerRating: 4 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── DELETE /account ──────────────────────────────────────────────────
describe('DELETE /user/account', () => {
    it('returns 400 when password is not provided', async () => {
        const res = await request(app)
            .delete('/user/account')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({});
        expect(res.status).toBe(400);
    });

    it('returns 400 when password is wrong', async () => {
        getUserPasswordHash.mockResolvedValueOnce(correctPasswordHash);
        const res = await request(app)
            .delete('/user/account')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ password: 'wrongpassword' });
        expect(res.status).toBe(400);
    });

    it('returns 200 on successful account deletion (soft delete)', async () => {
        getUserPasswordHash.mockResolvedValueOnce(correctPasswordHash);
        // 3 pool.execute calls: cancel appointments, delete saved_salons, delete RefTokens
        pool.execute
            .mockResolvedValueOnce([{ affectedRows: 0 }]) // cancel appointments
            .mockResolvedValueOnce([{ affectedRows: 0 }]) // delete saved_salons
            .mockResolvedValueOnce([{ affectedRows: 1 }]); // delete RefTokens
        deleteUser.mockResolvedValueOnce(true);
        const res = await request(app)
            .delete('/user/account')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ password: 'mypassword' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(deleteUser).toHaveBeenCalledWith(1);
    });
});
```

**Step 2: Run and verify all tests pass**

```bash
cd backend && npx jest tests/integration/user.test.js --no-coverage --verbose
```

Expected: All tests pass.

**Common pitfalls:**
- `getAppointmentById` is imported from BOTH `sql/users.js` (as `getAppointmentById`) and `sql/database.js` (as `getAppointmentById`). userApi.js actually imports it from `database.js`. Mock it via `const { getAppointmentById } = require('../../sql/database.js')` in the test. The mock for `sql/users.js` exports an unused `getAppointmentById` — that's OK, just don't use it.
- For POST /appointments: `appointment_date: '2026-12-15'` must be a FUTURE date. The route validates `appointmentStart <= new Date()` → 400. Since we're in 2026-03-06, December 15 is in the future. ✓
- The `createRating` in the POST /ratings route is imported from `sql/users.js` — mock it there.

---

## Final Step: Run the full test suite

After all 3 tasks are complete, run the full suite to verify nothing is broken:

```bash
cd backend && npx jest --no-coverage
```

Expected: ~83 tests passing (47 existing + ~36 new).

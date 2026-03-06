# Backend Test Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Jest + Supertest test suite covering auth, middleware, search, and utility functions — no database or Docker required.

**Architecture:** Each API router is mounted on a fresh `express()` app in the test file, bypassing `server.js` (which connects to MySQL on import). `sql/database.js` is fully mocked via `jest.mock()` — all `pool.query`, `pool.execute`, and named query functions are replaced with `jest.fn()` so tests control return values precisely.

**Tech Stack:** Jest 29, Supertest 7, jsonwebtoken (already installed), CommonJS

---

### Task 1: Install dependencies and configure Jest

**Files:**
- Modify: `backend/package.json`
- Create: `backend/jest.config.js`

**Step 1: Install test packages**

Run from `backend/` directory:
```bash
npm install --save-dev jest supertest
```

**Step 2: Add test scripts to `backend/package.json`**

Find the `"scripts"` section and add two entries:
```json
"test": "jest --coverage",
"test:watch": "jest --watch"
```

**Step 3: Create `backend/jest.config.js`**

```js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'api/**/*.js',
        'services/**/*.js',
        'sql/**/*.js',
        '!**/node_modules/**'
    ]
};
```

**Step 4: Verify Jest runs**

```bash
cd backend && npx jest --listTests
```

Expected: no output yet (no test files), exit code 0.

**Step 5: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/jest.config.js
git commit -m "chore: install jest and supertest, add test scripts"
```

---

### Task 2: Create shared test setup helpers

**Files:**
- Create: `backend/tests/setup/testHelpers.js`

**Step 1: Write the helper**

This file generates real JWTs using a fixed test secret so integration tests can create auth tokens without touching the database.

Create `backend/tests/setup/testHelpers.js`:

```js
const jwt = require('jsonwebtoken');

const TEST_JWT_SECRET = 'test-jwt-secret-bookly';
const TEST_REFRESH_SECRET = 'test-refresh-secret-bookly';

function setTestEnv() {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_REFRESH_SECRET;
}

function makeAccessToken(payload = {}) {
    const defaults = { email: 'test@example.com', userId: 1, name: 'Test User', role: 'customer' };
    return jwt.sign({ ...defaults, ...payload }, TEST_JWT_SECRET, { expiresIn: '15m' });
}

function makeRefreshToken(payload = {}) {
    const defaults = { email: 'test@example.com', userId: 1, name: 'Test User', role: 'customer' };
    return jwt.sign({ ...defaults, ...payload }, TEST_REFRESH_SECRET, { expiresIn: '7d' });
}

function makeExpiredAccessToken(payload = {}) {
    const defaults = { email: 'test@example.com', userId: 1, name: 'Test User', role: 'customer' };
    return jwt.sign({ ...defaults, ...payload }, TEST_JWT_SECRET, { expiresIn: '-1s' });
}

module.exports = { setTestEnv, makeAccessToken, makeRefreshToken, makeExpiredAccessToken };
```

**Step 2: Verify the file loads without error**

```bash
cd backend && node -e "require('./tests/setup/testHelpers'); console.log('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add backend/tests/setup/testHelpers.js
git commit -m "test: add shared JWT helper for test suite"
```

---

### Task 3: Unit tests — locationService.js

**Files:**
- Create: `backend/tests/unit/locationService.test.js`
- Read: `backend/services/locationService.js`

**Step 1: Write the failing tests**

Create `backend/tests/unit/locationService.test.js`:

```js
const { calculateDistance, findNearbySalons } = require('../../services/locationService');

// We access parseAddress via module internals — test through findNearbySalons
// and test calculateDistance + findNearbySalons directly since they are exported.

describe('calculateDistance', () => {
    test('returns 0 for identical coordinates', () => {
        const dist = calculateDistance(47.497913, 19.03991, 47.497913, 19.03991);
        expect(dist).toBe(0);
    });

    test('calculates distance between Budapest and Debrecen (~220 km)', () => {
        // Budapest: 47.497913, 19.03991
        // Debrecen: 47.531, 21.624
        const dist = calculateDistance(47.497913, 19.03991, 47.531, 21.624);
        expect(dist).toBeGreaterThan(180);
        expect(dist).toBeLessThan(260);
    });

    test('is symmetric (A→B equals B→A)', () => {
        const d1 = calculateDistance(47.497913, 19.03991, 47.531, 21.624);
        const d2 = calculateDistance(47.531, 21.624, 47.497913, 19.03991);
        expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
    });
});

describe('findNearbySalons', () => {
    const userLat = 47.497913;
    const userLon = 19.03991;

    const salons = [
        { id: 1, name: 'Close Salon', latitude: 47.5, longitude: 19.05 },       // ~0.4 km
        { id: 2, name: 'Far Salon', latitude: 47.531, longitude: 21.624 },       // ~220 km
        { id: 3, name: 'No Coords Salon', latitude: null, longitude: null }
    ];

    test('filters salons outside the radius', () => {
        const results = findNearbySalons(salons, userLat, userLon, 10);
        expect(results.map(s => s.id)).toEqual([1]);
    });

    test('sorts by distance ascending', () => {
        const results = findNearbySalons(salons, userLat, userLon, 300);
        expect(results[0].id).toBe(1);
        expect(results[1].id).toBe(2);
    });

    test('excludes salons with null coordinates', () => {
        const results = findNearbySalons(salons, userLat, userLon, 300);
        const ids = results.map(s => s.id);
        expect(ids).not.toContain(3);
    });

    test('attaches rounded distance property to each result', () => {
        const results = findNearbySalons(salons, userLat, userLon, 10);
        expect(results[0].distance).toBeDefined();
        expect(typeof results[0].distance).toBe('number');
    });

    test('returns empty array when no salons within radius', () => {
        const results = findNearbySalons(salons, userLat, userLon, 0.1);
        expect(results).toEqual([]);
    });
});
```

**Step 2: Run to verify they fail (no implementation issues) or pass**

```bash
cd backend && npx jest tests/unit/locationService.test.js --verbose
```

Expected: All 8 tests PASS — these are pure math functions with no dependencies.

**Step 3: Commit**

```bash
git add backend/tests/unit/locationService.test.js
git commit -m "test: add unit tests for locationService calculateDistance and findNearbySalons"
```

---

### Task 4: Unit tests — expandTimeBlocks (database.js pure function)

**Files:**
- Create: `backend/tests/unit/expandTimeBlocks.test.js`
- Read: `backend/sql/database.js` lines 410-488

**Step 1: Write the failing tests**

`expandTimeBlocks` is exported from `database.js`. It is a pure function with no DB calls — test it directly.

Create `backend/tests/unit/expandTimeBlocks.test.js`:

```js
// expandTimeBlocks is a pure function exported from database.js
// We mock the pool to prevent MySQL connection on require
jest.mock('../../sql/database.js', () => {
    const actual = jest.requireActual('../../sql/database.js');
    return {
        ...actual,
        pool: { query: jest.fn(), execute: jest.fn() }
    };
});

const { expandTimeBlocks } = require('../../sql/database.js');

describe('expandTimeBlocks', () => {
    const startDate = '2026-03-10';
    const endDate = '2026-03-14';

    test('includes a non-recurring block that falls within range', () => {
        const block = {
            id: 1,
            is_recurring: false,
            start_datetime: '2026-03-11 10:00:00',
            end_datetime: '2026-03-11 11:00:00',
            notes: 'Break'
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
        expect(result[0].is_recurring).toBe(false);
    });

    test('excludes a non-recurring block entirely outside the range', () => {
        const block = {
            id: 2,
            is_recurring: false,
            start_datetime: '2026-03-20 10:00:00',
            end_datetime: '2026-03-20 11:00:00',
            notes: null
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(0);
    });

    test('expands a daily recurring block into one occurrence per day in range', () => {
        const block = {
            id: 3,
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_days: null,
            recurrence_end_date: null,
            start_datetime: '2026-03-01 09:00:00',
            end_datetime: '2026-03-01 09:30:00',
            notes: 'Morning break'
        };
        // Range is 5 days (Mon 10 → Fri 14)
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(5);
        expect(result.every(r => r.is_recurring)).toBe(true);
    });

    test('expands weekly recurring block only for matching weekdays', () => {
        const block = {
            id: 4,
            is_recurring: true,
            recurrence_pattern: 'weekly',
            recurrence_days: JSON.stringify([1, 3]), // Monday=1, Wednesday=3
            recurrence_end_date: null,
            start_datetime: '2026-03-01 14:00:00',
            end_datetime: '2026-03-01 15:00:00',
            notes: null
        };
        // 2026-03-10 is Tuesday, 2026-03-11 Wednesday, 2026-03-12 Thursday, 2026-03-13 Friday, 2026-03-14 Saturday
        // Wait: Mon=1, Wed=3. In JS getDay: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
        // 2026-03-10: Tuesday (getDay=2) — no
        // 2026-03-11: Wednesday (getDay=3) — YES
        // 2026-03-12: Thursday (getDay=4) — no
        // 2026-03-13: Friday (getDay=5) — no
        // 2026-03-14: Saturday (getDay=6) — no
        // So only Wednesday March 11 matches
        const result = expandTimeBlocks([block], startDate, endDate);
        expect(result).toHaveLength(1);
    });

    test('respects recurrence_end_date and stops expanding after it', () => {
        const block = {
            id: 5,
            is_recurring: true,
            recurrence_pattern: 'daily',
            recurrence_days: null,
            recurrence_end_date: '2026-03-11', // ends Tuesday
            start_datetime: '2026-03-01 08:00:00',
            end_datetime: '2026-03-01 08:30:00',
            notes: null
        };
        const result = expandTimeBlocks([block], startDate, endDate);
        // Only March 10 and 11 are within both range AND before recurrence_end_date
        expect(result).toHaveLength(2);
    });

    test('returns empty array for empty input', () => {
        expect(expandTimeBlocks([], startDate, endDate)).toEqual([]);
    });
});
```

**Step 2: Run tests**

```bash
cd backend && npx jest tests/unit/expandTimeBlocks.test.js --verbose
```

Expected: All 6 tests PASS.

**Step 3: If any test fails, check the date math and adjust the comment above about weekdays**

To verify weekday numbers for the test range:
```bash
node -e "
const days = ['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14'];
days.forEach(d => console.log(d, new Date(d).getDay()));
"
```

**Step 4: Commit**

```bash
git add backend/tests/unit/expandTimeBlocks.test.js
git commit -m "test: add unit tests for expandTimeBlocks recurring/non-recurring logic"
```

---

### Task 5: Integration tests — AuthMiddleware

**Files:**
- Create: `backend/tests/integration/authMiddleware.test.js`
- Read: `backend/api/auth/AuthMiddleware.js`

**Step 1: Write the failing tests**

`AuthMiddleware` uses `pool.query()` directly to check user/provider status in DB. We mock `database.js` and mount the middleware on a test route.

Create `backend/tests/integration/authMiddleware.test.js`:

```js
const request = require('supertest');
const express = require('express');
const { setTestEnv, makeAccessToken, makeExpiredAccessToken } = require('../setup/testHelpers');

// Mock DB before requiring anything that uses it
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

// Build a minimal app with a protected test route
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
        // pool.query is called once: SELECT status FROM users WHERE id = ?
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
```

**Step 2: Run tests**

```bash
cd backend && npx jest tests/integration/authMiddleware.test.js --verbose
```

Expected: All 9 tests PASS.

**Step 3: Commit**

```bash
git add backend/tests/integration/authMiddleware.test.js
git commit -m "test: add integration tests for AuthMiddleware token and account-status scenarios"
```

---

### Task 6: Integration tests — POST /auth/register and POST /auth/login

**Files:**
- Create: `backend/tests/integration/auth.test.js`

**Step 1: Write the failing tests**

`LoginApi.js` imports `getUserByEmail` and `addUser` from `users.js`. We mock `users.js` directly so we control what those functions return without database involvement. We also mock `logService` and `emailService` which fire side effects.

Create `backend/tests/integration/auth.test.js`:

```js
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { setTestEnv, makeRefreshToken } = require('../setup/testHelpers');

// Mock all external dependencies before imports
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
    // LoginApi requires database.js on load — it's already mocked above
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
        getUserByEmail.mockResolvedValueOnce(null); // email not taken
        addUser.mockResolvedValueOnce(5);           // new user id

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
        // bcryptjs.compare will return false because 'wrongpassword' won't match the hash
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

        // pool.query is called twice: INSERT RefTokens, UPDATE last_login
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
```

**Step 2: Run tests**

```bash
cd backend && npx jest tests/integration/auth.test.js --verbose
```

Expected: All 9 tests PASS.

**Step 3: Commit**

```bash
git add backend/tests/integration/auth.test.js
git commit -m "test: add integration tests for register and login endpoints"
```

---

### Task 7: Integration tests — POST /auth/refresh and POST /auth/logout

**Files:**
- Modify: `backend/tests/integration/auth.test.js`

**Step 1: Append the refresh and logout test suites to the existing file**

Add at the bottom of `backend/tests/integration/auth.test.js`:

```js
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
        // SELECT from RefTokens → empty result
        pool.query.mockResolvedValueOnce([[]]);

        const res = await request(buildApp())
            .post('/auth/refresh')
            .set('Cookie', `refreshToken=${refreshToken}`);
        expect(res.status).toBe(401);
    });

    test('returns 401 when customer is banned', async () => {
        const refreshToken = makeRefreshToken({ role: 'customer', userId: 1 });
        // RefTokens row exists
        pool.query.mockResolvedValueOnce([[{ id: 10, user_id: 1, provider_id: null, admin_id: null }]]);
        // Customer query → banned
        pool.query.mockResolvedValueOnce([[{ id: 1, status: 'banned' }]]);

        const res = await request(buildApp())
            .post('/auth/refresh')
            .set('Cookie', `refreshToken=${refreshToken}`);
        expect(res.status).toBe(401);
        expect(res.body.banned).toBe(true);
    });

    test('returns 200 with new accessToken on success', async () => {
        const refreshToken = makeRefreshToken({ role: 'customer', userId: 1 });
        // RefTokens row
        pool.query.mockResolvedValueOnce([[{ id: 10, user_id: 1, provider_id: null, admin_id: null }]]);
        // Customer active
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
        // Cookie should be cleared (set to empty or expires in past)
        const setCookie = res.headers['set-cookie'];
        expect(setCookie).toBeDefined();
    });
});
```

**Step 2: Run the full auth test file**

```bash
cd backend && npx jest tests/integration/auth.test.js --verbose
```

Expected: All 15 tests PASS.

**Step 3: Commit**

```bash
git add backend/tests/integration/auth.test.js
git commit -m "test: add refresh token and logout integration tests"
```

---

### Task 8: Integration tests — searchApi

**Files:**
- Create: `backend/tests/integration/search.test.js`

**Step 1: Write the failing tests**

`searchApi.js` calls `database.getAllSalons()`, `database.getProvidersBySalonId()`, etc. — all named exports we can mock. For geocoding routes, we also mock `locationService.js`.

Create `backend/tests/integration/search.test.js`:

```js
const request = require('supertest');
const express = require('express');

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

jest.mock('../../services/locationService.js', () => ({
    placeToCoordinate: jest.fn(),
    findNearbySalons: jest.fn(),
    coordinateToPlace: jest.fn(),
    addressAutocomplete: jest.fn(),
    calculateDistance: jest.fn()
}));

const database = require('../../sql/database.js');
const locationService = require('../../services/locationService.js');

function buildApp() {
    const app = express();
    app.use(express.json());
    const searchRouter = require('../../api/searchApi.js');
    app.use('/api/search', searchRouter);
    return app;
}

beforeEach(() => jest.clearAllMocks());

describe('POST /api/search/nearby', () => {
    test('returns 400 when no coordinates or place are provided', async () => {
        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when latitude is out of valid range', async () => {
        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ latitude: 200, longitude: 19 });
        expect(res.status).toBe(400);
    });

    test('returns 400 when geocoding fails for a place name', async () => {
        locationService.placeToCoordinate.mockRejectedValueOnce(new Error('Not found'));

        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ place: 'NonexistentPlace123' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 200 with salons when coordinates are valid', async () => {
        const mockSalon = { id: 1, name: 'Test Salon', latitude: 47.5, longitude: 19.0 };
        database.getAllSalons.mockResolvedValueOnce([mockSalon]);
        locationService.findNearbySalons.mockReturnValueOnce([{ ...mockSalon, distance: 0.5 }]);
        database.getProvidersBySalonId.mockResolvedValueOnce([]);
        database.getServicesBySalonId.mockResolvedValueOnce([]);

        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ latitude: 47.5, longitude: 19.0, radius_km: 10 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.salons).toHaveLength(1);
        expect(res.body.salons[0].name).toBe('Test Salon');
    });

    test('filters by service_name when provided', async () => {
        const salons = [
            { id: 1, name: 'Hair Salon', type: 'hair', latitude: 47.5, longitude: 19.0,
              services: [{ name: 'Haircut', description: 'A nice cut' }], providers: [] },
            { id: 2, name: 'Nail Salon', type: 'nails', latitude: 47.5, longitude: 19.0,
              services: [{ name: 'Manicure', description: 'Nail art' }], providers: [] }
        ];
        database.getAllSalons.mockResolvedValueOnce(salons.map(({ services, providers, ...s }) => s));
        locationService.findNearbySalons.mockReturnValueOnce(salons.map(s => ({ ...s, distance: 1 })));
        database.getProvidersBySalonId.mockResolvedValue([]);
        database.getServicesBySalonId.mockImplementation(async (id) =>
            salons.find(s => s.id === id)?.services || []
        );

        const res = await request(buildApp())
            .post('/api/search/nearby')
            .send({ latitude: 47.5, longitude: 19.0, service_name: 'hair' });
        expect(res.status).toBe(200);
        expect(res.body.salons).toHaveLength(1);
        expect(res.body.salons[0].id).toBe(1);
    });
});

describe('GET /api/search/salon/:id', () => {
    test('returns 404 when salon is not found', async () => {
        database.getSalonById.mockResolvedValueOnce(null);

        const res = await request(buildApp()).get('/api/search/salon/999');
        expect(res.status).toBe(404);
    });

    test('returns 200 with salon data when found', async () => {
        const salon = { id: 5, name: 'Found Salon' };
        database.getSalonById.mockResolvedValueOnce(salon);
        database.getProvidersBySalonId.mockResolvedValueOnce([]);
        database.getServicesBySalonId.mockResolvedValueOnce([]);
        database.getServicesByProviderId.mockResolvedValueOnce([]);

        const res = await request(buildApp()).get('/api/search/salon/5');
        expect(res.status).toBe(200);
        expect(res.body.salon.name).toBe('Found Salon');
    });
});

describe('GET /api/search/types', () => {
    test('returns 200 with array of types', async () => {
        database.getDistinctSalonTypes.mockResolvedValueOnce(['hair', 'nails', 'massage']);

        const res = await request(buildApp()).get('/api/search/types');
        expect(res.status).toBe(200);
        expect(res.body.types).toEqual(['hair', 'nails', 'massage']);
    });
});
```

**Step 2: Run tests**

```bash
cd backend && npx jest tests/integration/search.test.js --verbose
```

Expected: All 7 tests PASS.

**Step 3: Commit**

```bash
git add backend/tests/integration/search.test.js
git commit -m "test: add integration tests for searchApi nearby, salon lookup, and types"
```

---

### Task 9: Run full suite with coverage

**Step 1: Run all tests**

```bash
cd backend && npm test
```

Expected output: All test suites pass, coverage report printed.

**Step 2: Check coverage output**

Look at the summary table printed to terminal. `api/auth/LoginApi.js`, `api/auth/AuthMiddleware.js`, and `services/locationService.js` should show coverage above 70%.

**Step 3: Commit final state**

```bash
git add backend/coverage/
echo "coverage/" >> backend/.gitignore
git add backend/.gitignore
git commit -m "chore: ignore coverage output directory"
```

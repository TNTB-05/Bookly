# Backend Test Suite Design

**Date:** 2026-03-06
**Scope:** Bookly backend (`/backend`)
**Stack:** Jest + Supertest, CommonJS, mocked MySQL pool

---

## Goals

- Catch regressions in auth, search, calendar, and salon endpoints
- Run without Docker or a live database (fast CI-friendly)
- Cover pure utility functions and critical HTTP routes

---

## Tooling

| Tool | Role |
|---|---|
| `jest` | Test runner, mocking, coverage |
| `supertest` | HTTP-level integration testing against Express routers |
| `jest.fn()` / `jest.mock()` | Intercept `pool.query()` calls |

No ORM, no new architecture. Tests import the same router modules Express uses.

---

## File Structure

```
backend/
  tests/
    unit/
      locationService.test.js
      authHelpers.test.js
    integration/
      auth.test.js
      authMiddleware.test.js
      search.test.js
      calendar.test.js
      salon.test.js
    setup/
      mockDb.js
      testHelpers.js
  jest.config.js
```

---

## Mocking Strategy

All test files that touch the database mock `sql/database.js`:

```js
jest.mock('../../sql/database.js', () => ({
    pool: { query: jest.fn() }
}));
```

Per-test query responses are configured with `mockResolvedValueOnce`. Auth tests set environment variables in `beforeAll`:

```js
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
```

Integration tests mount routers independently — NOT via `server.js` (which connects to MySQL on import):

```js
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', require('../api/auth/LoginApi'));
```

---

## Coverage Plan

### Unit Tests

| File | Functions Covered |
|---|---|
| `locationService.test.js` | `calculateDistance` (Haversine formula), `parseAddress` (city/street/postal extraction), `findNearbySalons` (radius filter + sort) |
| `authHelpers.test.js` | `generateTokens` — correct JWT payload, expiry differences for admin vs customer |

### Integration Tests

| File | Scenarios |
|---|---|
| `auth.test.js` | `POST /auth/register`: missing fields, short password, duplicate email, success |
| | `POST /auth/login`: missing fields, wrong password, banned user, deleted+reactivatable, success |
| | `POST /auth/refresh`: no cookie, invalid token, banned user, success |
| | `POST /auth/logout`: with and without cookie |
| `authMiddleware.test.js` | No token, expired token, invalid token, banned user, banned provider, admin valid |
| `search.test.js` | Missing location param, geocoding mock, results returned with distance |
| `calendar.test.js` | Get appointments for provider, availability slots |
| `salon.test.js` | Get salon info, list services, missing salon ID |

---

## Test Count Estimate

~60–80 test cases total across all files.

---

## Package Changes

Add to `backend/package.json` devDependencies:

```json
"jest": "^29",
"supertest": "^7",
```

Add to scripts:

```json
"test": "jest --coverage",
"test:watch": "jest --watch"
```

Add `jest.config.js`:

```js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'api/**/*.js',
        'services/**/*.js',
        '!**/node_modules/**'
    ]
};
```

# Backend Test Suite — Extended Coverage Design

**Date:** 2026-03-06
**Scope:** Business-critical modules not yet covered

---

## Goal

Extend the existing Jest + Supertest suite to cover the three highest-risk backend modules: provider auth, calendar/appointment management, and customer user API.

## New Test Files

| File | Module | Est. Tests |
|---|---|---|
| `tests/integration/provAuth.test.js` | `api/auth/ProvLoginApi.js` | ~10 |
| `tests/integration/calendar.test.js` | `api/calendarApi.js` | ~12 |
| `tests/integration/user.test.js` | `api/userApi.js` | ~14 |

**Total: ~36 new tests**

## Mocking Strategy

Same pattern as existing suite:
- `jest.mock('../../sql/database.js', ...)` — mock pool.query, pool.execute, all named exports
- `jest.mock('../../sql/users.js', ...)` — mock getUserByEmail, getUserById, etc.
- `jest.mock('../../services/locationService.js', ...)` — mock calculateDistance for travel buffer tests
- `jest.mock('../../services/emailService.js', ...)` — prevent real emails
- `jest.mock('../../services/waitlistService.js', ...)` — prevent side effects

## Key Scenarios Per Module

### ProvLoginApi (Provider Auth)
- `POST /validate-salon-code`: missing code (400), code not found (404), valid code (200)
- `POST /register`: missing fields (400), password < 8 chars (400), duplicate email (409), success creating salon (201), success joining with share code (201)
- `POST /login`: missing fields (400), not found (422), wrong password (422), banned (403), deleted/GDPR (403), success (200)

### calendarApi (Provider Calendar)
Routes require: AuthMiddleware → requireRole(['provider']) → verifyProvider (checks provider owns a salon)
- `GET /statistics`: returns today's count, weekly revenue (200)
- `GET /appointments`: returns appointments array (200)
- `POST /appointments`: missing required fields (400), time outside salon hours (400), slot conflict with existing appointment (409), success guest booking (201), success registered user booking (201)
- `DELETE /appointments/:id`: not found (404), already canceled (400), success (200)
- `POST /services`: missing name/duration/price (400), success (201)
- `DELETE /services/:id`: has active bookings (400), success (200)

### userApi (Customer API)
Routes require: AuthMiddleware
- `GET /profile`: success (200), user not found (404)
- `PUT /profile`: empty name (400), duplicate email (400), success (200)
- `PUT /password`: wrong current password (400), new password too short (400), success (200)
- `POST /appointments`: missing fields (400), slot conflict (409), travel buffer conflict between salons (409), success (201)
- `DELETE /appointments/:id`: not appointment owner (403), already canceled (400), success (200)
- `POST /ratings`: appointment not completed (400), rating out of range (400), success (200)
- `DELETE /account`: wrong password (400), success soft-delete (200)

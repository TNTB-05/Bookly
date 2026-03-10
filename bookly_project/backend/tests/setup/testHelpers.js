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

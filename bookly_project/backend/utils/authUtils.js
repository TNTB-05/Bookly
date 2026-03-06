/**
 * Shared authentication utility functions.
 * Consolidates duplicated token generation from LoginApi and ProvLoginApi.
 */

const jwt = require('jsonwebtoken');

/**
 * Generate access + refresh token pair for customer login.
 * @param {{ email: string, userId: number, name: string, role?: string }} payload
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateCustomerTokens({ email, userId, name, role = 'customer' }) {
    if (!process.env.JWT_SECRET) {
        throw new Error('Server configuration error: JWT_SECRET missing');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('Server configuration error: JWT_REFRESH_SECRET missing');
    }

    const accessToken = jwt.sign(
        { email, userId, name, role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { email, userId, name, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
}

/**
 * Generate access + refresh token pair for provider login.
 * @param {{ email: string, userId: number, name: string }} payload
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateProviderTokens({ email, userId, name }) {
    if (!process.env.JWT_SECRET) {
        throw new Error('Server configuration error: JWT_SECRET missing');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('Server configuration error: JWT_REFRESH_SECRET missing');
    }

    const accessToken = jwt.sign(
        { email, userId, role: 'provider', name },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { email, userId, role: 'provider', name },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
}

/**
 * Generate shorter-lived access + refresh token pair for admin login.
 * @param {{ email: string, adminId: number, name: string }} payload
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateAdminTokens({ email, adminId, name }) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new Error('Server configuration error: JWT secrets missing');
    }

    const accessToken = jwt.sign(
        { email, userId: adminId, name, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
    );

    const refreshToken = jwt.sign(
        { email, userId: adminId, name, role: 'admin' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '1h' }
    );

    return { accessToken, refreshToken };
}

/**
 * Set refresh token as HTTP-only cookie on the response.
 * @param {import('express').Response} res
 * @param {string} refreshToken
 * @param {{ maxAge?: number }} options
 */
function setAuthCookies(res, refreshToken, { maxAge = 7 * 24 * 60 * 60 * 1000 } = {}) {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge
    });
}

module.exports = {
    generateCustomerTokens,
    generateProviderTokens,
    generateAdminTokens,
    setAuthCookies
};

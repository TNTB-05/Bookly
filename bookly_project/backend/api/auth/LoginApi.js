const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByEmail, addUser, reactivateUser } = require('../../sql/userQueries.js');
const {
    findRefreshToken,
    insertUserRefreshToken,
    insertAdminRefreshToken,
    deleteRefreshTokenById,
    deleteRefreshToken,
    getAdminByEmail,
    getAdminById,
    getUserStatus,
    updateUserLastLogin,
    updateAdminLastLogin,
    getUserForReactivation
} = require('../../sql/authQueries.js');
const { getProviderStatus } = require('../../sql/providerQueries.js');
const { generateCustomerTokens, generateAdminTokens, setAuthCookies } = require('../../utils/authUtils.js');
const { logEvent } = require('../../services/logService.js');
const { sendWelcomeEmail } = require('../../services/emailService.js');


//!Endpoints:

// POST /api/auth/register — register a new customer account
router.post('/register', async (request, response) => {
    const { name, email, password } = request.body;

    if (!email || !password || !name) {
        return response.status(400).json({
            success: false,
            message: 'A név, e-mail és jelszó megadása kötelező'
        });
    }

    if (password.length < 6) {
        return response.status(400).json({
            success: false,
            message: 'A jelszónak legalább 6 karakter hosszúnak kell lennie'
        });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return response.status(409).json({
                success: false,
                message: 'Ez az e-mail cím már használatban van'
            });
        }

        await addUser(name, email, hashedPassword, 'customer');

        // Send welcome email (don't block response if it fails)
        sendWelcomeEmail({ email, name, role: 'customer' }).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        // Log registration event (fire-and-forget, actor ID unknown at this point)
        logEvent('INFO', 'USER_SIGNUP', 'user', null, 'user', null, `New user registered: ${email}`).catch(() => {});

        response.status(201).json({
            success: true,
            message: 'Sikeres regisztráció'
        });
    } catch (error) {
        console.error('Registration error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba'
        });
    }
});

// POST /api/auth/login — authenticate customer and return JWT tokens
router.post('/login', async (request, response) => {
    const { email, password } = request.body;

    // Input validation
    if (!email || !password) {
        return response.status(400).json({
            success: false,
            message: 'Az e-mail és jelszó megadása kötelező'
        });
    }

    if (password.length < 6) {
        return response.status(400).json({
            success: false,
            message: 'Hibás e-mail vagy jelszó'
        });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return response.status(422).json({
                success: false,
                message: 'Hibás e-mail vagy jelszó'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return response.status(422).json({
                success: false,
                message: 'Hibás e-mail vagy jelszó'
            });
        }

        // Check if user account is banned
        if (user.status === 'banned') {
            return response.status(403).json({
                success: false,
                message: 'A fiókod le lett tiltva.',
                banned: true,
                reason: 'banned'
            });
        }

        // Check if user account is deleted (self-delete with email still present = reactivatable)
        if (user.status === 'deleted') {
            // If email is still present, user self-deleted (not GDPR) — allow reactivation
            if (user.email) {
                const reactivationToken = jwt.sign(
                    { userId: user.id, purpose: 'reactivation' },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }
                );
                return response.status(200).json({
                    success: true,
                    needsReactivation: true,
                    reactivationToken,
                    message: 'A fiók törölt állapotban van. Újraaktiválás szükséges.'
                });
            }
            // GDPR deleted (no email) — shouldn't match getUserByEmail, but just in case
            return response.status(403).json({
                success: false,
                message: 'A fiók GDPR törlés miatt megszűnt.',
                banned: true,
                reason: 'gdpr'
            });
        }

        // Generate both access and refresh tokens
        const { accessToken, refreshToken } = generateCustomerTokens({ email, userId: user.id, name: user.name });

        // Store refresh token in database (user_id for customers)
        await insertUserRefreshToken(user.id, refreshToken);

        // Update last_login
        await updateUserLastLogin(user.id);

        // Log login event
        await logEvent('INFO', 'USER_LOGIN', 'user', user.id, 'user', user.id, `User ${email} logged in`);

        // Send refresh token as HTTP-only cookie
        setAuthCookies(response, refreshToken);

        response.status(200).json({
            success: true,
            message: 'Sikeres bejelentkezés',
            accessToken
        });
    } catch (error) {
        console.error('Login error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba'
        });
    }
});

// POST /api/auth/refresh — refresh access token using HTTP-only cookie
router.post('/refresh', async (request, response) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
        return response.status(400).json({
            success: false,
            message: 'Frissítő token szükséges'
        });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
        console.error('JWT_REFRESH_SECRET not configured');
        return response.status(500).json({
            success: false,
            message: 'Szerver konfigurációs hiba'
        });
    }

    try {
        // Verify token signature first
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // Check if token exists in database
        const tokenRecord = await findRefreshToken(refreshToken);

        if (!tokenRecord) {
            response.clearCookie('refreshToken');
            return response.status(401).json({
                success: false,
                message: 'Érvénytelen frissítő token'
            });
        }

        // Validate user still exists and is active based on role
        if (decoded.role === 'provider') {
            // Verify token belongs to a provider
            if (!tokenRecord.provider_id) {
                await deleteRefreshTokenById(tokenRecord.id);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Érvénytelen token típus'
                });
            }

            const provider = await getProviderStatus(tokenRecord.provider_id);

            if (!provider || provider.status === 'deleted' || provider.status === 'banned') {
                await deleteRefreshTokenById(tokenRecord.id);
                response.clearCookie('refreshToken');
                const reason = provider && provider.status === 'banned' ? 'banned' : 'gdpr';
                return response.status(401).json({
                    success: false,
                    message: reason === 'banned' ? 'A fiókod le lett tiltva.' : 'A fiók GDPR törlés miatt megszűnt.',
                    banned: true,
                    reason
                });
            }
        } else if (decoded.role === 'admin') {
            // Admin validation - verify token belongs to an admin
            if (!tokenRecord.admin_id) {
                await deleteRefreshTokenById(tokenRecord.id);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Érvénytelen token típus'
                });
            }

            const admin = await getAdminById(tokenRecord.admin_id);

            if (!admin) {
                await deleteRefreshTokenById(tokenRecord.id);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Admin fiók nem található'
                });
            }
        } else {
            // Customer validation - verify token belongs to a user
            if (!tokenRecord.user_id) {
                await deleteRefreshTokenById(tokenRecord.id);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Érvénytelen token típus'
                });
            }

            const user = await getUserStatus(tokenRecord.user_id);

            if (!user || user.status === 'banned' || user.status === 'deleted') {
                await deleteRefreshTokenById(tokenRecord.id);
                response.clearCookie('refreshToken');
                const reason = user && user.status === 'banned' ? 'banned' : 'gdpr';
                return response.status(401).json({
                    success: false,
                    message: reason === 'banned' ? 'A fiókod le lett tiltva.' : 'A fiók GDPR törlés miatt megszűnt.',
                    banned: true,
                    reason
                });
            }
        }

        // Generate new access token with userId and role
        // Admin gets shorter-lived access token for security
        const accessTokenExpiry = decoded.role === 'admin' ? '5m' : '15m';
        const newAccessToken = jwt.sign(
            { email: decoded.email, userId: decoded.userId, role: decoded.role },
            process.env.JWT_SECRET,
            { expiresIn: accessTokenExpiry }
        );

        response.status(200).json({
            success: true,
            message: 'Token sikeresen frissítve',
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        
        // Remove invalid token from database if it exists
        try {
            await deleteRefreshToken(refreshToken);
        } catch (dbError) {
            console.error('Error removing invalid token:', dbError);
        }
        
        response.clearCookie('refreshToken');
        
        return response.status(401).json({
            success: false,
            message: 'Érvénytelen vagy lejárt frissítő token'
        });
    }
});

// POST /api/auth/logout — clear refresh token cookie and delete from DB
router.post('/logout', async (request, response) => {
    const refreshToken = request.cookies.refreshToken;

    // Remove token from database
    if (refreshToken) {
        try {
            // Look up token before deleting to identify the actor for logging
            const tokenRecord = await findRefreshToken(refreshToken);
            await deleteRefreshToken(refreshToken);

            if (tokenRecord) {
                if (tokenRecord.user_id) {
                    logEvent('INFO', 'USER_LOGOUT', 'user', tokenRecord.user_id, 'user', tokenRecord.user_id, `User #${tokenRecord.user_id} logged out`).catch(() => {});
                } else if (tokenRecord.provider_id) {
                    logEvent('INFO', 'PROVIDER_LOGOUT', 'provider', tokenRecord.provider_id, 'provider', tokenRecord.provider_id, `Provider #${tokenRecord.provider_id} logged out`).catch(() => {});
                } else if (tokenRecord.admin_id) {
                    logEvent('INFO', 'ADMIN_LOGOUT', 'admin', tokenRecord.admin_id, 'admin', tokenRecord.admin_id, `Admin #${tokenRecord.admin_id} logged out`).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error deleting refresh token:', error);
        }
    }
    
    response.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    });
    
    response.status(200).json({
        success: true,
        message: 'Sikeresen kijelentkezve'
    });
});

// POST /api/auth/admin/login — authenticate admin with separate credentials
router.post('/admin/login', async (request, response) => {
    const { email, password } = request.body;

    if (!email || !password) {
        return response.status(400).json({
            success: false,
            message: 'Email és jelszó megadása kötelező'
        });
    }

    try {
        // Query admins table (separate from users for security)
        const admin = await getAdminByEmail(email);

        if (!admin) {
            return response.status(422).json({
                success: false,
                message: 'Érvénytelen email vagy jelszó'
            });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordMatch) {
            return response.status(422).json({
                success: false,
                message: 'Érvénytelen email vagy jelszó'
            });
        }

        // Generate tokens with admin-specific shorter durations
        const { accessToken, refreshToken } = generateAdminTokens({ email, adminId: admin.id, name: admin.name });

        // Store refresh token in database (admin_id for admins - separate column)
        await insertAdminRefreshToken(admin.id, refreshToken);

        // Update last_login on admins table
        await updateAdminLastLogin(admin.id);

        // Log admin login event
        await logEvent('INFO', 'ADMIN_LOGIN', 'admin', admin.id, 'admin', admin.id, `Admin ${email} logged in`);

        // Send refresh token as HTTP-only cookie (1 hour for admin)
        setAuthCookies(response, refreshToken, { maxAge: 1 * 60 * 60 * 1000 });

        response.status(200).json({
            success: true,
            message: 'Admin bejelentkezés sikeres',
            accessToken
        });
    } catch (error) {
        console.error('Admin login error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba'
        });
    }
});

// POST /api/auth/reactivate — reactivate a self-deleted user account
router.post('/reactivate', async (request, response) => {
    const { reactivationToken, name, phone, address } = request.body;

    if (!reactivationToken) {
        return response.status(400).json({
            success: false,
            message: 'Újraaktiválási token szükséges'
        });
    }

    if (!name || !name.trim()) {
        return response.status(400).json({
            success: false,
            message: 'A név megadása kötelező'
        });
    }

    if (!phone || !phone.trim()) {
        return response.status(400).json({
            success: false,
            message: 'A telefonszám megadása kötelező'
        });
    }

    try {
        // Verify the reactivation token
        const decoded = jwt.verify(reactivationToken, process.env.JWT_SECRET);

        if (decoded.purpose !== 'reactivation') {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen token'
            });
        }

        const userId = decoded.userId;

        // Verify user exists and is still in deleted state
        const user = await getUserForReactivation(userId);

        if (!user) {
            return response.status(404).json({
                success: false,
                message: 'Felhasználó nem található'
            });
        }

        if (user.status !== 'deleted') {
            return response.status(400).json({
                success: false,
                message: 'A fiók nem törölt állapotban van'
            });
        }

        // Check if within 30-day grace period
        if (user.deleted_at) {
            const deletedAt = new Date(user.deleted_at);
            const now = new Date();
            const daysSinceDelete = (now - deletedAt) / (1000 * 60 * 60 * 24);
            if (daysSinceDelete > 30) {
                return response.status(400).json({
                    success: false,
                    message: 'A törlési határidő (30 nap) lejárt. Kérjük, regisztrálj újra.'
                });
            }
        }

        // Reactivate: update profile and set status to active
        await reactivateUser(userId, name.trim(), phone?.trim() || null, address?.trim() || null);

        // Generate tokens for the reactivated user
        const { accessToken, refreshToken } = generateCustomerTokens({ email: user.email, userId, name: name.trim() });

        // Store refresh token in database
        await insertUserRefreshToken(userId, refreshToken);

        // Update last_login
        await updateUserLastLogin(userId);

        // Log reactivation event
        await logEvent('INFO', 'USER_REACTIVATION', 'user', userId, 'user', userId, `User ${user.email} reactivated their account`);

        // Send refresh token as HTTP-only cookie
        setAuthCookies(response, refreshToken);

        response.status(200).json({
            success: true,
            message: 'Fiók sikeresen újraaktiválva!',
            accessToken
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return response.status(401).json({
                success: false,
                message: 'Az újraaktiválási token lejárt. Kérjük, jelentkezz be újra.'
            });
        }
        console.error('Reactivation error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba az újraaktiválás során'
        });
    }
});

module.exports = router;

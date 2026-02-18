const express = require('express');
const router = express.Router();
const database = require('../../sql/database.js');
const { pool } = require('../../sql/database.js');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs'); //?npm install bcrypt
const jwt = require('jsonwebtoken'); //?npm install jsonwebtoken
const addUser = require('../../sql/users.js').addUser;
const getUserByEmail = require('../../sql/users.js').getUserByEmail;
const getUsers = require('../../sql/users.js').getUsers;
const { logEvent } = require('../../services/logService.js');


//!Multer
const multer = require('multer'); //?npm install multer
const path = require('path');

const storage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, path.join(__dirname, '../uploads'));
    },
    filename: (request, file, callback) => {
        callback(null, Date.now() + '-' + file.originalname); //?egyedi név: dátum - file eredeti neve
    }
});

const upload = multer({ storage });


//!Endpoints:

// Helper function to generate tokens
const generateTokens = (email, userId, name, role = 'customer') => {
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        throw new Error('Server configuration error: JWT_SECRET missing');
    }
    
    if (!process.env.JWT_REFRESH_SECRET) {
        console.error('JWT_REFRESH_SECRET is not configured');
        throw new Error('Server configuration error: JWT_REFRESH_SECRET missing');
    }

    const accessToken = jwt.sign(
        { email, userId, name, role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
        { email, userId, name, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );

    return { accessToken, refreshToken };
};

// Stricter token generation for admin accounts
const generateAdminTokens = (email, adminId, name) => {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new Error('Server configuration error: JWT secrets missing');
    }

    const accessToken = jwt.sign(
        { email, userId: adminId, name, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' } // Very short-lived for admin security
    );

    const refreshToken = jwt.sign(
        { email, userId: adminId, name, role: 'admin' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '1h' } // 1 hour admin session max
    );

    return { accessToken, refreshToken };
};

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
        const { accessToken, refreshToken } = generateTokens(email, user.id, user.name, 'customer');

        // Store refresh token in database (user_id for customers)
        await pool.query(
            'INSERT INTO RefTokens (user_id, refresh_token) VALUES (?, ?)',
            [user.id, refreshToken]
        );

        // Update last_login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Log login event
        await logEvent('INFO', 'USER_LOGIN', 'user', user.id, 'user', user.id, `User ${email} logged in`);

        // Send refresh token as HTTP-only cookie
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,      
            secure: false,  
            sameSite: 'lax',  
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

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

// Refresh token endpoint (works for both customers and providers)
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
        const [tokens] = await pool.query(
            'SELECT id, user_id, provider_id, admin_id FROM RefTokens WHERE refresh_token = ?',
            [refreshToken]
        );

        if (tokens.length === 0) {
            response.clearCookie('refreshToken');
            return response.status(401).json({
                success: false,
                message: 'Érvénytelen frissítő token'
            });
        }

        const tokenRecord = tokens[0];

        // Validate user still exists and is active based on role
        if (decoded.role === 'provider') {
            // Verify token belongs to a provider
            if (!tokenRecord.provider_id) {
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Érvénytelen token típus'
                });
            }

            const [providers] = await pool.query(
                'SELECT id, status FROM providers WHERE id = ?',
                [tokenRecord.provider_id]
            );

            if (providers.length === 0 || providers[0].status === 'deleted' || providers[0].status === 'banned') {
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                const reason = providers.length > 0 && providers[0].status === 'banned' ? 'banned' : 'gdpr';
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
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Érvénytelen token típus'
                });
            }

            const [admins] = await pool.query(
                'SELECT id FROM admins WHERE id = ?',
                [tokenRecord.admin_id]
            );

            if (admins.length === 0) {
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Admin fiók nem található'
                });
            }
        } else {
            // Customer validation - verify token belongs to a user
            if (!tokenRecord.user_id) {
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Érvénytelen token típus'
                });
            }

            const [users] = await pool.query(
                'SELECT id, status FROM users WHERE id = ?',
                [tokenRecord.user_id]
            );

            if (users.length === 0 || users[0].status === 'banned' || users[0].status === 'deleted') {
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                const reason = users.length > 0 && users[0].status === 'banned' ? 'banned' : 'gdpr';
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
            await pool.query('DELETE FROM RefTokens WHERE refresh_token = ?', [refreshToken]);
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

// Logout endpoint (works for both customers and providers)
router.post('/logout', async (request, response) => {
    const refreshToken = request.cookies.refreshToken;
    
    console.log('=== LOGOUT ===');
    console.log('Cookie received:', !!refreshToken);
    
    // Remove token from database
    if (refreshToken) {
        try {
            // Decode token to get user/provider ID
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            // Delete the token from RefTokens table
            const [result] = await pool.query('DELETE FROM RefTokens WHERE refresh_token = ?', [refreshToken]);
            console.log('Deleted rows:', result.affectedRows);
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

// Admin login endpoint - authenticates against separate admins table
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
        const [admins] = await pool.query(
            'SELECT id, name, email, password_hash FROM admins WHERE email = ?',
            [email]
        );

        if (admins.length === 0) {
            return response.status(422).json({
                success: false,
                message: 'Érvénytelen email vagy jelszó'
            });
        }

        const admin = admins[0];

        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordMatch) {
            return response.status(422).json({
                success: false,
                message: 'Érvénytelen email vagy jelszó'
            });
        }

        // Generate tokens with admin-specific shorter durations
        const { accessToken, refreshToken } = generateAdminTokens(email, admin.id, admin.name);

        // Store refresh token in database (admin_id for admins - separate column)
        await pool.query(
            'INSERT INTO RefTokens (admin_id, refresh_token) VALUES (?, ?)',
            [admin.id, refreshToken]
        );

        // Update last_login on admins table
        await pool.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

        // Log admin login event
        await logEvent('INFO', 'ADMIN_LOGIN', 'admin', admin.id, 'admin', admin.id, `Admin ${email} logged in`);

        // Send refresh token as HTTP-only cookie (1 hour for admin)
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 1 * 60 * 60 * 1000 // 1 hour (admin)
        });

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

// Reactivate a self-deleted user account
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
        const [users] = await pool.query(
            'SELECT id, email, status, deleted_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Felhasználó nem található'
            });
        }

        const user = users[0];

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
        await pool.query(
            `UPDATE users 
             SET status = 'active',
                 name = ?,
                 phone = ?,
                 address = ?,
                 deleted_at = NULL
             WHERE id = ?`,
            [name.trim(), phone?.trim() || null, address?.trim() || null, userId]
        );

        // Generate tokens for the reactivated user
        const { accessToken, refreshToken } = generateTokens(user.email, userId, name.trim(), 'customer');

        // Store refresh token in database
        await pool.query(
            'INSERT INTO RefTokens (user_id, refresh_token) VALUES (?, ?)',
            [userId, refreshToken]
        );

        // Update last_login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);

        // Log reactivation event
        await logEvent('INFO', 'USER_REACTIVATION', 'user', userId, 'user', userId, `User ${user.email} reactivated their account`);

        // Send refresh token as HTTP-only cookie
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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

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

//!Refresh token store (in production, use database)
const refreshTokenStore = new Map();

// Clean up expired refresh tokens every hour
setInterval(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    for (const [token, data] of refreshTokenStore.entries()) {
        if (now - data.createdAt > sevenDays) {
            refreshTokenStore.delete(token);
        }
    }
}, 60 * 60 * 1000); // Run every hour

//!Endpoints:

// Helper function to generate tokens
const generateTokens = (email, userId, name) => {
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        throw new Error('Server configuration error: JWT_SECRET missing');
    }
    
    if (!process.env.JWT_REFRESH_SECRET) {
        console.error('JWT_REFRESH_SECRET is not configured');
        throw new Error('Server configuration error: JWT_REFRESH_SECRET missing');
    }

    const accessToken = jwt.sign(
        { email, userId, name, role: 'customer'},
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
        { email, userId, name, role: 'customer'},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );

    return { accessToken, refreshToken };
};

router.post('/register', async (request, response) => {
    const { name, email, password } = request.body;

    if (!email || !password || !name) {
        return response.status(400).json({
            success: false,
            message: 'Name and Email and password are required'
        });
    }

    if (password.length < 6) {
        return response.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
        });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return response.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        await addUser(name, email, hashedPassword, 'customer');
        

        response.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        response.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.post('/login', async (request, response) => {
    const { email, password } = request.body;

    // Input validation
    if (!email || !password) {
        return response.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    if (password.length < 6) {
        return response.status(400).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return response.status(422).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return response.status(422).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate both access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(email, user.id, user.name);

        // Store refresh token in database (user_id for customers)
        await pool.query(
            'INSERT INTO RefTokens (user_id, refresh_token) VALUES (?, ?)',
            [user.id, refreshToken]
        );

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
            message: 'Login successful',
            accessToken
        });
    } catch (error) {
        console.error('Login error:', error);
        response.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Refresh token endpoint (works for both customers and providers)
router.post('/refresh', async (request, response) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
        return response.status(400).json({
            success: false,
            message: 'Refresh token is required'
        });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
        console.error('JWT_REFRESH_SECRET not configured');
        return response.status(500).json({
            success: false,
            message: 'Server configuration error'
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
            'SELECT id, user_id, provider_id FROM RefTokens WHERE refresh_token = ?',
            [refreshToken]
        );

        if (tokens.length === 0) {
            response.clearCookie('refreshToken');
            return response.status(401).json({
                success: false,
                message: 'Invalid refresh token'
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
                    message: 'Invalid token for user type'
                });
            }

            const [providers] = await pool.query(
                'SELECT id, status FROM providers WHERE id = ?',
                [tokenRecord.provider_id]
            );

            if (providers.length === 0 || providers[0].status === 'deleted' || providers[0].status === 'banned') {
                // Remove invalid token
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'User account is no longer active'
                });
            }
        } else {
            // Customer validation - verify token belongs to a customer
            if (!tokenRecord.user_id) {
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'Invalid token for user type'
                });
            }

            const [users] = await pool.query(
                'SELECT id, status FROM users WHERE id = ?',
                [tokenRecord.user_id]
            );

            if (users.length === 0 || users[0].status === 'deleted' || users[0].status === 'banned') {
                // Remove invalid token
                await pool.query('DELETE FROM RefTokens WHERE id = ?', [tokenRecord.id]);
                response.clearCookie('refreshToken');
                return response.status(401).json({
                    success: false,
                    message: 'User account is no longer active'
                });
            }
        }

        // Generate new access token with userId and role
        const newAccessToken = jwt.sign(
            { email: decoded.email, userId: decoded.userId, role: decoded.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        response.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
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
            message: 'Invalid or expired refresh token'
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
            
            // Clear the foreign key reference in providers table if applicable
            if (decoded.role === 'provider') {
                await pool.query('UPDATE providers SET refresh_token_id = NULL WHERE id = ?', [decoded.userId]);
            }
            
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
        message: 'Logged out successfully'
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const database = require('../../sql/database.js');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs'); //?npm install bcrypt
const jwt = require('jsonwebtoken'); //?npm install jsonwebtoken


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

const Users = [];

// Helper function to generate tokens
const generateTokens = (email, userId) => {
    const accessToken = jwt.sign(
        { email, userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
        { email, userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );

    return { accessToken, refreshToken };
};

router.post('/register', async (request, response) => {
    const { email, password } = request.body;

    if (!email || !password) {
        return response.status(400).json({
            success: false,
            message: 'Email and password are required'
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
        const existingUser = Users.find(u => u.email === email);
        if (existingUser) {
            return response.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        const userId = Users.length + 1;
        Users.push({ userId, email, hashedPassword });
        

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
        const user = Users.find(u => u.email === email);

        if (!user) {
            return response.status(422).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordMatch) {
            return response.status(422).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate both access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(email, user.userId);

        // Store refresh token (in production, save to database)
        refreshTokenStore.set(refreshToken, { email, userId: user.userId, createdAt: Date.now() });

        // Send refresh token as HTTP-only cookie
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,      // Not accessible from JavaScript
            secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
            sameSite: 'strict',  // CSRF protection
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

// Refresh token endpoint
router.post('/refresh', (request, response) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
        return response.status(400).json({
            success: false,
            message: 'Refresh token is required'
        });
    }

    // Check if token exists in store
    if (!refreshTokenStore.has(refreshToken)) {
        return response.status(401).json({
            success: false,
            message: 'Invalid refresh token'
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
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // Generate new access token with userId
        const newAccessToken = jwt.sign(
            { email: decoded.email, userId: decoded.userId },
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
        
        // Remove invalid token from store
        refreshTokenStore.delete(refreshToken);
        response.clearCookie('refreshToken');
        
        return response.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
});

// Logout endpoint
router.post('/logout', (request, response) => {
    const refreshToken = request.cookies.refreshToken;
    
    // Remove token from store
    if (refreshToken) {
        refreshTokenStore.delete(refreshToken);
    }
    
    response.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    response.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;

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
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        throw new Error('Server configuration error: JWT_SECRET missing');
    }
    
    if (!process.env.JWT_REFRESH_SECRET) {
        console.error('JWT_REFRESH_SECRET is not configured');
        throw new Error('Server configuration error: JWT_REFRESH_SECRET missing');
    }

    const accessToken = jwt.sign(
        { email, userId , role: 'provider'},
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
        { email, userId , role: 'provider'},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );

    return { accessToken, refreshToken };
};        

router.post('/register', async (request, response) => {
    const { companyName, email, password, phone } = request.body;

    if (!companyName || !email || !password || !phone) {
        return response.status(400).json({
            success: false,
            message: 'Minden mező kitöltése kötelező'
        });
    }

    if (password.length < 8) {
        return response.status(400).json({
            success: false,
            message: 'A jelszónak legalább 8 karakter hosszúnak kell lennie'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if provider already exists
        const existingProvider = Users.find(u => u.email === email);
        if (existingProvider) {
            return response.status(409).json({
                success: false,
                message: 'Ez az email cím már használatban van'
            });
        }

        const userId = Users.length + 1;
        Users.push({ 
            userId, 
            companyName, 
            email, 
            hashedPassword, 
            phone,
            role: 'provider'
        });

        response.status(201).json({
            success: true,
            message: 'Sikeres regisztráció'
        });
    } catch (error) {
        console.error('Registration error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerver hiba történt'
        });
    }
});

router.post('/login', async (request, response) => {
    const { email, password } = request.body;

    if (!email || !password) {
        return response.status(400).json({
            success: false,
            message: 'Email és jelszó megadása kötelező'
        });
    }

    try {
        const user = Users.find(u => u.email === email && u.role === 'provider');

        if (!user) {
            return response.status(422).json({
                success: false,
                message: 'Hibás email vagy jelszó'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordMatch) {
            return response.status(422).json({
                success: false,
                message: 'Hibás email vagy jelszó'
            });
        }

        // Generate both access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(email, user.userId);

        // Store refresh token
        refreshTokenStore.set(refreshToken, { email, userId: user.userId, createdAt: Date.now() });

        // Send refresh token as HTTP-only cookie
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        response.status(200).json({
            success: true,
            message: 'Sikeres bejelentkezés',
            accessToken,
            companyName: user.companyName
        });
    } catch (error) {
        console.error('Login error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerver hiba történt'
        });
    }
});




module.exports=router;
const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
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

//!Endpoints:
//?GET /api/test
router.get('/test', (request, response) => {
    response.status(200).json({
        message: 'Ez a végpont működik.'
    });
});

//?GET /api/testsql
router.get('/testsql', async (request, response) => {
    try {
        const selectall = await database.selectall();
        response.status(200).json({
            message: 'Ez a végpont működik.',
            results: selectall
        });
    } catch (error) {
        response.status(500).json({
            message: 'Ez a végpont nem működik.'
        });
    }
});


const Users = [{email:'test@test.com' ,password:'test123'}]

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

    try {
        const existingUser = Users.find(u => u.email === email);
        if (existingUser) {
            return response.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        Users.push({ email, password });
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
            return response.status(401).json({
                success: false,
                message: 'nincs ilyen felhasználó'
            });
        }

        if (user.password !== password) {
            return response.status(401).json({
                success: false,
                message: 'hibás jelszó'
            });
        }

        // TODO: Compare password with hash
        // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        // if (!isPasswordValid) {
        //     return response.status(401).json({
        //         success: false,
        //         message: 'Invalid credentials'
        //     });
        // }

        // TODO: Generate JWT token
        // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        response.status(200).json({
            success: true,
            message: 'Login successful',
            // token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        response.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

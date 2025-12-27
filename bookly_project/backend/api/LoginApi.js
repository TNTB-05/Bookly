const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs'); //?npm install bcrypt


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


router.post('/login', async (request, response) => {
    const { username, password } = request.body;

    // Input validation
    if (!username || !password) {
        return response.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    if (password.length < 6) {
        return response.status(400).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    try {
        // TODO: Query database for user
        // const user = await database.getUserByUsername(username);
        // if (!user) {
        //     return response.status(401).json({
        //         success: false,
        //         message: 'Invalid credentials'
        //     });
        // }
        
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

const express = require('express');
const router = express.Router();
const { pool } = require('../../sql/database.js');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs'); //?npm install bcrypt
const jwt = require('jsonwebtoken'); //?npm install jsonwebtoken
const crypto = require('crypto');
const locationService = require('../../services/locationService.js');



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

const Users = [];

// Helper function to generate unique salon share code
function generateShareCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

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
        { email, userId , role: 'provider',name},
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
        { email, userId , role: 'provider',name},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );

    return { accessToken, refreshToken };
};        

// Validate salon code endpoint
router.post('/validate-salon-code', async (request, response) => {
    const { code } = request.body;

    if (!code || code.trim().length < 6) {
        return response.status(400).json({
            success: false,
            message: 'Érvénytelen szalon kód'
        });
    }

    try {
        const [salons] = await pool.query(
            'SELECT id, name FROM salons WHERE sharecode = ? AND status != "closed"',
            [code.trim().toUpperCase()]
        );

        if (salons.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Nem található szalon ezzel a kóddal'
            });
        }

        const salon = salons[0];

        response.status(200).json({
            success: true,
            salonId: salon.id,
            salonName: salon.name
        });
    } catch (error) {
        console.error('Validate salon code error:', error);
        response.status(500).json({
            success: false,
            message: error.message || 'Szerver hiba történt'
        });
    }
});

router.post('/register', async (request, response) => {
    const { name, email, password, phone, registrationType, salonId, salon } = request.body;

    // Validate required user fields
    if (!name || !email || !password || !phone) {
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

    // Validate registration type
    if (!registrationType || !['join', 'create'].includes(registrationType)) {
        return response.status(400).json({
            success: false,
            message: 'Érvénytelen regisztrációs típus'
        });
    }

    // Validate based on registration type
    if (registrationType === 'join' && !salonId) {
        return response.status(400).json({
            success: false,
            message: 'Szalon azonosító szükséges a csatlakozáshoz'
        });
    }

    if (registrationType === 'create') {
        if (!salon || !salon.companyName || !salon.address || !salon.description || !salon.salonType) {
            return response.status(400).json({
                success: false,
                message: 'Minden szalon adat kitöltése kötelező'
            });
        }
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if provider already exists
        const [existingProviders] = await connection.query(
            'SELECT id FROM providers WHERE email = ? OR phone = ?',
            [email, phone]
        );

        if (existingProviders.length > 0) {
            await connection.rollback();
            return response.status(409).json({
                success: false,
                message: 'Ez az email cím vagy telefonszám már használatban van'
            });
        }

        let finalSalonId;
        let isManager = false;

        if (registrationType === 'create') {
            // Verify salon doesn't already exist with same name at same address
            const [existingSalons] = await connection.query(
                'SELECT id FROM salons WHERE name = ? AND address = ?',
                [salon.companyName.trim(), salon.address.trim()]
            );

            if (existingSalons.length > 0) {
                await connection.rollback();
                return response.status(409).json({
                    success: false,
                    message: 'Már létezik szalon ezzel a névvel ezen a címen'
                });
            }

            // Generate unique share code
            let shareCode;
            let isUnique = false;
            while (!isUnique) {
                shareCode = generateShareCode();
                const [existing] = await connection.query(
                    'SELECT id FROM salons WHERE sharecode = ?',
                    [shareCode]
                );
                if (existing.length === 0) {
                    isUnique = true;
                }
            }

            // Geocode the address to get coordinates
            // Use coordinates from frontend if provided, otherwise try server-side geocoding
            let latitude = salon.latitude || null;
            let longitude = salon.longitude || null;
            
            if (!latitude || !longitude) {
                try {
                    const coords = await locationService.placeToCoordinate(salon.address.trim());
                    latitude = coords.latitude;
                    longitude = coords.longitude;
                } catch (geocodeError) {
                    console.warn('Geocoding failed for address:', salon.address, geocodeError.message);
                    // Continue without coordinates - they can be added later
                }
            }

            // Create new salon with coordinates
            const [salonResult] = await connection.query(
                `INSERT INTO salons (name, address, description, sharecode, status, type, latitude, longitude) 
                 VALUES (?, ?, ?, ?, 'open', ?, ?, ?)`,
                [
                    salon.companyName.trim(),
                    salon.address.trim(),
                    salon.description.trim(),
                    shareCode,
                    salon.salonType.trim(),
                    latitude,
                    longitude
                ]
            );

            finalSalonId = salonResult.insertId;
            isManager = true; // Creator becomes manager
        } else {
            // Join existing salon - verify it exists
            const [salons] = await connection.query(
                'SELECT id FROM salons WHERE id = ?',
                [salonId]
            );

            if (salons.length === 0) {
                await connection.rollback();
                return response.status(404).json({
                    success: false,
                    message: 'A megadott szalon nem található'
                });
            }

            finalSalonId = salonId;
            isManager = false; // Joining members are regular providers
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create provider
        const [providerResult] = await connection.query(
            `INSERT INTO providers (salon_id, name, email, phone, status, role, isManager, password_hash) 
             VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
            [
                finalSalonId,
                name.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                isManager ? 'manager' : 'provider',
                isManager,
                hashedPassword
            ]
        );

        await connection.commit();

        response.status(201).json({
            success: true,
            message: 'Sikeres regisztráció',
            providerId: providerResult.insertId,
            isManager
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }
        console.error('Registration error:', error);
        response.status(500).json({
            success: false,
            message: error.message || 'Szerver hiba történt'
        });
    } finally {
        if (connection) {
            connection.release();
        }
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
        // Query provider from database
        const [providers] = await pool.query(
            `SELECT p.id, p.name, p.email, p.password_hash, p.salon_id, p.isManager, p.status, s.name as salon_name 
             FROM providers p 
             JOIN salons s ON p.salon_id = s.id 
             WHERE p.email = ?`,
            [email.trim().toLowerCase()]
        );

        if (providers.length === 0) {
            return response.status(422).json({
                success: false,
                message: 'Hibás email vagy jelszó'
            });
        }

        const provider = providers[0];

        if (provider.status === 'banned' || provider.status === 'deleted') {
            return response.status(403).json({
                success: false,
                message: 'Ez a fiók le van tiltva'
            });
        }

        const passwordMatch = await bcrypt.compare(password, provider.password_hash);
        if (!passwordMatch) {
            return response.status(422).json({
                success: false,
                message: 'Hibás email vagy jelszó'
            });
        }

        // Generate both access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(email, provider.id, provider.name);

        // Store refresh token in database (provider_id for providers)
        const [tokenResult] = await pool.query(
            'INSERT INTO RefTokens (provider_id, refresh_token) VALUES (?, ?)',
            [provider.id, refreshToken]
        );

        // Update last login
        await pool.query(
            'UPDATE providers SET last_login = NOW() WHERE id = ?',
            [provider.id]
        );

        // Send refresh token as HTTP-only cookie
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        response.status(200).json({
            success: true,
            message: 'Sikeres bejelentkezés',
            accessToken,
            provider: {
                id: provider.id,
                name: provider.name,
                email: provider.email,
                salonId: provider.salon_id,
                salonName: provider.salon_name,
                isManager: provider.isManager
            }
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
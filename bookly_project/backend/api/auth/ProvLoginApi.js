const express = require('express');
const router = express.Router();
const pool = require('../../sql/pool.js');
const { validateSalonCode, insertProviderRefreshToken, updateProviderLastLogin, getProviderForLogin } = require('../../sql/authQueries.js');
const { generateProviderTokens, setAuthCookies } = require('../../utils/authUtils.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const locationService = require('../../services/locationService.js');
const { sendWelcomeEmail } = require('../../services/emailService.js');


//!Endpoints:

// Helper function to generate unique salon share code
function generateShareCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

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
        const salon = await validateSalonCode(code.trim().toUpperCase());

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: 'Nem található szalon ezzel a kóddal'
            });
        }

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

        // Send welcome email (don't block response if it fails)
        sendWelcomeEmail({ email: email.trim().toLowerCase(), name: name.trim(), role: 'provider' }).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

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
        const provider = await getProviderForLogin(email.trim().toLowerCase());

        if (!provider) {
            return response.status(422).json({
                success: false,
                message: 'Hibás email vagy jelszó'
            });
        }

        if (provider.status === 'banned') {
            return response.status(403).json({
                success: false,
                message: 'A fiókod le lett tiltva.',
                banned: true,
                reason: 'banned'
            });
        }

        if (provider.status === 'deleted') {
            return response.status(403).json({
                success: false,
                message: 'A fiók GDPR törlés miatt megszűnt.',
                banned: true,
                reason: 'gdpr'
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
        const { accessToken, refreshToken } = generateProviderTokens({ email, userId: provider.id, name: provider.name });

        // Store refresh token in database (provider_id for providers)
        await insertProviderRefreshToken(provider.id, refreshToken);

        // Update last login
        await updateProviderLastLogin(provider.id);

        // Send refresh token as HTTP-only cookie
        setAuthCookies(response, refreshToken);

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
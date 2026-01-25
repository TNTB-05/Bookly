const express = require('express');
const router = express.Router();
const { pool } = require('../sql/database.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');
const { requireRole } = require('./auth/RoleMiddleware.js');

// Middleware to verify provider exists and is active in database
const verifyProvider = async (req, res, next) => {
    try {
        const providerId = req.user.userId;
        
        // Verify provider exists and is active in the database
        const [providers] = await pool.query(
            'SELECT id, status FROM providers WHERE id = ?',
            [providerId]
        );

        if (providers.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Szolgáltató nem található'
            });
        }

        if (providers[0].status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'A fiók nincs aktív státuszban'
            });
        }

        // Attach verified provider ID to request for use in route handlers
        req.providerId = providerId;
        next();
    } catch (error) {
        console.error('Provider verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Hiba történt a hitelesítés során'
        });
    }
};

// Apply middleware to all routes: Auth -> Role check -> Provider verification
router.use(AuthMiddleware, requireRole(['provider']), verifyProvider);

// Get dashboard statistics
router.get('/statistics', async (request, response) => {
    try {
        const providerId = request.providerId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        // Today's appointments count
        const [todayResult] = await pool.query(
            `SELECT COUNT(*) as count FROM appointments 
             WHERE provider_id = ? 
             AND appointment_start >= ? 
             AND appointment_start < ? 
             AND status != 'canceled'`,
            [providerId, today, tomorrow]
        );

        // Weekly revenue
        const [revenueResult] = await pool.query(
            `SELECT SUM(price) as total FROM appointments 
             WHERE provider_id = ? 
             AND appointment_start >= ? 
             AND appointment_start < ? 
             AND status IN ('completed', 'scheduled')`,
            [providerId, weekStart, weekEnd]
        );

        // New customers this month (users created this month with appointments)
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const [newCustomersResult] = await pool.query(
            `SELECT COUNT(DISTINCT u.id) as count 
             FROM users u
             INNER JOIN appointments a ON a.user_id = u.id
             WHERE a.provider_id = ? 
             AND u.created_at >= ?`,
            [providerId, monthStart]
        );

        // Upcoming appointments (next 5)
        const [upcomingAppointments] = await pool.query(
            `SELECT 
                a.id,
                a.appointment_start,
                a.appointment_end,
                a.status,
                a.price,
                COALESCE(u.name, a.guest_name) as user_name,
                COALESCE(u.email, a.guest_email) as user_email,
                s.name as service_name
             FROM appointments a
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN services s ON a.service_id = s.id
             WHERE a.provider_id = ? 
             AND a.appointment_start >= NOW()
             AND a.status = 'scheduled'
             ORDER BY a.appointment_start ASC
             LIMIT 5`,
            [providerId]
        );

        response.status(200).json({
            success: true,
            statistics: {
                todayAppointments: todayResult[0].count,
                weeklyRevenue: revenueResult[0].total || 0,
                newCustomers: newCustomersResult[0].count,
                upcomingAppointments: upcomingAppointments
            }
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt az adatok lekérdezésekor'
        });
    }
});

// Get working hours for provider's salon
router.get('/working-hours', async (request, response) => {
    try {
        const providerId = request.providerId;

        const [result] = await pool.query(
            `SELECT s.opening_hours, s.closing_hours 
             FROM salons s
             JOIN providers p ON p.salon_id = s.id
             WHERE p.id = ?`,
            [providerId]
        );

        if (result.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Szalon nem található'
            });
        }

        const { opening_hours, closing_hours } = result[0];

        response.status(200).json({
            success: true,
            openingHour: opening_hours || 8,  // Default to 8 if not set
            closingHour: closing_hours || 20  // Default to 20 if not set
        });
    } catch (error) {
        console.error('Get working hours error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a nyitvatartás lekérdezésekor'
        });
    }
});

// Get appointments for a provider
router.get('/appointments', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { startDate, endDate } = request.query;

        let query = `
            SELECT 
                a.id,
                a.appointment_start,
                a.appointment_end,
                a.comment,
                a.price,
                a.status,
                a.created_at,
                a.guest_name,
                a.guest_email,
                a.guest_phone,
                u.id as user_id,
                COALESCE(u.name, a.guest_name) as user_name,
                COALESCE(u.email, a.guest_email) as user_email,
                COALESCE(u.phone, a.guest_phone) as user_phone,
                s.id as service_id,
                s.name as service_name,
                s.duration_minutes as service_duration
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            JOIN services s ON a.service_id = s.id
            WHERE a.provider_id = ?
        `;
        
        const params = [providerId];

        if (startDate && endDate) {
            query += ` AND DATE(a.appointment_start) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY a.appointment_start ASC`;

        const [appointments] = await pool.query(query, params);

        response.status(200).json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a foglalások lekérdezésekor'
        });
    }
});

// Get single appointment details
router.get('/appointments/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const appointmentId = request.params.id;

        // Validate appointmentId is a number to prevent SQL injection
        if (isNaN(parseInt(appointmentId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen foglalás azonosító'
            });
        }

        const [appointments] = await pool.query(
            `SELECT 
                a.id,
                a.appointment_start,
                a.appointment_end,
                a.comment,
                a.price,
                a.status,
                a.created_at,
                a.guest_name,
                a.guest_email,
                a.guest_phone,
                u.id as user_id,
                COALESCE(u.name, a.guest_name) as user_name,
                COALESCE(u.email, a.guest_email) as user_email,
                COALESCE(u.phone, a.guest_phone) as user_phone,
                s.id as service_id,
                s.name as service_name,
                s.duration_minutes as service_duration
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            JOIN services s ON a.service_id = s.id
            WHERE a.id = ? AND a.provider_id = ?`,
            [appointmentId, providerId]
        );

        if (appointments.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Foglalás nem található vagy nincs jogosultságod megtekinteni'
            });
        }

        response.status(200).json({
            success: true,
            appointment: appointments[0]
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a foglalás lekérdezésekor'
        });
    }
});

// Create new appointment (manual booking by provider)
router.post('/appointments', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { is_guest, user_email, user_name, user_phone, service_id, appointment_date, appointment_time, comment } = request.body;

        // Validation
        if (!user_name || !service_id || !appointment_date || !appointment_time) {
            return response.status(400).json({
                success: false,
                message: 'Név, szolgáltatás, dátum és idő megadása kötelező'
            });
        }

        // Verify service exists and belongs to provider
        const [services] = await pool.query(
            'SELECT id, duration_minutes, price FROM services WHERE id = ? AND provider_id = ?',
            [service_id, providerId]
        );

        if (services.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Szolgáltatás nem található'
            });
        }

        const service = services[0];
        let userId = null;

        // Handle registered user vs guest
        if (is_guest) {
            // Guest booking - no user_id needed
            if (!user_email && !user_phone) {
                return response.status(400).json({
                    success: false,
                    message: 'Vendég foglaláshoz email vagy telefonszám szükséges'
                });
            }
        } else {
            // Registered user - email required
            if (!user_email) {
                return response.status(400).json({
                    success: false,
                    message: 'Regisztrált felhasználóhoz email cím szükséges'
                });
            }

            // Find or create user
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE email = ?',
                [user_email.trim()]
            );

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
                
                // Update user info if provided
                await pool.query(
                    'UPDATE users SET name = ?, phone = ? WHERE id = ?',
                    [user_name.trim(), user_phone?.trim() || null, userId]
                );
            } else {
                // Create new user (with a default password hash, they'll need to reset)
                const bcrypt = require('bcryptjs');
                const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
                
                const [result] = await pool.query(
                    `INSERT INTO users (name, email, phone, password_hash, status, role) 
                     VALUES (?, ?, ?, ?, 'active', 'customer')`,
                    [user_name.trim(), user_email.trim(), user_phone?.trim() || null, defaultPasswordHash]
                );
                userId = result.insertId;
            }
        }

        // Parse appointment start datetime
        const appointmentStart = new Date(`${appointment_date}T${appointment_time}`);
        
        // Calculate end time based on service duration
        const appointmentEnd = new Date(appointmentStart.getTime() + service.duration_minutes * 60000);

        // Check for conflicts
        const [conflicts] = await pool.query(
            `SELECT id FROM appointments 
             WHERE provider_id = ? 
             AND status = 'scheduled'
             AND (
                 (appointment_start < ? AND appointment_end > ?)
                 OR (appointment_start < ? AND appointment_end > ?)
                 OR (appointment_start >= ? AND appointment_end <= ?)
             )`,
            [
                providerId,
                appointmentEnd.toISOString().slice(0, 19).replace('T', ' '),
                appointmentStart.toISOString().slice(0, 19).replace('T', ' '),
                appointmentEnd.toISOString().slice(0, 19).replace('T', ' '),
                appointmentStart.toISOString().slice(0, 19).replace('T', ' '),
                appointmentStart.toISOString().slice(0, 19).replace('T', ' '),
                appointmentEnd.toISOString().slice(0, 19).replace('T', ' ')
            ]
        );

        if (conflicts.length > 0) {
            return response.status(409).json({
                success: false,
                message: 'Ez az időpont már foglalt'
            });
        }

        // Create appointment
        const [appointmentResult] = await pool.query(
            `INSERT INTO appointments (
                user_id, provider_id, service_id, appointment_start, appointment_end, 
                comment, price, status, guest_name, guest_email, guest_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)`,
            [
                userId,
                providerId,
                service_id,
                appointmentStart.toISOString().slice(0, 19).replace('T', ' '),
                appointmentEnd.toISOString().slice(0, 19).replace('T', ' '),
                comment?.trim() || null,
                service.price,
                is_guest ? user_name.trim() : null,
                is_guest ? (user_email?.trim() || null) : null,
                is_guest ? (user_phone?.trim() || null) : null
            ]
        );

        response.status(201).json({
            success: true,
            message: 'Foglalás sikeresen létrehozva',
            appointmentId: appointmentResult.insertId
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a foglalás létrehozásakor'
        });
    }
});

// Delete (cancel) an appointment
router.delete('/appointments/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const appointmentId = request.params.id;

        // Validate appointmentId is a number to prevent SQL injection
        if (isNaN(parseInt(appointmentId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen foglalás azonosító'
            });
        }

        // First check if appointment exists and belongs to this provider
        const [appointments] = await pool.query(
            'SELECT id, status, provider_id FROM appointments WHERE id = ?',
            [appointmentId]
        );

        if (appointments.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Foglalás nem található'
            });
        }

        // Security check: verify appointment belongs to this provider
        if (appointments[0].provider_id !== providerId) {
            console.warn(`Security: Provider ${providerId} attempted to delete appointment ${appointmentId} belonging to provider ${appointments[0].provider_id}`);
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod törölni ezt a foglalást'
            });
        }

        if (appointments[0].status === 'canceled') {
            return response.status(400).json({
                success: false,
                message: 'Ez a foglalás már törölve van'
            });
        }

        // Update status to canceled
        await pool.query(
            'DELETE from appointments WHERE id = ?',
            [appointmentId]
        );

        response.status(200).json({
            success: true,
            message: 'Foglalás sikeresen törölve'
        });
    } catch (error) {
        console.error('Delete appointment error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a foglalás törlésekor'
        });
    }
});

// Update appointment status
router.patch('/appointments/:id/status', async (request, response) => {
    try {
        const providerId = request.providerId;
        const appointmentId = request.params.id;
        const { status } = request.body;

        // Validate appointmentId is a number to prevent SQL injection
        if (isNaN(parseInt(appointmentId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen foglalás azonosító'
            });
        }

        const validStatuses = ['scheduled', 'completed', 'canceled', 'no_show'];
        if (!validStatuses.includes(status)) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen státusz'
            });
        }

        // Check if appointment exists
        const [appointments] = await pool.query(
            'SELECT id, provider_id FROM appointments WHERE id = ?',
            [appointmentId]
        );

        if (appointments.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Foglalás nem található'
            });
        }

        // Security check: verify appointment belongs to this provider
        if (appointments[0].provider_id !== providerId) {
            console.warn(`Security: Provider ${providerId} attempted to update appointment ${appointmentId} belonging to provider ${appointments[0].provider_id}`);
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod módosítani ezt a foglalást'
            });
        }

        await pool.query(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, appointmentId]
        );

        response.status(200).json({
            success: true,
            message: 'Foglalás státusza frissítve'
        });
    } catch (error) {
        console.error('Update appointment status error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a státusz frissítésekor'
        });
    }
});

// Get services for provider
router.get('/services', async (request, response) => {
    try {
        const providerId = request.providerId;

        const [services] = await pool.query(
            `SELECT 
                id,
                name,
                description,
                duration_minutes,
                price,
                status,
                created_at
            FROM services
            WHERE provider_id = ?
            ORDER BY name ASC`,
            [providerId]
        );

        response.status(200).json({
            success: true,
            services
        });
    } catch (error) {
        console.error('Get services error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatások lekérdezésekor'
        });
    }
});

// Create new service
router.post('/services', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { name, description, duration_minutes, price, status } = request.body;

        // Validation
        if (!name || !duration_minutes || !price) {
            return response.status(400).json({
                success: false,
                message: 'Név, időtartam és ár megadása kötelező'
            });
        }

        if (duration_minutes < 5 || duration_minutes > 480) {
            return response.status(400).json({
                success: false,
                message: 'Az időtartam 5 és 480 perc között kell legyen'
            });
        }

        if (price < 0) {
            return response.status(400).json({
                success: false,
                message: 'Az ár nem lehet negatív'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO services (provider_id, name, description, duration_minutes, price, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [providerId, name.trim(), description?.trim() || null, duration_minutes, price, status || 'available']
        );

        response.status(201).json({
            success: true,
            message: 'Szolgáltatás sikeresen létrehozva',
            serviceId: result.insertId
        });
    } catch (error) {
        console.error('Create service error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatás létrehozásakor'
        });
    }
});

// Update service
router.put('/services/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const serviceId = request.params.id;
        const { name, description, duration_minutes, price, status } = request.body;

        // Validate serviceId
        if (isNaN(parseInt(serviceId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen szolgáltatás azonosító'
            });
        }

        // Check if service belongs to provider
        const [services] = await pool.query(
            'SELECT id, provider_id FROM services WHERE id = ?',
            [serviceId]
        );

        if (services.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Szolgáltatás nem található'
            });
        }

        if (services[0].provider_id !== providerId) {
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod módosítani ezt a szolgáltatást'
            });
        }

        // Validation
        if (!name || !duration_minutes || !price) {
            return response.status(400).json({
                success: false,
                message: 'Név, időtartam és ár megadása kötelező'
            });
        }

        if (duration_minutes < 5 || duration_minutes > 480) {
            return response.status(400).json({
                success: false,
                message: 'Az időtartam 5 és 480 perc között kell legyen'
            });
        }

        if (price < 0) {
            return response.status(400).json({
                success: false,
                message: 'Az ár nem lehet negatív'
            });
        }

        await pool.query(
            `UPDATE services 
             SET name = ?, description = ?, duration_minutes = ?, price = ?, status = ?
             WHERE id = ?`,
            [name.trim(), description?.trim() || null, duration_minutes, price, status || 'available', serviceId]
        );

        response.status(200).json({
            success: true,
            message: 'Szolgáltatás sikeresen frissítve'
        });
    } catch (error) {
        console.error('Update service error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatás frissítésekor'
        });
    }
});

// Delete service
router.delete('/services/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const serviceId = request.params.id;

        // Validate serviceId
        if (isNaN(parseInt(serviceId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen szolgáltatás azonosító'
            });
        }

        // Check if service belongs to provider
        const [services] = await pool.query(
            'SELECT id, provider_id FROM services WHERE id = ?',
            [serviceId]
        );

        if (services.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Szolgáltatás nem található'
            });
        }

        if (services[0].provider_id !== providerId) {
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod törölni ezt a szolgáltatást'
            });
        }

        // Check if there are any appointments using this service
        const [appointments] = await pool.query(
            'SELECT COUNT(*) as count FROM appointments WHERE service_id = ? AND status = "scheduled"',
            [serviceId]
        );

        if (appointments[0].count > 0) {
            return response.status(400).json({
                success: false,
                message: `Nem törölhető: ${appointments[0].count} aktív foglalás tartozik ehhez a szolgáltatáshoz`
            });
        }

        await pool.query('DELETE FROM services WHERE id = ?', [serviceId]);

        response.status(200).json({
            success: true,
            message: 'Szolgáltatás sikeresen törölve'
        });
    } catch (error) {
        console.error('Delete service error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a szolgáltatás törlésekor'
        });
    }
});

module.exports = router;

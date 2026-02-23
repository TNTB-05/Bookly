const express = require('express');
const router = express.Router();
const { pool, getSalonHoursByProviderId, getExpandedTimeBlocksForDate, getFullyBookedDays } = require('../sql/database.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');
const { requireRole } = require('./auth/RoleMiddleware.js');
const { sendAppointmentCancellation, sendCustomerReminder } = require('../services/emailService.js');

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

// Get fully booked days for a date range
router.get('/fully-booked-days', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { startDate, endDate } = request.query;

        if (!startDate || !endDate) {
            return response.status(400).json({
                success: false,
                message: 'startDate és endDate megadása kötelező'
            });
        }

        const fullyBookedDays = await getFullyBookedDays(providerId, startDate, endDate);

        response.status(200).json({
            success: true,
            fullyBookedDays
        });
    } catch (error) {
        console.error('Get fully booked days error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a teltház napok lekérdezésekor'
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
// Format a Date as 'YYYY-MM-DD HH:MM:SS' in local time (no UTC conversion)
function formatLocalDatetime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

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

        // Fetch salon hours to validate appointment time
        const salonHours = await getSalonHoursByProviderId(providerId);
        const openingHour = salonHours?.opening_hours || 8;
        const closingHour = salonHours?.closing_hours || 20;

        // Parse appointment start datetime
        const appointmentStart = new Date(`${appointment_date}T${appointment_time}`);
        
        // Calculate end time based on service duration
        const appointmentEnd = new Date(appointmentStart.getTime() + service.duration_minutes * 60000);

        // Validate appointment is within salon hours
        const startHour = appointmentStart.getHours();
        if (startHour < openingHour || startHour >= closingHour) {
            return response.status(400).json({
                success: false,
                message: 'Az időpont a szalon nyitvatartási idején kívül esik'
            });
        }

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

        // Helper: format date to MySQL datetime in local timezone (not UTC)
        function formatDateTimeLocal(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        function formatDateLocal(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

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
                formatLocalDatetime(appointmentEnd),
                formatLocalDatetime(appointmentStart),
                formatLocalDatetime(appointmentEnd),
                formatLocalDatetime(appointmentStart),
                formatLocalDatetime(appointmentStart),
                formatLocalDatetime(appointmentEnd)
            ]
        );

        if (conflicts.length > 0) {
            return response.status(409).json({
                success: false,
                message: 'Ez az időpont már foglalt'
            });
        }

        // Check for time block conflicts
        const dateStr = formatLocalDatetime(appointmentStart).split(' ')[0];
        const timeBlocks = await getExpandedTimeBlocksForDate(providerId, dateStr);
        const hasTimeBlockConflict = timeBlocks.some(block => {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            return appointmentStart < blockEnd && appointmentEnd > blockStart;
        });

        if (hasTimeBlockConflict) {
            return response.status(409).json({
                success: false,
                message: 'Időpont foglalás ütközik a szolgáltató szünetével'
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
                formatLocalDatetime(appointmentStart),
                formatLocalDatetime(appointmentEnd),
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

        // First check if appointment exists and belongs to this provider, and get details for email
        const [appointments] = await pool.query(
            `SELECT
                a.id, a.status, a.provider_id, a.user_id, a.appointment_start,
                u.email as customer_email,
                u.name as customer_name,
                sal.name as salon_name,
                s.name as service_name
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN salons sal ON sal.id = (SELECT salon_id FROM providers WHERE id = a.provider_id)
            WHERE a.id = ?`,
            [appointmentId]
        );

        if (appointments.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Foglalás nem található'
            });
        }

        const appointment = appointments[0];

        // Security check: verify appointment belongs to this provider
        if (appointment.provider_id !== providerId) {
            console.warn(`Security: Provider ${providerId} attempted to delete appointment ${appointmentId} belonging to provider ${appointment.provider_id}`);
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod törölni ezt a foglalást'
            });
        }

        if (appointment.status === 'canceled') {
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

        // Send cancellation email only if user is registered (has user_id and email)
        if (appointment.user_id && appointment.customer_email) {
            sendAppointmentCancellation({
                customer_email: appointment.customer_email,
                customer_name: appointment.customer_name,
                salon_name: appointment.salon_name,
                service_name: appointment.service_name,
                appointment_start: appointment.appointment_start
            }).catch(err => {
                console.error('Failed to send cancellation email:', err);
            });
        }

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

// Get customer stats for the stats strip
router.get('/customers/stats', async (request, response) => {
    try {
        const providerId = request.providerId;

        const [registeredResult] = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as count FROM appointments
             WHERE provider_id = ? AND user_id IS NOT NULL AND deleted_at IS NULL`,
            [providerId]
        );

        const [guestResult] = await pool.query(
            `SELECT COUNT(DISTINCT guest_email) as count FROM appointments
             WHERE provider_id = ? AND user_id IS NULL AND guest_email IS NOT NULL AND deleted_at IS NULL`,
            [providerId]
        );

        const [returningRegistered] = await pool.query(
            `SELECT COUNT(*) as count FROM (
                SELECT user_id FROM appointments
                WHERE provider_id = ? AND user_id IS NOT NULL AND deleted_at IS NULL
                GROUP BY user_id HAVING COUNT(*) > 1
             ) t`,
            [providerId]
        );

        const [returningGuests] = await pool.query(
            `SELECT COUNT(*) as count FROM (
                SELECT guest_email FROM appointments
                WHERE provider_id = ? AND user_id IS NULL AND guest_email IS NOT NULL AND deleted_at IS NULL
                GROUP BY guest_email HAVING COUNT(*) > 1
             ) t`,
            [providerId]
        );

        const [topServices] = await pool.query(
            `SELECT s.name, COUNT(a.id) as booking_count
             FROM appointments a
             JOIN services s ON a.service_id = s.id
             WHERE a.provider_id = ? AND a.deleted_at IS NULL
             GROUP BY s.id, s.name
             ORDER BY booking_count DESC
             LIMIT 3`,
            [providerId]
        );

        const totalCustomers = registeredResult[0].count + guestResult[0].count;
        const returningCount = returningRegistered[0].count + returningGuests[0].count;
        const returningRate = totalCustomers > 0 ? Math.round((returningCount / totalCustomers) * 100) : 0;

        response.status(200).json({
            success: true,
            stats: {
                total_customers: totalCustomers,
                returning_rate: returningRate,
                top_services: topServices
            }
        });
    } catch (error) {
        console.error('Get customer stats error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a statisztikák lekérdezésekor' });
    }
});

// Get all customers (registered + guests) for this provider
router.get('/customers', async (request, response) => {
    try {
        const providerId = request.providerId;
        const search = request.query.search ? `%${request.query.search}%` : null;

        let registeredQuery = `
            SELECT u.id, u.name, u.email, u.phone, u.profile_picture_url,
                   0 as is_guest,
                   COUNT(a.id) as total_bookings,
                   MAX(a.appointment_start) as last_booking_date,
                   COALESCE(SUM(a.price), 0) as total_spent
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            WHERE a.provider_id = ? AND a.deleted_at IS NULL`;
        const registeredParams = [providerId];

        if (search) {
            registeredQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
            registeredParams.push(search, search);
        }
        registeredQuery += ` GROUP BY u.id ORDER BY last_booking_date DESC`;

        const [registeredCustomers] = await pool.query(registeredQuery, registeredParams);

        let guestQuery = `
            SELECT NULL as id, MAX(a.guest_name) as name, a.guest_email as email,
                   MAX(a.guest_phone) as phone, NULL as profile_picture_url,
                   1 as is_guest,
                   COUNT(a.id) as total_bookings,
                   MAX(a.appointment_start) as last_booking_date,
                   COALESCE(SUM(a.price), 0) as total_spent
            FROM appointments a
            WHERE a.provider_id = ? AND a.user_id IS NULL
                  AND a.guest_email IS NOT NULL AND a.deleted_at IS NULL`;
        const guestParams = [providerId];

        if (search) {
            guestQuery += ` AND (a.guest_name LIKE ? OR a.guest_email LIKE ?)`;
            guestParams.push(search, search);
        }
        guestQuery += ` GROUP BY a.guest_email ORDER BY last_booking_date DESC`;

        const [guestCustomers] = await pool.query(guestQuery, guestParams);

        const customers = [...registeredCustomers, ...guestCustomers].sort(
            (a, b) => new Date(b.last_booking_date) - new Date(a.last_booking_date)
        );

        response.status(200).json({ success: true, customers });
    } catch (error) {
        console.error('Get customers error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt az ügyfelek lekérdezésekor' });
    }
});

// Get full detail for a registered customer
router.get('/customers/registered/:userId', async (request, response) => {
    try {
        const providerId = request.providerId;
        const userId = parseInt(request.params.userId);

        if (isNaN(userId)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen felhasználó azonosító' });
        }

        const [users] = await pool.query(
            `SELECT id, name, email, phone, profile_picture_url, created_at FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return response.status(404).json({ success: false, message: 'Felhasználó nem található' });
        }

        const [appointments] = await pool.query(
            `SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price, a.comment,
                    s.name as service_name
             FROM appointments a
             JOIN services s ON a.service_id = s.id
             WHERE a.provider_id = ? AND a.user_id = ? AND a.deleted_at IS NULL
             ORDER BY a.appointment_start DESC`,
            [providerId, userId]
        );

        const totalSpent = appointments.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);

        const [ratings] = await pool.query(
            `SELECT r.provider_rating as rating, r.provider_comment as comment, r.created_at
             FROM ratings r
             WHERE r.provider_id = ? AND r.user_id = ? AND r.active = TRUE
             ORDER BY r.created_at DESC LIMIT 1`,
            [providerId, userId]
        );

        response.status(200).json({
            success: true,
            customer: {
                ...users[0],
                is_guest: false,
                total_bookings: appointments.length,
                total_spent: totalSpent,
                first_booking_date: appointments.length > 0 ? appointments[appointments.length - 1].appointment_start : null,
                rating: ratings.length > 0 ? ratings[0] : null,
                appointments
            }
        });
    } catch (error) {
        console.error('Get registered customer error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt az ügyfél lekérdezésekor' });
    }
});

// Get full detail for a guest customer by email
router.get('/customers/guest', async (request, response) => {
    try {
        const providerId = request.providerId;
        const email = request.query.email;

        if (!email) {
            return response.status(400).json({ success: false, message: 'Email cím megadása kötelező' });
        }

        const [appointments] = await pool.query(
            `SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price,
                    a.guest_name as name, a.guest_email as email, a.guest_phone as phone,
                    s.name as service_name
             FROM appointments a
             JOIN services s ON a.service_id = s.id
             WHERE a.provider_id = ? AND a.guest_email = ? AND a.user_id IS NULL AND a.deleted_at IS NULL
             ORDER BY a.appointment_start DESC`,
            [providerId, email]
        );

        if (appointments.length === 0) {
            return response.status(404).json({ success: false, message: 'Vendég ügyfél nem található' });
        }

        const totalSpent = appointments.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
        const first = appointments[appointments.length - 1];

        response.status(200).json({
            success: true,
            customer: {
                id: null,
                name: first.name,
                email: first.email,
                phone: first.phone,
                profile_picture_url: null,
                is_guest: true,
                total_bookings: appointments.length,
                total_spent: totalSpent,
                first_booking_date: first.appointment_start,
                rating: null,
                appointments
            }
        });
    } catch (error) {
        console.error('Get guest customer error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a vendég ügyfél lekérdezésekor' });
    }
});

// Send reminder email to a customer
router.post('/customers/remind', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { userId, guestEmail } = request.body;

        if (!userId && !guestEmail) {
            return response.status(400).json({ success: false, message: 'userId vagy guestEmail megadása kötelező' });
        }

        // Get salon name for the email
        const [salonResult] = await pool.query(
            `SELECT s.name FROM salons s JOIN providers p ON p.salon_id = s.id WHERE p.id = ?`,
            [providerId]
        );

        if (salonResult.length === 0) {
            return response.status(404).json({ success: false, message: 'Szalon nem található' });
        }

        const salonName = salonResult[0].name;
        let customerEmail, customerName;

        if (userId) {
            // Registered user — verify they have a booking with this provider
            const [users] = await pool.query(
                `SELECT u.name, u.email FROM users u
                 INNER JOIN appointments a ON a.user_id = u.id
                 WHERE u.id = ? AND a.provider_id = ? LIMIT 1`,
                [userId, providerId]
            );
            if (users.length === 0) {
                return response.status(404).json({ success: false, message: 'Ügyfél nem található' });
            }
            customerEmail = users[0].email;
            customerName = users[0].name;
        } else {
            // Guest — verify they have a booking with this provider
            const [guests] = await pool.query(
                `SELECT guest_name, guest_email FROM appointments
                 WHERE guest_email = ? AND provider_id = ? AND user_id IS NULL LIMIT 1`,
                [guestEmail, providerId]
            );
            if (guests.length === 0) {
                return response.status(404).json({ success: false, message: 'Vendég ügyfél nem található' });
            }
            customerEmail = guests[0].guest_email;
            customerName = guests[0].guest_name;
        }

        if (!customerEmail) {
            return response.status(400).json({ success: false, message: 'Az ügyfélnek nincs email címe' });
        }

        await sendCustomerReminder({ customer_email: customerEmail, customer_name: customerName, salon_name: salonName });

        response.status(200).json({ success: true, message: 'Emlékeztető sikeresen elküldve' });
    } catch (error) {
        console.error('Send reminder error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt az emlékeztető küldésekor' });
    }
});

module.exports = router;

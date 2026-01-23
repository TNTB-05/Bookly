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
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM appointments a
            JOIN users u ON a.user_id = u.id
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
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM appointments a
            JOIN users u ON a.user_id = u.id
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
            'UPDATE appointments SET status = ? WHERE id = ?',
            ['canceled', appointmentId]
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

module.exports = router;

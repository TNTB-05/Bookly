const express = require('express');
const router = express.Router();
const { pool, getSalonHoursByProviderId, getExpandedTimeBlocksForDate } = require('../sql/database.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');

// Middleware to check if provider is a manager and set req.salonId
const isManagerMiddleware = async (req, res, next) => {
    try {
        const providerId = req.user.userId;

        const [providers] = await pool.query(
            'SELECT isManager, salon_id FROM providers WHERE id = ?',
            [providerId]
        );

        if (providers.length === 0) {
            return res.status(404).json({ success: false, message: 'Szolgáltató nem található' });
        }

        if (!providers[0].isManager) {
            return res.status(403).json({ success: false, message: 'Csak menedzserek végezhetik el ezt a műveletet' });
        }

        req.salonId = providers[0].salon_id;
        next();
    } catch (error) {
        console.error('Manager check error:', error);
        return res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
};

// Helper: verify staffId belongs to manager's salon
const verifyStaffBelongsToSalon = async (staffId, salonId) => {
    const [rows] = await pool.query(
        'SELECT id FROM providers WHERE id = ? AND salon_id = ?',
        [staffId, salonId]
    );
    return rows.length > 0;
};

// Helper: verify appointment belongs to manager's salon
const verifyAppointmentBelongsToSalon = async (appointmentId, salonId) => {
    const [rows] = await pool.query(
        `SELECT a.id FROM appointments a
         JOIN providers p ON p.id = a.provider_id
         WHERE a.id = ? AND p.salon_id = ?`,
        [appointmentId, salonId]
    );
    return rows.length > 0;
};

function formatLocalDatetime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

// GET /api/staff/services/:staffId — returns active services for a staff member
// Applied before the manager middleware since both managers and providers need this.
// We keep it manager-only for simplicity (consistent with all other staff routes).

// Apply auth + manager check to all routes
router.use(AuthMiddleware, isManagerMiddleware);

// GET /api/staff/services/:staffId — list active services for a staff member
router.get('/services/:staffId', async (req, res) => {
    try {
        const staffId = parseInt(req.params.staffId);
        if (isNaN(staffId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen munkatárs azonosító' });
        }

        const belongs = await verifyStaffBelongsToSalon(staffId, req.salonId);
        if (!belongs) {
            return res.status(403).json({ success: false, message: 'A munkatárs nem tartozik a szalonhoz' });
        }

        const [services] = await pool.query(
            `SELECT id, name, description, duration_minutes, price, status
             FROM services WHERE provider_id = ? AND status = 'available'
             ORDER BY name ASC`,
            [staffId]
        );

        res.status(200).json({ success: true, services });
    } catch (error) {
        console.error('Get staff services error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// GET /api/staff/calendar/:staffId?date=YYYY-MM-DD
// Returns appointments + time blocks for a staff member on a given date
router.get('/calendar/:staffId', async (req, res) => {
    try {
        const staffId = parseInt(req.params.staffId);
        const { date } = req.query;

        if (isNaN(staffId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen munkatárs azonosító' });
        }

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen dátum formátum (YYYY-MM-DD szükséges)' });
        }

        const belongs = await verifyStaffBelongsToSalon(staffId, req.salonId);
        if (!belongs) {
            return res.status(403).json({ success: false, message: 'A munkatárs nem tartozik a szalonhoz' });
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
             WHERE a.provider_id = ? AND DATE(a.appointment_start) = ?
             ORDER BY a.appointment_start ASC`,
            [staffId, date]
        );

        const timeBlocks = await getExpandedTimeBlocksForDate(staffId, date);

        const salonHours = await getSalonHoursByProviderId(staffId);

        res.status(200).json({
            success: true,
            appointments,
            timeBlocks,
            openingHour: salonHours?.opening_hours || 8,
            closingHour: salonHours?.closing_hours || 20
        });
    } catch (error) {
        console.error('Get staff calendar error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// POST /api/staff/appointment
// Creates an appointment for a staff member
router.post('/appointment', async (req, res) => {
    try {
        const { staffId, is_guest, user_email, user_name, user_phone, service_id, appointment_date, appointment_time, comment } = req.body;

        if (!staffId || !user_name || !service_id || !appointment_date || !appointment_time) {
            return res.status(400).json({ success: false, message: 'staffId, név, szolgáltatás, dátum és idő megadása kötelező' });
        }

        const parsedStaffId = parseInt(staffId);
        if (isNaN(parsedStaffId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen munkatárs azonosító' });
        }

        const belongs = await verifyStaffBelongsToSalon(parsedStaffId, req.salonId);
        if (!belongs) {
            return res.status(403).json({ success: false, message: 'A munkatárs nem tartozik a szalonhoz' });
        }

        // Verify service belongs to the staff member
        const [services] = await pool.query(
            'SELECT id, duration_minutes, price FROM services WHERE id = ? AND provider_id = ?',
            [service_id, parsedStaffId]
        );

        if (services.length === 0) {
            return res.status(404).json({ success: false, message: 'Szolgáltatás nem található a munkatársnál' });
        }

        const service = services[0];
        const salonHours = await getSalonHoursByProviderId(parsedStaffId);
        const openingHour = salonHours?.opening_hours || 8;
        const closingHour = salonHours?.closing_hours || 20;

        const appointmentStart = new Date(`${appointment_date}T${appointment_time}`);
        const appointmentEnd = new Date(appointmentStart.getTime() + service.duration_minutes * 60000);

        const startHour = appointmentStart.getHours();
        if (startHour < openingHour || startHour >= closingHour) {
            return res.status(400).json({ success: false, message: 'Az időpont a szalon nyitvatartási idején kívül esik' });
        }

        let userId = null;

        if (is_guest) {
            if (!user_email && !user_phone) {
                return res.status(400).json({ success: false, message: 'Vendég foglaláshoz email vagy telefonszám szükséges' });
            }
        } else {
            if (!user_email) {
                return res.status(400).json({ success: false, message: 'Regisztrált felhasználóhoz email cím szükséges' });
            }

            const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [user_email.trim()]);

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
                await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [user_name.trim(), user_phone?.trim() || null, userId]);
            } else {
                const bcrypt = require('bcryptjs');
                const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
                const [result] = await pool.query(
                    `INSERT INTO users (name, email, phone, password_hash, status, role) VALUES (?, ?, ?, ?, 'active', 'customer')`,
                    [user_name.trim(), user_email.trim(), user_phone?.trim() || null, defaultPasswordHash]
                );
                userId = result.insertId;
            }
        }

        // Check for appointment conflicts
        const [conflicts] = await pool.query(
            `SELECT id FROM appointments
             WHERE provider_id = ? AND status = 'scheduled'
             AND (
                 (appointment_start < ? AND appointment_end > ?)
                 OR (appointment_start < ? AND appointment_end > ?)
                 OR (appointment_start >= ? AND appointment_end <= ?)
             )`,
            [
                parsedStaffId,
                formatLocalDatetime(appointmentEnd), formatLocalDatetime(appointmentStart),
                formatLocalDatetime(appointmentEnd), formatLocalDatetime(appointmentStart),
                formatLocalDatetime(appointmentStart), formatLocalDatetime(appointmentEnd)
            ]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ success: false, message: 'Ez az időpont már foglalt' });
        }

        // Check for time block conflicts
        const dateStr = formatLocalDatetime(appointmentStart).split(' ')[0];
        const timeBlocks = await getExpandedTimeBlocksForDate(parsedStaffId, dateStr);
        const hasConflict = timeBlocks.some(block => {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            return appointmentStart < blockEnd && appointmentEnd > blockStart;
        });

        if (hasConflict) {
            return res.status(409).json({ success: false, message: 'Időpont ütközik a munkatárs szünetével' });
        }

        const [appointmentResult] = await pool.query(
            `INSERT INTO appointments (user_id, provider_id, service_id, appointment_start, appointment_end, comment, price, status, guest_name, guest_email, guest_phone)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)`,
            [
                userId, parsedStaffId, service_id,
                formatLocalDatetime(appointmentStart), formatLocalDatetime(appointmentEnd),
                comment?.trim() || null, service.price,
                is_guest ? user_name.trim() : null,
                is_guest ? (user_email?.trim() || null) : null,
                is_guest ? (user_phone?.trim() || null) : null
            ]
        );

        res.status(201).json({ success: true, message: 'Foglalás sikeresen létrehozva', appointmentId: appointmentResult.insertId });
    } catch (error) {
        console.error('Create staff appointment error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// PUT /api/staff/appointment/:appointmentId
// Updates appointment status or comment
router.put('/appointment/:appointmentId', async (req, res) => {
    try {
        const appointmentId = parseInt(req.params.appointmentId);
        const { status, comment } = req.body;

        if (isNaN(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen foglalás azonosító' });
        }

        const belongs = await verifyAppointmentBelongsToSalon(appointmentId, req.salonId);
        if (!belongs) {
            return res.status(403).json({ success: false, message: 'A foglalás nem tartozik a szalonhoz' });
        }

        const validStatuses = ['scheduled', 'completed', 'canceled', 'no_show'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen státusz' });
        }

        const updates = [];
        const params = [];

        if (status) { updates.push('status = ?'); params.push(status); }
        if (comment !== undefined) { updates.push('comment = ?'); params.push(comment?.trim() || null); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Nincs módosítandó adat' });
        }

        params.push(appointmentId);
        await pool.query(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, params);

        res.status(200).json({ success: true, message: 'Foglalás sikeresen frissítve' });
    } catch (error) {
        console.error('Update staff appointment error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// DELETE /api/staff/appointment/:appointmentId
// Deletes (cancels) a staff appointment
router.delete('/appointment/:appointmentId', async (req, res) => {
    try {
        const appointmentId = parseInt(req.params.appointmentId);

        if (isNaN(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen foglalás azonosító' });
        }

        const belongs = await verifyAppointmentBelongsToSalon(appointmentId, req.salonId);
        if (!belongs) {
            return res.status(403).json({ success: false, message: 'A foglalás nem tartozik a szalonhoz' });
        }

        const [appointments] = await pool.query(
            'SELECT id, status FROM appointments WHERE id = ?',
            [appointmentId]
        );

        if (appointments.length === 0) {
            return res.status(404).json({ success: false, message: 'Foglalás nem található' });
        }

        if (appointments[0].status === 'canceled') {
            return res.status(400).json({ success: false, message: 'Ez a foglalás már törölve van' });
        }

        await pool.query('DELETE FROM appointments WHERE id = ?', [appointmentId]);

        res.status(200).json({ success: true, message: 'Foglalás sikeresen törölve' });
    } catch (error) {
        console.error('Delete staff appointment error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

module.exports = router;

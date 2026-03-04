const express = require('express');
const router = express.Router();
const { verifyStaffBelongsToSalon } = require('../sql/providerQueries.js');
const { verifyAppointmentBelongsToSalon, getStaffCalendarAppointments, checkProviderAppointmentConflicts, createAppointment, getAppointmentStatusById, deleteAppointment, updateAppointmentStatus, updateAppointmentComment } = require('../sql/appointmentQueries.js');
const { getActiveServicesForStaff, getServiceByIdAndProvider, getSalonHoursByProviderId } = require('../sql/serviceQueries.js');
const { getExpandedTimeBlocksForDate } = require('../sql/timeBlockQueries.js');
const { getUserByEmail, updateUserNameAndPhone, createUserFromProviderBooking } = require('../sql/userQueries.js');
const { formatLocalDatetime } = require('../utils/dateUtils.js');
const { isManagerMiddleware } = require('../middleware/providerMiddleware.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');
const bcrypt = require('bcryptjs');

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

        const services = await getActiveServicesForStaff(staffId);

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

        const appointments = await getStaffCalendarAppointments(staffId, date);

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
        const service = await getServiceByIdAndProvider(service_id, parsedStaffId);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Szolgáltatás nem található a munkatársnál' });
        }
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

            const existingUser = await getUserByEmail(user_email.trim());

            if (existingUser) {
                userId = existingUser.id;
                await updateUserNameAndPhone(userId, user_name.trim(), user_phone?.trim() || null);
            } else {
                const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
                userId = await createUserFromProviderBooking(user_name.trim(), user_email.trim(), user_phone?.trim() || null, defaultPasswordHash);
            }
        }

        // Check for appointment conflicts
        const conflicts = await checkProviderAppointmentConflicts(
            parsedStaffId,
            formatLocalDatetime(appointmentStart),
            formatLocalDatetime(appointmentEnd)
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

        const appointmentId = await createAppointment({
            userId,
            providerId: parsedStaffId,
            serviceId: service_id,
            appointmentStart: formatLocalDatetime(appointmentStart),
            appointmentEnd: formatLocalDatetime(appointmentEnd),
            comment: comment?.trim() || null,
            price: service.price,
            guestName: is_guest ? user_name.trim() : null,
            guestEmail: is_guest ? (user_email?.trim() || null) : null,
            guestPhone: is_guest ? (user_phone?.trim() || null) : null
        });

        res.status(201).json({ success: true, message: 'Foglalás sikeresen létrehozva', appointmentId });
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

        if (!status && comment === undefined) {
            return res.status(400).json({ success: false, message: 'Nincs módosítandó adat' });
        }

        if (status) {
            await updateAppointmentStatus(appointmentId, status);
        }
        if (comment !== undefined) {
            await updateAppointmentComment(appointmentId, comment?.trim() || null);
        }

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

        const appointment = await getAppointmentStatusById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Foglalás nem található' });
        }

        if (appointment.status === 'canceled') {
            return res.status(400).json({ success: false, message: 'Ez a foglalás már törölve van' });
        }

        await deleteAppointment(appointmentId);

        res.status(200).json({ success: true, message: 'Foglalás sikeresen törölve' });
    } catch (error) {
        console.error('Delete staff appointment error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

module.exports = router;

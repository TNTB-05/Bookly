/**
 * Appointment routes for user API.
 * Covers: GET /appointments, POST /appointments (with transaction + travel buffer),
 *         PATCH /appointments/:id/comment, DELETE /appointments/:id,
 *         GET /provider/:providerId/availability (public).
 */

const express = require('express');
const router = express.Router();
const pool = require('../../sql/pool');
const AuthMiddleware = require('../auth/AuthMiddleware');
const { getAppointmentById, getUserAppointments, autoCompletePastAppointments, getNewAppointmentDetails, updateAppointmentComment, getAppointmentDetailsForUserCancel, updateAppointmentStatus, getUserConflictingAppointments, checkProviderConflictsForUpdate, createAppointmentTx } = require('../../sql/appointmentQueries');
const { getServiceById } = require('../../sql/serviceQueries');
const { getProviderById } = require('../../sql/providerQueries');
const { getSalonById } = require('../../sql/salonQueries');
const { getAvailableTimeSlots } = require('../../services/availabilityService');
const { calculateDistance } = require('../../services/locationService');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../../services/emailService');
const { notifyWaitlistForCancelledSlot } = require('../../services/waitlistService');
const { formatLocalDatetime } = require('../../utils/dateUtils');

// Travel time multiplier (minutes per km) — single config point
const TRAVEL_TIME_MULTIPLIER_MIN_PER_KM = 2;

function calculateTravelBuffer(distanceKm) {
    return Math.max(5, Math.round(distanceKm * TRAVEL_TIME_MULTIPLIER_MIN_PER_KM));
}

// Get user's appointments
router.get('/appointments', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Safety layer: auto-complete past-due appointments for this user
        await autoCompletePastAppointments(userId);

        const appointments = await getUserAppointments(userId);

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ success: false, message: 'Hiba történt a foglalások lekérdezésekor' });
    }
});

// Create new appointment (customer booking) — uses transaction + FOR UPDATE locking
router.post('/appointments', AuthMiddleware, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.userId;
        const { provider_id, service_id, appointment_date, appointment_time, comment } = req.body;

        if (!provider_id || !service_id || !appointment_date || !appointment_time) {
            return res.status(400).json({ success: false, message: 'Szolgáltató, szolgáltatás, dátum és időpont megadása kötelező' });
        }

        const service = await getServiceById(service_id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'A szolgáltatás nem található' });
        }

        if (service.provider_id !== parseInt(provider_id)) {
            return res.status(400).json({ success: false, message: 'A szolgáltatás nem tartozik ehhez a szolgáltatóhoz' });
        }

        const provider = await getProviderById(provider_id);
        if (!provider || provider.status !== 'active') {
            return res.status(404).json({ success: false, message: 'A szolgáltató nem található vagy nem elérhető' });
        }

        const appointmentStart = new Date(`${appointment_date}T${appointment_time}`);
        const appointmentEnd = new Date(appointmentStart.getTime() + service.duration_minutes * 60000);

        if (appointmentStart <= new Date()) {
            return res.status(400).json({ success: false, message: 'A foglalás időpontja nem lehet a múltban' });
        }

        const openingHour = service.opening_hours || 8;
        const closingHour = service.closing_hours || 20;
        const startHour = appointmentStart.getHours();
        const endHour = appointmentEnd.getHours();
        const endMinute = appointmentEnd.getMinutes();

        if (startHour < openingHour || (endHour > closingHour) || (endHour === closingHour && endMinute > 0)) {
            return res.status(400).json({ success: false, message: 'A foglalás kívül esik a nyitvatartási időn' });
        }

        // Start transaction for race condition prevention
        await connection.beginTransaction();

        try {
            const targetSalon = await getSalonById(provider.salon_id);

            // Check for user's own conflicting appointments with distance-based buffer
            const userAppointments = await getUserConflictingAppointments(connection, userId, appointment_date);

            for (const existingAppt of userAppointments) {
                const existingStart = new Date(existingAppt.appointment_start);
                const existingEnd = new Date(existingAppt.appointment_end);

                let bufferMinutes = 0;
                const isSameSalon = existingAppt.salon_id === provider.salon_id;

                if (!isSameSalon && targetSalon.latitude && targetSalon.longitude &&
                    existingAppt.latitude && existingAppt.longitude) {
                    const distance = calculateDistance(
                        parseFloat(targetSalon.latitude),
                        parseFloat(targetSalon.longitude),
                        parseFloat(existingAppt.latitude),
                        parseFloat(existingAppt.longitude)
                    );
                    bufferMinutes = calculateTravelBuffer(distance);
                } else if (!isSameSalon) {
                    bufferMinutes = 30;
                }

                const existingStartWithBuffer = new Date(existingStart.getTime() - bufferMinutes * 60000);
                const existingEndWithBuffer = new Date(existingEnd.getTime() + bufferMinutes * 60000);

                const hasDirectConflict = (appointmentStart < existingEnd && appointmentEnd > existingStart);
                const hasConflict = (
                    (appointmentStart < existingEndWithBuffer && appointmentEnd > existingStart) ||
                    (appointmentStart < existingEnd && appointmentEnd > existingStartWithBuffer)
                );

                if (hasConflict) {
                    await connection.rollback();

                    const fmtOpts = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' };
                    const startFmt = existingStart.toLocaleTimeString('hu-HU', fmtOpts);
                    const endFmt = existingEnd.toLocaleTimeString('hu-HU', fmtOpts);

                    let message;
                    if (hasDirectConflict) {
                        message = `Ebben az időpontban már egy másik szalonban van foglalása (${startFmt}–${endFmt}), ${existingAppt.salon_name}. Kérjük válasszon másik időpontot.`;
                    } else {
                        message = `Az utazási idő miatt (${bufferMinutes} perc) nem lehetséges. Kérjük válasszon másik időpontot.`;
                    }

                    return res.status(409).json({ success: false, message });
                }
            }

            // Check for provider availability conflicts with row-level locking
            const conflicts = await checkProviderConflictsForUpdate(
                connection,
                provider_id,
                formatLocalDatetime(appointmentStart),
                formatLocalDatetime(appointmentEnd)
            );

            if (conflicts.length > 0) {
                await connection.rollback();
                return res.status(409).json({ success: false, message: 'Ez az időpont már foglalt. Kérjük, válasszon másik időpontot.' });
            }

            // Create appointment
            const appointmentId = await createAppointmentTx(connection, {
                userId,
                providerId: provider_id,
                serviceId: service_id,
                appointmentStart: formatLocalDatetime(appointmentStart),
                appointmentEnd: formatLocalDatetime(appointmentEnd),
                comment,
                price: service.price
            });

            await connection.commit();

            // Get the created appointment details (outside transaction)
            const newAppointment = await getNewAppointmentDetails(appointmentId);

            sendAppointmentConfirmation(newAppointment).catch(console.error);

            res.status(201).json({
                success: true,
                message: 'Foglalás sikeresen létrehozva',
                appointment: newAppointment
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ success: false, message: 'Hiba történt a foglalás létrehozásakor' });
    } finally {
        connection.release();
    }
});

// Update appointment comment
router.patch('/appointments/:id/comment', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const appointmentId = parseInt(req.params.id);
        const { comment } = req.body;

        if (!appointmentId || isNaN(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen foglalás azonosító' });
        }

        const appointment = await getAppointmentById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'A foglalás nem található' });
        }

        if (appointment.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Nincs jogosultságod módosítani ezt a foglalást' });
        }

        if (appointment.status !== 'scheduled') {
            return res.status(400).json({ success: false, message: 'Csak várható foglalás megjegyzése szerkeszthető' });
        }

        await updateAppointmentComment(appointmentId, comment?.trim() || null);

        return res.status(200).json({ success: true, message: 'Megjegyzés frissítve' });
    } catch (error) {
        console.error('Update comment error:', error);
        return res.status(500).json({ success: false, message: 'Hiba a megjegyzés frissítésekor' });
    }
});

// Cancel user's appointment
router.delete('/appointments/:id', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const appointmentId = parseInt(req.params.id);

        if (!appointmentId || isNaN(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen foglalás azonosító' });
        }

        const appointment = await getAppointmentById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'A foglalás nem található' });
        }

        if (appointment.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Nincs jogosultságod törölni ezt a foglalást' });
        }

        if (appointment.status !== 'scheduled') {
            return res.status(400).json({ success: false, message: 'Csak aktív foglalás mondható le' });
        }

        // Get details for email and waitlist notification before canceling
        const cancelDetails = await getAppointmentDetailsForUserCancel(appointmentId);

        await updateAppointmentStatus(appointmentId, 'canceled');

        if (cancelDetails) {
            sendAppointmentCancellation(cancelDetails).catch(err => {
                console.error('Failed to send cancellation email:', err);
            });

            notifyWaitlistForCancelledSlot(
                cancelDetails.provider_id,
                cancelDetails.service_id,
                cancelDetails.appointment_start,
                cancelDetails.salon_name,
                cancelDetails.service_name,
                cancelDetails.provider_name
            ).catch(err => console.error('Waitlist notify error:', err));
        }

        res.status(200).json({ success: true, message: 'Foglalás sikeresen lemondva' });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ success: false, message: 'Hiba történt a foglalás lemondásakor' });
    }
});

// Get available time slots for a provider on a specific date (public endpoint — no AuthMiddleware)
router.get('/provider/:providerId/availability', async (req, res) => {
    try {
        const providerId = parseInt(req.params.providerId);
        const { date, serviceDuration } = req.query;

        if (!providerId || isNaN(providerId)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen szolgáltató azonosító' });
        }

        if (!date) {
            return res.status(400).json({ success: false, message: 'Dátum megadása kötelező' });
        }

        const duration = parseInt(serviceDuration) || 60;

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen dátum formátum (YYYY-MM-DD)' });
        }

        const requestedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (requestedDate < today) {
            return res.status(400).json({ success: false, message: 'Múltbeli dátumra nem lehet foglalni' });
        }

        const slots = await getAvailableTimeSlots(providerId, date, duration);

        res.status(200).json({ success: true, date, serviceDuration: duration, slots });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ success: false, message: 'Hiba történt az időpontok lekérdezésekor' });
    }
});

module.exports = router;

/**
 * Appointment routes for provider calendar.
 * Covers: GET/POST/DELETE/PATCH /appointments
 */

const express = require('express');
const router = express.Router();
const { getSalonHoursByProviderId, getServiceByIdAndProvider } = require('../../sql/serviceQueries');
const { getExpandedTimeBlocksForDate } = require('../../sql/timeBlockQueries');
const {
    getProviderAppointments,
    getProviderAppointmentById,
    checkProviderAppointmentConflicts,
    createAppointment,
    getAppointmentWithDetailsForCancel,
    deleteAppointment,
    getAppointmentOwnership,
    updateAppointmentStatus
} = require('../../sql/appointmentQueries');
const { findUserByEmail, updateUserNameAndPhone, createUserFromProviderBooking } = require('../../sql/userQueries');
const { sendAppointmentCancellation } = require('../../services/emailService');
const { notifyWaitlistForCancelledSlot } = require('../../services/waitlistService');
const { formatLocalDatetime } = require('../../utils/dateUtils');
const { logEvent } = require('../../services/logService');
const bcrypt = require('bcryptjs');

// Get appointments for a provider
router.get('/', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { startDate, endDate } = request.query;

        const appointments = await getProviderAppointments(providerId, startDate, endDate);

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
router.get('/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const appointmentId = request.params.id;

        if (isNaN(parseInt(appointmentId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen foglalás azonosító'
            });
        }

        const appointment = await getProviderAppointmentById(appointmentId, providerId);

        if (!appointment) {
            return response.status(404).json({
                success: false,
                message: 'Foglalás nem található vagy nincs jogosultságod megtekinteni'
            });
        }

        response.status(200).json({
            success: true,
            appointment
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
router.post('/', async (request, response) => {
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
        const service = await getServiceByIdAndProvider(service_id, providerId);

        if (!service) {
            return response.status(404).json({
                success: false,
                message: 'Szolgáltatás nem található'
            });
        }

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
            if (!user_email && !user_phone) {
                return response.status(400).json({
                    success: false,
                    message: 'Vendég foglaláshoz email vagy telefonszám szükséges'
                });
            }
        } else {
            if (!user_email) {
                return response.status(400).json({
                    success: false,
                    message: 'Regisztrált felhasználóhoz email cím szükséges'
                });
            }

            // Find or create user
            const existingUser = await findUserByEmail(user_email.trim());

            if (existingUser) {
                userId = existingUser.id;
                await updateUserNameAndPhone(userId, user_name.trim(), user_phone?.trim() || null);
            } else {
                // Create new user with default password
                const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
                userId = await createUserFromProviderBooking(user_name.trim(), user_email.trim(), user_phone?.trim() || null, defaultPasswordHash);
            }
        }

        // Check for conflicts
        const conflicts = await checkProviderAppointmentConflicts(
            providerId,
            formatLocalDatetime(appointmentStart),
            formatLocalDatetime(appointmentEnd)
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
        const appointmentId = await createAppointment({
            userId,
            providerId,
            serviceId: service_id,
            appointmentStart: formatLocalDatetime(appointmentStart),
            appointmentEnd: formatLocalDatetime(appointmentEnd),
            comment: comment?.trim() || null,
            price: service.price,
            guestName: is_guest ? user_name.trim() : null,
            guestEmail: is_guest ? (user_email?.trim() || null) : null,
            guestPhone: is_guest ? (user_phone?.trim() || null) : null
        });

        const provApptAction = is_guest ? 'PROVIDER_APPOINTMENT_CREATED_GUEST' : 'PROVIDER_APPOINTMENT_CREATED';
        const provApptDetails = is_guest
            ? `Provider #${providerId} created guest appointment #${appointmentId} for ${user_name}`
            : `Provider #${providerId} created appointment #${appointmentId} for user #${userId}`;
        logEvent('INFO', provApptAction, 'provider', providerId, 'appointment', appointmentId, provApptDetails).catch(() => {});

        response.status(201).json({
            success: true,
            message: 'Foglalás sikeresen létrehozva',
            appointmentId
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
router.delete('/:id', async (request, response) => {
    try {
        const providerId = request.providerId;
        const appointmentId = request.params.id;

        if (isNaN(parseInt(appointmentId))) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen foglalás azonosító'
            });
        }

        // Get appointment with details for email and waitlist
        const appointment = await getAppointmentWithDetailsForCancel(appointmentId);

        if (!appointment) {
            return response.status(404).json({
                success: false,
                message: 'Foglalás nem található'
            });
        }

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

        await deleteAppointment(appointmentId);

        logEvent('INFO', 'PROVIDER_APPOINTMENT_CANCELED', 'provider', providerId, 'appointment', parseInt(appointmentId), `Provider #${providerId} canceled appointment #${appointmentId}`).catch(() => {});

        // Send cancellation email (fire-and-forget)
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

        // Notify waitlisted users (fire-and-forget)
        notifyWaitlistForCancelledSlot(
            appointment.provider_id,
            appointment.service_id,
            appointment.appointment_start,
            appointment.salon_name,
            appointment.service_name,
            appointment.provider_name
        ).catch(err => console.error('Waitlist notify error:', err));

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
router.patch('/:id/status', async (request, response) => {
    try {
        const providerId = request.providerId;
        const appointmentId = request.params.id;
        const { status } = request.body;

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

        const appointment = await getAppointmentOwnership(appointmentId);

        if (!appointment) {
            return response.status(404).json({
                success: false,
                message: 'Foglalás nem található'
            });
        }

        if (appointment.provider_id !== providerId) {
            console.warn(`Security: Provider ${providerId} attempted to update appointment ${appointmentId} belonging to provider ${appointment.provider_id}`);
            return response.status(403).json({
                success: false,
                message: 'Nincs jogosultságod módosítani ezt a foglalást'
            });
        }

        await updateAppointmentStatus(appointmentId, status);

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

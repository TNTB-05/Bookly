/**
 * Admin rating, appointment, and log routes.
 * Covers: GET /ratings, DELETE /ratings/:id, GET /appointments, DELETE /appointments/:id, GET /logs.
 */

const express = require('express');
const router = express.Router();
const { getAdminRatings, getRatingById, deactivateRating } = require('../../sql/ratingQueries');
const { getAdminAppointments, getAdminAppointmentById, softDeleteAppointment } = require('../../sql/appointmentQueries');
const { getSystemLogs } = require('../../sql/adminQueries');
const { logEvent } = require('../../services/logService');

// ==================== Ratings ====================

// GET /admin/ratings — List all ratings for admin panel
router.get('/ratings', async (request, response) => {
    try {
        const ratings = await getAdminRatings();
        return response.status(200).json({ success: true, ratings });
    } catch (error) {
        console.error('[Admin Ratings] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba az értékelések lekérése során' });
    }
});

// DELETE /admin/ratings/:id — Deactivate a rating by ID
router.delete('/ratings/:id', async (request, response) => {
    try {
        const ratingId = request.params.id;

        const rating = await getRatingById(ratingId);
        if (!rating) return response.status(404).json({ success: false, message: 'Értékelés nem található' });

        await deactivateRating(ratingId);
        await logEvent('WARN', 'RATING_DEACTIVATE', 'admin', request.user.userId, 'rating', parseInt(ratingId),
            `Admin deactivated rating #${ratingId} (salon: ${rating.salon_id}, provider: ${rating.provider_id})`);
        return response.status(200).json({ success: true, message: 'Értékelés deaktiválva' });
    } catch (error) {
        console.error('[Admin Delete Rating] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba az értékelés törlése során' });
    }
});

// ==================== Appointments ====================

// GET /admin/appointments — List all appointments for admin panel
router.get('/appointments', async (request, response) => {
    try {
        const appointments = await getAdminAppointments();
        return response.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('[Admin Appointments] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a foglalások lekérése során' });
    }
});

// DELETE /admin/appointments/:id — Soft-delete an appointment with reason
router.delete('/appointments/:id', async (request, response) => {
    try {
        const appointmentId = request.params.id;
        const { reason } = request.body;
        if (!reason || reason.trim().length === 0) {
            return response.status(400).json({ success: false, message: 'Törlés indoklása kötelező' });
        }

        const appointment = await getAdminAppointmentById(appointmentId);
        if (!appointment) return response.status(404).json({ success: false, message: 'Foglalás nem található' });
        if (appointment.status === 'deleted') return response.status(400).json({ success: false, message: 'Ez a foglalás már törölve van' });

        await softDeleteAppointment(appointmentId, reason.trim(), request.user.userId);
        await logEvent('CRITICAL', 'APPOINTMENT_SOFT_DELETE', 'admin', request.user.userId, 'appointment', parseInt(appointmentId),
            `Admin soft-deleted appointment #${appointmentId} (was: ${appointment.status}, price: ${appointment.price}). Reason: ${reason.trim()}`);
        return response.status(200).json({ success: true, message: 'Foglalás törölve (soft delete)' });
    } catch (error) {
        console.error('[Admin Delete Appointment] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a foglalás törlése során' });
    }
});

// ==================== System Logs ====================

// GET /admin/logs — Fetch system logs with optional level/action filters
router.get('/logs', async (request, response) => {
    try {
        const { level, action, limit = 200 } = request.query;
        const logs = await getSystemLogs({ level, action, limit });
        return response.status(200).json({ success: true, logs });
    } catch (error) {
        console.error('[Admin Logs] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a naplók lekérése során' });
    }
});

module.exports = router;

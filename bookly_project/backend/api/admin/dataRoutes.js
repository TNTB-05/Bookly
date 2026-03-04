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

router.get('/ratings', async (req, res) => {
    try {
        const ratings = await getAdminRatings();
        return res.json({ success: true, ratings });
    } catch (error) {
        console.error('[Admin Ratings] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba az értékelések lekérése során' });
    }
});

router.delete('/ratings/:id', async (req, res) => {
    try {
        const ratingId = req.params.id;

        const rating = await getRatingById(ratingId);
        if (!rating) return res.status(404).json({ success: false, message: 'Értékelés nem található' });

        await deactivateRating(ratingId);
        await logEvent('WARN', 'RATING_DEACTIVATE', 'admin', req.user.userId, 'rating', parseInt(ratingId),
            `Admin deactivated rating #${ratingId} (salon: ${rating.salon_id}, provider: ${rating.provider_id})`);
        return res.json({ success: true, message: 'Értékelés deaktiválva' });
    } catch (error) {
        console.error('[Admin Delete Rating] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba az értékelés törlése során' });
    }
});

// ==================== Appointments ====================

router.get('/appointments', async (req, res) => {
    try {
        const appointments = await getAdminAppointments();
        return res.json({ success: true, appointments });
    } catch (error) {
        console.error('[Admin Appointments] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a foglalások lekérése során' });
    }
});

router.delete('/appointments/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { reason } = req.body;
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Törlés indoklása kötelező' });
        }

        const appointment = await getAdminAppointmentById(appointmentId);
        if (!appointment) return res.status(404).json({ success: false, message: 'Foglalás nem található' });
        if (appointment.status === 'deleted') return res.status(400).json({ success: false, message: 'Ez a foglalás már törölve van' });

        await softDeleteAppointment(appointmentId, reason.trim(), req.user.userId);
        await logEvent('CRITICAL', 'APPOINTMENT_SOFT_DELETE', 'admin', req.user.userId, 'appointment', parseInt(appointmentId),
            `Admin soft-deleted appointment #${appointmentId} (was: ${appointment.status}, price: ${appointment.price}). Reason: ${reason.trim()}`);
        return res.json({ success: true, message: 'Foglalás törölve (soft delete)' });
    } catch (error) {
        console.error('[Admin Delete Appointment] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a foglalás törlése során' });
    }
});

// ==================== System Logs ====================

router.get('/logs', async (req, res) => {
    try {
        const { level, action, limit = 200 } = req.query;
        const logs = await getSystemLogs({ level, action, limit });
        return res.json({ success: true, logs });
    } catch (error) {
        console.error('[Admin Logs] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a naplók lekérése során' });
    }
});

module.exports = router;

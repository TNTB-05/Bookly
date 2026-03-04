/**
 * Rating routes for user API.
 * Covers: POST /ratings, GET /ratings/appointment/:appointmentId.
 */

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../auth/AuthMiddleware');
const { createRating, getRatingByAppointment } = require('../../sql/ratingQueries');
const { getAppointmentById } = require('../../sql/appointmentQueries');

// Submit or update a rating
router.post('/ratings', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment } = req.body;

        if (!appointmentId || !salonId || !providerId || !salonRating || !providerRating) {
            return res.status(400).json({ success: false, message: 'Hiányzó kötelező mezők' });
        }

        if (salonRating < 1 || salonRating > 5 || providerRating < 1 || providerRating > 5) {
            return res.status(400).json({ success: false, message: 'Az értékelésnek 1 és 5 között kell lennie' });
        }

        const appointment = await getAppointmentById(appointmentId);
        if (!appointment || appointment.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Foglalás nem található vagy nem a tiéd' });
        }
        if (appointment.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Csak befejezett foglalásokat lehet értékelni' });
        }

        await createRating(userId, appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment);

        res.status(200).json({ success: true, message: 'Értékelés mentve!' });
    } catch (error) {
        console.error('Create rating error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba az értékelés mentése során' });
    }
});

// Get rating for a specific appointment
router.get('/ratings/appointment/:appointmentId', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const appointmentId = parseInt(req.params.appointmentId);

        const rating = await getRatingByAppointment(appointmentId);

        if (rating && rating.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Nincs jogosultságod' });
        }

        res.status(200).json({ success: true, rating: rating });
    } catch (error) {
        console.error('Get rating error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba az értékelés lekérése során' });
    }
});

module.exports = router;

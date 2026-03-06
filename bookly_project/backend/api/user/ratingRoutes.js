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
router.post('/ratings', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const { appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment } = request.body;

        if (!appointmentId || !salonId || !providerId || !salonRating || !providerRating) {
            return response.status(400).json({ success: false, message: 'Hiányzó kötelező mezők' });
        }

        if (salonRating < 1 || salonRating > 5 || providerRating < 1 || providerRating > 5) {
            return response.status(400).json({ success: false, message: 'Az értékelésnek 1 és 5 között kell lennie' });
        }

        const appointment = await getAppointmentById(appointmentId);
        if (!appointment || appointment.user_id !== userId) {
            return response.status(403).json({ success: false, message: 'Foglalás nem található vagy nem a tiéd' });
        }
        if (appointment.status !== 'completed') {
            return response.status(400).json({ success: false, message: 'Csak befejezett foglalásokat lehet értékelni' });
        }

        await createRating(userId, appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment);

        response.status(200).json({ success: true, message: 'Értékelés mentve!' });
    } catch (error) {
        console.error('Create rating error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba az értékelés mentése során' });
    }
});

// Get rating for a specific appointment
router.get('/ratings/appointment/:appointmentId', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const appointmentId = parseInt(request.params.appointmentId);

        const rating = await getRatingByAppointment(appointmentId);

        if (rating && rating.user_id !== userId) {
            return response.status(403).json({ success: false, message: 'Nincs jogosultságod' });
        }

        response.status(200).json({ success: true, rating: rating });
    } catch (error) {
        console.error('Get rating error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba az értékelés lekérése során' });
    }
});

module.exports = router;

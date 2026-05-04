const express = require('express');
const router = express.Router();
const { addToWaitlist, getUserWaitlistEntries, cancelWaitlistEntry } = require('../sql/waitlistQueries.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');

// POST /api/waitlist — join waitlist
router.post('/', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const { provider_id, service_id, date_from, date_to, time_from, time_to } = request.body;
        if (!provider_id || !service_id || !date_from || !date_to)
            return response.status(400).json({ success: false, message: 'Hiányzó adatok' });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parsedFrom = new Date(date_from);
        const parsedTo = new Date(date_to);
        if (isNaN(parsedFrom) || isNaN(parsedTo))
            return response.status(400).json({ success: false, message: 'Érvénytelen dátumformátum' });
        if (parsedFrom < today)
            return response.status(400).json({ success: false, message: 'A kezdő dátum nem lehet múltbeli' });
        if (parsedTo < parsedFrom)
            return response.status(400).json({ success: false, message: 'A befejező dátum nem lehet korábbi a kezdő dátumnál' });
        const result = await addToWaitlist(userId, provider_id, service_id, date_from, date_to, time_from, time_to);
        return response.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        return response.status(500).json({ success: false, message: 'Hiba a várólistára való feliratkozáskor', error: error.message });
    }
});

// GET /api/waitlist — get user's active waitlist entries
router.get('/', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const entries = await getUserWaitlistEntries(userId);
        return response.status(200).json({ success: true, data: { entries } });
    } catch (error) {
        return response.status(500).json({ success: false, message: 'Hiba a várólistás bejegyzések lekérésekor', error: error.message });
    }
});

// DELETE /api/waitlist/:id — cancel waitlist entry
router.delete('/:id', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        await cancelWaitlistEntry(parseInt(request.params.id), userId);
        return response.status(200).json({ success: true });
    } catch (error) {
        return response.status(500).json({ success: false, message: 'Hiba a várólistás bejegyzés törlésekor', error: error.message });
    }
});

module.exports = router;

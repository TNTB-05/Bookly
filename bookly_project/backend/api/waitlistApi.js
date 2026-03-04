const express = require('express');
const router = express.Router();
const { addToWaitlist, getUserWaitlistEntries, cancelWaitlistEntry } = require('../sql/waitlistQueries.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');

// POST /api/waitlist — join waitlist
router.post('/', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { provider_id, service_id, date_from, date_to, time_from, time_to } = req.body;
        if (!provider_id || !service_id || !date_from || !date_to)
            return res.json({ success: false, message: 'Hiányzó adatok' });
        const result = await addToWaitlist(userId, provider_id, service_id, date_from, date_to, time_from, time_to);
        res.json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Hiba a várólistára való feliratkozáskor', error: error.message });
    }
});

// GET /api/waitlist — get user's active waitlist entries
router.get('/', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const entries = await getUserWaitlistEntries(userId);
        res.json({ success: true, data: { entries } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Hiba a várólistás bejegyzések lekérésekor', error: error.message });
    }
});

// DELETE /api/waitlist/:id — cancel waitlist entry
router.delete('/:id', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        await cancelWaitlistEntry(parseInt(req.params.id), userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Hiba a várólistás bejegyzés törlésekor', error: error.message });
    }
});

module.exports = router;

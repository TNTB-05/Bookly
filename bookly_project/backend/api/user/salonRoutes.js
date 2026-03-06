/**
 * Saved-salon & visited-salon routes for user API.
 * Covers: GET saved-salons, GET saved-salon-ids, POST/DELETE saved-salons/:id, GET visited-salons.
 */

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../auth/AuthMiddleware');
const { getSavedSalonsByUserId, saveSalon, unsaveSalon, getSavedSalonIds } = require('../../sql/savedSalonQueries');
const { getProvidersBySalonId } = require('../../sql/providerQueries');
const { getVisitedSalons } = require('../../sql/appointmentQueries');

// Get user's saved salons
router.get('/saved-salons', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const savedSalons = await getSavedSalonsByUserId(userId);

        const salonsWithProviders = await Promise.all(
            savedSalons.map(async (salon) => {
                const providers = await getProvidersBySalonId(salon.id);
                return { ...salon, providers };
            })
        );

        response.status(200).json({ success: true, salons: salonsWithProviders });
    } catch (error) {
        console.error('Get saved salons error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba a mentett szalonok lekérése során' });
    }
});

// Get user's saved salon IDs
router.get('/saved-salon-ids', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const savedIds = await getSavedSalonIds(userId);
        response.status(200).json({ success: true, savedIds });
    } catch (error) {
        console.error('Get saved salon IDs error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba a mentett szalon azonosítók lekérése során' });
    }
});

// Save a salon
router.post('/saved-salons/:salonId', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const salonId = parseInt(request.params.salonId);

        if (!salonId || isNaN(salonId)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen szalon azonosító' });
        }

        await saveSalon(userId, salonId);
        response.status(200).json({ success: true, message: 'Szalon sikeresen mentve' });
    } catch (error) {
        console.error('Save salon error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba a szalon mentése során' });
    }
});

// Unsave a salon
router.delete('/saved-salons/:salonId', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const salonId = parseInt(request.params.salonId);

        if (!salonId || isNaN(salonId)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen szalon azonosító' });
        }

        await unsaveSalon(userId, salonId);
        response.status(200).json({ success: true, message: 'Szalon eltávolítva a mentettek közül' });
    } catch (error) {
        console.error('Unsave salon error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba a szalon eltávolítása során' });
    }
});

// Get user's visited salons (from past appointments)
router.get('/visited-salons', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;

        const salons = await getVisitedSalons(userId);

        const salonsWithProviders = await Promise.all(
            salons.map(async (salon) => {
                const providers = await getProvidersBySalonId(salon.id);
                return { ...salon, providers };
            })
        );

        response.status(200).json({ success: true, salons: salonsWithProviders });
    } catch (error) {
        console.error('Get visited salons error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a meglátogatott szalonok lekérdezésekor' });
    }
});

module.exports = router;

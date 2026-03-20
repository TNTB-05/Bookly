/**
 * Admin provider management routes.
 * Covers: GET /providers, GET /providers/:id, POST /providers/:id/deactivate|activate|ban|unban,
 *         DELETE /providers/:id/picture.
 */

const express = require('express');
const router = express.Router();
const { getAdminProviders, getAdminProviderById } = require('../../sql/providerQueries');
const { deactivateProvider, activateProvider, getProviderProfilePicture, removeProviderProfilePicture, banProvider, unbanProvider } = require('../../sql/adminQueries');
const { logEvent } = require('../../services/logService');
const fs = require('fs').promises;
const path = require('path');

// GET /admin/providers — List all providers for admin panel
router.get('/providers', async (request, response) => {
    try {
        const providers = await getAdminProviders();
        return response.status(200).json({ success: true, providers });
    } catch (error) {
        console.error('[Admin Providers] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a szolgáltatók lekérése során' });
    }
});

// GET /admin/providers/:id — Get detailed provider info by ID
router.get('/providers/:id', async (request, response) => {
    try {
        const providerId = request.params.id;
        const result = await getAdminProviderById(providerId);
        if (!result) return response.status(404).json({ success: false, message: 'Szolgáltató nem található' });

        return response.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error('[Admin Provider Detail] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a szolgáltató adatainak lekérése során' });
    }
});

// POST /admin/providers/:id/deactivate — Deactivate a provider account
router.post('/providers/:id/deactivate', async (request, response) => {
    try {
        const providerId = request.params.id;
        await deactivateProvider(providerId);
        await logEvent('WARN', 'PROVIDER_DEACTIVATE', 'admin', request.user.userId, 'provider', parseInt(providerId), `Admin deactivated provider #${providerId}`);
        return response.status(200).json({ success: true, message: 'Szolgáltató deaktiválva' });
    } catch (error) {
        console.error('[Admin Deactivate] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a deaktiválás során' });
    }
});

// POST /admin/providers/:id/activate — Re-activate a provider account
router.post('/providers/:id/activate', async (request, response) => {
    try {
        const providerId = request.params.id;
        await activateProvider(providerId);
        await logEvent('INFO', 'PROVIDER_ACTIVATE', 'admin', request.user.userId, 'provider', parseInt(providerId), `Admin activated provider #${providerId}`);
        return response.status(200).json({ success: true, message: 'Szolgáltató aktiválva' });
    } catch (error) {
        console.error('[Admin Activate] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba az aktiválás során' });
    }
});

// DELETE /admin/providers/:id/picture — Remove a provider's profile picture
router.delete('/providers/:id/picture', async (request, response) => {
    try {
        const providerId = request.params.id;

        const pictureUrl = await getProviderProfilePicture(providerId);
        if (pictureUrl) {
            const filePath = path.join(__dirname, '../..', pictureUrl);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }

        await removeProviderProfilePicture(providerId);
        await logEvent('WARN', 'PROVIDER_PIC_REMOVED', 'admin', request.user.userId, 'provider', parseInt(providerId), `Admin removed profile picture for provider #${providerId}`);
        return response.status(200).json({ success: true, message: 'Profilkép eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Provider Pic] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a profilkép eltávolítása során' });
    }
});

// POST /admin/providers/:id/ban — Ban a provider
router.post('/providers/:id/ban', async (request, response) => {
    try {
        const providerId = request.params.id;
        await banProvider(providerId);
        await logEvent('CRITICAL', 'PROVIDER_BAN', 'admin', request.user.userId, 'provider', parseInt(providerId), `Admin banned provider #${providerId}`);
        return response.status(200).json({ success: true, message: 'Szolgáltató letiltva' });
    } catch (error) {
        console.error('[Admin Ban Provider] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a tiltás során' });
    }
});

// POST /admin/providers/:id/unban — Unban a provider
router.post('/providers/:id/unban', async (request, response) => {
    try {
        const providerId = request.params.id;
        await unbanProvider(providerId);
        await logEvent('INFO', 'PROVIDER_UNBAN', 'admin', request.user.userId, 'provider', parseInt(providerId), `Admin unbanned provider #${providerId}`);
        return response.status(200).json({ success: true, message: 'Szolgáltató tiltása feloldva' });
    } catch (error) {
        console.error('[Admin Unban Provider] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a tiltás feloldása során' });
    }
});

module.exports = router;

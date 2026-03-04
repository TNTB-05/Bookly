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

router.get('/providers', async (req, res) => {
    try {
        const providers = await getAdminProviders();
        return res.json({ success: true, providers });
    } catch (error) {
        console.error('[Admin Providers] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szolgáltatók lekérése során' });
    }
});

router.get('/providers/:id', async (req, res) => {
    try {
        const providerId = req.params.id;
        const result = await getAdminProviderById(providerId);
        if (!result) return res.status(404).json({ success: false, message: 'Szolgáltató nem található' });

        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Admin Provider Detail] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szolgáltató adatainak lekérése során' });
    }
});

router.post('/providers/:id/deactivate', async (req, res) => {
    try {
        const providerId = req.params.id;
        await deactivateProvider(providerId);
        await logEvent('WARN', 'PROVIDER_DEACTIVATE', 'admin', req.user.userId, 'provider', parseInt(providerId), `Admin deactivated provider #${providerId}`);
        return res.json({ success: true, message: 'Szolgáltató deaktiválva' });
    } catch (error) {
        console.error('[Admin Deactivate] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a deaktiválás során' });
    }
});

router.post('/providers/:id/activate', async (req, res) => {
    try {
        const providerId = req.params.id;
        await activateProvider(providerId);
        await logEvent('INFO', 'PROVIDER_ACTIVATE', 'admin', req.user.userId, 'provider', parseInt(providerId), `Admin activated provider #${providerId}`);
        return res.json({ success: true, message: 'Szolgáltató aktiválva' });
    } catch (error) {
        console.error('[Admin Activate] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba az aktiválás során' });
    }
});

router.delete('/providers/:id/picture', async (req, res) => {
    try {
        const providerId = req.params.id;

        const pictureUrl = await getProviderProfilePicture(providerId);
        if (pictureUrl) {
            const filePath = path.join(__dirname, '../..', pictureUrl);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }

        await removeProviderProfilePicture(providerId);
        await logEvent('WARN', 'PROVIDER_PIC_REMOVED', 'admin', req.user.userId, 'provider', parseInt(providerId), `Admin removed profile picture for provider #${providerId}`);
        return res.json({ success: true, message: 'Profilkép eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Provider Pic] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a profilkép eltávolítása során' });
    }
});

router.post('/providers/:id/ban', async (req, res) => {
    try {
        const providerId = req.params.id;
        await banProvider(providerId);
        await logEvent('CRITICAL', 'PROVIDER_BAN', 'admin', req.user.userId, 'provider', parseInt(providerId), `Admin banned provider #${providerId}`);
        return res.json({ success: true, message: 'Szolgáltató letiltva' });
    } catch (error) {
        console.error('[Admin Ban Provider] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a tiltás során' });
    }
});

router.post('/providers/:id/unban', async (req, res) => {
    try {
        const providerId = req.params.id;
        await unbanProvider(providerId);
        await logEvent('INFO', 'PROVIDER_UNBAN', 'admin', req.user.userId, 'provider', parseInt(providerId), `Admin unbanned provider #${providerId}`);
        return res.json({ success: true, message: 'Szolgáltató tiltása feloldva' });
    } catch (error) {
        console.error('[Admin Unban Provider] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a tiltás feloldása során' });
    }
});

module.exports = router;

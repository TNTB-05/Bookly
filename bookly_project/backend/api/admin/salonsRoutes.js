/**
 * Admin salon management routes.
 * Covers: GET /salons, GET /salons/:id, DELETE /salons/:id/banner|logo|description, PUT /salons/:id/status.
 */

const express = require('express');
const router = express.Router();
const { getAdminSalons, getAdminSalonById, getSalonBannerUrl, removeSalonBanner, updateSalonStatus } = require('../../sql/salonQueries');
const { getSalonLogoUrl, removeSalonLogo, removeSalonDescription } = require('../../sql/adminQueries');
const { logEvent } = require('../../services/logService');
const fs = require('fs').promises;
const path = require('path');

router.get('/salons', async (request, response) => {
    try {
        const salons = await getAdminSalons();
        return response.status(200).json({ success: true, salons });
    } catch (error) {
        console.error('[Admin Salons] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a szalonok lekérése során' });
    }
});

router.get('/salons/:id', async (request, response) => {
    try {
        const salonId = request.params.id;
        const result = await getAdminSalonById(salonId);
        if (!result) return response.status(404).json({ success: false, message: 'Szalon nem található' });

        return response.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error('[Admin Salon Detail] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a szalon adatainak lekérése során' });
    }
});

router.delete('/salons/:id/banner', async (request, response) => {
    try {
        const salonId = request.params.id;
        const bannerUrl = await getSalonBannerUrl(salonId);
        if (bannerUrl) {
            const filePath = path.join(__dirname, '../..', bannerUrl);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }
        await removeSalonBanner(salonId);
        await logEvent('WARN', 'SALON_BANNER_REMOVED', 'admin', request.user.userId, 'salon', parseInt(salonId), `Admin removed banner for salon #${salonId}`);
        return response.status(200).json({ success: true, message: 'Banner eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Banner] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a banner eltávolítása során' });
    }
});

router.delete('/salons/:id/logo', async (request, response) => {
    try {
        const salonId = request.params.id;
        const logoUrl = await getSalonLogoUrl(salonId);
        if (logoUrl) {
            const filePath = path.join(__dirname, '../..', logoUrl);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }
        await removeSalonLogo(salonId);
        await logEvent('WARN', 'SALON_LOGO_REMOVED', 'admin', request.user.userId, 'salon', parseInt(salonId), `Admin removed logo for salon #${salonId}`);
        return response.status(200).json({ success: true, message: 'Logó eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Logo] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a logó eltávolítása során' });
    }
});

router.delete('/salons/:id/description', async (request, response) => {
    try {
        const salonId = request.params.id;
        await removeSalonDescription(salonId);
        await logEvent('WARN', 'SALON_DESC_REMOVED', 'admin', request.user.userId, 'salon', parseInt(salonId), `Admin removed description for salon #${salonId}`);
        return response.status(200).json({ success: true, message: 'Leírás eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Desc] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a leírás eltávolítása során' });
    }
});

router.put('/salons/:id/status', async (request, response) => {
    try {
        const salonId = request.params.id;
        const { status } = request.body;
        const validStatuses = ['open', 'closed', 'renovation'];
        if (!validStatuses.includes(status)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen státusz' });
        }
        await updateSalonStatus(salonId, status);
        await logEvent('INFO', 'SALON_STATUS_CHANGE', 'admin', request.user.userId, 'salon', parseInt(salonId), `Admin changed salon #${salonId} status to ${status}`);
        return response.status(200).json({ success: true, message: 'Szalon státusz frissítve' });
    } catch (error) {
        console.error('[Admin Salon Status] ERROR:', error);
        return response.status(500).json({ success: false, message: 'Hiba a státusz frissítése során' });
    }
});

module.exports = router;

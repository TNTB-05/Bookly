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

router.get('/salons', async (req, res) => {
    try {
        const salons = await getAdminSalons();
        return res.json({ success: true, salons });
    } catch (error) {
        console.error('[Admin Salons] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szalonok lekérése során' });
    }
});

router.get('/salons/:id', async (req, res) => {
    try {
        const salonId = req.params.id;
        const result = await getAdminSalonById(salonId);
        if (!result) return res.status(404).json({ success: false, message: 'Szalon nem található' });

        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Admin Salon Detail] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szalon adatainak lekérése során' });
    }
});

router.delete('/salons/:id/banner', async (req, res) => {
    try {
        const salonId = req.params.id;
        const bannerUrl = await getSalonBannerUrl(salonId);
        if (bannerUrl) {
            const filePath = path.join(__dirname, '../..', bannerUrl);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }
        await removeSalonBanner(salonId);
        await logEvent('WARN', 'SALON_BANNER_REMOVED', 'admin', req.user.userId, 'salon', parseInt(salonId), `Admin removed banner for salon #${salonId}`);
        return res.json({ success: true, message: 'Banner eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Banner] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a banner eltávolítása során' });
    }
});

router.delete('/salons/:id/logo', async (req, res) => {
    try {
        const salonId = req.params.id;
        const logoUrl = await getSalonLogoUrl(salonId);
        if (logoUrl) {
            const filePath = path.join(__dirname, '../..', logoUrl);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }
        await removeSalonLogo(salonId);
        await logEvent('WARN', 'SALON_LOGO_REMOVED', 'admin', req.user.userId, 'salon', parseInt(salonId), `Admin removed logo for salon #${salonId}`);
        return res.json({ success: true, message: 'Logó eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Logo] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a logó eltávolítása során' });
    }
});

router.delete('/salons/:id/description', async (req, res) => {
    try {
        const salonId = req.params.id;
        await removeSalonDescription(salonId);
        await logEvent('WARN', 'SALON_DESC_REMOVED', 'admin', req.user.userId, 'salon', parseInt(salonId), `Admin removed description for salon #${salonId}`);
        return res.json({ success: true, message: 'Leírás eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove Desc] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a leírás eltávolítása során' });
    }
});

router.put('/salons/:id/status', async (req, res) => {
    try {
        const salonId = req.params.id;
        const { status } = req.body;
        const validStatuses = ['open', 'closed', 'renovation'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen státusz' });
        }
        await updateSalonStatus(salonId, status);
        await logEvent('INFO', 'SALON_STATUS_CHANGE', 'admin', req.user.userId, 'salon', parseInt(salonId), `Admin changed salon #${salonId} status to ${status}`);
        return res.json({ success: true, message: 'Szalon státusz frissítve' });
    } catch (error) {
        console.error('[Admin Salon Status] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a státusz frissítése során' });
    }
});

module.exports = router;

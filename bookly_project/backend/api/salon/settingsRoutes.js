/**
 * Salon settings & branding routes.
 * Covers: GET /my-salon, PUT /update, PUT /status, POST /branding, POST /branding/remove-banner.
 * Manager-only routes use isManagerMiddleware.
 */

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../auth/AuthMiddleware');
const { isManagerMiddleware } = require('../../middleware/providerMiddleware');
const { upload, processSalonLogo, processSalonBanner, deleteOldSalonImage } = require('../../middleware/uploadMiddleware');
const {
    getMySalon,
    updateSalon,
    getFullSalonById,
    updateSalonStatus,
    getSalonBranding,
    updateSalonBranding,
    getSalonBannerUrl,
    removeSalonBanner
} = require('../../sql/salonQueries');

// GET /my-salon - Get salon details for current provider
router.get('/my-salon', AuthMiddleware, async (req, res) => {
    try {
        const providerId = req.user.userId;

        const result = await getMySalon(providerId);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Szolgáltató nem található' });
        }

        res.status(200).json({ success: true, salon: result.salon, provider: { isManager: result.isManager } });
    } catch (error) {
        console.error('Get salon error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// PUT /update - Update salon details (managers only)
router.put('/update', AuthMiddleware, isManagerMiddleware, async (req, res) => {
    try {
        const { name, address, phone, email, type, opening_hours, closing_hours, description, latitude, longitude } = req.body;
        const salonId = req.salonId;

        if (!name || !address) {
            return res.status(400).json({ success: false, message: 'A név és cím megadása kötelező' });
        }

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (address) updateData.address = address.trim();
        if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
        if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
        if (type !== undefined) updateData.type = type ? type.trim() : null;
        if (opening_hours !== undefined) updateData.opening_hours = opening_hours;
        if (closing_hours !== undefined) updateData.closing_hours = closing_hours;
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'Nincs frissítendő mező' });
        }

        await updateSalon(salonId, updateData);

        const updatedSalon = await getFullSalonById(salonId);

        res.status(200).json({ success: true, message: 'Szalon sikeresen frissítve', salon: updatedSalon });
    } catch (error) {
        console.error('Update salon error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// PUT /status - Update salon status (managers only)
router.put('/status', AuthMiddleware, isManagerMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const salonId = req.salonId;

        if (!status || !['open', 'closed', 'renovation'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Érvénytelen státusz érték' });
        }

        await updateSalonStatus(salonId, status);

        res.status(200).json({ success: true, message: 'Szalon státusz sikeresen frissítve' });
    } catch (error) {
        console.error('Update salon status error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// POST /branding - Update salon logo, banner image, and/or banner color (managers only)
router.post('/branding', AuthMiddleware, isManagerMiddleware, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), async (req, res) => {
    try {
        const salonId = req.salonId;
        const { banner_color } = req.body;

        const currentBranding = await getSalonBranding(salonId);
        if (!currentBranding) {
            return res.status(404).json({ success: false, message: 'Szalon nem található' });
        }

        const updates = [];
        const values = [];

        if (req.files && req.files.logo && req.files.logo[0]) {
            const logoUrl = await processSalonLogo(req.files.logo[0].buffer, salonId);
            deleteOldSalonImage(currentBranding.logo_url);
            updates.push('logo_url = ?');
            values.push(logoUrl);
        }

        if (req.files && req.files.banner && req.files.banner[0]) {
            const bannerUrl = await processSalonBanner(req.files.banner[0].buffer, salonId);
            deleteOldSalonImage(currentBranding.banner_image_url);
            updates.push('banner_image_url = ?');
            values.push(bannerUrl);
        }

        if (banner_color) {
            const colorRegex = /^#[0-9A-Fa-f]{6}$/;
            if (!colorRegex.test(banner_color)) {
                return res.status(400).json({ success: false, message: 'Érvénytelen szín formátum. Használjon #RRGGBB formátumot.' });
            }
            updates.push('banner_color = ?');
            values.push(banner_color);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Nincs frissítendő adat' });
        }

        await updateSalonBranding(salonId, updates, values);

        const updatedSalon = await getFullSalonById(salonId);

        res.status(200).json({ success: true, message: 'Szalon arculat sikeresen frissítve', salon: updatedSalon });
    } catch (error) {
        console.error('Salon branding update error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba az arculat frissítése során' });
    }
});

// POST /branding/remove-banner - Remove banner image (managers only)
router.post('/branding/remove-banner', AuthMiddleware, isManagerMiddleware, async (req, res) => {
    try {
        const salonId = req.salonId;

        const bannerUrl = await getSalonBannerUrl(salonId);

        if (bannerUrl) {
            deleteOldSalonImage(bannerUrl);
        }

        await removeSalonBanner(salonId);

        res.status(200).json({ success: true, message: 'Banner kép eltávolítva' });
    } catch (error) {
        console.error('Remove banner error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

module.exports = router;

/**
 * Provider self-profile routes for salon API.
 * Covers: GET/PUT /me, POST /me/picture, PUT /me/password.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const AuthMiddleware = require('../auth/AuthMiddleware');
const { upload, processAndSaveImage, deleteOldImage } = require('../../middleware/uploadMiddleware');
const {
    getProviderProfile,
    updateProviderProfile,
    getProviderPictureUrl,
    updateProviderPicture,
    getProviderPasswordHash,
    updateProviderPassword
} = require('../../sql/providerQueries');

// GET /me - Get current provider's own profile
router.get('/me', AuthMiddleware, async (req, res) => {
    try {
        const providerId = req.user.userId;

        const provider = await getProviderProfile(providerId);

        if (!provider) {
            return res.status(404).json({ success: false, message: 'Szolgáltató nem található' });
        }

        res.status(200).json({ success: true, provider });
    } catch (error) {
        console.error('Get provider profile error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// PUT /me - Update current provider's own profile (name, phone, description only)
router.put('/me', AuthMiddleware, async (req, res) => {
    try {
        const providerId = req.user.userId;
        const { name, phone, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'A név megadása kötelező' });
        }
        if (!phone || !phone.trim()) {
            return res.status(400).json({ success: false, message: 'A telefonszám megadása kötelező' });
        }

        await updateProviderProfile(providerId, {
            name: name.trim(),
            phone: phone.trim(),
            description: description ? description.trim() : null
        });

        const updatedProvider = await getProviderProfile(providerId);

        res.status(200).json({ success: true, message: 'Profil sikeresen frissítve', provider: updatedProvider });
    } catch (error) {
        console.error('Update provider profile error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// POST /me/picture - Upload provider's own profile picture
router.post('/me/picture', AuthMiddleware, (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'A fájl mérete nem haladhatja meg az 5MB-ot' });
            }
            if (err.message) {
                return res.status(400).json({ success: false, message: err.message });
            }
            return res.status(400).json({ success: false, message: 'Hiba a fájl feltöltésekor' });
        }
        next();
    });
}, async (req, res) => {
    try {
        const providerId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nincs feltöltött kép. Kérjük válasszon egy JPG, PNG vagy WebP fájlt.' });
        }

        const oldUrl = await getProviderPictureUrl(providerId);
        const imageUrl = await processAndSaveImage(req.file.buffer, 'provider', providerId);

        await updateProviderPicture(providerId, imageUrl);

        deleteOldImage(oldUrl);

        res.status(200).json({
            success: true,
            message: 'Profilkép sikeresen feltöltve',
            profile_picture_url: imageUrl
        });
    } catch (error) {
        console.error('Upload provider picture error:', error);
        res.status(500).json({ success: false, message: 'Hiba történt a kép feltöltésekor. Kérjük próbálja újra.' });
    }
});

// PUT /me/password - Change provider's own password
router.put('/me/password', AuthMiddleware, async (req, res) => {
    try {
        const providerId = req.user.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Minden jelszó mező kitöltése kötelező' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Az új jelszavak nem egyeznek' });
        }

        const currentHash = await getProviderPasswordHash(providerId);
        if (!currentHash) {
            return res.status(404).json({ success: false, message: 'Szolgáltató nem található' });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, currentHash);
        if (!passwordMatch) {
            return res.status(400).json({ success: false, message: 'A jelenlegi jelszó helytelen' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await updateProviderPassword(providerId, newHash);

        res.status(200).json({ success: true, message: 'Jelszó sikeresen megváltoztatva' });
    } catch (error) {
        console.error('Change provider password error:', error);
        res.status(500).json({ success: false, message: 'Szerverhiba a jelszó módosítása során' });
    }
});

module.exports = router;

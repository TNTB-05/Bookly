/**
 * Profile routes for user API.
 * Covers: GET/PUT profile, PUT password, POST profile picture, POST restore-account, DELETE account.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const AuthMiddleware = require('../auth/AuthMiddleware');
const { getUserById, updateUserProfile, updateUserPassword, getUserPasswordHash, checkEmailExists, deleteUser, restoreUser, updateUserPicture, deleteSavedSalonsForUser, deleteRefTokensForUser } = require('../../sql/userQueries');
const { cancelUserScheduledAppointments } = require('../../sql/appointmentQueries');
const { upload, processAndSaveImage, deleteOldImage } = require('../../middleware/uploadMiddleware');
const { sendPasswordChangeConfirmation } = require('../../services/emailService');
const { logEvent } = require('../../services/logService');

// Get current user's profile
router.get('/profile', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;

        if (!userId) {
            return response.status(400).json({
                success: false,
                message: 'Felhasználó azonosító nem található a tokenben'
            });
        }

        const user = await getUserById(userId);

        if (!user) {
            return response.status(404).json({
                success: false,
                message: 'Felhasználó nem található'
            });
        }

        response.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                status: user.status,
                created_at: user.created_at,
                deleted_at: user.deleted_at || null,
                profile_picture_url: user.profile_picture_url
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba a profil lekérése során'
        });
    }
});

// Update current user's profile
router.put('/profile', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const { name, email, phone, address } = request.body;

        if (!userId) {
            return response.status(400).json({
                success: false,
                message: 'Felhasználó azonosító nem található a tokenben'
            });
        }

        if (!name || name.trim() === '') {
            return response.status(400).json({
                success: false,
                message: 'A név megadása kötelező'
            });
        }

        if (!email || email.trim() === '') {
            return response.status(400).json({
                success: false,
                message: 'Az e-mail megadása kötelező'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return response.status(400).json({
                success: false,
                message: 'Érvénytelen e-mail formátum'
            });
        }

        const emailExists = await checkEmailExists(email.trim(), userId);
        if (emailExists) {
            return response.status(400).json({
                success: false,
                message: 'Ez az e-mail cím már használatban van másik fióknál'
            });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = phone?.trim() || null;
        const trimmedAddress = address?.trim() || null;

        const isProfileComplete = trimmedName && trimmedEmail && trimmedPhone;
        const newStatus = isProfileComplete ? 'active' : 'inactive';

        const updated = await updateUserProfile(userId, {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            address: trimmedAddress,
            status: newStatus
        });

        if (!updated) {
            return response.status(404).json({
                success: false,
                message: 'Felhasználó nem található vagy a frissítés sikertelen'
            });
        }

        const user = await getUserById(userId);

        logEvent('INFO', 'USER_PROFILE_UPDATED', 'user', userId, 'user', userId, `User #${userId} updated their profile`).catch(() => {});

        response.status(200).json({
            success: true,
            message: 'Profil sikeresen frissítve',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                status: user.status,
                profile_picture_url: user.profile_picture_url,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba a profil frissítése során'
        });
    }
});

// Change user password
router.put('/password', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const { currentPassword, newPassword, confirmPassword } = request.body;

        if (!userId) {
            return response.status(400).json({
                success: false,
                message: 'Felhasználó azonosító nem található a tokenben'
            });
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            return response.status(400).json({
                success: false,
                message: 'Minden jelszó mező kitöltése kötelező'
            });
        }

        if (newPassword.length < 6) {
            return response.status(400).json({
                success: false,
                message: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie'
            });
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                success: false,
                message: 'Az új jelszavak nem egyeznek'
            });
        }

        const currentHash = await getUserPasswordHash(userId);
        if (!currentHash) {
            return response.status(404).json({
                success: false,
                message: 'Felhasználó nem található'
            });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, currentHash);
        if (!passwordMatch) {
            return response.status(400).json({
                success: false,
                message: 'A jelenlegi jelszó helytelen'
            });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        const updated = await updateUserPassword(userId, newHashedPassword);
        if (!updated) {
            return response.status(500).json({
                success: false,
                message: 'Nem sikerült a jelszó frissítése'
            });
        }

        const user = await getUserById(userId);
        if (user) {
            sendPasswordChangeConfirmation({ email: user.email, name: user.name }).catch(err => {
                console.error('Failed to send password change email:', err);
            });
        }

        logEvent('INFO', 'USER_PASSWORD_CHANGED', 'user', userId, 'user', userId, `User #${userId} changed their password`).catch(() => {});

        response.status(200).json({
            success: true,
            message: 'Jelszó sikeresen megváltoztatva'
        });
    } catch (error) {
        console.error('Change password error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba a jelszó módosítása során'
        });
    }
});

// Upload profile picture
router.post('/profile/picture', AuthMiddleware, (request, response, next) => {
    upload.single('profilePicture')(request, response, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return response.status(400).json({ success: false, message: 'A fájl mérete nem haladhatja meg az 5MB-ot' });
            }
            if (err.message) {
                return response.status(400).json({ success: false, message: err.message });
            }
            return response.status(400).json({ success: false, message: 'Hiba a fájl feltöltésekor' });
        }
        next();
    });
}, async (request, response) => {
    try {
        const userId = request.user.userId;

        if (!request.file) {
            return response.status(400).json({ success: false, message: 'Nincs feltöltött kép. Kérjük válasszon egy JPG, PNG vagy WebP fájlt.' });
        }

        const user = await getUserById(userId);
        if (!user) {
            return response.status(404).json({ success: false, message: 'Felhasználó nem található' });
        }
        const oldUrl = user.profile_picture_url;

        const imageUrl = await processAndSaveImage(request.file.buffer, 'user', userId);

        await updateUserPicture(userId, imageUrl);

        deleteOldImage(oldUrl);

        response.status(200).json({
            success: true,
            message: 'Profilkép sikeresen feltöltve',
            profile_picture_url: imageUrl
        });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a kép feltöltésekor. Kérjük próbálja újra.' });
    }
});

// Restore deleted account (within grace period)
router.post('/restore-account', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;

        const restored = await restoreUser(userId);
        if (!restored) {
            return response.status(400).json({
                success: false,
                message: 'Nem lehet visszaállítani a fiókot. A törlési határidő (30 nap) lejárt, vagy a fiók nem törölt állapotban van.'
            });
        }

        response.status(200).json({
            success: true,
            message: 'Fiók sikeresen visszaállítva. Kérjük, töltsd ki a profilodat.'
        });
    } catch (error) {
        console.error('Restore account error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba a fiók visszaállítása során'
        });
    }
});

// Delete user account
router.delete('/account', AuthMiddleware, async (request, response) => {
    try {
        const userId = request.user.userId;
        const { password } = request.body;

        if (!userId) {
            return response.status(400).json({
                success: false,
                message: 'Felhasználó azonosító nem található a tokenben'
            });
        }

        if (!password) {
            return response.status(400).json({
                success: false,
                message: 'A jelszó megadása kötelező a fiók törléséhez'
            });
        }

        const currentHash = await getUserPasswordHash(userId);
        if (!currentHash) {
            return response.status(404).json({
                success: false,
                message: 'Felhasználó nem található'
            });
        }

        const passwordMatch = await bcrypt.compare(password, currentHash);
        if (!passwordMatch) {
            return response.status(400).json({
                success: false,
                message: 'Helytelen jelszó'
            });
        }

        await cancelUserScheduledAppointments(userId);

        await deleteSavedSalonsForUser(userId);

        await deleteRefTokensForUser(userId);

        const deleted = await deleteUser(userId);
        if (!deleted) {
            return response.status(500).json({
                success: false,
                message: 'Nem sikerült a fiók törlése'
            });
        }

        logEvent('WARN', 'USER_SELF_DELETE', 'user', userId, 'user', userId, `User #${userId} deleted their own account`).catch(() => {});

        response.status(200).json({
            success: true,
            message: 'Fiók sikeresen törölve'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        response.status(500).json({
            success: false,
            message: 'Szerverhiba a fiók törlése során'
        });
    }
});

module.exports = router;

/**
 * Admin user management routes.
 * Covers: GET /users, GET /users/:id, POST /users/:id/ban|unban|gdpr-delete, DELETE /users/:id/picture.
 */

const express = require('express');
const router = express.Router();
const { getAdminUsers, getAdminUserById, banUser, unbanUser, getUserPictureUrl, removeUserPicture } = require('../../sql/userQueries');
const { gdprDeleteUser } = require('../../sql/adminQueries');
const { logEvent } = require('../../services/logService');
const fs = require('fs').promises;
const path = require('path');

router.get('/users', async (req, res) => {
    try {
        const users = await getAdminUsers();
        return res.json({ success: true, users });
    } catch (error) {
        console.error('[Admin Users] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a felhasználók lekérése során' });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await getAdminUserById(userId);
        if (!result) return res.status(404).json({ success: false, message: 'Felhasználó nem található' });

        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Admin User Detail] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a felhasználó adatainak lekérése során' });
    }
});

router.post('/users/:id/ban', async (req, res) => {
    try {
        const userId = req.params.id;
        await banUser(userId);
        await logEvent('WARN', 'USER_BAN', 'admin', req.user.userId, 'user', parseInt(userId), `Admin banned user #${userId}`);
        return res.json({ success: true, message: 'Felhasználó letiltva' });
    } catch (error) {
        console.error('[Admin Ban] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a tiltás során' });
    }
});

router.post('/users/:id/unban', async (req, res) => {
    try {
        const userId = req.params.id;
        await unbanUser(userId);
        await logEvent('INFO', 'USER_UNBAN', 'admin', req.user.userId, 'user', parseInt(userId), `Admin unbanned user #${userId}`);
        return res.json({ success: true, message: 'Felhasználó tiltása feloldva' });
    } catch (error) {
        console.error('[Admin Unban] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a tiltás feloldása során' });
    }
});

router.post('/users/:id/gdpr-delete', async (req, res) => {
    try {
        const userId = req.params.id;

        const originalUser = await gdprDeleteUser(userId);
        if (!originalUser) return res.status(404).json({ success: false, message: 'Felhasználó nem található' });

        if (originalUser.profile_picture_url) {
            const filePath = path.join(__dirname, '../..', originalUser.profile_picture_url);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }

        await logEvent('CRITICAL', 'USER_GDPR_DELETE', 'admin', req.user.userId, 'user', parseInt(userId),
            `Admin performed GDPR deletion for user #${userId} (was: ${originalUser.email})`);
        return res.json({ success: true, message: 'Felhasználó adatai anonimizálva (GDPR törlés)' });
    } catch (error) {
        console.error('[Admin GDPR Delete] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a GDPR törlés során' });
    }
});

router.delete('/users/:id/picture', async (req, res) => {
    try {
        const userId = req.params.id;

        const pictureUrl = await getUserPictureUrl(userId);
        if (pictureUrl) {
            const filePath = path.join(__dirname, '../..', pictureUrl);
            try { await fs.unlink(filePath); } catch (e) { /* file may not exist */ }
        }

        await removeUserPicture(userId);
        await logEvent('WARN', 'USER_PIC_REMOVED', 'admin', req.user.userId, 'user', parseInt(userId), `Admin removed profile picture for user #${userId}`);
        return res.json({ success: true, message: 'Profilkép eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove User Pic] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a profilkép eltávolítása során' });
    }
});

module.exports = router;

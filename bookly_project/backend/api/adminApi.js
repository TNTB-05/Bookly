const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const { pool } = require('../sql/database.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');
const { requireRole } = require('./auth/RoleMiddleware.js');
const { logEvent } = require('../services/logService.js');
const fs = require('fs');
const path = require('path');

// All admin routes require authentication + admin role
router.use(AuthMiddleware, requireRole(['admin']));

// ==========================================
// Statistics Dashboard
// ==========================================
router.get('/statistics', async (req, res) => {
    try {
        const [
            [usersResult],
            [providersResult],
            [salonsResult],
            [appointmentsThisMonthResult],
            [totalAppointmentsResult],
            [revenueResult],
            [newUsersResult],
            [newProvidersResult],
            [recentAppointmentsResult],
            [appointmentsByStatusResult],
        ] = await Promise.all([
            pool.query(`SELECT COUNT(*) as count FROM users WHERE status = 'active'`),
            pool.query(`SELECT COUNT(*) as count FROM providers WHERE status = 'active'`),
            pool.query(`SELECT COUNT(*) as count FROM salons WHERE status = 'open'`),
            pool.query(`SELECT COUNT(*) as count FROM appointments 
                WHERE MONTH(appointment_start) = MONTH(NOW()) 
                AND YEAR(appointment_start) = YEAR(NOW())`),
            pool.query(`SELECT COUNT(*) as count FROM appointments`),
            pool.query(`SELECT COALESCE(SUM(price), 0) as total FROM appointments WHERE status = 'completed'`),
            pool.query(`SELECT COUNT(*) as count FROM users 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
            pool.query(`SELECT COUNT(*) as count FROM providers 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
            pool.query(`SELECT 
                    a.id, a.appointment_start, a.appointment_end, a.status, a.price,
                    u.name as customer_name, p.name as provider_name,
                    s.name as salon_name, srv.name as service_name
                FROM appointments a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN providers p ON a.provider_id = p.id
                LEFT JOIN salons s ON p.salon_id = s.id
                LEFT JOIN services srv ON a.service_id = srv.id
                ORDER BY a.appointment_start DESC LIMIT 10`),
            pool.query(`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`),
        ]);

        let topSalons = [];
        try { topSalons = await database.getTopRatedSalons(5); } catch (e) { /* continue */ }

        let monthlyRevenueResult = [];
        try {
            const [result] = await pool.query(`
                SELECT DATE_FORMAT(appointment_start, '%Y-%m') as month,
                    COALESCE(SUM(price), 0) as revenue, COUNT(*) as appointment_count
                FROM appointments WHERE status = 'completed'
                AND appointment_start >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(appointment_start, '%Y-%m') ORDER BY month ASC`);
            monthlyRevenueResult = result;
        } catch (e) { /* continue */ }

        const statusBreakdown = {};
        appointmentsByStatusResult.forEach(row => { statusBreakdown[row.status] = row.count; });

        return res.json({
            success: true,
            stats: {
                totalUsers: usersResult[0].count,
                totalProviders: providersResult[0].count,
                totalSalons: salonsResult[0].count,
                appointmentsThisMonth: appointmentsThisMonthResult[0].count,
                totalAppointments: totalAppointmentsResult[0].count,
                totalRevenue: revenueResult[0].total,
                newRegistrations: { users: newUsersResult[0].count, providers: newProvidersResult[0].count },
                appointmentsByStatus: statusBreakdown,
                monthlyRevenue: monthlyRevenueResult
            },
            recentAppointments: recentAppointmentsResult,
            topSalons
        });
    } catch (error) {
        console.error('[Admin Stats] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a statisztikák lekérése során' });
    }
});

// ==========================================
// Users Management
// ==========================================
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id, name, email, phone, role, status, last_login, profile_picture_url, created_at
            FROM users ORDER BY created_at DESC
        `);
        return res.json({ success: true, users });
    } catch (error) {
        console.error('[Admin Users] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a felhasználók lekérése során' });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const [users] = await pool.query(
            'SELECT id, name, email, phone, address, role, status, last_login, profile_picture_url, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Felhasználó nem található' });

        const [appointments] = await pool.query(`
            SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price, a.comment,
                p.name as provider_name, s.name as salon_name, srv.name as service_name
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            JOIN salons s ON p.salon_id = s.id
            JOIN services srv ON a.service_id = srv.id
            WHERE a.user_id = ? ORDER BY a.appointment_start DESC
        `, [userId]);

        const [ratings] = await pool.query(`
            SELECT r.id, r.salon_rating, r.provider_rating, r.salon_comment, r.provider_comment,
                r.created_at, r.active, s.name as salon_name, p.name as provider_name
            FROM ratings r
            JOIN salons s ON r.salon_id = s.id
            JOIN providers p ON r.provider_id = p.id
            WHERE r.user_id = ? ORDER BY r.created_at DESC
        `, [userId]);

        return res.json({ success: true, user: users[0], appointments, ratings });
    } catch (error) {
        console.error('[Admin User Detail] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a felhasználó adatainak lekérése során' });
    }
});

router.post('/users/:id/ban', async (req, res) => {
    try {
        const userId = req.params.id;
        await pool.query("UPDATE users SET status = 'banned' WHERE id = ?", [userId]);
        // Force logout by deleting all refresh tokens
        await pool.query('DELETE FROM RefTokens WHERE user_id = ?', [userId]);
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
        await pool.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);
        await logEvent('INFO', 'USER_UNBAN', 'admin', req.user.userId, 'user', parseInt(userId), `Admin unbanned user #${userId}`);
        return res.json({ success: true, message: 'Felhasználó tiltása feloldva' });
    } catch (error) {
        console.error('[Admin Unban] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a tiltás feloldása során' });
    }
});

// GDPR User Delete - anonymize personal data
router.post('/users/:id/gdpr-delete', async (req, res) => {
    try {
        const userId = req.params.id;
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Felhasználó nem található' });

        // Delete profile picture file if exists
        if (users[0].profile_picture_url) {
            const filePath = path.join(__dirname, '..', users[0].profile_picture_url);
            try { fs.unlinkSync(filePath); } catch (e) { /* file may not exist */ }
        }

        // Anonymize user data
        await pool.query(
            `UPDATE users SET 
                name = ?, email = ?, phone = NULL, address = NULL,
                profile_picture_url = NULL, password_hash = NULL,
                status = 'deleted'
            WHERE id = ?`,
            [`Törölt felhasználó #${userId}`, `deleted_${userId}@removed.local`, userId]
        );

        // Delete all refresh tokens
        await pool.query('DELETE FROM RefTokens WHERE user_id = ?', [userId]);

        // Deactivate all ratings by this user
        await pool.query('UPDATE ratings SET active = FALSE WHERE user_id = ?', [userId]);

        await logEvent('CRITICAL', 'USER_GDPR_DELETE', 'admin', req.user.userId, 'user', parseInt(userId),
            `Admin performed GDPR deletion for user #${userId} (was: ${users[0].email})`);
        return res.json({ success: true, message: 'Felhasználó adatai anonimizálva (GDPR törlés)' });
    } catch (error) {
        console.error('[Admin GDPR Delete] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a GDPR törlés során' });
    }
});

router.delete('/users/:id/picture', async (req, res) => {
    try {
        const userId = req.params.id;
        const [users] = await pool.query('SELECT profile_picture_url FROM users WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].profile_picture_url) {
            const filePath = path.join(__dirname, '..', users[0].profile_picture_url);
            try { fs.unlinkSync(filePath); } catch (e) { /* file may not exist */ }
        }
        await pool.query('UPDATE users SET profile_picture_url = NULL WHERE id = ?', [userId]);
        await logEvent('WARN', 'USER_PIC_REMOVED', 'admin', req.user.userId, 'user', parseInt(userId), `Admin removed profile picture for user #${userId}`);
        return res.json({ success: true, message: 'Profilkép eltávolítva' });
    } catch (error) {
        console.error('[Admin Remove User Pic] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a profilkép eltávolítása során' });
    }
});

// ==========================================
// Providers Management
// ==========================================
router.get('/providers', async (req, res) => {
    try {
        const [providers] = await pool.query(`
            SELECT p.id, p.name, p.email, p.phone, p.description, p.status, p.role, p.isManager,
                p.profile_picture_url, p.last_login, p.created_at,
                s.id as salon_id, s.name as salon_name
            FROM providers p
            JOIN salons s ON p.salon_id = s.id
            ORDER BY p.created_at DESC
        `);
        return res.json({ success: true, providers });
    } catch (error) {
        console.error('[Admin Providers] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szolgáltatók lekérése során' });
    }
});

router.get('/providers/:id', async (req, res) => {
    try {
        const providerId = req.params.id;
        const [providers] = await pool.query(`
            SELECT p.*, s.name as salon_name, s.address as salon_address
            FROM providers p JOIN salons s ON p.salon_id = s.id WHERE p.id = ?
        `, [providerId]);
        if (providers.length === 0) return res.status(404).json({ success: false, message: 'Szolgáltató nem található' });

        const [appointments] = await pool.query(`
            SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price, a.comment,
                u.name as customer_name, srv.name as service_name
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            JOIN services srv ON a.service_id = srv.id
            WHERE a.provider_id = ? ORDER BY a.appointment_start DESC
        `, [providerId]);

        const [ratings] = await pool.query(`
            SELECT r.id, r.provider_rating, r.provider_comment, r.salon_rating, r.salon_comment,
                r.created_at, r.active, u.name as user_name
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.provider_id = ? ORDER BY r.created_at DESC
        `, [providerId]);

        const [services] = await pool.query(`
            SELECT id, name, description, duration_minutes, price, status
            FROM services WHERE provider_id = ?
        `, [providerId]);

        return res.json({ success: true, provider: providers[0], appointments, ratings, services });
    } catch (error) {
        console.error('[Admin Provider Detail] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szolgáltató adatainak lekérése során' });
    }
});

router.post('/providers/:id/deactivate', async (req, res) => {
    try {
        const providerId = req.params.id;
        await pool.query("UPDATE providers SET status = 'inactive' WHERE id = ?", [providerId]);
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
        await pool.query("UPDATE providers SET status = 'active' WHERE id = ?", [providerId]);
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
        const [providers] = await pool.query('SELECT profile_picture_url FROM providers WHERE id = ?', [providerId]);
        if (providers.length > 0 && providers[0].profile_picture_url) {
            const filePath = path.join(__dirname, '..', providers[0].profile_picture_url);
            try { fs.unlinkSync(filePath); } catch (e) { /* file may not exist */ }
        }
        await pool.query('UPDATE providers SET profile_picture_url = NULL WHERE id = ?', [providerId]);
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
        await pool.query("UPDATE providers SET status = 'banned' WHERE id = ?", [providerId]);
        // Invalidate all refresh tokens for this provider
        await pool.query('DELETE FROM RefTokens WHERE provider_id = ?', [providerId]);
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
        await pool.query("UPDATE providers SET status = 'active' WHERE id = ?", [providerId]);
        await logEvent('INFO', 'PROVIDER_UNBAN', 'admin', req.user.userId, 'provider', parseInt(providerId), `Admin unbanned provider #${providerId}`);
        return res.json({ success: true, message: 'Szolgáltató tiltása feloldva' });
    } catch (error) {
        console.error('[Admin Unban Provider] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a tiltás feloldása során' });
    }
});

// ==========================================
// Salons Management
// ==========================================
router.get('/salons', async (req, res) => {
    try {
        const [salons] = await pool.query(`
            SELECT s.id, s.name, s.address, s.phone, s.email, s.type, s.description, s.status,
                s.banner_color, s.logo_url, s.banner_image_url, s.created_at,
                COUNT(DISTINCT p.id) as provider_count,
                COALESCE(AVG(r.salon_rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as rating_count
            FROM salons s
            LEFT JOIN providers p ON p.salon_id = s.id
            LEFT JOIN ratings r ON r.salon_id = s.id AND r.active = TRUE
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        return res.json({ success: true, salons });
    } catch (error) {
        console.error('[Admin Salons] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szalonok lekérése során' });
    }
});

router.get('/salons/:id', async (req, res) => {
    try {
        const salonId = req.params.id;
        const [salons] = await pool.query('SELECT * FROM salons WHERE id = ?', [salonId]);
        if (salons.length === 0) return res.status(404).json({ success: false, message: 'Szalon nem található' });

        const [providers] = await pool.query(`
            SELECT id, name, email, phone, description, status, role, isManager, profile_picture_url, created_at
            FROM providers WHERE salon_id = ?
        `, [salonId]);

        const [services] = await pool.query(`
            SELECT s.id, s.name, s.description, s.duration_minutes, s.price, s.status, p.name as provider_name
            FROM services s
            JOIN providers p ON s.provider_id = p.id
            WHERE p.salon_id = ?
        `, [salonId]);

        const [ratings] = await pool.query(`
            SELECT r.id, r.salon_rating, r.salon_comment, r.provider_rating, r.provider_comment,
                r.created_at, r.active, u.name as user_name, p.name as provider_name
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            JOIN providers p ON r.provider_id = p.id
            WHERE r.salon_id = ? ORDER BY r.created_at DESC
        `, [salonId]);

        return res.json({ success: true, salon: salons[0], providers, services, ratings });
    } catch (error) {
        console.error('[Admin Salon Detail] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a szalon adatainak lekérése során' });
    }
});

router.delete('/salons/:id/banner', async (req, res) => {
    try {
        const salonId = req.params.id;
        const [salons] = await pool.query('SELECT banner_image_url FROM salons WHERE id = ?', [salonId]);
        if (salons.length > 0 && salons[0].banner_image_url) {
            const filePath = path.join(__dirname, '..', salons[0].banner_image_url);
            try { fs.unlinkSync(filePath); } catch (e) { /* file may not exist */ }
        }
        await pool.query('UPDATE salons SET banner_image_url = NULL WHERE id = ?', [salonId]);
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
        const [salons] = await pool.query('SELECT logo_url FROM salons WHERE id = ?', [salonId]);
        if (salons.length > 0 && salons[0].logo_url) {
            const filePath = path.join(__dirname, '..', salons[0].logo_url);
            try { fs.unlinkSync(filePath); } catch (e) { /* file may not exist */ }
        }
        await pool.query('UPDATE salons SET logo_url = NULL WHERE id = ?', [salonId]);
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
        await pool.query('UPDATE salons SET description = NULL WHERE id = ?', [salonId]);
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
        await pool.query('UPDATE salons SET status = ? WHERE id = ?', [status, salonId]);
        await logEvent('INFO', 'SALON_STATUS_CHANGE', 'admin', req.user.userId, 'salon', parseInt(salonId), `Admin changed salon #${salonId} status to ${status}`);
        return res.json({ success: true, message: 'Szalon státusz frissítve' });
    } catch (error) {
        console.error('[Admin Salon Status] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a státusz frissítése során' });
    }
});

// ==========================================
// Ratings Management
// ==========================================
router.delete('/ratings/:id', async (req, res) => {
    try {
        const ratingId = req.params.id;
        const [ratings] = await pool.query('SELECT * FROM ratings WHERE id = ?', [ratingId]);
        if (ratings.length === 0) return res.status(404).json({ success: false, message: 'Értékelés nem található' });
        
        // Soft delete - set active to false
        await pool.query('UPDATE ratings SET active = FALSE WHERE id = ?', [ratingId]);
        await logEvent('WARN', 'RATING_DEACTIVATE', 'admin', req.user.userId, 'rating', parseInt(ratingId),
            `Admin deactivated rating #${ratingId} (salon: ${ratings[0].salon_id}, provider: ${ratings[0].provider_id})`);
        return res.json({ success: true, message: 'Értékelés deaktiválva' });
    } catch (error) {
        console.error('[Admin Delete Rating] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba az értékelés törlése során' });
    }
});

// ==========================================
// Appointments Management
// ==========================================
router.get('/appointments', async (req, res) => {
    try {
        const [appointments] = await pool.query(`
            SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price, a.comment,
                a.guest_name, a.guest_email, a.guest_phone, a.created_at,
                a.deleted_reason, a.deleted_at, a.deleted_by,
                u.name as customer_name, u.email as customer_email,
                p.name as provider_name, s.name as salon_name, srv.name as service_name
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            JOIN providers p ON a.provider_id = p.id
            JOIN salons s ON p.salon_id = s.id
            JOIN services srv ON a.service_id = srv.id
            ORDER BY a.appointment_start DESC
        `);
        return res.json({ success: true, appointments });
    } catch (error) {
        console.error('[Admin Appointments] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a foglalások lekérése során' });
    }
});

router.delete('/appointments/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { reason } = req.body;
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Törlés indoklása kötelező' });
        }
        const [appts] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
        if (appts.length === 0) return res.status(404).json({ success: false, message: 'Foglalás nem található' });
        if (appts[0].status === 'deleted') return res.status(400).json({ success: false, message: 'Ez a foglalás már törölve van' });

        await pool.query(
            'UPDATE appointments SET status = ?, deleted_reason = ?, deleted_at = NOW(), deleted_by = ? WHERE id = ?',
            ['deleted', reason.trim(), req.user.userId, appointmentId]
        );
        await logEvent('CRITICAL', 'APPOINTMENT_SOFT_DELETE', 'admin', req.user.userId, 'appointment', parseInt(appointmentId),
            `Admin soft-deleted appointment #${appointmentId} (was: ${appts[0].status}, price: ${appts[0].price}). Reason: ${reason.trim()}`);
        return res.json({ success: true, message: 'Foglalás törölve (soft delete)' });
    } catch (error) {
        console.error('[Admin Delete Appointment] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a foglalás törlése során' });
    }
});

// ==========================================
// System Logs
// ==========================================
router.get('/logs', async (req, res) => {
    try {
        const { level, action, limit = 200 } = req.query;
        let query = 'SELECT * FROM system_logs WHERE 1=1';
        const params = [];
        if (level) { query += ' AND level = ?'; params.push(level); }
        if (action) { query += ' AND action LIKE ?'; params.push(`%${action}%`); }
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        const [logs] = await pool.query(query, params);
        return res.json({ success: true, logs });
    } catch (error) {
        console.error('[Admin Logs] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a naplók lekérése során' });
    }
});

module.exports = router;

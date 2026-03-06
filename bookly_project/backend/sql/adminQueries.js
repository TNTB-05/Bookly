/**
 * Admin-specific SQL queries.
 * Contains ONLY queries unique to admin operations.
 * Shared/duplicated queries have been moved to their respective domain files:
 *   - userQueries.js (getAdminUsers, getAdminUserById, banUser, unbanUser, etc.)
 *   - providerQueries.js (getAdminProviders, getAdminProviderById)
 *   - salonQueries.js (getAdminSalons, getAdminSalonById, getSalonBannerUrl, removeSalonBanner, updateSalonStatus)
 *   - ratingQueries.js (getAdminRatings, getRatingById, deactivateRating)
 *   - appointmentQueries.js (getAdminAppointments, getAdminAppointmentById, softDeleteAppointment)
 */

const pool = require('./pool');

// ==================== STATISTICS ====================

// Get admin dashboard statistics (users, providers, salons, appointments, revenue)
async function getDashboardStatistics() {
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
        pool.execute(`SELECT COUNT(*) as count FROM users WHERE status = 'active'`),
        pool.execute(`SELECT COUNT(*) as count FROM providers WHERE status = 'active'`),
        pool.execute(`SELECT COUNT(*) as count FROM salons WHERE status = 'open'`),
        pool.execute(`SELECT COUNT(*) as count FROM appointments 
            WHERE MONTH(appointment_start) = MONTH(NOW()) 
            AND YEAR(appointment_start) = YEAR(NOW())`),
        pool.execute(`SELECT COUNT(*) as count FROM appointments`),
        pool.execute(`SELECT COALESCE(SUM(price), 0) as total FROM appointments WHERE status = 'completed'`),
        pool.execute(`SELECT COUNT(*) as count FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
        pool.execute(`SELECT COUNT(*) as count FROM providers 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
        pool.execute(`SELECT 
                a.id, a.appointment_start, a.appointment_end, a.status, a.price,
                u.name as customer_name, p.name as provider_name,
                s.name as salon_name, srv.name as service_name
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN providers p ON a.provider_id = p.id
            LEFT JOIN salons s ON p.salon_id = s.id
            LEFT JOIN services srv ON a.service_id = srv.id
            ORDER BY a.appointment_start DESC LIMIT 10`),
        pool.execute(`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`),
    ]);

    return {
        usersResult,
        providersResult,
        salonsResult,
        appointmentsThisMonthResult,
        totalAppointmentsResult,
        revenueResult,
        newUsersResult,
        newProvidersResult,
        recentAppointmentsResult,
        appointmentsByStatusResult,
    };
}

// Get monthly revenue and appointment counts for the last 6 months
async function getMonthlyRevenue() {
    const query = `
        SELECT DATE_FORMAT(appointment_start, '%Y-%m') as month,
            COALESCE(SUM(price), 0) as revenue, COUNT(*) as appointment_count
        FROM appointments WHERE status = 'completed'
        AND appointment_start >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(appointment_start, '%Y-%m') ORDER BY month ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

// ==================== ADMIN-ONLY USER OPERATIONS ====================

// GDPR-delete a user by anonymizing their data and deleting tokens
async function gdprDeleteUser(userId) {
    const selectQuery = `SELECT * FROM users WHERE id = ?`;
    const [users] = await pool.execute(selectQuery, [userId]);
    if (users.length === 0) return null;

    const anonymizeQuery = `
        UPDATE users SET 
            name = ?, email = NULL, phone = NULL, address = NULL,
            profile_picture_url = NULL, password_hash = NULL,
            status = 'deleted'
        WHERE id = ?
    `;
    await pool.execute(anonymizeQuery, [`Törölt felhasználó #${userId}`, userId]);

    const deleteTokensQuery = `DELETE FROM RefTokens WHERE user_id = ?`;
    await pool.execute(deleteTokensQuery, [userId]);

    return users[0];
}

// ==================== ADMIN-ONLY PROVIDER OPERATIONS ====================

// Deactivate a provider (set status to 'inactive')
async function deactivateProvider(providerId) {
    const query = `UPDATE providers SET status = 'inactive' WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

// Activate a provider (set status to 'active')
async function activateProvider(providerId) {
    const query = `UPDATE providers SET status = 'active' WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

// Get a provider's profile picture URL
async function getProviderProfilePicture(providerId) {
    const query = `SELECT profile_picture_url FROM providers WHERE id = ?`;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0].profile_picture_url : null;
}

// Remove a provider's profile picture (set to NULL)
async function removeProviderProfilePicture(providerId) {
    const query = `UPDATE providers SET profile_picture_url = NULL WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

// Ban a provider and delete their refresh tokens
async function banProvider(providerId) {
    const updateQuery = `UPDATE providers SET status = 'banned' WHERE id = ?`;
    await pool.execute(updateQuery, [providerId]);
    const deleteTokensQuery = `DELETE FROM RefTokens WHERE provider_id = ?`;
    await pool.execute(deleteTokensQuery, [providerId]);
}

// Unban a provider (set status back to 'active') — semantic alias for activateProvider
const unbanProvider = activateProvider;

// ==================== ADMIN-ONLY SALON OPERATIONS ====================

// Get a salon's logo URL
async function getSalonLogoUrl(salonId) {
    const query = `SELECT logo_url FROM salons WHERE id = ?`;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0].logo_url : null;
}

// Remove a salon's logo (set to NULL)
async function removeSalonLogo(salonId) {
    const query = `UPDATE salons SET logo_url = NULL WHERE id = ?`;
    await pool.execute(query, [salonId]);
}

// Remove a salon's description (set to NULL)
async function removeSalonDescription(salonId) {
    const query = `UPDATE salons SET description = NULL WHERE id = ?`;
    await pool.execute(query, [salonId]);
}

// ==================== SYSTEM LOGS ====================

// Insert a system log event (used by logService)
async function insertLogEvent(level, action, actorType, actorId, targetType = null, targetId = null, details = null) {
    const query = 'INSERT INTO system_logs (level, action, actor_type, actor_id, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [level, action, actorType, actorId, targetType, targetId, details]);
    return result;
}

// Get system logs with optional filters (level, action, limit)
async function getSystemLogs(filters = {}) {
    let query = 'SELECT * FROM system_logs WHERE 1=1';
    const params = [];

    if (filters.level) {
        query += ' AND level = ?';
        params.push(filters.level);
    }
    if (filters.action) {
        query += ' AND action LIKE ?';
        params.push(`%${filters.action}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(String(parseInt(filters.limit) || 200));

    const [rows] = await pool.execute(query, params);
    return rows;
}

module.exports = {
    // Statistics
    getDashboardStatistics,
    getMonthlyRevenue,
    // Admin-only user operations
    gdprDeleteUser,
    // Admin-only provider operations
    deactivateProvider,
    activateProvider,
    getProviderProfilePicture,
    removeProviderProfilePicture,
    banProvider,
    unbanProvider,
    // Admin-only salon operations
    getSalonLogoUrl,
    removeSalonLogo,
    removeSalonDescription,
    // Logs
    insertLogEvent,
    getSystemLogs
};

/**
 * Admin-specific SQL queries.
 * Covers: dashboard statistics, system logs, admin CRUD for users/providers/salons/ratings/appointments.
 */

const pool = require('./pool');

// ==================== STATISTICS ====================

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

// ==================== USERS ====================

async function getAdminUsers() {
    const query = `
        SELECT id, name, email, phone, role, status, last_login, profile_picture_url, created_at
        FROM users ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getAdminUserById(userId) {
    const selectUserQuery = `
        SELECT id, name, email, phone, address, role, status, last_login, profile_picture_url, created_at 
        FROM users WHERE id = ?
    `;
    const [users] = await pool.execute(selectUserQuery, [userId]);
    if (users.length === 0) return null;

    const selectAppointmentsQuery = `
        SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price, a.comment,
            p.name as provider_name, s.name as salon_name, srv.name as service_name
        FROM appointments a
        JOIN providers p ON a.provider_id = p.id
        JOIN salons s ON p.salon_id = s.id
        JOIN services srv ON a.service_id = srv.id
        WHERE a.user_id = ? ORDER BY a.appointment_start DESC
    `;
    const [appointments] = await pool.execute(selectAppointmentsQuery, [userId]);

    const selectRatingsQuery = `
        SELECT r.id, r.salon_rating, r.provider_rating, r.salon_comment, r.provider_comment,
            r.created_at, r.active, s.name as salon_name, p.name as provider_name
        FROM ratings r
        JOIN salons s ON r.salon_id = s.id
        JOIN providers p ON r.provider_id = p.id
        WHERE r.user_id = ? ORDER BY r.created_at DESC
    `;
    const [ratings] = await pool.execute(selectRatingsQuery, [userId]);

    return { user: users[0], appointments, ratings };
}

async function banUser(userId) {
    const updateQuery = `UPDATE users SET status = 'banned' WHERE id = ?`;
    await pool.execute(updateQuery, [userId]);
    const deleteTokensQuery = `DELETE FROM RefTokens WHERE user_id = ?`;
    await pool.execute(deleteTokensQuery, [userId]);
}

async function unbanUser(userId) {
    const query = `UPDATE users SET status = 'active' WHERE id = ?`;
    await pool.execute(query, [userId]);
}

async function getUserProfilePicture(userId) {
    const query = `SELECT profile_picture_url FROM users WHERE id = ?`;
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0].profile_picture_url : null;
}

async function removeUserProfilePicture(userId) {
    const query = `UPDATE users SET profile_picture_url = NULL WHERE id = ?`;
    await pool.execute(query, [userId]);
}

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

// ==================== PROVIDERS ====================

async function getAdminProviders() {
    const query = `
        SELECT p.id, p.name, p.email, p.phone, p.description, p.status, p.role, p.isManager,
            p.profile_picture_url, p.last_login, p.created_at,
            s.id as salon_id, s.name as salon_name
        FROM providers p
        JOIN salons s ON p.salon_id = s.id
        ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getAdminProviderById(providerId) {
    const selectProviderQuery = `
        SELECT p.*, s.name as salon_name, s.address as salon_address
        FROM providers p JOIN salons s ON p.salon_id = s.id WHERE p.id = ?
    `;
    const [providers] = await pool.execute(selectProviderQuery, [providerId]);
    if (providers.length === 0) return null;

    const selectAppointmentsQuery = `
        SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price, a.comment,
            u.name as customer_name, srv.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN services srv ON a.service_id = srv.id
        WHERE a.provider_id = ? ORDER BY a.appointment_start DESC
    `;
    const [appointments] = await pool.execute(selectAppointmentsQuery, [providerId]);

    const selectRatingsQuery = `
        SELECT r.id, r.provider_rating, r.provider_comment, r.salon_rating, r.salon_comment,
            r.created_at, r.active, u.name as user_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.provider_id = ? ORDER BY r.created_at DESC
    `;
    const [ratings] = await pool.execute(selectRatingsQuery, [providerId]);

    const selectServicesQuery = `
        SELECT id, name, description, duration_minutes, price, status
        FROM services WHERE provider_id = ?
    `;
    const [services] = await pool.execute(selectServicesQuery, [providerId]);

    return { provider: providers[0], appointments, ratings, services };
}

async function deactivateProvider(providerId) {
    const query = `UPDATE providers SET status = 'inactive' WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

async function activateProvider(providerId) {
    const query = `UPDATE providers SET status = 'active' WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

async function getProviderProfilePicture(providerId) {
    const query = `SELECT profile_picture_url FROM providers WHERE id = ?`;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0].profile_picture_url : null;
}

async function removeProviderProfilePicture(providerId) {
    const query = `UPDATE providers SET profile_picture_url = NULL WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

async function banProvider(providerId) {
    const updateQuery = `UPDATE providers SET status = 'banned' WHERE id = ?`;
    await pool.execute(updateQuery, [providerId]);
    const deleteTokensQuery = `DELETE FROM RefTokens WHERE provider_id = ?`;
    await pool.execute(deleteTokensQuery, [providerId]);
}

async function unbanProvider(providerId) {
    const query = `UPDATE providers SET status = 'active' WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

// ==================== SALONS ====================

async function getAdminSalons() {
    const query = `
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
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getAdminSalonById(salonId) {
    const selectSalonQuery = `SELECT * FROM salons WHERE id = ?`;
    const [salons] = await pool.execute(selectSalonQuery, [salonId]);
    if (salons.length === 0) return null;

    const selectProvidersQuery = `
        SELECT id, name, email, phone, description, status, role, isManager, profile_picture_url, created_at
        FROM providers WHERE salon_id = ?
    `;
    const [providers] = await pool.execute(selectProvidersQuery, [salonId]);

    const selectServicesQuery = `
        SELECT s.id, s.name, s.description, s.duration_minutes, s.price, s.status, p.name as provider_name
        FROM services s
        JOIN providers p ON s.provider_id = p.id
        WHERE p.salon_id = ?
    `;
    const [services] = await pool.execute(selectServicesQuery, [salonId]);

    const selectRatingsQuery = `
        SELECT r.id, r.salon_rating, r.salon_comment, r.provider_rating, r.provider_comment,
            r.created_at, r.active, u.name as user_name, p.name as provider_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        JOIN providers p ON r.provider_id = p.id
        WHERE r.salon_id = ? ORDER BY r.created_at DESC
    `;
    const [ratings] = await pool.execute(selectRatingsQuery, [salonId]);

    return { salon: salons[0], providers, services, ratings };
}

async function getSalonBannerUrl(salonId) {
    const query = `SELECT banner_image_url FROM salons WHERE id = ?`;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0].banner_image_url : null;
}

async function getSalonLogoUrl(salonId) {
    const query = `SELECT logo_url FROM salons WHERE id = ?`;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0].logo_url : null;
}

async function removeSalonBanner(salonId) {
    const query = `UPDATE salons SET banner_image_url = NULL WHERE id = ?`;
    await pool.execute(query, [salonId]);
}

async function removeSalonLogo(salonId) {
    const query = `UPDATE salons SET logo_url = NULL WHERE id = ?`;
    await pool.execute(query, [salonId]);
}

async function removeSalonDescription(salonId) {
    const query = `UPDATE salons SET description = NULL WHERE id = ?`;
    await pool.execute(query, [salonId]);
}

async function updateSalonStatus(salonId, status) {
    const query = `UPDATE salons SET status = ? WHERE id = ?`;
    await pool.execute(query, [status, salonId]);
}

// ==================== RATINGS ====================

async function getAdminRatings() {
    const query = `
        SELECT r.id, r.user_id, r.appointment_id, r.salon_id, r.provider_id,
            r.salon_rating, r.provider_rating, r.salon_comment, r.provider_comment,
            r.created_at, r.active,
            u.name as user_name, u.email as user_email,
            s.name as salon_name,
            p.name as provider_name
        FROM ratings r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN salons s ON r.salon_id = s.id
        LEFT JOIN providers p ON r.provider_id = p.id
        ORDER BY r.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getRatingById(ratingId) {
    const query = `SELECT * FROM ratings WHERE id = ?`;
    const [rows] = await pool.execute(query, [ratingId]);
    return rows.length > 0 ? rows[0] : null;
}

async function deactivateRating(ratingId) {
    const query = `UPDATE ratings SET active = FALSE WHERE id = ?`;
    await pool.execute(query, [ratingId]);
}

// ==================== APPOINTMENTS ====================

async function getAdminAppointments() {
    const query = `
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
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getAdminAppointmentById(appointmentId) {
    const query = `SELECT * FROM appointments WHERE id = ?`;
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

async function softDeleteAppointment(appointmentId, reason, deletedBy) {
    const query = `
        UPDATE appointments SET status = ?, deleted_reason = ?, deleted_at = NOW(), deleted_by = ? WHERE id = ?
    `;
    await pool.execute(query, ['deleted', reason, deletedBy, appointmentId]);
}

// ==================== SYSTEM LOGS ====================

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
    // Users
    getAdminUsers,
    getAdminUserById,
    banUser,
    unbanUser,
    getUserProfilePicture,
    removeUserProfilePicture,
    gdprDeleteUser,
    // Providers
    getAdminProviders,
    getAdminProviderById,
    deactivateProvider,
    activateProvider,
    getProviderProfilePicture,
    removeProviderProfilePicture,
    banProvider,
    unbanProvider,
    // Salons
    getAdminSalons,
    getAdminSalonById,
    getSalonBannerUrl,
    getSalonLogoUrl,
    removeSalonBanner,
    removeSalonLogo,
    removeSalonDescription,
    updateSalonStatus,
    // Ratings
    getAdminRatings,
    getRatingById,
    deactivateRating,
    // Appointments
    getAdminAppointments,
    getAdminAppointmentById,
    softDeleteAppointment,
    // Logs
    getSystemLogs
};

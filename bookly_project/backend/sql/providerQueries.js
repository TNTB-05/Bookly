/**
 * Provider-related SQL queries.
 * Covers: provider CRUD, profile, salon membership.
 */

const pool = require('./pool');

// ==================== READ ====================

async function getProvidersBySalonId(salonId) {
    const query = `
        SELECT 
            p.id, 
            p.salon_id, 
            p.name, 
            p.email, 
            p.phone, 
            p.description, 
            p.status, 
            p.role, 
            p.isManager, 
            p.created_at,
            p.profile_picture_url,
            COALESCE(AVG(r.provider_rating), 0) as average_rating,
            COUNT(r.id) as rating_count
        FROM providers p
        LEFT JOIN ratings r ON p.id = r.provider_id AND r.active = TRUE
        WHERE p.salon_id = ? AND p.status = 'active'
        GROUP BY p.id
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows;
}

async function getProviderById(providerId) {
    const query = `
        SELECT id, salon_id, name, email, phone, description, status, role, isManager, created_at
        FROM providers
        WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getProviderProfile(providerId) {
    const query = `
        SELECT id, salon_id, name, email, phone, description, status, role, isManager, profile_picture_url, created_at
        FROM providers WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getProviderPasswordHash(providerId) {
    const query = 'SELECT password_hash FROM providers WHERE id = ?';
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0].password_hash : null;
}

async function getProviderPictureUrl(providerId) {
    const query = 'SELECT profile_picture_url FROM providers WHERE id = ?';
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0].profile_picture_url : null;
}

async function getProviderSalonId(providerId) {
    const query = 'SELECT salon_id FROM providers WHERE id = ?';
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0].salon_id : null;
}

async function getProviderStatus(providerId) {
    const query = 'SELECT id, status FROM providers WHERE id = ?';
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== UPDATE ====================

async function updateProviderProfile(providerId, { name, phone, description }) {
    const query = 'UPDATE providers SET name = ?, phone = ?, description = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, phone, description, providerId]);
    return result;
}

async function updateProviderPicture(providerId, imageUrl) {
    const query = 'UPDATE providers SET profile_picture_url = ? WHERE id = ?';
    const [result] = await pool.execute(query, [imageUrl, providerId]);
    return result;
}

async function updateProviderPassword(providerId, newHashedPassword) {
    const query = 'UPDATE providers SET password_hash = ? WHERE id = ?';
    const [result] = await pool.execute(query, [newHashedPassword, providerId]);
    return result;
}

async function updateProviderLastLogin(providerId) {
    const query = 'UPDATE providers SET last_login = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [providerId]);
    return result;
}

// ==================== SALON PROVIDER MANAGEMENT (from salonApi inline SQL) ====================

async function getSalonProviders(salonId) {
    const query = `
        SELECT p.id, p.name, p.email, p.phone, p.description, p.status, p.role, p.isManager,
                p.profile_picture_url, p.created_at,
                COUNT(a.id) as appointment_count
        FROM providers p
        LEFT JOIN appointments a ON a.provider_id = p.id AND a.status IN ('scheduled', 'completed')
        WHERE p.salon_id = ?
        GROUP BY p.id
        ORDER BY p.isManager DESC, p.created_at ASC
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows;
}

async function getProviderForUpdate(providerId) {
    const query = 'SELECT id, salon_id, isManager FROM providers WHERE id = ?';
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getManagerCount(salonId) {
    const query = 'SELECT COUNT(*) as count FROM providers WHERE salon_id = ? AND isManager = TRUE';
    const [rows] = await pool.execute(query, [salonId]);
    return rows[0].count;
}

async function updateProviderDetails(providerId, updates, values) {
    const query = `UPDATE providers SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, [...values, providerId]);
    return result;
}

async function getProviderBasicInfo(providerId) {
    const query = `
        SELECT id, name, email, phone, description, status, role, isManager, created_at
        FROM providers WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0] : null;
}

async function softDeleteProvider(providerId) {
    const query = 'UPDATE providers SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, ['deleted', providerId]);
    return result;
}

// ==================== ADMIN PROVIDER QUERIES ====================

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

// ==================== AUTH QUERIES (from ProvLoginApi, LoginApi) ====================

async function getProviderByEmail(email) {
    const query = `
        SELECT p.id, p.name, p.email, p.password_hash, p.salon_id, p.isManager, p.status, s.name as salon_name 
        FROM providers p 
        JOIN salons s ON p.salon_id = s.id 
        WHERE p.email = ?
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
}

async function checkProviderExists(email, phone) {
    const query = 'SELECT id FROM providers WHERE email = ? OR phone = ?';
    const [rows] = await pool.execute(query, [email, phone]);
    return rows.length > 0;
}

// ==================== STAFF QUERIES (from staffApi) ====================

async function verifyStaffBelongsToSalon(staffId, salonId) {
    const query = 'SELECT id FROM providers WHERE id = ? AND salon_id = ?';
    const [rows] = await pool.execute(query, [staffId, salonId]);
    return rows.length > 0;
}

module.exports = {
    getProvidersBySalonId,
    getProviderById,
    getProviderProfile,
    getProviderPasswordHash,
    getProviderPictureUrl,
    getProviderSalonId,
    getProviderStatus,
    updateProviderProfile,
    updateProviderPicture,
    updateProviderPassword,
    updateProviderLastLogin,
    getSalonProviders,
    getProviderForUpdate,
    getManagerCount,
    updateProviderDetails,
    getProviderBasicInfo,
    softDeleteProvider,
    getAdminProviders,
    getAdminProviderById,
    getProviderByEmail,
    checkProviderExists,
    verifyStaffBelongsToSalon
};

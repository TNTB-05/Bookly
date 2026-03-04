/**
 * Salon-related SQL queries.
 * Covers: salon CRUD, types, branding, status.
 */

const pool = require('./pool');

// ==================== READ ====================

async function getAllSalons() {
    const query = `
        SELECT id, name, address, phone, email, type, description, latitude, longitude, status, banner_color, logo_url, banner_image_url, created_at
        FROM salons
        WHERE status != 'closed'
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getSalonById(salonId) {
    const query = `
        SELECT id, name, address, phone, email, type, description, latitude, longitude, status, banner_color, logo_url, banner_image_url, created_at
        FROM salons
        WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getDistinctSalonTypes() {
    const query = `
        SELECT DISTINCT type
        FROM salons
        WHERE status != 'closed' AND type IS NOT NULL AND type != ''
        ORDER BY type
    `;
    const [rows] = await pool.execute(query);
    return rows.map(row => row.type);
}

async function getTopRatedSalons(limit = 10) {
    const query = `
        SELECT 
            s.id,
            s.name,
            s.address,
            s.type,
            s.description,
            s.banner_color,
            s.logo_url,
            s.banner_image_url,
            COALESCE(AVG(r.salon_rating), 0) as average_rating,
            COUNT(r.id) as rating_count
        FROM salons s
        LEFT JOIN ratings r ON s.id = r.salon_id AND r.active = TRUE
        WHERE s.status = 'open'
        GROUP BY s.id
        ORDER BY average_rating DESC, rating_count DESC, s.created_at DESC
        LIMIT ?
    `;
    const [rows] = await pool.execute(query, [String(parseInt(limit) || 10)]);
    return rows;
}

async function getServicesBySalonId(salonId) {
    const query = `
        SELECT s.id, s.provider_id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at,
            p.name as provider_name,
            JSON_ARRAYAGG(
                IF(si.id IS NOT NULL, JSON_OBJECT('id', si.id, 'image_url', si.image_url, 'sort_order', si.sort_order), NULL)
            ) AS images
        FROM services s
        INNER JOIN providers p ON s.provider_id = p.id
        LEFT JOIN service_images si ON si.service_id = s.id
        WHERE p.salon_id = ? AND s.status = 'available' AND p.status = 'active'
        GROUP BY s.id, s.provider_id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at, p.name
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.map(row => ({ ...row, images: (row.images || []).filter(img => img !== null) }));
}

// ==================== UPDATE ====================

async function updateSalon(salonId, updateData) {
    const allowedFields = ['name', 'address', 'phone', 'email', 'type', 'opening_hours', 'closing_hours', 'description', 'latitude', 'longitude', 'status', 'banner_color', 'logo_url', 'banner_image_url'];
    const fields = Object.keys(updateData).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updateData[f]);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE salons SET ${setClause} WHERE id = ?`;

    const [result] = await pool.execute(query, [...values, salonId]);
    return result;
}

// ==================== SALON MANAGEMENT (from salonApi inline SQL) ====================

async function getMySalon(providerId) {
    const selectProviderQuery = 'SELECT salon_id, isManager FROM providers WHERE id = ?';
    const [providers] = await pool.execute(selectProviderQuery, [providerId]);

    if (providers.length === 0) return null;

    const salonId = providers[0].salon_id;
    const isManager = providers[0].isManager;

    const selectSalonQuery = `
        SELECT id, name, address, phone, email, type, opening_hours, closing_hours, 
                description, latitude, longitude, sharecode, status, banner_color, logo_url, banner_image_url, created_at
        FROM salons WHERE id = ?
    `;
    const [salons] = await pool.execute(selectSalonQuery, [salonId]);

    if (salons.length === 0) return null;

    return { salon: salons[0], isManager };
}

async function updateSalonStatus(salonId, status) {
    const query = 'UPDATE salons SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, salonId]);
    return result;
}

async function getSalonBranding(salonId) {
    const query = 'SELECT logo_url, banner_image_url, banner_color FROM salons WHERE id = ?';
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0] : null;
}

async function updateSalonBranding(salonId, updates, values) {
    const query = `UPDATE salons SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, [...values, salonId]);
    return result;
}

async function getFullSalonById(salonId) {
    const query = `
        SELECT id, name, address, phone, email, type, opening_hours, closing_hours,
                description, latitude, longitude, sharecode, status, banner_color, logo_url, banner_image_url, created_at
        FROM salons WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getSalonBannerUrl(salonId) {
    const query = 'SELECT banner_image_url FROM salons WHERE id = ?';
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0].banner_image_url : null;
}

async function removeSalonBanner(salonId) {
    const query = 'UPDATE salons SET banner_image_url = NULL WHERE id = ?';
    const [result] = await pool.execute(query, [salonId]);
    return result;
}

// ==================== ADMIN SALON QUERIES ====================

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
    const selectSalonQuery = 'SELECT * FROM salons WHERE id = ?';
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

module.exports = {
    getAllSalons,
    getSalonById,
    getDistinctSalonTypes,
    getTopRatedSalons,
    getServicesBySalonId,
    updateSalon,
    getMySalon,
    updateSalonStatus,
    getSalonBranding,
    updateSalonBranding,
    getFullSalonById,
    getSalonBannerUrl,
    removeSalonBanner,
    getAdminSalons,
    getAdminSalonById
};

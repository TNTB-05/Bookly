const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

//!SQL Queries
async function selectall() {
    const query = 'SELECT * FROM exampletable;';
    const [rows] = await pool.execute(query);
    return rows;
}

async function getAllSalons() {
    const query = `
        SELECT id, name, address, phone, email, type, description, latitude, longitude, status, created_at
        FROM salons
        WHERE status != 'closed'
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getSalonById(salonId) {
    const query = `
        SELECT id, name, address, phone, email, type, description, latitude, longitude, status, created_at
        FROM salons
        WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getProvidersBySalonId(salonId) {
    const query = `
        SELECT id, salon_id, name, email, phone, description, status, role, isManager, created_at
        FROM providers
        WHERE salon_id = ? AND status = 'active'
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows;
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

async function getServicesByProviderId(providerId) {
    const query = `
        SELECT id, provider_id, name, description, duration_minutes, price, status, created_at
        FROM services
        WHERE provider_id = ? AND status = 'available'
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows;
}

async function getServicesBySalonId(salonId) {
    const query = `
        SELECT s.id, s.provider_id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at, providers.name as provider_name
        FROM services s
        INNER JOIN providers ON s.provider_id = providers.id
        WHERE providers.salon_id = ? AND s.status = 'available' AND providers.status = 'active'
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows;
}

async function getTopRatedSalons(limit = 10) {
    const limitValue = parseInt(limit) || 10;
    const query = `
        SELECT 
            s.id,
            s.name,
            s.address,
            s.type,
            s.description,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(r.id) as rating_count
        FROM salons s
        LEFT JOIN ratings r ON s.id = r.salon_id AND r.active = TRUE
        WHERE s.status = 'open'
        GROUP BY s.id
        ORDER BY average_rating DESC, rating_count DESC
        LIMIT ${limitValue}
    `;
    const [rows] = await pool.query(query);
    return rows;
}

// Saved salons functions
async function getSavedSalonsByUserId(userId) {
    const query = `
        SELECT s.id, s.name, s.address, s.phone, s.email, s.type, s.description, 
               s.latitude, s.longitude, s.status, s.created_at,
               ss.created_at as saved_at,
               COALESCE(AVG(r.rating), 0) as average_rating,
               COUNT(DISTINCT r.id) as rating_count
        FROM saved_salons ss
        INNER JOIN salons s ON ss.salon_id = s.id
        LEFT JOIN ratings r ON s.id = r.salon_id AND r.active = TRUE
        WHERE ss.user_id = ? AND s.status != 'closed'
        GROUP BY s.id, ss.created_at
        ORDER BY ss.created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
}

async function saveSalon(userId, salonId) {
    const query = `
        INSERT INTO saved_salons (user_id, salon_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `;
    const [result] = await pool.execute(query, [userId, salonId]);
    return result;
}

async function unsaveSalon(userId, salonId) {
    const query = `
        DELETE FROM saved_salons
        WHERE user_id = ? AND salon_id = ?
    `;
    const [result] = await pool.execute(query, [userId, salonId]);
    return result;
}

async function isSalonSaved(userId, salonId) {
    const query = `
        SELECT id FROM saved_salons
        WHERE user_id = ? AND salon_id = ?
    `;
    const [rows] = await pool.execute(query, [userId, salonId]);
    return rows.length > 0;
}

async function getSavedSalonIds(userId) {
    const query = `
        SELECT salon_id FROM saved_salons
        WHERE user_id = ?
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => row.salon_id);
}

async function updateSalon(salonId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE salons SET ${setClause} WHERE id = ?`;
    
    const [result] = await pool.execute(query, [...values, salonId]);
    return result;
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

//!Export
module.exports = {
    pool,
    selectall,
    getAllSalons,
    getSalonById,
    getProvidersBySalonId,
    getServicesByProviderId,
    getServicesBySalonId,
    getDistinctSalonTypes,
    getTopRatedSalons,
    getSavedSalonsByUserId,
    saveSalon,
    unsaveSalon,
    isSalonSaved,
    getSavedSalonIds,
    updateSalon,
    getProviderById
};

/**
 * Saved salon SQL queries.
 * Covers: user's saved/favorite salons.
 */

const pool = require('./pool');

// ==================== READ ====================

// Get a user's saved salons with ratings info
async function getSavedSalonsByUserId(userId) {
    const query = `
        SELECT s.id, s.name, s.address, s.phone, s.email, s.type, s.description, 
               s.latitude, s.longitude, s.status, s.banner_color, s.logo_url, s.banner_image_url, s.created_at,
               ss.created_at as saved_at,
               COALESCE(AVG(r.salon_rating), 0) as average_rating,
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

// Check if a specific salon is saved by a user
async function isSalonSaved(userId, salonId) {
    const query = `
        SELECT id FROM saved_salons
        WHERE user_id = ? AND salon_id = ?
    `;
    const [rows] = await pool.execute(query, [userId, salonId]);
    return rows.length > 0;
}

// Get just the IDs of all salons saved by a user
async function getSavedSalonIds(userId) {
    const query = `
        SELECT salon_id FROM saved_salons
        WHERE user_id = ?
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => row.salon_id);
}

// ==================== CREATE ====================

// Save a salon to user's favorites (upsert)
async function saveSalon(userId, salonId) {
    const query = `
        INSERT INTO saved_salons (user_id, salon_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `;
    const [result] = await pool.execute(query, [userId, salonId]);
    return result;
}

// ==================== DELETE ====================

// Remove a salon from user's favorites
async function unsaveSalon(userId, salonId) {
    const query = `
        DELETE FROM saved_salons
        WHERE user_id = ? AND salon_id = ?
    `;
    const [result] = await pool.execute(query, [userId, salonId]);
    return result;
}

module.exports = {
    getSavedSalonsByUserId,
    isSalonSaved,
    getSavedSalonIds,
    saveSalon,
    unsaveSalon
};

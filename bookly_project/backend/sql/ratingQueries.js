/**
 * Rating-related SQL queries.
 * Covers: rating CRUD, admin rating management.
 */

const pool = require('./pool');

// ==================== READ ====================

async function getRatingByAppointment(appointmentId) {
    const query = 'SELECT * FROM ratings WHERE appointment_id = ?';
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows[0] || null;
}

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
    const query = 'SELECT * FROM ratings WHERE id = ?';
    const [rows] = await pool.execute(query, [ratingId]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== CREATE ====================

async function createRating(userId, appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment) {
    const query = `
        INSERT INTO ratings (user_id, appointment_id, salon_id, provider_id, salon_rating, provider_rating, salon_comment, provider_comment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            salon_rating = VALUES(salon_rating),
            provider_rating = VALUES(provider_rating),
            salon_comment = VALUES(salon_comment),
            provider_comment = VALUES(provider_comment)
    `;
    const [result] = await pool.execute(query, [userId, appointmentId, salonId, providerId, salonRating, providerRating, salonComment || null, providerComment || null]);
    return result.insertId || result.affectedRows > 0;
}

// ==================== UPDATE ====================

async function deactivateRating(ratingId) {
    const query = 'UPDATE ratings SET active = FALSE WHERE id = ?';
    const [result] = await pool.execute(query, [ratingId]);
    return result;
}

module.exports = {
    getRatingByAppointment,
    getAdminRatings,
    getRatingById,
    createRating,
    deactivateRating
};

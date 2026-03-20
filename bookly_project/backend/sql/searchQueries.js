/**
 * Search SQL queries.
 * Covers: suggestions autocomplete, by-name search, recent reviews, recommendations.
 */

const pool = require('./pool');

// ==================== READ ====================

// Search salon suggestions by name (autocomplete, max 5)
async function getSalonSuggestions(searchTerm) {
    const query = `
        SELECT DISTINCT id, name, address, type
        FROM salons
        WHERE status != 'closed' 
        AND LOWER(name) LIKE ?
        LIMIT 5
    `;
    const [rows] = await pool.execute(query, [`%${searchTerm}%`]);
    return rows;
}

// Search salon type suggestions (autocomplete, max 3)
async function getTypeSuggestions(searchTerm) {
    const query = `
        SELECT DISTINCT type
        FROM salons
        WHERE status != 'closed' 
        AND type IS NOT NULL 
        AND type != ''
        AND LOWER(type) LIKE ?
        LIMIT 3
    `;
    const [rows] = await pool.execute(query, [`%${searchTerm}%`]);
    return rows.map(row => row.type);
}

// Search salons by dynamic WHERE conditions with ratings
async function searchSalonsByName(whereConditions, queryParams) {
    const query = `
        SELECT s.id, s.name, s.address, s.type, s.description, s.banner_color, s.logo_url, s.banner_image_url,
               s.latitude, s.longitude, s.phone, s.email, s.opening_hours, s.closing_hours,
               COALESCE(AVG(r.salon_rating), 0) as average_rating,
               COUNT(DISTINCT r.id) as rating_count
        FROM salons s
        LEFT JOIN ratings r ON s.id = r.salon_id AND r.active = TRUE
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY s.id
        ORDER BY average_rating DESC, rating_count DESC
    `;
    const [rows] = await pool.execute(query, queryParams);
    return rows;
}

// Get recent active reviews with comments for the landing page
async function getRecentReviews(limit) {
    const query = `
        SELECT 
            r.id,
            r.salon_rating,
            r.salon_comment,
            r.created_at,
            u.name as user_name,
            sal.id as salon_id,
            sal.name as salon_name,
            sal.type as salon_type
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        JOIN salons sal ON r.salon_id = sal.id
        WHERE r.active = TRUE 
        AND r.salon_comment IS NOT NULL 
        AND r.salon_comment != ''
        ORDER BY r.created_at DESC
        LIMIT ?
    `;
    const [rows] = await pool.execute(query, [String(limit)]);
    return rows;
}

// Get personalized salon recommendations using collaborative filtering and distance
async function getRecommendedSalons(userId, lat, lng, limit = 8) {
    const query = `
        WITH
        user_service_affinity AS (
            SELECT sal.type, COUNT(*) AS booking_count
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            JOIN salons sal ON p.salon_id = sal.id
            WHERE a.user_id = ?
            GROUP BY sal.type
        ),
        collab_users AS (
        SELECT DISTINCT user_id FROM(
            SELECT DISTINCT ss2.user_id
            FROM saved_salons ss1
            JOIN saved_salons ss2 ON ss1.salon_id = ss2.salon_id AND ss2.user_id != ?
            WHERE ss1.user_id = ?
            UNION ALL
            SELECT DISTINCT a2.user_id
            FROM appointments a1
            JOIN appointments a2 ON a1.provider_id = a2.provider_id AND a2.user_id != ?
            WHERE a1.user_id = ? AND DATE(a1.appointment_start) >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ) collab_users_agg
        GROUP BY user_id
        ORDER BY COUNT(*) DESC
        ),
        collab_salons AS (
            SELECT salon_id, COUNT(*) AS collab_score FROM (
                SELECT salon_id FROM saved_salons
                WHERE user_id IN (SELECT user_id FROM collab_users)
                UNION ALL
                SELECT p.salon_id
                FROM appointments a
                JOIN providers p ON a.provider_id = p.id
                WHERE a.user_id IN (SELECT user_id FROM collab_users)
                  AND DATE(a.appointment_start) >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            ) collab_activity
            GROUP BY salon_id
        ),
        salon_popularity AS (
            SELECT salon_id,
                   AVG(salon_rating)                        AS avg_rating,
                   COUNT(*)                                  AS rating_count,
                   AVG(salon_rating) * LOG(COUNT(*) + 1)    AS popularity_score
            FROM ratings
            GROUP BY salon_id
        ),
        recent_visits AS (
            SELECT DISTINCT p.salon_id
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            WHERE a.user_id = ?
              AND DATE(a.appointment_start) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
        SELECT
            s.id,
            s.name,
            s.address,
            s.banner_image_url,
            s.logo_url,
            s.banner_color,
            s.type,
            COALESCE(sp.avg_rating, 0)    AS avg_rating,
            COALESCE(sp.rating_count, 0)  AS rating_count,
            (
                111.045 * DEGREES(ACOS(LEAST(1.0, COS(RADIANS(?))
                  * COS(RADIANS(s.latitude))
                  * COS(RADIANS(s.longitude) - RADIANS(?))
                  + SIN(RADIANS(?)) * SIN(RADIANS(s.latitude)))))
            ) AS distance_km,
            (
                COALESCE(usa.booking_count, 0) * 0.30
              + COALESCE(cs.collab_score,   0) * 0.25
              + COALESCE(sp.popularity_score, 0) * 0.20
              + (CASE WHEN sav.user_id IS NOT NULL THEN 1 ELSE 0 END) * 0.15
              + (1 / (1 + (111.045 * DEGREES(ACOS(LEAST(1.0,
                    COS(RADIANS(?)) * COS(RADIANS(s.latitude))
                    * COS(RADIANS(s.longitude) - RADIANS(?))
                    + SIN(RADIANS(?)) * SIN(RADIANS(s.latitude)))))))) * 0.10
            ) * (CASE WHEN rv.salon_id IS NOT NULL THEN 0.7 ELSE 1.0 END) AS score
        FROM salons s
        LEFT JOIN (
            SELECT s2.id AS salon_id, usa2.booking_count
            FROM salons s2
            JOIN user_service_affinity usa2 ON s2.type = usa2.type
            WHERE s2.type IS NOT NULL
        ) usa ON usa.salon_id = s.id
        LEFT JOIN collab_salons cs ON cs.salon_id = s.id
        LEFT JOIN salon_popularity sp ON sp.salon_id = s.id
        LEFT JOIN saved_salons sav ON sav.salon_id = s.id AND sav.user_id = ?
        LEFT JOIN recent_visits rv ON rv.salon_id = s.id
        WHERE s.latitude IS NOT NULL AND s.status != 'closed'
        ORDER BY score DESC
        LIMIT ?
    `;
    const params = [userId, userId, userId, userId, userId, userId, lat, lng, lat, lat, lng, lat, userId, limit];
    // Note: pool.query used here because pool.execute doesn't support certain CTE parameter patterns in all MySQL versions
    const [rows] = await pool.query(query, params);
    return rows;
}

module.exports = {
    getSalonSuggestions,
    getTypeSuggestions,
    searchSalonsByName,
    getRecentReviews,
    getRecommendedSalons
};

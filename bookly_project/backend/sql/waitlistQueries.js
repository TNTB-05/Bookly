/**
 * Waitlist SQL queries.
 * Covers: waitlist entries CRUD, slot matching.
 */

const pool = require('./pool');

// ==================== READ ====================

async function getWaitlistForFreedSlot(providerId, serviceId, freedSlotDate) {
    const query = `
        SELECT w.id, w.user_id, w.preferred_time_from, w.preferred_time_to,
               u.email AS user_email, u.name AS user_name
        FROM waitlist w
        JOIN users u ON w.user_id = u.id
        WHERE w.provider_id = ?
          AND w.service_id = ?
          AND w.status = 'active'
          AND w.preferred_date_from <= ?
          AND w.preferred_date_to >= ?
    `;
    const [rows] = await pool.execute(query, [providerId, serviceId, freedSlotDate, freedSlotDate]);
    return rows;
}

async function getUserWaitlistEntries(userId) {
    const query = `
        SELECT w.id, w.provider_id, w.service_id, w.preferred_date_from, w.preferred_date_to,
               w.preferred_time_from, w.preferred_time_to, w.status, w.created_at,
               p.name AS provider_name, s.name AS service_name, s.duration_minutes,
               sal.name AS salon_name, sal.id AS salon_id
        FROM waitlist w
        JOIN providers p ON w.provider_id = p.id
        JOIN services s ON w.service_id = s.id
        JOIN salons sal ON p.salon_id = sal.id
        WHERE w.user_id = ? AND w.status = 'active'
        ORDER BY w.created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
}

// ==================== CREATE ====================

async function addToWaitlist(userId, providerId, serviceId, dateFrom, dateTo, timeFrom, timeTo) {
    const query = `
        INSERT INTO waitlist (user_id, provider_id, service_id, preferred_date_from, preferred_date_to, preferred_time_from, preferred_time_to)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [userId, providerId, serviceId, dateFrom, dateTo, timeFrom || null, timeTo || null]);
    return result;
}

// ==================== UPDATE ====================

async function cancelWaitlistEntry(waitlistId, userId) {
    const query = `
        UPDATE waitlist SET status = 'canceled' WHERE id = ? AND user_id = ?
    `;
    const [result] = await pool.execute(query, [waitlistId, userId]);
    return result;
}

async function markWaitlistBooked(waitlistId) {
    const query = `
        UPDATE waitlist SET status = 'booked' WHERE id = ?
    `;
    const [result] = await pool.execute(query, [waitlistId]);
    return result;
}

module.exports = {
    getWaitlistForFreedSlot,
    getUserWaitlistEntries,
    addToWaitlist,
    cancelWaitlistEntry,
    markWaitlistBooked
};

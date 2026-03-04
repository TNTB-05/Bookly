/**
 * Appointment-related SQL queries.
 * Covers: appointment CRUD, conflict checks, status updates.
 */

const pool = require('./pool');

// ==================== READ ====================

async function getUserAppointments(userId) {
    const query = `
        SELECT 
            a.id,
            a.appointment_start,
            a.appointment_end,
            a.comment,
            a.price,
            a.status,
            a.deleted_reason,
            a.created_at,
            p.id as provider_id,
            p.name as provider_name,
            p.email as provider_email,
            p.phone as provider_phone,
            s.id as service_id,
            s.name as service_name,
            s.duration_minutes,
            sal.id as salon_id,
            sal.name as salon_name,
            sal.address as salon_address,
            r.id as rating_id,
            r.salon_rating,
            r.provider_rating
        FROM appointments a
        JOIN providers p ON a.provider_id = p.id
        JOIN services s ON a.service_id = s.id
        JOIN salons sal ON p.salon_id = sal.id
        LEFT JOIN ratings r ON a.id = r.appointment_id
        WHERE a.user_id = ?
        ORDER BY a.appointment_start DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
}

async function getAppointmentById(appointmentId) {
    const query = `
        SELECT 
            a.id, a.user_id, a.provider_id, a.service_id,
            a.appointment_start, a.appointment_end,
            a.comment, a.price, a.status, a.created_at
        FROM appointments a
        WHERE a.id = ?
    `;
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getProviderAppointmentsForDate(providerId, date) {
    const query = `
        SELECT 
            id, appointment_start, appointment_end, status
        FROM appointments
        WHERE provider_id = ?
        AND DATE(appointment_start) = ?
        AND status = 'scheduled'
        ORDER BY appointment_start ASC
    `;
    const [rows] = await pool.execute(query, [providerId, date]);
    return rows;
}

async function getProviderAppointments(providerId, startDate, endDate) {
    let query = `
        SELECT 
            a.id,
            a.appointment_start,
            a.appointment_end,
            a.comment,
            a.price,
            a.status,
            a.created_at,
            a.guest_name,
            a.guest_email,
            a.guest_phone,
            u.id as user_id,
            COALESCE(u.name, a.guest_name) as user_name,
            COALESCE(u.email, a.guest_email) as user_email,
            COALESCE(u.phone, a.guest_phone) as user_phone,
            s.id as service_id,
            s.name as service_name,
            s.duration_minutes as service_duration
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN services s ON a.service_id = s.id
        WHERE a.provider_id = ?
    `;
    const params = [providerId];

    if (startDate && endDate) {
        query += ` AND DATE(a.appointment_start) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    query += ` ORDER BY a.appointment_start ASC`;

    const [rows] = await pool.execute(query, params);
    return rows;
}

async function getProviderAppointmentById(appointmentId, providerId) {
    const query = `
        SELECT 
            a.id,
            a.appointment_start,
            a.appointment_end,
            a.comment,
            a.price,
            a.status,
            a.created_at,
            a.guest_name,
            a.guest_email,
            a.guest_phone,
            u.id as user_id,
            COALESCE(u.name, a.guest_name) as user_name,
            COALESCE(u.email, a.guest_email) as user_email,
            COALESCE(u.phone, a.guest_phone) as user_phone,
            s.id as service_id,
            s.name as service_name,
            s.duration_minutes as service_duration
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN services s ON a.service_id = s.id
        WHERE a.id = ? AND a.provider_id = ?
    `;
    const [rows] = await pool.execute(query, [appointmentId, providerId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getAppointmentWithDetailsForCancel(appointmentId) {
    const query = `
        SELECT
            a.id, a.status, a.provider_id, a.service_id, a.user_id, a.appointment_start,
            u.email as customer_email,
            u.name as customer_name,
            sal.name as salon_name,
            s.name as service_name,
            p.name as provider_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN providers p ON p.id = a.provider_id
        LEFT JOIN salons sal ON sal.id = p.salon_id
        WHERE a.id = ?
    `;
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getAppointmentDetailsForUserCancel(appointmentId) {
    const query = `
        SELECT
            a.appointment_start,
            a.service_id,
            a.provider_id,
            u.email as customer_email,
            u.name as customer_name,
            sal.name as salon_name,
            s.name as service_name,
            p.name as provider_name
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN services s ON a.service_id = s.id
        JOIN providers p ON a.provider_id = p.id
        JOIN salons sal ON p.salon_id = sal.id
        WHERE a.id = ?
    `;
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getNewAppointmentDetails(appointmentId) {
    const query = `
        SELECT
            a.id, a.appointment_start, a.appointment_end,
            a.comment, a.price, a.status, a.created_at,
            p.name as provider_name,
            s.name as service_name,
            sal.name as salon_name,
            u.email as customer_email,
            u.name as customer_name
        FROM appointments a
        JOIN providers p ON a.provider_id = p.id
        JOIN services s ON a.service_id = s.id
        JOIN salons sal ON p.salon_id = sal.id
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
    `;
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getAppointmentOwnership(appointmentId) {
    const query = 'SELECT id, provider_id FROM appointments WHERE id = ?';
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getAppointmentsBatchForRange(providerId, startDate, endDate) {
    const query = `
        SELECT appointment_start, appointment_end
        FROM appointments
        WHERE provider_id = ?
        AND DATE(appointment_start) BETWEEN ? AND ?
        AND status != 'canceled'
        ORDER BY appointment_start ASC
    `;
    const [rows] = await pool.execute(query, [providerId, startDate, endDate]);
    return rows;
}

async function verifyAppointmentBelongsToSalon(appointmentId, salonId) {
    const query = `
        SELECT a.id FROM appointments a
        JOIN providers p ON p.id = a.provider_id
        WHERE a.id = ? AND p.salon_id = ?
    `;
    const [rows] = await pool.execute(query, [appointmentId, salonId]);
    return rows.length > 0;
}

async function getStaffCalendarAppointments(staffId, date) {
    const query = `
        SELECT
            a.id,
            a.appointment_start,
            a.appointment_end,
            a.comment,
            a.price,
            a.status,
            a.created_at,
            a.guest_name,
            a.guest_email,
            a.guest_phone,
            u.id as user_id,
            COALESCE(u.name, a.guest_name) as user_name,
            COALESCE(u.email, a.guest_email) as user_email,
            COALESCE(u.phone, a.guest_phone) as user_phone,
            s.id as service_id,
            s.name as service_name,
            s.duration_minutes as service_duration
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        JOIN services s ON a.service_id = s.id
        WHERE a.provider_id = ? AND DATE(a.appointment_start) = ?
        ORDER BY a.appointment_start ASC
    `;
    const [rows] = await pool.execute(query, [staffId, date]);
    return rows;
}

async function getAppointmentStatusById(appointmentId) {
    const query = 'SELECT id, status FROM appointments WHERE id = ?';
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== CREATE ====================

async function createAppointment({ userId, providerId, serviceId, appointmentStart, appointmentEnd, comment, price, guestName, guestEmail, guestPhone }) {
    const query = `
        INSERT INTO appointments (
            user_id, provider_id, service_id, appointment_start, appointment_end, 
            comment, price, status, guest_name, guest_email, guest_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
        userId, providerId, serviceId, appointmentStart, appointmentEnd,
        comment || null, price, guestName || null, guestEmail || null, guestPhone || null
    ]);
    return result.insertId;
}

// ==================== UPDATE ====================

async function updateAppointmentStatus(appointmentId, status) {
    const query = 'UPDATE appointments SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, appointmentId]);
    return result;
}

async function updateAppointmentComment(appointmentId, comment) {
    const query = 'UPDATE appointments SET comment = ? WHERE id = ?';
    const [result] = await pool.execute(query, [comment, appointmentId]);
    return result;
}

async function autoCompletePastAppointments(userId) {
    const query = `
        UPDATE appointments SET status = 'completed'
        WHERE user_id = ? AND status = 'scheduled' AND appointment_end < NOW()
    `;
    const [result] = await pool.execute(query, [userId]);
    return result;
}

async function cancelUserScheduledAppointments(userId) {
    const query = `
        UPDATE appointments 
        SET status = 'canceled' 
        WHERE user_id = ? AND status = 'scheduled'
    `;
    const [result] = await pool.execute(query, [userId]);
    return result;
}

async function completeAllExpiredAppointments() {
    const query = `
        UPDATE appointments
        SET status = 'completed'
        WHERE status = 'scheduled'
          AND appointment_end < NOW()
    `;
    const [result] = await pool.query(query);
    return result;
}

async function softDeleteAppointment(appointmentId, reason, adminId) {
    const query = 'UPDATE appointments SET status = ?, deleted_reason = ?, deleted_at = NOW(), deleted_by = ? WHERE id = ?';
    const [result] = await pool.execute(query, ['deleted', reason, adminId, appointmentId]);
    return result;
}

// ==================== DELETE ====================

async function deleteAppointment(appointmentId) {
    const query = 'DELETE FROM appointments WHERE id = ?';
    const [result] = await pool.execute(query, [appointmentId]);
    return result;
}

// ==================== CONFLICT CHECKS ====================

async function checkAppointmentConflicts(providerId, startDatetime, endDatetime) {
    const query = `
        SELECT a.id, a.appointment_start, a.appointment_end, 
               COALESCE(u.name, a.guest_name) as user_name,
               s.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.provider_id = ? 
        AND a.status = 'scheduled'
        AND a.appointment_start < ? 
        AND a.appointment_end > ?
    `;
    const [rows] = await pool.execute(query, [providerId, endDatetime, startDatetime]);
    return rows;
}

async function checkProviderAppointmentConflicts(providerId, startFormatted, endFormatted) {
    const query = `
        SELECT id FROM appointments 
        WHERE provider_id = ? 
        AND status = 'scheduled'
        AND appointment_start < ? AND appointment_end > ?
    `;
    const [rows] = await pool.execute(query, [
        providerId,
        endFormatted, startFormatted
    ]);
    return rows;
}

// ==================== DASHBOARD STATISTICS ====================

async function getDashboardStatistics(providerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const selectTodayQuery = `
        SELECT COUNT(*) as count FROM appointments 
        WHERE provider_id = ? 
        AND appointment_start >= ? 
        AND appointment_start < ? 
        AND status != 'canceled'
    `;
    const [todayResult] = await pool.execute(selectTodayQuery, [providerId, today, tomorrow]);

    const selectRevenueQuery = `
        SELECT SUM(price) as total FROM appointments 
        WHERE provider_id = ? 
        AND appointment_start >= ? 
        AND appointment_start < ? 
        AND status IN ('completed', 'scheduled')
    `;
    const [revenueResult] = await pool.execute(selectRevenueQuery, [providerId, weekStart, weekEnd]);

    const selectNewCustomersQuery = `
        SELECT COUNT(DISTINCT u.id) as count 
        FROM users u
        INNER JOIN appointments a ON a.user_id = u.id
        WHERE a.provider_id = ? 
        AND u.created_at >= ?
    `;
    const [newCustomersResult] = await pool.execute(selectNewCustomersQuery, [providerId, monthStart]);

    const selectUpcomingQuery = `
        SELECT 
            a.id,
            a.appointment_start,
            a.appointment_end,
            a.status,
            a.price,
            COALESCE(u.name, a.guest_name) as user_name,
            COALESCE(u.email, a.guest_email) as user_email,
            s.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.provider_id = ? 
        AND a.appointment_start >= NOW()
        AND a.status = 'scheduled'
        ORDER BY a.appointment_start ASC
        LIMIT 5
    `;
    const [upcomingAppointments] = await pool.execute(selectUpcomingQuery, [providerId]);

    return {
        todayAppointments: todayResult[0].count,
        weeklyRevenue: revenueResult[0].total || 0,
        newCustomers: newCustomersResult[0].count,
        upcomingAppointments
    };
}

// ==================== CUSTOMER MANAGEMENT (from calendarApi) ====================

async function getCustomerStats(providerId) {
    const selectRegisteredQuery = `
        SELECT COUNT(DISTINCT user_id) as count FROM appointments
        WHERE provider_id = ? AND user_id IS NOT NULL AND deleted_at IS NULL
    `;
    const [registeredResult] = await pool.execute(selectRegisteredQuery, [providerId]);

    const selectGuestQuery = `
        SELECT COUNT(DISTINCT guest_email) as count FROM appointments
        WHERE provider_id = ? AND user_id IS NULL AND guest_email IS NOT NULL AND deleted_at IS NULL
    `;
    const [guestResult] = await pool.execute(selectGuestQuery, [providerId]);

    const selectReturningRegisteredQuery = `
        SELECT COUNT(*) as count FROM (
            SELECT user_id FROM appointments
            WHERE provider_id = ? AND user_id IS NOT NULL AND deleted_at IS NULL
            GROUP BY user_id HAVING COUNT(*) > 1
        ) t
    `;
    const [returningRegistered] = await pool.execute(selectReturningRegisteredQuery, [providerId]);

    const selectReturningGuestsQuery = `
        SELECT COUNT(*) as count FROM (
            SELECT guest_email FROM appointments
            WHERE provider_id = ? AND user_id IS NULL AND guest_email IS NOT NULL AND deleted_at IS NULL
            GROUP BY guest_email HAVING COUNT(*) > 1
        ) t
    `;
    const [returningGuests] = await pool.execute(selectReturningGuestsQuery, [providerId]);

    const selectTopServicesQuery = `
        SELECT s.name, COUNT(a.id) as booking_count
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.provider_id = ? AND a.deleted_at IS NULL
        GROUP BY s.id, s.name
        ORDER BY booking_count DESC
        LIMIT 3
    `;
    const [topServices] = await pool.execute(selectTopServicesQuery, [providerId]);

    return {
        registered: registeredResult[0].count,
        guests: guestResult[0].count,
        returningRegistered: returningRegistered[0].count,
        returningGuests: returningGuests[0].count,
        topServices
    };
}

async function getRegisteredCustomers(providerId, search) {
    let query = `
        SELECT u.id, u.name, u.email, u.phone, u.profile_picture_url,
               0 as is_guest,
               COUNT(a.id) as total_bookings,
               MAX(a.appointment_start) as last_booking_date,
               COALESCE(SUM(a.price), 0) as total_spent
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        WHERE a.provider_id = ? AND a.deleted_at IS NULL
    `;
    const params = [providerId];

    if (search) {
        query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
        params.push(search, search);
    }
    query += ` GROUP BY u.id ORDER BY last_booking_date DESC`;

    const [rows] = await pool.execute(query, params);
    return rows;
}

async function getGuestCustomers(providerId, search) {
    let query = `
        SELECT NULL as id, MAX(a.guest_name) as name, a.guest_email as email,
               MAX(a.guest_phone) as phone, NULL as profile_picture_url,
               1 as is_guest,
               COUNT(a.id) as total_bookings,
               MAX(a.appointment_start) as last_booking_date,
               COALESCE(SUM(a.price), 0) as total_spent
        FROM appointments a
        WHERE a.provider_id = ? AND a.user_id IS NULL
              AND a.guest_email IS NOT NULL AND a.deleted_at IS NULL
    `;
    const params = [providerId];

    if (search) {
        query += ` AND (a.guest_name LIKE ? OR a.guest_email LIKE ?)`;
        params.push(search, search);
    }
    query += ` GROUP BY a.guest_email ORDER BY last_booking_date DESC`;

    const [rows] = await pool.execute(query, params);
    return rows;
}

async function getRegisteredCustomerDetail(providerId, userId) {
    const selectUserQuery = `
        SELECT id, name, email, phone, profile_picture_url, created_at FROM users WHERE id = ?
    `;
    const [users] = await pool.execute(selectUserQuery, [userId]);
    if (users.length === 0) return null;

    const selectAppointmentsQuery = `
        SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price, a.comment,
                s.name as service_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.provider_id = ? AND a.user_id = ? AND a.deleted_at IS NULL
        ORDER BY a.appointment_start DESC
    `;
    const [appointments] = await pool.execute(selectAppointmentsQuery, [providerId, userId]);

    const selectRatingQuery = `
        SELECT r.provider_rating as rating, r.provider_comment as comment, r.created_at
        FROM ratings r
        WHERE r.provider_id = ? AND r.user_id = ? AND r.active = TRUE
        ORDER BY r.created_at DESC LIMIT 1
    `;
    const [ratings] = await pool.execute(selectRatingQuery, [providerId, userId]);

    return { user: users[0], appointments, rating: ratings.length > 0 ? ratings[0] : null };
}

async function getGuestCustomerDetail(providerId, email) {
    const query = `
        SELECT a.id, a.appointment_start, a.appointment_end, a.status, a.price,
                a.guest_name as name, a.guest_email as email, a.guest_phone as phone,
                s.name as service_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.provider_id = ? AND a.guest_email = ? AND a.user_id IS NULL AND a.deleted_at IS NULL
        ORDER BY a.appointment_start DESC
    `;
    const [rows] = await pool.execute(query, [providerId, email]);
    return rows;
}

async function getReminderCustomerInfo(providerId, userId) {
    const selectSalonQuery = `
        SELECT s.name FROM salons s JOIN providers p ON p.salon_id = s.id WHERE p.id = ?
    `;
    const [salonResult] = await pool.execute(selectSalonQuery, [providerId]);
    if (salonResult.length === 0) return null;

    const selectUserQuery = `
        SELECT u.name, u.email FROM users u
        INNER JOIN appointments a ON a.user_id = u.id
        WHERE u.id = ? AND a.provider_id = ? LIMIT 1
    `;
    const [users] = await pool.execute(selectUserQuery, [userId, providerId]);
    if (users.length === 0) return null;

    return { salonName: salonResult[0].name, customerEmail: users[0].email, customerName: users[0].name };
}

async function getReminderGuestInfo(providerId, guestEmail) {
    const selectSalonQuery = `
        SELECT s.name FROM salons s JOIN providers p ON p.salon_id = s.id WHERE p.id = ?
    `;
    const [salonResult] = await pool.execute(selectSalonQuery, [providerId]);
    if (salonResult.length === 0) return null;

    const selectGuestQuery = `
        SELECT guest_name, guest_email FROM appointments
        WHERE guest_email = ? AND provider_id = ? AND user_id IS NULL LIMIT 1
    `;
    const [guests] = await pool.execute(selectGuestQuery, [guestEmail, providerId]);
    if (guests.length === 0) return null;

    return { salonName: salonResult[0].name, customerEmail: guests[0].guest_email, customerName: guests[0].guest_name };
}

// ==================== ADMIN QUERIES ====================

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
    const query = 'SELECT * FROM appointments WHERE id = ?';
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== USER VISITED SALONS ====================

async function getVisitedSalons(userId) {
    const query = `
        SELECT 
            sal.id,
            sal.name,
            sal.address,
            sal.type,
            sal.description,
            sal.latitude,
            sal.longitude,
            MAX(a.appointment_start) as last_visit,
            COUNT(DISTINCT a.id) as visit_count,
            (
                SELECT COALESCE(AVG(r.salon_rating), 0)
                FROM ratings r
                WHERE r.salon_id = sal.id AND r.active = TRUE
            ) as average_rating,
            (
                SELECT COUNT(r.id)
                FROM ratings r
                WHERE r.salon_id = sal.id AND r.active = TRUE
            ) as rating_count
        FROM appointments a
        JOIN providers p ON a.provider_id = p.id
        JOIN salons sal ON p.salon_id = sal.id
        WHERE a.user_id = ? AND a.status IN ('completed', 'scheduled')
        GROUP BY sal.id
        ORDER BY last_visit DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
}

// ==================== TRANSACTION-AWARE (user booking flow) ====================

async function getUserConflictingAppointments(connection, userId, date) {
    const query = `
        SELECT a.id, a.appointment_start, a.appointment_end,
               sal.id as salon_id, sal.name as salon_name,
               sal.latitude, sal.longitude
        FROM appointments a
        JOIN providers p ON a.provider_id = p.id
        JOIN salons sal ON p.salon_id = sal.id
        WHERE a.user_id = ?
        AND a.status = 'scheduled'
        AND DATE(a.appointment_start) = ?
        FOR UPDATE
    `;
    const [rows] = await connection.query(query, [userId, date]);
    return rows;
}

async function checkProviderConflictsForUpdate(connection, providerId, startFormatted, endFormatted) {
    const query = `
        SELECT id FROM appointments
        WHERE provider_id = ?
        AND status = 'scheduled'
        AND appointment_start < ? AND appointment_end > ?
        FOR UPDATE
    `;
    const [rows] = await connection.query(query, [
        providerId,
        endFormatted, startFormatted
    ]);
    return rows;
}

async function createAppointmentTx(connection, { userId, providerId, serviceId, appointmentStart, appointmentEnd, comment, price }) {
    const query = `
        INSERT INTO appointments (
            user_id, provider_id, service_id,
            appointment_start, appointment_end,
            comment, price, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `;
    const [result] = await connection.query(query, [
        userId, providerId, serviceId,
        appointmentStart, appointmentEnd,
        comment || null, price
    ]);
    return result.insertId;
}

module.exports = {
    getUserAppointments,
    getAppointmentById,
    getProviderAppointmentsForDate,
    getProviderAppointments,
    getProviderAppointmentById,
    getAppointmentWithDetailsForCancel,
    getAppointmentDetailsForUserCancel,
    getNewAppointmentDetails,
    getAppointmentOwnership,
    getAppointmentsBatchForRange,
    verifyAppointmentBelongsToSalon,
    getStaffCalendarAppointments,
    getAppointmentStatusById,
    createAppointment,
    updateAppointmentStatus,
    updateAppointmentComment,
    autoCompletePastAppointments,
    cancelUserScheduledAppointments,
    completeAllExpiredAppointments,
    softDeleteAppointment,
    deleteAppointment,
    checkAppointmentConflicts,
    checkProviderAppointmentConflicts,
    getDashboardStatistics,
    getCustomerStats,
    getRegisteredCustomers,
    getGuestCustomers,
    getRegisteredCustomerDetail,
    getGuestCustomerDetail,
    getReminderCustomerInfo,
    getReminderGuestInfo,
    getAdminAppointments,
    getAdminAppointmentById,
    getVisitedSalons,
    getUserConflictingAppointments,
    checkProviderConflictsForUpdate,
    createAppointmentTx
};

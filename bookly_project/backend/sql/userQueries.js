/**
 * User-related SQL queries.
 * Covers: user CRUD, profile, password, account management.
 */

const pool = require('./pool');

// ==================== READ ====================

async function getUserById(userId) {
    const query = 'SELECT id, name, email, phone, address, role, status, profile_picture_url, created_at, deleted_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows[0] || null;
}

async function getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] || null;
}

async function getUsers() {
    const query = 'SELECT * FROM users';
    const [rows] = await pool.execute(query);
    return rows;
}

async function getUserPasswordHash(userId) {
    const query = 'SELECT password_hash FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows[0]?.password_hash || null;
}

async function checkEmailExists(email, excludeUserId) {
    const query = 'SELECT id FROM users WHERE email = ? AND id != ?';
    const [rows] = await pool.execute(query, [email, excludeUserId]);
    return rows.length > 0;
}

async function getUserPictureUrl(userId) {
    const query = 'SELECT profile_picture_url FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0].profile_picture_url : null;
}

async function getUserByIdForReactivation(userId) {
    const query = 'SELECT id, email, status, deleted_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
}

async function findUserByEmail(email) {
    const query = 'SELECT id FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== CREATE ====================

async function addUser(name, email, hashedPassword, role) {
    const query = 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)';
    const [result] = await pool.execute(query, [name, email, hashedPassword, role]);
    return result.insertId;
}

async function createUserFromProviderBooking(name, email, phone, hashedPassword) {
    const query = `
        INSERT INTO users (name, email, phone, password_hash, status, role) 
        VALUES (?, ?, ?, ?, 'active', 'customer')
    `;
    const [result] = await pool.execute(query, [name, email, phone, hashedPassword]);
    return result.insertId;
}

// ==================== UPDATE ====================

async function updateUserProfile(userId, { name, email, phone, address, status }) {
    const query = 'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, email, phone, address, status, userId]);
    return result.affectedRows > 0;
}

async function updateUserPassword(userId, hashedPassword) {
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, userId]);
    return result.affectedRows > 0;
}

async function updateUserPicture(userId, imageUrl) {
    const query = 'UPDATE users SET profile_picture_url = ? WHERE id = ?';
    const [result] = await pool.execute(query, [imageUrl, userId]);
    return result;
}

async function updateUserLastLogin(userId) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

async function updateUserNameAndPhone(userId, name, phone) {
    const query = 'UPDATE users SET name = ?, phone = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, phone, userId]);
    return result;
}

// ==================== DELETE (soft) ====================

async function deleteUser(userId) {
    const query = `
        UPDATE users 
        SET status = 'deleted',
            name = 'Törölt felhasználó',
            phone = NULL,
            address = NULL,
            deleted_at = NOW()
        WHERE id = ?
    `;
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows > 0;
}

async function restoreUser(userId) {
    const query = `
        UPDATE users 
        SET status = 'active',
            deleted_at = NULL
        WHERE id = ? 
        AND status = 'deleted' 
        AND deleted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows > 0;
}

async function permanentlyDeleteUser(userId) {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows > 0;
}

async function reactivateUser(userId, name, phone, address) {
    const query = `
        UPDATE users 
        SET status = 'active',
            name = ?,
            phone = ?,
            address = ?,
            deleted_at = NULL
        WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, phone, address, userId]);
    return result;
}

// ==================== ACCOUNT DELETION CLEANUP ====================

async function deleteSavedSalonsForUser(userId) {
    const query = 'DELETE FROM saved_salons WHERE user_id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

async function deleteRefTokensForUser(userId) {
    const query = 'DELETE FROM RefTokens WHERE user_id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

// ==================== ADMIN USER QUERIES ====================

async function getAdminUsers() {
    const query = `
        SELECT id, name, email, phone, role, status, last_login, profile_picture_url, created_at
        FROM users ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getAdminUserById(userId) {
    const selectUserQuery = 'SELECT id, name, email, phone, address, role, status, last_login, profile_picture_url, created_at FROM users WHERE id = ?';
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
    const query = "UPDATE users SET status = 'banned' WHERE id = ?";
    const [result] = await pool.execute(query, [userId]);
    return result;
}

async function unbanUser(userId) {
    const query = "UPDATE users SET status = 'active' WHERE id = ?";
    const [result] = await pool.execute(query, [userId]);
    return result;
}

async function gdprDeleteUser(userId, anonymizedName) {
    const query = `
        UPDATE users SET 
            name = ?, email = NULL, phone = NULL, address = NULL,
            profile_picture_url = NULL, password_hash = NULL,
            status = 'deleted'
        WHERE id = ?
    `;
    const [result] = await pool.execute(query, [anonymizedName, userId]);
    return result;
}

async function getAdminUserFull(userId) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
}

async function removeUserPicture(userId) {
    const query = 'UPDATE users SET profile_picture_url = NULL WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

module.exports = {
    getUserById,
    getUserByEmail,
    getUsers,
    getUserPasswordHash,
    checkEmailExists,
    getUserPictureUrl,
    getUserByIdForReactivation,
    findUserByEmail,
    addUser,
    createUserFromProviderBooking,
    updateUserProfile,
    updateUserPassword,
    updateUserPicture,
    updateUserLastLogin,
    updateUserNameAndPhone,
    deleteUser,
    restoreUser,
    permanentlyDeleteUser,
    reactivateUser,
    deleteSavedSalonsForUser,
    deleteRefTokensForUser,
    getAdminUsers,
    getAdminUserById,
    banUser,
    unbanUser,
    gdprDeleteUser,
    getAdminUserFull,
    removeUserPicture
};

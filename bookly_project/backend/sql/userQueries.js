/**
 * User-related SQL queries.
 * Covers: user CRUD, profile, password, account management.
 */

const pool = require('./pool');

// ==================== READ ====================

// Get a user by their ID (excludes password hash)
async function getUserById(userId) {
    const query = 'SELECT id, name, email, phone, address, role, status, profile_picture_url, created_at, deleted_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows[0] || null;
}

// Get a user by their email address (full row)
async function getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] || null;
}

// Get a user's password hash for verification
async function getUserPasswordHash(userId) {
    const query = 'SELECT password_hash FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows[0]?.password_hash || null;
}

// Check if an email is already in use (excluding a specific user)
async function checkEmailExists(email, excludeUserId) {
    const query = 'SELECT id FROM users WHERE email = ? AND id != ?';
    const [rows] = await pool.execute(query, [email, excludeUserId]);
    return rows.length > 0;
}

// Get a user's profile picture URL
async function getUserPictureUrl(userId) {
    const query = 'SELECT profile_picture_url FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0].profile_picture_url : null;
}

// Find a user by email, returning only their ID
async function findUserByEmail(email) {
    const query = 'SELECT id FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== CREATE ====================

// Create a new user account
async function addUser(name, email, hashedPassword, role) {
    const query = 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)';
    const [result] = await pool.execute(query, [name, email, hashedPassword, role]);
    return result.insertId;
}

// Create a user account when booked by a provider (auto-active, customer role)
async function createUserFromProviderBooking(name, email, phone, hashedPassword) {
    const query = `
        INSERT INTO users (name, email, phone, password_hash, status, role) 
        VALUES (?, ?, ?, ?, 'active', 'customer')
    `;
    const [result] = await pool.execute(query, [name, email, phone, hashedPassword]);
    return result.insertId;
}

// ==================== UPDATE ====================

// Update user profile fields (name, email, phone, address, status)
async function updateUserProfile(userId, { name, email, phone, address, status }) {
    const query = 'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, email, phone, address, status, userId]);
    return result.affectedRows > 0;
}

// Update user's password hash
async function updateUserPassword(userId, hashedPassword) {
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, userId]);
    return result.affectedRows > 0;
}

// Update user's profile picture URL
async function updateUserPicture(userId, imageUrl) {
    const query = 'UPDATE users SET profile_picture_url = ? WHERE id = ?';
    const [result] = await pool.execute(query, [imageUrl, userId]);
    return result;
}

// Update user's last login timestamp
async function updateUserLastLogin(userId) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

// Update only user's name and phone number
async function updateUserNameAndPhone(userId, name, phone) {
    const query = 'UPDATE users SET name = ?, phone = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, phone, userId]);
    return result;
}

// ==================== DELETE (soft) ====================

// Soft-delete a user (anonymize name, clear phone/address)
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

// Restore a self-deleted user within the 30-day grace period
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

// Reactivate a deleted user account with new profile data
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

// Remove all saved salons for a user
async function deleteSavedSalonsForUser(userId) {
    const query = 'DELETE FROM saved_salons WHERE user_id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

// Delete all refresh tokens for a user
async function deleteRefTokensForUser(userId) {
    const query = 'DELETE FROM RefTokens WHERE user_id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

// ==================== ADMIN USER QUERIES ====================

// Get all users for admin panel listing
async function getAdminUsers() {
    const query = `
        SELECT id, name, email, phone, role, status, last_login, profile_picture_url, created_at
        FROM users ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

// Get detailed user info for admin (includes appointments, ratings)
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

// Ban a user and invalidate all their refresh tokens
async function banUser(userId) {
    const query = "UPDATE users SET status = 'banned' WHERE id = ?";
    const [result] = await pool.execute(query, [userId]);
    // Also invalidate all refresh tokens for the banned user
    await pool.execute('DELETE FROM RefTokens WHERE user_id = ?', [userId]);
    return result;
}

// Unban a user (set status back to active)
async function unbanUser(userId) {
    const query = "UPDATE users SET status = 'active' WHERE id = ?";
    const [result] = await pool.execute(query, [userId]);
    return result;
}

// GDPR-anonymize a user (nullify personal data)
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

// Remove user's profile picture from database
async function removeUserPicture(userId) {
    const query = 'UPDATE users SET profile_picture_url = NULL WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result;
}

module.exports = {
    getUserById,
    getUserByEmail,
    getUserPasswordHash,
    checkEmailExists,
    getUserPictureUrl,
    findUserByEmail,
    addUser,
    createUserFromProviderBooking,
    updateUserProfile,
    updateUserPassword,
    updateUserPicture,
    updateUserNameAndPhone,
    deleteUser,
    restoreUser,
    reactivateUser,
    deleteSavedSalonsForUser,
    deleteRefTokensForUser,
    getAdminUsers,
    getAdminUserById,
    banUser,
    unbanUser,
    gdprDeleteUser,
    removeUserPicture
};

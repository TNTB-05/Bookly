const { get } = require('../api/auth/LoginApi');
const {pool} = require('./database.js');
const mysql = require('mysql2/promise');


const getUserById=async (userId) => {
    const query = 'SELECT id, name, email, phone, address, role, status, profile_picture_url, created_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows[0];
};

const getUserByEmail=async (email) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0];
};
const getUsers=async () => {
    const query = 'SELECT * FROM users';
    const [rows] = await pool.execute(query);
    return rows;
}

const addUser=async (name, email, hashedPassword, role) => {
    const query = 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)';
    const [result] = await pool.execute(query, [name, email, hashedPassword, role]);
    return result.insertId;
};

const updateUserProfile = async (userId, { name, email, phone, address, status }) => {
    const query = 'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, email, phone, address, status, userId]);
    return result.affectedRows > 0;
};

const updateUserPassword = async (userId, hashedPassword) => {
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, userId]);
    return result.affectedRows > 0;
};

const getUserPasswordHash = async (userId) => {
    const query = 'SELECT password_hash FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [userId]);
    return rows[0]?.password_hash;
};

const checkEmailExists = async (email, excludeUserId) => {
    const query = 'SELECT id FROM users WHERE email = ? AND id != ?';
    const [rows] = await pool.execute(query, [email, excludeUserId]);
    return rows.length > 0;
};

const deleteUser = async (userId) => {
    // Soft delete: anonymize personal data but keep email + password for 30-day restoration login
    const query = `
        UPDATE users 
        SET status = 'deleted',
            name = NULL,
            phone = NULL,
            address = NULL,
            deleted_at = NOW()
        WHERE id = ?
    `;
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows > 0;
};

const restoreUser = async (userId) => {
    // Restore user account during grace period
    const query = `
        UPDATE users 
        SET status = 'inactive',
            deleted_at = NULL
        WHERE id = ? 
        AND status = 'deleted' 
        AND deleted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows > 0;
};

const permanentlyDeleteUser = async (userId) => {
    // Hard delete user (called after grace period)
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows > 0;
};

// --- Rating functions ---

const createRating = async (userId, appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment) => {
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
};

const getRatingByAppointment = async (appointmentId) => {
    const query = 'SELECT * FROM ratings WHERE appointment_id = ?';
    const [rows] = await pool.execute(query, [appointmentId]);
    return rows[0] || null;
};

module.exports = {
    getUserById,
    getUserByEmail,
    addUser,
    getUsers,
    updateUserProfile,
    updateUserPassword,
    getUserPasswordHash,
    checkEmailExists,
    deleteUser,
    restoreUser,
    permanentlyDeleteUser,
    createRating,
    getRatingByAppointment
};
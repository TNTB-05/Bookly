const { get } = require('../api/auth/LoginApi');
const {pool} = require('./database.js');
const mysql = require('mysql2/promise');


const getUserById=async (userId) => {
    const query = 'SELECT id, name, email, phone, address, role, status, created_at FROM users WHERE id = ?';
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

const getUserDataForExport = async (userId) => {
    const user = await getUserById(userId);
    
    // Get appointments
    const [appointments] = await pool.execute(
        `SELECT a.appointment_start, a.appointment_end, a.comment, a.price, a.status, 
         sal.name AS salon_name, p.name AS provider_name, s.name AS service_name 
         FROM appointments a
         JOIN providers p ON a.provider_id = p.id
         JOIN services s ON a.service_id = s.id
         JOIN salons sal ON p.salon_id = sal.id
         WHERE a.user_id = ?
         ORDER BY a.appointment_start DESC`,
        [userId]
    );
    
    // Get saved salons
    const [savedSalons] = await pool.execute(
        `SELECT s.id, s.name, s.address, s.type
         FROM saved_salons ss
         JOIN salons s ON ss.salon_id = s.id
         WHERE ss.user_id = ?
         ORDER BY ss.created_at DESC`,
        [userId]
    );
    
    return {
        profile: user,
        appointments: appointments,
        savedSalons: savedSalons,
        exportDate: new Date().toISOString()
    };
};

const permanentlyDeleteUser = async (userId) => {
    // Hard delete user (called after grace period)
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows > 0;
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
    getUserDataForExport,
    permanentlyDeleteUser
};
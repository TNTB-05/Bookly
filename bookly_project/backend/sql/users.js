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
    deleteUser
};
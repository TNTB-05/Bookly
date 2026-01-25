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

module.exports = {
    getUserById,
    getUserByEmail,
    addUser,
    getUsers
};
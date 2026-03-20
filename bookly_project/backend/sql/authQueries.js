/**
 * Auth SQL queries.
 * Covers: RefToken CRUD, admin table, user/provider status checks for auth flows.
 * NOTE: Provider registration transaction stays in ProvLoginApi.js (uses getConnection + beginTransaction).
 */

const pool = require('./pool');

// ==================== REFRESH TOKENS ====================

// Find a refresh token record by token string
async function findRefreshToken(refreshToken) {
    const query = `
        SELECT id, user_id, provider_id, admin_id FROM RefTokens WHERE refresh_token = ?
    `;
    const [rows] = await pool.execute(query, [refreshToken]);
    return rows.length > 0 ? rows[0] : null;
}

// Store a new refresh token for a user
async function insertUserRefreshToken(userId, refreshToken) {
    const query = `
        INSERT INTO RefTokens (user_id, refresh_token) VALUES (?, ?)
    `;
    await pool.execute(query, [userId, refreshToken]);
}

// Store a new refresh token for a provider
async function insertProviderRefreshToken(providerId, refreshToken) {
    const query = `
        INSERT INTO RefTokens (provider_id, refresh_token) VALUES (?, ?)
    `;
    await pool.execute(query, [providerId, refreshToken]);
}

// Store a new refresh token for an admin
async function insertAdminRefreshToken(adminId, refreshToken) {
    const query = `
        INSERT INTO RefTokens (admin_id, refresh_token) VALUES (?, ?)
    `;
    await pool.execute(query, [adminId, refreshToken]);
}

// Delete a refresh token by its ID
async function deleteRefreshTokenById(tokenId) {
    const query = `DELETE FROM RefTokens WHERE id = ?`;
    await pool.execute(query, [tokenId]);
}

// Delete a refresh token by its token string
async function deleteRefreshToken(refreshToken) {
    const query = `DELETE FROM RefTokens WHERE refresh_token = ?`;
    await pool.execute(query, [refreshToken]);
}

// ==================== ADMIN TABLE ====================

// Get admin account by email for login
async function getAdminByEmail(email) {
    const query = `
        SELECT id, name, email, password_hash FROM admins WHERE email = ?
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
}

// Check if admin exists by ID
async function getAdminById(adminId) {
    const query = `SELECT id FROM admins WHERE id = ?`;
    const [rows] = await pool.execute(query, [adminId]);
    return rows.length > 0 ? rows[0] : null;
}

// Update admin's last login timestamp
async function updateAdminLastLogin(adminId) {
    const query = `UPDATE admins SET last_login = NOW() WHERE id = ?`;
    await pool.execute(query, [adminId]);
}

// ==================== USER STATUS CHECKS (for auth middleware & refresh) ====================

// Get user's ID and status for auth validation
async function getUserStatus(userId) {
    const query = `SELECT id, status FROM users WHERE id = ?`;
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
}

// Update user's last login timestamp
async function updateUserLastLogin(userId) {
    const query = `UPDATE users SET last_login = NOW() WHERE id = ?`;
    await pool.execute(query, [userId]);
}

// Update provider's last login timestamp
async function updateProviderLastLogin(providerId) {
    const query = `UPDATE providers SET last_login = NOW() WHERE id = ?`;
    await pool.execute(query, [providerId]);
}

// ==================== PROVIDER LOGIN ====================

// Get provider with salon info for login authentication
async function getProviderForLogin(email) {
    const query = `
        SELECT p.id, p.name, p.email, p.password_hash, p.salon_id, p.isManager, p.status, s.name as salon_name 
        FROM providers p 
        JOIN salons s ON p.salon_id = s.id 
        WHERE p.email = ?
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== PROVIDER REGISTRATION HELPERS ====================

// Validate a salon sharecode and return salon ID/name if valid
async function validateSalonCode(code) {
    const query = `SELECT id, name FROM salons WHERE sharecode = ? AND status != 'closed'`;
    const [rows] = await pool.execute(query, [code]);
    return rows.length > 0 ? rows[0] : null;
}

// ==================== PROVIDER REGISTRATION (transactional — accept connection param) ====================

// Check if a provider with the given email or phone already exists (transactional)
async function checkProviderExistsByEmailOrPhone(connection, email, phone) {
    const [rows] = await connection.query(
        'SELECT id FROM providers WHERE email = ? OR phone = ?',
        [email, phone]
    );
    return rows.length > 0;
}

// Check if a salon with the same name and address already exists (transactional)
async function checkSalonExistsByNameAndAddress(connection, name, address) {
    const [rows] = await connection.query(
        'SELECT id FROM salons WHERE name = ? AND address = ?',
        [name, address]
    );
    return rows.length > 0;
}

// Verify a sharecode is unique (transactional)
async function checkSharecodeUnique(connection, sharecode) {
    const [rows] = await connection.query(
        'SELECT id FROM salons WHERE sharecode = ?',
        [sharecode]
    );
    return rows.length === 0;
}

// Create a new salon record (transactional)
async function createSalon(connection, { name, address, description, sharecode, salonType, latitude, longitude }) {
    const [result] = await connection.query(
        `INSERT INTO salons (name, address, description, sharecode, status, type, latitude, longitude) 
         VALUES (?, ?, ?, ?, 'open', ?, ?, ?)`,
        [name, address, description, sharecode, salonType, latitude, longitude]
    );
    return result.insertId;
}

// Check if a salon with given ID exists (transactional)
async function checkSalonExistsById(connection, salonId) {
    const [rows] = await connection.query(
        'SELECT id FROM salons WHERE id = ?',
        [salonId]
    );
    return rows.length > 0;
}

// Create a new provider record (transactional)
async function createProvider(connection, { salonId, name, email, phone, role, isManager, passwordHash }) {
    const [result] = await connection.query(
        `INSERT INTO providers (salon_id, name, email, phone, status, role, isManager, password_hash) 
         VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
        [salonId, name, email, phone, role, isManager, passwordHash]
    );
    return result.insertId;
}

// ==================== USER REACTIVATION ====================

// Get user data needed for reactivation check
async function getUserForReactivation(userId) {
    const query = `SELECT id, email, status, deleted_at FROM users WHERE id = ?`;
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
}

module.exports = {
    // Refresh tokens
    findRefreshToken,
    insertUserRefreshToken,
    insertProviderRefreshToken,
    insertAdminRefreshToken,
    deleteRefreshTokenById,
    deleteRefreshToken,
    // Admin table
    getAdminByEmail,
    getAdminById,
    updateAdminLastLogin,
    // Status checks
    getUserStatus,
    updateUserLastLogin,
    updateProviderLastLogin,
    // Provider login
    getProviderForLogin,
    // Registration helpers
    validateSalonCode,
    // Registration (transactional)
    checkProviderExistsByEmailOrPhone,
    checkSalonExistsByNameAndAddress,
    checkSharecodeUnique,
    createSalon,
    checkSalonExistsById,
    createProvider,
    // Reactivation
    getUserForReactivation
};

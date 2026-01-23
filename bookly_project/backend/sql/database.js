const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

//!SQL Queries
async function selectall() {
    const query = 'SELECT * FROM exampletable;';
    const [rows] = await pool.execute(query);
    return rows;
}

async function getAllSalons() {
    const query = `
        SELECT id, name, address, phone, email, description, latitude, longitude, status, created_at
        FROM salons
        WHERE status != 'closed'
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getSalonById(salonId) {
    const query = `
        SELECT id, name, address, phone, email, description, latitude, longitude, status, created_at
        FROM salons
        WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getProvidersBySalonId(salonId) {
    const query = `
        SELECT id, salon_id, name, email, phone, description, status, role, isManager, created_at
        FROM providers
        WHERE salon_id = ? AND status = 'active'
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows;
}

async function getDistinctSalonTypes() {
    const query = `
        SELECT DISTINCT type
        FROM salons
        WHERE status != 'closed' AND type IS NOT NULL AND type != ''
        ORDER BY type
    `;

    const [rows] = await pool.execute(query);
    return rows.map(row => row.type);
}

async function getServicesByProviderId(providerId) {
    const query = `
        SELECT id, provider_id, name, description, duration_minutes, price, status, created_at
        FROM services
        WHERE provider_id = ? AND status = 'available'
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows;
}

async function getServicesBySalonId(salonId) {
    const query = `
        SELECT services.id, services.provider_id, services.name, services.description, services.duration_minutes, services.price, services.status, services.created_at, providers.name as provider_name
        FROM services
        INNER JOIN providers ON services.provider_id = providers.id
        WHERE providers.salon_id = ? AND services.status = 'available' AND providers.status = 'active'
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows;
}

//!Export
module.exports = {
    pool,
    selectall,
    getAllSalons,
    getSalonById,
    getProvidersBySalonId,
    getServicesByProviderId,
    getServicesBySalonId,
    getDistinctSalonTypes
};

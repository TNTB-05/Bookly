/**
 * Service-related SQL queries.
 * Covers: service CRUD, service images.
 */

const pool = require('./pool');

// ==================== READ ====================

async function getServicesByProviderId(providerId) {
    const query = `
        SELECT s.id, s.provider_id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at,
            JSON_ARRAYAGG(
                IF(si.id IS NOT NULL, JSON_OBJECT('id', si.id, 'image_url', si.image_url, 'sort_order', si.sort_order), NULL)
            ) AS images
        FROM services s
        LEFT JOIN service_images si ON si.service_id = s.id
        WHERE s.provider_id = ? AND s.status = 'available'
        GROUP BY s.id, s.provider_id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.map(row => ({ ...row, images: (row.images || []).filter(img => img !== null) }));
}

async function getServiceById(serviceId) {
    const query = `
        SELECT 
            s.id, s.provider_id, s.name, s.description, 
            s.duration_minutes, s.price, s.status,
            p.salon_id,
            sal.opening_hours, sal.closing_hours
        FROM services s
        JOIN providers p ON s.provider_id = p.id
        JOIN salons sal ON p.salon_id = sal.id
        WHERE s.id = ?
    `;
    const [rows] = await pool.execute(query, [serviceId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getProviderServicesWithImages(providerId) {
    const query = `
        SELECT 
            s.id,
            s.name,
            s.description,
            s.duration_minutes,
            s.price,
            s.status,
            s.created_at,
            JSON_ARRAYAGG(
                IF(si.id IS NOT NULL, JSON_OBJECT('id', si.id, 'image_url', si.image_url, 'sort_order', si.sort_order), NULL)
            ) AS images
        FROM services s
        LEFT JOIN service_images si ON si.service_id = s.id
        WHERE s.provider_id = ?
        GROUP BY s.id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at
        ORDER BY s.name ASC
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.map(s => ({
        ...s,
        images: (s.images || []).filter(img => img !== null)
    }));
}

async function getServiceOwnership(serviceId) {
    const query = 'SELECT id, provider_id FROM services WHERE id = ?';
    const [rows] = await pool.execute(query, [serviceId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getServiceByIdAndProvider(serviceId, providerId) {
    const query = 'SELECT id, duration_minutes, price FROM services WHERE id = ? AND provider_id = ?';
    const [rows] = await pool.execute(query, [serviceId, providerId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getActiveServicesForStaff(staffId) {
    const query = `
        SELECT id, name, description, duration_minutes, price, status
        FROM services WHERE provider_id = ? AND status = 'available'
        ORDER BY name ASC
    `;
    const [rows] = await pool.execute(query, [staffId]);
    return rows;
}

async function getSalonHoursByProviderId(providerId) {
    const query = `
        SELECT sal.opening_hours, sal.closing_hours
        FROM salons sal
        JOIN providers p ON p.salon_id = sal.id
        WHERE p.id = ?
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getMinServiceDuration(providerId) {
    const query = `
        SELECT MIN(duration_minutes) as min_duration FROM services
        WHERE provider_id = ? AND status = 'available'
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows[0]?.min_duration || null;
}

async function getScheduledAppointmentCountForService(serviceId) {
    const query = 'SELECT COUNT(*) as count FROM appointments WHERE service_id = ? AND status = "scheduled"';
    const [rows] = await pool.execute(query, [serviceId]);
    return rows[0].count;
}

// ==================== CREATE ====================

async function createService(providerId, { name, description, duration_minutes, price, status }) {
    const query = `
        INSERT INTO services (provider_id, name, description, duration_minutes, price, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [providerId, name, description || null, duration_minutes, price, status || 'available']);
    return result.insertId;
}

// ==================== UPDATE ====================

async function updateService(serviceId, { name, description, duration_minutes, price, status }) {
    const query = `
        UPDATE services 
        SET name = ?, description = ?, duration_minutes = ?, price = ?, status = ?
        WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, description || null, duration_minutes, price, status || 'available', serviceId]);
    return result;
}

// ==================== DELETE ====================

async function deleteService(serviceId) {
    const query = 'DELETE FROM services WHERE id = ?';
    const [result] = await pool.execute(query, [serviceId]);
    return result;
}

// ==================== SERVICE IMAGES ====================

async function getServiceImages(serviceId) {
    const query = 'SELECT id, image_url, sort_order FROM service_images WHERE service_id = ? ORDER BY sort_order ASC, id ASC';
    const [rows] = await pool.execute(query, [serviceId]);
    return rows;
}

async function getServiceImageCount(serviceId) {
    const query = 'SELECT COUNT(*) as count FROM service_images WHERE service_id = ?';
    const [rows] = await pool.execute(query, [serviceId]);
    return rows[0].count;
}

async function createServiceImage(serviceId, imageUrl, sortOrder) {
    const query = 'INSERT INTO service_images (service_id, image_url, sort_order) VALUES (?, ?, ?)';
    const [result] = await pool.execute(query, [serviceId, imageUrl, sortOrder]);
    return result.insertId;
}

async function getServiceImageById(imageId, serviceId) {
    const query = 'SELECT id, image_url FROM service_images WHERE id = ? AND service_id = ?';
    const [rows] = await pool.execute(query, [imageId, serviceId]);
    return rows.length > 0 ? rows[0] : null;
}

async function deleteServiceImage(imageId) {
    const query = 'DELETE FROM service_images WHERE id = ?';
    const [result] = await pool.execute(query, [imageId]);
    return result;
}

module.exports = {
    getServicesByProviderId,
    getServiceById,
    getProviderServicesWithImages,
    getServiceOwnership,
    getServiceByIdAndProvider,
    getActiveServicesForStaff,
    getSalonHoursByProviderId,
    getMinServiceDuration,
    getScheduledAppointmentCountForService,
    createService,
    updateService,
    deleteService,
    getServiceImages,
    getServiceImageCount,
    createServiceImage,
    getServiceImageById,
    deleteServiceImage
};

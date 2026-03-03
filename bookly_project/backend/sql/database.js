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
        SELECT id, name, address, phone, email, type, description, latitude, longitude, status, banner_color, logo_url, banner_image_url, created_at
        FROM salons
        WHERE status != 'closed'
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

async function getSalonById(salonId) {
    const query = `
        SELECT id, name, address, phone, email, type, description, latitude, longitude, status, banner_color, logo_url, banner_image_url, created_at
        FROM salons
        WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.length > 0 ? rows[0] : null;
}

async function getProvidersBySalonId(salonId) {
    const query = `
        SELECT 
            p.id, 
            p.salon_id, 
            p.name, 
            p.email, 
            p.phone, 
            p.description, 
            p.status, 
            p.role, 
            p.isManager, 
            p.created_at,
            p.profile_picture_url,
            COALESCE(AVG(r.provider_rating), 0) as average_rating,
            COUNT(r.id) as rating_count
        FROM providers p
        LEFT JOIN ratings r ON p.id = r.provider_id AND r.active = TRUE
        WHERE p.salon_id = ? AND p.status = 'active'
        GROUP BY p.id
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

async function getServicesBySalonId(salonId) {
    const query = `
        SELECT s.id, s.provider_id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at,
            p.name as provider_name,
            JSON_ARRAYAGG(
                IF(si.id IS NOT NULL, JSON_OBJECT('id', si.id, 'image_url', si.image_url, 'sort_order', si.sort_order), NULL)
            ) AS images
        FROM services s
        INNER JOIN providers p ON s.provider_id = p.id
        LEFT JOIN service_images si ON si.service_id = s.id
        WHERE p.salon_id = ? AND s.status = 'available' AND p.status = 'active'
        GROUP BY s.id, s.provider_id, s.name, s.description, s.duration_minutes, s.price, s.status, s.created_at, p.name
    `;
    const [rows] = await pool.execute(query, [salonId]);
    return rows.map(row => ({ ...row, images: (row.images || []).filter(img => img !== null) }));
}

async function getTopRatedSalons(limit = 10) {
    const limitValue = parseInt(limit) || 10;
    const query = `
        SELECT 
            s.id,
            s.name,
            s.address,
            s.type,
            s.description,
            s.banner_color,
            s.logo_url,
            s.banner_image_url,
            COALESCE(AVG(r.salon_rating), 0) as average_rating,
            COUNT(r.id) as rating_count
        FROM salons s
        LEFT JOIN ratings r ON s.id = r.salon_id AND r.active = TRUE
        WHERE s.status = 'open'
        GROUP BY s.id
        ORDER BY average_rating DESC, rating_count DESC, s.created_at DESC
        LIMIT ${limitValue}
    `;
    const [rows] = await pool.query(query);
    return rows;
}

// Saved salons functions
async function getSavedSalonsByUserId(userId) {
    const query = `
        SELECT s.id, s.name, s.address, s.phone, s.email, s.type, s.description, 
               s.latitude, s.longitude, s.status, s.banner_color, s.logo_url, s.banner_image_url, s.created_at,
               ss.created_at as saved_at,
               COALESCE(AVG(r.salon_rating), 0) as average_rating,
               COUNT(DISTINCT r.id) as rating_count
        FROM saved_salons ss
        INNER JOIN salons s ON ss.salon_id = s.id
        LEFT JOIN ratings r ON s.id = r.salon_id AND r.active = TRUE
        WHERE ss.user_id = ? AND s.status != 'closed'
        GROUP BY s.id, ss.created_at
        ORDER BY ss.created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
}

async function saveSalon(userId, salonId) {
    const query = `
        INSERT INTO saved_salons (user_id, salon_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `;
    const [result] = await pool.execute(query, [userId, salonId]);
    return result;
}

async function unsaveSalon(userId, salonId) {
    const query = `
        DELETE FROM saved_salons
        WHERE user_id = ? AND salon_id = ?
    `;
    const [result] = await pool.execute(query, [userId, salonId]);
    return result;
}

async function isSalonSaved(userId, salonId) {
    const query = `
        SELECT id FROM saved_salons
        WHERE user_id = ? AND salon_id = ?
    `;
    const [rows] = await pool.execute(query, [userId, salonId]);
    return rows.length > 0;
}

async function getSavedSalonIds(userId) {
    const query = `
        SELECT salon_id FROM saved_salons
        WHERE user_id = ?
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => row.salon_id);
}

async function updateSalon(salonId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE salons SET ${setClause} WHERE id = ?`;
    
    const [result] = await pool.execute(query, [...values, salonId]);
    return result;
}

async function getProviderById(providerId) {
    const query = `
        SELECT id, salon_id, name, email, phone, description, status, role, isManager, created_at
        FROM providers
        WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows.length > 0 ? rows[0] : null;
}

// Get user's appointments with full details
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

// Get service by ID with provider and salon info
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

// Get provider's appointments for a specific date
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

// Get salon hours by provider ID
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

// Calculate available time slots for a provider on a given date
async function getAvailableTimeSlots(providerId, date, serviceDurationMinutes) {
    // Get salon hours
    const salonHours = await getSalonHoursByProviderId(providerId);
    if (!salonHours) {
        return [];
    }

    const openingHour = salonHours.opening_hours || 8;
    const closingHour = salonHours.closing_hours || 20;

    // Get existing appointments for the day
    const existingAppointments = await getProviderAppointmentsForDate(providerId, date);

    // Get expanded time blocks for the day
    const timeBlocks = await getExpandedTimeBlocksForDate(providerId, date);

    // Generate all possible 15-minute slots
    const slots = [];
    const slotInterval = 15; // minutes

    // Parse the date
    const dateObj = new Date(date);
    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();

    for (let hour = openingHour; hour < closingHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
            const slotStart = new Date(dateObj);
            slotStart.setHours(hour, minute, 0, 0);

            const slotEnd = new Date(slotStart.getTime() + serviceDurationMinutes * 60000);

            // Skip if slot ends after closing time
            const closingTime = new Date(dateObj);
            closingTime.setHours(closingHour, 0, 0, 0);
            if (slotEnd > closingTime) {
                continue;
            }

            // Skip past times if today
            if (isToday && slotStart <= now) {
                continue;
            }

            // Check for conflicts with existing appointments
            let hasConflict = false;
            for (const apt of existingAppointments) {
                const aptStart = new Date(apt.appointment_start);
                const aptEnd = new Date(apt.appointment_end);

                // Check if the new slot overlaps with existing appointment
                if (slotStart < aptEnd && slotEnd > aptStart) {
                    hasConflict = true;
                    break;
                }
            }

            // Check for conflicts with time blocks
            if (!hasConflict) {
                for (const block of timeBlocks) {
                    const blockStart = new Date(block.start_datetime);
                    const blockEnd = new Date(block.end_datetime);

                    if (slotStart < blockEnd && slotEnd > blockStart) {
                        hasConflict = true;
                        break;
                    }
                }
            }

            if (!hasConflict) {
                // Format time as HH:MM
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeStr);
            }
        }
    }

    return slots;
}

// Get appointment by ID with ownership check
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

// ==================== TIME BLOCKS ====================

// Get provider time blocks for a date range (raw DB rows)
async function getProviderTimeBlocks(providerId, startDate, endDate) {
    const query = `
        SELECT id, provider_id, start_datetime, end_datetime, 
               is_recurring, recurrence_pattern, recurrence_days, 
               recurrence_end_date, notes, created_at
        FROM provider_time_blocks
        WHERE provider_id = ?
        AND (
            (is_recurring = FALSE AND DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?)
            OR is_recurring = TRUE
        )
        ORDER BY start_datetime ASC
    `;
    const [rows] = await pool.execute(query, [providerId, endDate, startDate]);
    return rows;
}

// Expand recurring blocks into individual occurrences for a date range
function expandTimeBlocks(blocks, startDate, endDate) {
    const expanded = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    for (const block of blocks) {
        if (!block.is_recurring) {
            // Non-recurring: include as-is if within range
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            if (blockStart <= end && blockEnd >= start) {
                expanded.push({
                    id: block.id,
                    parent_id: block.id,
                    start_datetime: block.start_datetime,
                    end_datetime: block.end_datetime,
                    is_recurring: false,
                    notes: block.notes,
                });
            }
        } else {
            // Recurring: expand into individual occurrences
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            const timeStartHours = blockStart.getHours();
            const timeStartMinutes = blockStart.getMinutes();
            const timeEndHours = blockEnd.getHours();
            const timeEndMinutes = blockEnd.getMinutes();
            
            const recurrenceEnd = block.recurrence_end_date 
                ? new Date(block.recurrence_end_date) 
                : end;
            recurrenceEnd.setHours(23, 59, 59, 999);
            
            const effectiveEnd = recurrenceEnd < end ? recurrenceEnd : end;
            const effectiveStart = blockStart > start ? new Date(blockStart) : new Date(start);
            effectiveStart.setHours(0, 0, 0, 0);

            let days = [];
            if (block.recurrence_pattern === 'daily') {
                // Every day
                for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
                    days.push(new Date(d));
                }
            } else if (block.recurrence_pattern === 'weekly') {
                // Specific days of week
                const recurrenceDays = typeof block.recurrence_days === 'string' 
                    ? JSON.parse(block.recurrence_days) 
                    : (block.recurrence_days || []);
                for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
                    if (recurrenceDays.includes(d.getDay())) {
                        days.push(new Date(d));
                    }
                }
            }

            for (const day of days) {
                const occStart = new Date(day);
                occStart.setHours(timeStartHours, timeStartMinutes, 0, 0);
                const occEnd = new Date(day);
                occEnd.setHours(timeEndHours, timeEndMinutes, 0, 0);

                expanded.push({
                    id: block.id,
                    parent_id: block.id,
                    start_datetime: occStart,
                    end_datetime: occEnd,
                    is_recurring: true,
                    recurrence_pattern: block.recurrence_pattern,
                    notes: block.notes,
                });
            }
        }
    }

    return expanded;
}

// Get expanded time blocks for a specific date (used in availability check)
async function getExpandedTimeBlocksForDate(providerId, date) {
    const blocks = await getProviderTimeBlocks(providerId, date, date);
    return expandTimeBlocks(blocks, date, date);
}

// Get expanded time blocks for a date range (used in calendar view)
async function getExpandedTimeBlocksForRange(providerId, startDate, endDate) {
    const blocks = await getProviderTimeBlocks(providerId, startDate, endDate);
    return expandTimeBlocks(blocks, startDate, endDate);
}

// Check appointment conflicts for a time range
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

// Check time block overlaps for merging
async function getOverlappingTimeBlocks(providerId, startDatetime, endDatetime, excludeId = null) {
    let query = `
        SELECT id, start_datetime, end_datetime, is_recurring, 
               recurrence_pattern, recurrence_days, recurrence_end_date, notes
        FROM provider_time_blocks
        WHERE provider_id = ? 
        AND is_recurring = FALSE
        AND start_datetime < ? 
        AND end_datetime > ?
    `;
    const params = [providerId, endDatetime, startDatetime];
    
    if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
}

// Create time block (with auto-merge of overlapping non-recurring blocks)
async function createTimeBlock(providerId, blockData) {
    const { start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes } = blockData;
    
    // For non-recurring blocks, check and merge overlaps
    if (!is_recurring) {
        const overlapping = await getOverlappingTimeBlocks(providerId, start_datetime, end_datetime);
        
        if (overlapping.length > 0) {
            // Merge: find the earliest start and latest end among all overlapping blocks
            let mergedStart = new Date(start_datetime);
            let mergedEnd = new Date(end_datetime);
            const idsToDelete = [];
            
            for (const existing of overlapping) {
                const existStart = new Date(existing.start_datetime);
                const existEnd = new Date(existing.end_datetime);
                if (existStart < mergedStart) mergedStart = existStart;
                if (existEnd > mergedEnd) mergedEnd = existEnd;
                idsToDelete.push(existing.id);
            }
            
            // Delete overlapping blocks
            if (idsToDelete.length > 0) {
                await pool.execute(
                    `DELETE FROM provider_time_blocks WHERE id IN (${idsToDelete.map(() => '?').join(',')})`,
                    idsToDelete
                );
            }
            
            // Insert merged block
            const [result] = await pool.execute(
                `INSERT INTO provider_time_blocks (provider_id, start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes)
                 VALUES (?, ?, ?, FALSE, NULL, NULL, NULL, ?)`,
                [providerId, mergedStart, mergedEnd, notes || null]
            );
            return { id: result.insertId, merged: true, mergedCount: idsToDelete.length };
        }
    }
    
    const [result] = await pool.execute(
        `INSERT INTO provider_time_blocks (provider_id, start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            providerId, 
            start_datetime, 
            end_datetime, 
            is_recurring || false, 
            recurrence_pattern || null, 
            recurrence_days ? JSON.stringify(recurrence_days) : null, 
            recurrence_end_date || null, 
            notes || null
        ]
    );
    return { id: result.insertId, merged: false };
}

// Update time block
async function updateTimeBlock(blockId, providerId, updateData) {
    const { start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes } = updateData;
    
    const [result] = await pool.execute(
        `UPDATE provider_time_blocks 
         SET start_datetime = ?, end_datetime = ?, is_recurring = ?, 
             recurrence_pattern = ?, recurrence_days = ?, recurrence_end_date = ?, notes = ?
         WHERE id = ? AND provider_id = ?`,
        [
            start_datetime, end_datetime, is_recurring || false,
            recurrence_pattern || null,
            recurrence_days ? JSON.stringify(recurrence_days) : null,
            recurrence_end_date || null,
            notes || null,
            blockId, providerId
        ]
    );
    return result;
}

// Delete time block
async function deleteTimeBlock(blockId, providerId) {
    const [result] = await pool.execute(
        'DELETE FROM provider_time_blocks WHERE id = ? AND provider_id = ?',
        [blockId, providerId]
    );
    return result;
}

// Get single time block by ID
async function getTimeBlockById(blockId) {
    const query = `
        SELECT id, provider_id, start_datetime, end_datetime, 
               is_recurring, recurrence_pattern, recurrence_days, 
               recurrence_end_date, notes, created_at
        FROM provider_time_blocks
        WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [blockId]);
    return rows.length > 0 ? rows[0] : null;
}

// Get fully booked days for a provider in a date range
async function getFullyBookedDays(providerId, startDate, endDate) {
    // 1. Get salon working hours
    const salonHours = await getSalonHoursByProviderId(providerId);
    const openingHour = salonHours?.opening_hours || 8;
    const closingHour = salonHours?.closing_hours || 20;

    // 2. Get shortest service duration
    const [minResult] = await pool.execute(
        `SELECT MIN(duration_minutes) as min_duration FROM services
         WHERE provider_id = ? AND status = 'available'`,
        [providerId]
    );
    const minDuration = minResult[0]?.min_duration;
    if (!minDuration) return []; // No services → never fully booked

    // 3. Batch-fetch appointments for the range (exclude canceled)
    const [appointments] = await pool.execute(
        `SELECT appointment_start, appointment_end
         FROM appointments
         WHERE provider_id = ?
         AND DATE(appointment_start) BETWEEN ? AND ?
         AND status != 'canceled'
         ORDER BY appointment_start ASC`,
        [providerId, startDate, endDate]
    );

    // 4. Batch-fetch and expand time blocks for the range
    const expandedBlocks = await getExpandedTimeBlocksForRange(providerId, startDate, endDate);

    // 5. Group occupied intervals by date string
    const intervalsByDate = {};

    for (const apt of appointments) {
        const dateKey = new Date(apt.appointment_start).toISOString().split('T')[0];
        if (!intervalsByDate[dateKey]) intervalsByDate[dateKey] = [];
        intervalsByDate[dateKey].push({
            start: new Date(apt.appointment_start),
            end: new Date(apt.appointment_end)
        });
    }

    for (const block of expandedBlocks) {
        const dateKey = new Date(block.start_datetime).toISOString().split('T')[0];
        if (!intervalsByDate[dateKey]) intervalsByDate[dateKey] = [];
        intervalsByDate[dateKey].push({
            start: new Date(block.start_datetime),
            end: new Date(block.end_datetime)
        });
    }

    // 6. For each day in range, compute fully-booked status
    const results = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const dateKey = current.toISOString().split('T')[0];
        const dayOpen = new Date(current);
        dayOpen.setHours(openingHour, 0, 0, 0);
        const dayClose = new Date(current);
        dayClose.setHours(closingHour, 0, 0, 0);

        const intervals = intervalsByDate[dateKey] || [];

        // No occupied intervals → whole day is free
        if (intervals.length === 0) {
            current.setDate(current.getDate() + 1);
            continue; // not fully booked, skip adding to results
        }

        // Clamp intervals to working hours and convert to minutes
        const clamped = [];
        for (const iv of intervals) {
            const s = iv.start < dayOpen ? dayOpen : iv.start;
            const e = iv.end > dayClose ? dayClose : iv.end;
            if (s < e) {
                clamped.push({
                    start: s.getHours() * 60 + s.getMinutes(),
                    end: e.getHours() * 60 + e.getMinutes()
                });
            }
        }

        // Sort by start, then merge overlapping/adjacent
        clamped.sort((a, b) => a.start - b.start);
        const merged = [];
        for (const iv of clamped) {
            if (merged.length === 0 || iv.start > merged[merged.length - 1].end) {
                merged.push({ start: iv.start, end: iv.end });
            } else {
                merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
            }
        }

        // Walk gaps between working hours boundaries and merged blocks
        const openMin = openingHour * 60;
        const closeMin = closingHour * 60;
        let fullyBooked = true;

        // Gap before first block
        if (merged.length === 0 || merged[0].start - openMin >= minDuration) {
            fullyBooked = false;
        }

        // Gaps between blocks
        if (fullyBooked) {
            for (let i = 1; i < merged.length; i++) {
                if (merged[i].start - merged[i - 1].end >= minDuration) {
                    fullyBooked = false;
                    break;
                }
            }
        }

        // Gap after last block
        if (fullyBooked && merged.length > 0 && closeMin - merged[merged.length - 1].end >= minDuration) {
            fullyBooked = false;
        }

        if (fullyBooked) {
            results.push({ date: dateKey, fullyBooked: true });
        }

        current.setDate(current.getDate() + 1);
    }

    return results;
}

// End recurring block from a specific date (for "edit this and future" scenario)
async function endRecurringBlockAt(blockId, providerId, endDate) {
    const [result] = await pool.execute(
        'UPDATE provider_time_blocks SET recurrence_end_date = ? WHERE id = ? AND provider_id = ?',
        [endDate, blockId, providerId]
    );
    return result;
}

// ==================== WAITLIST ====================

async function addToWaitlist(userId, providerId, serviceId, dateFrom, dateTo, timeFrom, timeTo) {
    const [result] = await pool.execute(
        `INSERT INTO waitlist (user_id, provider_id, service_id, preferred_date_from, preferred_date_to, preferred_time_from, preferred_time_to)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, providerId, serviceId, dateFrom, dateTo, timeFrom || null, timeTo || null]
    );
    return result;
}

async function getWaitlistForFreedSlot(providerId, serviceId, freedSlotDate) {
    const query = `
        SELECT w.id, w.user_id, w.preferred_time_from, w.preferred_time_to,
               u.email AS user_email, u.name AS user_name
        FROM waitlist w
        JOIN users u ON w.user_id = u.id
        WHERE w.provider_id = ?
          AND w.service_id = ?
          AND w.status = 'active'
          AND w.preferred_date_from <= ?
          AND w.preferred_date_to >= ?
    `;
    const [rows] = await pool.execute(query, [providerId, serviceId, freedSlotDate, freedSlotDate]);
    return rows;
}

async function getUserWaitlistEntries(userId) {
    const query = `
        SELECT w.id, w.provider_id, w.service_id, w.preferred_date_from, w.preferred_date_to,
               w.preferred_time_from, w.preferred_time_to, w.status, w.created_at,
               p.name AS provider_name, s.name AS service_name, s.duration_minutes,
               sal.name AS salon_name, sal.id AS salon_id
        FROM waitlist w
        JOIN providers p ON w.provider_id = p.id
        JOIN services s ON w.service_id = s.id
        JOIN salons sal ON p.salon_id = sal.id
        WHERE w.user_id = ? AND w.status = 'active'
        ORDER BY w.created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
}

async function cancelWaitlistEntry(waitlistId, userId) {
    const [result] = await pool.execute(
        `UPDATE waitlist SET status = 'canceled' WHERE id = ? AND user_id = ?`,
        [waitlistId, userId]
    );
    return result;
}

async function markWaitlistBooked(waitlistId) {
    const [result] = await pool.execute(
        `UPDATE waitlist SET status = 'booked' WHERE id = ?`,
        [waitlistId]
    );
    return result;
}

async function getRecommendedSalons(userId, lat, lng, limit = 8) {
    const sql = `
        WITH
        user_service_affinity AS (
            SELECT sal.type, COUNT(*) AS booking_count
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            JOIN salons sal ON p.salon_id = sal.id
            WHERE a.user_id = ?
            GROUP BY sal.type
        ),
        collab_users AS (
        SELECT DISTINCT user_id FROM(
            SELECT DISTINCT ss2.user_id
            FROM saved_salons ss1
            JOIN saved_salons ss2 ON ss1.salon_id = ss2.salon_id AND ss2.user_id != ?
            WHERE ss1.user_id = ?
            UNION ALL
            SELECT DISTINCT a2.user_id
            FROM appointments a1
            JOIN appointments a2 ON a1.provider_id = a2.provider_id AND a2.user_id != ?
            WHERE a1.user_id = ? AND DATE(a1.appointment_start) >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ) collab_users_agg
        GROUP BY user_id
        ORDER BY COUNT(*) DESC
        ),
        collab_salons AS (
            SELECT salon_id, COUNT(*) AS collab_score FROM (
                SELECT salon_id FROM saved_salons
                WHERE user_id IN (SELECT user_id FROM collab_users)
                UNION ALL
                SELECT p.salon_id
                FROM appointments a
                JOIN providers p ON a.provider_id = p.id
                WHERE a.user_id IN (SELECT user_id FROM collab_users)
                  AND DATE(a.appointment_start) >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            ) collab_activity
            GROUP BY salon_id
        ),
        salon_popularity AS (
            SELECT salon_id,
                   AVG(salon_rating)                        AS avg_rating,
                   COUNT(*)                                  AS rating_count,
                   AVG(salon_rating) * LOG(COUNT(*) + 1)    AS popularity_score
            FROM ratings
            GROUP BY salon_id
        ),
        recent_visits AS (
            SELECT DISTINCT p.salon_id
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            WHERE a.user_id = ?
              AND DATE(a.appointment_start) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
        SELECT
            s.id,
            s.name,
            s.address,
            s.banner_image_url,
            s.logo_url,
            s.banner_color,
            s.type,
            COALESCE(sp.avg_rating, 0)    AS avg_rating,
            COALESCE(sp.rating_count, 0)  AS rating_count,
            (
                111.045 * DEGREES(ACOS(LEAST(1.0, COS(RADIANS(?))
                  * COS(RADIANS(s.latitude))
                  * COS(RADIANS(s.longitude) - RADIANS(?))
                  + SIN(RADIANS(?)) * SIN(RADIANS(s.latitude)))))
            ) AS distance_km,
            (
                COALESCE(usa.booking_count, 0) * 0.30
              + COALESCE(cs.collab_score,   0) * 0.25
              + COALESCE(sp.popularity_score, 0) * 0.20
              + (CASE WHEN sav.user_id IS NOT NULL THEN 1 ELSE 0 END) * 0.15
              + (1 / (1 + (111.045 * DEGREES(ACOS(LEAST(1.0,
                    COS(RADIANS(?)) * COS(RADIANS(s.latitude))
                    * COS(RADIANS(s.longitude) - RADIANS(?))
                    + SIN(RADIANS(?)) * SIN(RADIANS(s.latitude)))))))) * 0.10
            ) * (CASE WHEN rv.salon_id IS NOT NULL THEN 0.7 ELSE 1.0 END) AS score
        FROM salons s
        LEFT JOIN (
            SELECT s2.id AS salon_id, usa2.booking_count
            FROM salons s2
            JOIN user_service_affinity usa2 ON s2.type = usa2.type
            WHERE s2.type IS NOT NULL
        ) usa ON usa.salon_id = s.id
        LEFT JOIN collab_salons cs ON cs.salon_id = s.id
        LEFT JOIN salon_popularity sp ON sp.salon_id = s.id
        LEFT JOIN saved_salons sav ON sav.salon_id = s.id AND sav.user_id = ?
        LEFT JOIN recent_visits rv ON rv.salon_id = s.id
        WHERE s.latitude IS NOT NULL AND s.status != 'closed'
        ORDER BY score DESC
        LIMIT ?
    `;
    const params = [userId, userId, userId, userId, userId, userId, lat, lng, lat, lat, lng, lat, userId, limit];
    const [rows] = await pool.query(sql, params);
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
    getDistinctSalonTypes,
    getTopRatedSalons,
    getSavedSalonsByUserId,
    saveSalon,
    unsaveSalon,
    isSalonSaved,
    getSavedSalonIds,
    updateSalon,
    getProviderById,
    getUserAppointments,
    getServiceById,
    getProviderAppointmentsForDate,
    getSalonHoursByProviderId,
    getAvailableTimeSlots,
    getAppointmentById,
    // Time blocks
    getProviderTimeBlocks,
    expandTimeBlocks,
    getExpandedTimeBlocksForDate,
    getExpandedTimeBlocksForRange,
    checkAppointmentConflicts,
    getOverlappingTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    getTimeBlockById,
    endRecurringBlockAt,
    getFullyBookedDays,
    // Waitlist
    addToWaitlist,
    getWaitlistForFreedSlot,
    getUserWaitlistEntries,
    cancelWaitlistEntry,
    markWaitlistBooked
    getRecommendedSalons
};

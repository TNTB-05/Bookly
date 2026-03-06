/**
 * Time block SQL queries.
 * Covers: provider time blocks CRUD, recurring expansion, overlap detection, merging.
 */

const pool = require('./pool');

// ==================== READ ====================

// Get time blocks for a provider within a date range (including all recurring)
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

// Get a single time block by ID
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

// Get all active/future time blocks for a provider (raw, not expanded)
async function getRawTimeBlocks(providerId) {
    const query = `
        SELECT id, provider_id, start_datetime, end_datetime, 
               is_recurring, recurrence_pattern, recurrence_days, 
               recurrence_end_date, notes, created_at
        FROM provider_time_blocks
        WHERE provider_id = ?
        AND (
            (is_recurring = 0 AND DATE(CONVERT_TZ(end_datetime, '+00:00', '+01:00')) >= DATE(CONVERT_TZ(NOW(), '+00:00', '+01:00')))
            OR (is_recurring = 1 AND (recurrence_end_date IS NULL OR recurrence_end_date >= DATE(CONVERT_TZ(NOW(), '+00:00', '+01:00'))))
        )
        ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows;
}

// Find non-recurring time blocks that overlap with a given datetime range
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

// ==================== PURE FUNCTIONS (no SQL) ====================

/**
 * Expand recurring blocks into individual occurrences for a date range.
 * This is a pure function (no DB access) — will move to availabilityService in Phase 3.
 */
function expandTimeBlocks(blocks, startDate, endDate) {
    const expanded = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    for (const block of blocks) {
        if (!block.is_recurring) {
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
                for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
                    days.push(new Date(d));
                }
            } else if (block.recurrence_pattern === 'weekly') {
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

// ==================== COMPOSITE READS ====================

// Get expanded (individual occurrences) time blocks for a single date
async function getExpandedTimeBlocksForDate(providerId, date) {
    const blocks = await getProviderTimeBlocks(providerId, date, date);
    return expandTimeBlocks(blocks, date, date);
}

// Get expanded time blocks for a date range
async function getExpandedTimeBlocksForRange(providerId, startDate, endDate) {
    const blocks = await getProviderTimeBlocks(providerId, startDate, endDate);
    return expandTimeBlocks(blocks, startDate, endDate);
}

// ==================== CREATE ====================

// Create a time block, auto-merging with overlapping non-recurring blocks
async function createTimeBlock(providerId, blockData) {
    const { start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes } = blockData;

    // For non-recurring blocks, check and merge overlaps
    if (!is_recurring) {
        const overlapping = await getOverlappingTimeBlocks(providerId, start_datetime, end_datetime);

        if (overlapping.length > 0) {
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

            if (idsToDelete.length > 0) {
                const deleteQuery = `DELETE FROM provider_time_blocks WHERE id IN (${idsToDelete.map(() => '?').join(',')})`;
                await pool.execute(deleteQuery, idsToDelete);
            }

            const insertMergedQuery = `
                INSERT INTO provider_time_blocks (provider_id, start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes)
                VALUES (?, ?, ?, FALSE, NULL, NULL, NULL, ?)
            `;
            const [result] = await pool.execute(insertMergedQuery, [providerId, mergedStart, mergedEnd, notes || null]);
            return { id: result.insertId, merged: true, mergedCount: idsToDelete.length };
        }
    }

    const insertQuery = `
        INSERT INTO provider_time_blocks (provider_id, start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(insertQuery, [
        providerId,
        start_datetime,
        end_datetime,
        is_recurring || false,
        recurrence_pattern || null,
        recurrence_days ? JSON.stringify(recurrence_days) : null,
        recurrence_end_date || null,
        notes || null
    ]);
    return { id: result.insertId, merged: false };
}

// ==================== UPDATE ====================

// Update all fields of an existing time block
async function updateTimeBlock(blockId, providerId, updateData) {
    const { start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes } = updateData;

    const query = `
        UPDATE provider_time_blocks 
        SET start_datetime = ?, end_datetime = ?, is_recurring = ?, 
            recurrence_pattern = ?, recurrence_days = ?, recurrence_end_date = ?, notes = ?
        WHERE id = ? AND provider_id = ?
    `;
    const [result] = await pool.execute(query, [
        start_datetime, end_datetime, is_recurring || false,
        recurrence_pattern || null,
        recurrence_days ? JSON.stringify(recurrence_days) : null,
        recurrence_end_date || null,
        notes || null,
        blockId, providerId
    ]);
    return result;
}

// End a recurring block at a specific date (instead of deleting)
async function endRecurringBlockAt(blockId, providerId, endDate) {
    const query = `
        UPDATE provider_time_blocks SET recurrence_end_date = ? WHERE id = ? AND provider_id = ?
    `;
    const [result] = await pool.execute(query, [endDate, blockId, providerId]);
    return result;
}

// ==================== DELETE ====================

// Delete a time block by ID and provider
async function deleteTimeBlock(blockId, providerId) {
    const query = `
        DELETE FROM provider_time_blocks WHERE id = ? AND provider_id = ?
    `;
    const [result] = await pool.execute(query, [blockId, providerId]);
    return result;
}

module.exports = {
    getProviderTimeBlocks,
    getTimeBlockById,
    getRawTimeBlocks,
    getOverlappingTimeBlocks,
    expandTimeBlocks,
    getExpandedTimeBlocksForDate,
    getExpandedTimeBlocksForRange,
    createTimeBlock,
    updateTimeBlock,
    endRecurringBlockAt,
    deleteTimeBlock
};

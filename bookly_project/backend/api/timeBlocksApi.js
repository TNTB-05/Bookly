const express = require('express');
const router = express.Router();
const { 
    pool, 
    getExpandedTimeBlocksForRange,
    checkAppointmentConflicts,
    createTimeBlock, 
    updateTimeBlock, 
    deleteTimeBlock, 
    getTimeBlockById,
    endRecurringBlockAt
} = require('../sql/database.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');
const { requireRole } = require('./auth/RoleMiddleware.js');

// Middleware to verify provider exists and is active
const verifyProvider = async (req, res, next) => {
    try {
        const providerId = req.user.userId;
        const [providers] = await pool.query(
            'SELECT id, status FROM providers WHERE id = ?',
            [providerId]
        );

        if (providers.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Szolgáltató nem található'
            });
        }

        if (providers[0].status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'A fiók nincs aktív státuszban'
            });
        }

        req.providerId = providerId;
        next();
    } catch (error) {
        console.error('Provider verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Hiba történt a hitelesítés során'
        });
    }
};

// Apply middleware to all routes
router.use(AuthMiddleware, requireRole(['provider']), verifyProvider);

// GET /api/provider/time-blocks - List time blocks (expanded) for date range
router.get('/', async (req, res) => {
    try {
        const providerId = req.providerId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Kezdő és záró dátum megadása kötelező'
            });
        }

        const expanded = await getExpandedTimeBlocksForRange(providerId, startDate, endDate);

        res.status(200).json({
            success: true,
            timeBlocks: expanded
        });
    } catch (error) {
        console.error('Get time blocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt az időblokkok lekérdezésekor'
        });
    }
});

// GET /api/provider/time-blocks/raw - List raw (non-expanded) time blocks
router.get('/raw', async (req, res) => {
    try {
        const providerId = req.providerId;
        const [rows] = await pool.execute(
            `SELECT id, provider_id, start_datetime, end_datetime, 
                    is_recurring, recurrence_pattern, recurrence_days, 
                    recurrence_end_date, notes, created_at
             FROM provider_time_blocks
             WHERE provider_id = ?
             ORDER BY created_at DESC`,
            [providerId]
        );

        res.status(200).json({
            success: true,
            timeBlocks: rows
        });
    } catch (error) {
        console.error('Get raw time blocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt az időblokkok lekérdezésekor'
        });
    }
});

// POST /api/provider/time-blocks - Create new time block
router.post('/', async (req, res) => {
    try {
        const providerId = req.providerId;
        const { start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes } = req.body;

        // Validate required fields
        if (!start_datetime || !end_datetime) {
            return res.status(400).json({
                success: false,
                message: 'Kezdő és záró időpont megadása kötelező'
            });
        }

        const startDt = new Date(start_datetime);
        const endDt = new Date(end_datetime);

        // Validate end is after start
        if (endDt <= startDt) {
            return res.status(400).json({
                success: false,
                message: 'A záró időpontnak a kezdő időpont után kell lennie'
            });
        }

        // Validate not in the past
        const now = new Date();
        if (startDt < now && !is_recurring) {
            return res.status(400).json({
                success: false,
                message: 'Múltbeli időpontra nem lehet időblokkot létrehozni'
            });
        }

        // Validate max 30 days duration for non-recurring blocks
        if (!is_recurring) {
            const diffDays = (endDt - startDt) / (1000 * 60 * 60 * 24);
            if (diffDays > 30) {
                return res.status(400).json({
                    success: false,
                    message: 'Az időblokk maximális időtartama 30 nap'
                });
            }
        }

        // Validate recurring fields
        if (is_recurring) {
            if (!recurrence_pattern || !['daily', 'weekly'].includes(recurrence_pattern)) {
                return res.status(400).json({
                    success: false,
                    message: 'Érvénytelen ismétlődési minta'
                });
            }
            if (recurrence_pattern === 'weekly' && (!recurrence_days || !Array.isArray(recurrence_days) || recurrence_days.length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Heti ismétlődéshez válasszon napokat'
                });
            }
        }

        // Check for appointment conflicts (non-recurring only - for recurring, check first occurrence)
        const conflicts = await checkAppointmentConflicts(providerId, start_datetime, end_datetime);
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Az időblokk ütközik meglévő foglalásokkal',
                conflicts: conflicts.map(c => ({
                    id: c.id,
                    start: c.appointment_start,
                    end: c.appointment_end,
                    user_name: c.user_name,
                    service_name: c.service_name
                }))
            });
        }

        const result = await createTimeBlock(providerId, {
            start_datetime,
            end_datetime,
            is_recurring: is_recurring || false,
            recurrence_pattern: is_recurring ? recurrence_pattern : null,
            recurrence_days: is_recurring && recurrence_pattern === 'weekly' ? recurrence_days : null,
            recurrence_end_date: is_recurring ? recurrence_end_date : null,
            notes
        });

        res.status(201).json({
            success: true,
            message: result.merged 
                ? `Időblokk sikeresen létrehozva (${result.mergedCount} átfedő blokk összevonva)`
                : 'Időblokk sikeresen létrehozva',
            timeBlockId: result.id,
            merged: result.merged
        });
    } catch (error) {
        console.error('Create time block error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt az időblokk létrehozásakor'
        });
    }
});

// PUT /api/provider/time-blocks/:id - Update time block
router.put('/:id', async (req, res) => {
    try {
        const providerId = req.providerId;
        const blockId = parseInt(req.params.id);
        const { start_datetime, end_datetime, is_recurring, recurrence_pattern, recurrence_days, recurrence_end_date, notes, targetInstance } = req.body;

        if (isNaN(blockId)) {
            return res.status(400).json({
                success: false,
                message: 'Érvénytelen időblokk azonosító'
            });
        }

        // Verify ownership
        const block = await getTimeBlockById(blockId);
        if (!block || block.provider_id !== providerId) {
            return res.status(404).json({
                success: false,
                message: 'Időblokk nem található'
            });
        }

        // Validate times
        if (start_datetime && end_datetime) {
            const startDt = new Date(start_datetime);
            const endDt = new Date(end_datetime);
            if (endDt <= startDt) {
                return res.status(400).json({
                    success: false,
                    message: 'A záró időpontnak a kezdő időpont után kell lennie'
                });
            }
        }

        // If editing a single instance of a recurring block
        if (targetInstance === 'single' && block.is_recurring) {
            // End the current recurring series at the day before
            const instanceDate = new Date(start_datetime);
            const dayBefore = new Date(instanceDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            await endRecurringBlockAt(blockId, providerId, dayBefore.toISOString().split('T')[0]);

            // Create a new non-recurring block for this specific instance
            const newBlock = await createTimeBlock(providerId, {
                start_datetime,
                end_datetime,
                is_recurring: false,
                notes
            });

            // Create a new recurring block starting from the day after
            const dayAfter = new Date(instanceDate);
            dayAfter.setDate(dayAfter.getDate() + 1);
            
            const origStart = new Date(block.start_datetime);
            const origEnd = new Date(block.end_datetime);
            const newRecurStart = new Date(dayAfter);
            newRecurStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
            const newRecurEnd = new Date(dayAfter);
            newRecurEnd.setHours(origEnd.getHours(), origEnd.getMinutes(), 0, 0);

            await createTimeBlock(providerId, {
                start_datetime: newRecurStart,
                end_datetime: newRecurEnd,
                is_recurring: true,
                recurrence_pattern: block.recurrence_pattern,
                recurrence_days: typeof block.recurrence_days === 'string' ? JSON.parse(block.recurrence_days) : block.recurrence_days,
                recurrence_end_date: block.recurrence_end_date,
                notes: block.notes
            });

            return res.status(200).json({
                success: true,
                message: 'Időblokk példány sikeresen módosítva'
            });
        }

        // Standard update (all instances for recurring, or single non-recurring)
        // Check appointment conflicts for the new times
        if (start_datetime && end_datetime) {
            const conflicts = await checkAppointmentConflicts(providerId, start_datetime, end_datetime);
            if (conflicts.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Az időblokk ütközik meglévő foglalásokkal',
                    conflicts: conflicts.map(c => ({
                        id: c.id,
                        start: c.appointment_start,
                        end: c.appointment_end,
                        user_name: c.user_name,
                        service_name: c.service_name
                    }))
                });
            }
        }

        await updateTimeBlock(blockId, providerId, {
            start_datetime: start_datetime || block.start_datetime,
            end_datetime: end_datetime || block.end_datetime,
            is_recurring: is_recurring !== undefined ? is_recurring : block.is_recurring,
            recurrence_pattern: recurrence_pattern !== undefined ? recurrence_pattern : block.recurrence_pattern,
            recurrence_days: recurrence_days !== undefined ? recurrence_days : block.recurrence_days,
            recurrence_end_date: recurrence_end_date !== undefined ? recurrence_end_date : block.recurrence_end_date,
            notes: notes !== undefined ? notes : block.notes
        });

        res.status(200).json({
            success: true,
            message: 'Időblokk sikeresen frissítve'
        });
    } catch (error) {
        console.error('Update time block error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt az időblokk frissítésekor'
        });
    }
});

// DELETE /api/provider/time-blocks/:id - Delete time block
router.delete('/:id', async (req, res) => {
    try {
        const providerId = req.providerId;
        const blockId = parseInt(req.params.id);
        const { targetInstance, instanceDate } = req.query;

        if (isNaN(blockId)) {
            return res.status(400).json({
                success: false,
                message: 'Érvénytelen időblokk azonosító'
            });
        }

        // Verify ownership
        const block = await getTimeBlockById(blockId);
        if (!block || block.provider_id !== providerId) {
            return res.status(404).json({
                success: false,
                message: 'Időblokk nem található'
            });
        }

        // If deleting a single instance of a recurring block
        if (targetInstance === 'single' && block.is_recurring && instanceDate) {
            const deleteDate = new Date(instanceDate);
            const dayBefore = new Date(deleteDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            
            // End current series before the deleted date
            await endRecurringBlockAt(blockId, providerId, dayBefore.toISOString().split('T')[0]);

            // Create new recurring block starting after the deleted date
            const dayAfter = new Date(deleteDate);
            dayAfter.setDate(dayAfter.getDate() + 1);
            
            const origStart = new Date(block.start_datetime);
            const origEnd = new Date(block.end_datetime);
            const newStart = new Date(dayAfter);
            newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
            const newEnd = new Date(dayAfter);
            newEnd.setHours(origEnd.getHours(), origEnd.getMinutes(), 0, 0);

            await createTimeBlock(providerId, {
                start_datetime: newStart,
                end_datetime: newEnd,
                is_recurring: true,
                recurrence_pattern: block.recurrence_pattern,
                recurrence_days: typeof block.recurrence_days === 'string' ? JSON.parse(block.recurrence_days) : block.recurrence_days,
                recurrence_end_date: block.recurrence_end_date,
                notes: block.notes
            });

            return res.status(200).json({
                success: true,
                message: 'Időblokk példány sikeresen törölve'
            });
        }

        // Delete entire block (or all future for recurring)
        await deleteTimeBlock(blockId, providerId);

        res.status(200).json({
            success: true,
            message: 'Időblokk sikeresen törölve'
        });
    } catch (error) {
        console.error('Delete time block error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt az időblokk törlésekor'
        });
    }
});

module.exports = router;

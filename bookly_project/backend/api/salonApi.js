const express = require('express');
const router = express.Router();
const { pool } = require('../sql/database.js');
const AuthMiddleware = require('./auth/AuthMiddleware.js');

// Middleware to check if provider is a manager
const isManagerMiddleware = async (req, res, next) => {
    try {
        const providerId = req.user.userId;
        
        const [providers] = await pool.query(
            'SELECT isManager, salon_id FROM providers WHERE id = ?',
            [providerId]
        );

        if (providers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        const provider = providers[0];
        
        if (!provider.isManager) {
            return res.status(403).json({
                success: false,
                message: 'Only managers can perform this action'
            });
        }

        req.salonId = provider.salon_id;
        next();
    } catch (error) {
        console.error('Manager check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// GET /api/salon/my-salon - Get salon details for current provider
router.get('/my-salon', AuthMiddleware, async (req, res) => {
    try {
        const providerId = req.user.userId;

        const [providers] = await pool.query(
            'SELECT salon_id, isManager FROM providers WHERE id = ?',
            [providerId]
        );

        if (providers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        const salonId = providers[0].salon_id;
        const isManager = providers[0].isManager;

        const [salons] = await pool.query(
            `SELECT id, name, address, phone, email, type, opening_hours, closing_hours, 
                    description, latitude, longitude, sharecode, status, created_at
             FROM salons WHERE id = ?`,
            [salonId]
        );

        if (salons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon not found'
            });
        }

        res.status(200).json({
            success: true,
            salon: salons[0],
            provider: {
                isManager: isManager
            }
        });
    } catch (error) {
        console.error('Get salon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// PUT /api/salon/update - Update salon details (managers only)
router.put('/update', AuthMiddleware, isManagerMiddleware, async (req, res) => {
    try {
        const { name, address, phone, email, type, opening_hours, closing_hours, description, latitude, longitude } = req.body;
        const salonId = req.salonId;

        // Validate required fields
        if (!name || !address) {
            return res.status(400).json({
                success: false,
                message: 'Name and address are required'
            });
        }

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (address) {
            updates.push('address = ?');
            values.push(address.trim());
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone ? phone.trim() : null);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email ? email.trim().toLowerCase() : null);
        }
        if (type !== undefined) {
            updates.push('type = ?');
            values.push(type ? type.trim() : null);
        }
        if (opening_hours !== undefined) {
            updates.push('opening_hours = ?');
            values.push(opening_hours);
        }
        if (closing_hours !== undefined) {
            updates.push('closing_hours = ?');
            values.push(closing_hours);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description ? description.trim() : null);
        }
        if (latitude !== undefined) {
            updates.push('latitude = ?');
            values.push(latitude);
        }
        if (longitude !== undefined) {
            updates.push('longitude = ?');
            values.push(longitude);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(salonId);

        const query = `UPDATE salons SET ${updates.join(', ')} WHERE id = ?`;
        
        await pool.query(query, values);

        // Fetch updated salon data
        const [updatedSalon] = await pool.query(
            `SELECT id, name, address, phone, email, type, opening_hours, closing_hours, 
                    description, latitude, longitude, sharecode, status, created_at
             FROM salons WHERE id = ?`,
            [salonId]
        );

        res.status(200).json({
            success: true,
            message: 'Salon updated successfully',
            salon: updatedSalon[0]
        });
    } catch (error) {
        console.error('Update salon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/salon/providers - Get all providers for the salon
router.get('/providers', AuthMiddleware, async (req, res) => {
    try {
        const providerId = req.user.userId;

        const [providers] = await pool.query(
            'SELECT salon_id FROM providers WHERE id = ?',
            [providerId]
        );

        if (providers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        const salonId = providers[0].salon_id;

        const [salonProviders] = await pool.query(
            `SELECT id, name, email, phone, description, status, role, isManager, created_at
             FROM providers
             WHERE salon_id = ?
             ORDER BY isManager DESC, created_at ASC`,
            [salonId]
        );

        res.status(200).json({
            success: true,
            providers: salonProviders
        });
    } catch (error) {
        console.error('Get providers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// PUT /api/salon/provider/:providerId - Update provider details (managers only)
router.put('/provider/:providerId', AuthMiddleware, isManagerMiddleware, async (req, res) => {
    try {
        const targetProviderId = req.params.providerId;
        const salonId = req.salonId;
        const currentProviderId = req.user.userId;
        const { name, phone, description, status, isManager } = req.body;

        // Verify the target provider belongs to the same salon
        const [targetProviders] = await pool.query(
            'SELECT id, salon_id, isManager FROM providers WHERE id = ?',
            [targetProviderId]
        );

        if (targetProviders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        const targetProvider = targetProviders[0];

        if (targetProvider.salon_id !== salonId) {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify providers from another salon'
            });
        }

        // Prevent self-demotion if last manager
        if (currentProviderId == targetProviderId && targetProvider.isManager && isManager === false) {
            const [managerCount] = await pool.query(
                'SELECT COUNT(*) as count FROM providers WHERE salon_id = ? AND isManager = TRUE',
                [salonId]
            );

            if (managerCount[0].count <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot remove manager status - at least one manager required'
                });
            }
        }

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone.trim());
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description ? description.trim() : null);
        }
        if (status !== undefined && ['active', 'inactive', 'deleted', 'banned'].includes(status)) {
            updates.push('status = ?');
            values.push(status);
        }
        if (isManager !== undefined) {
            updates.push('isManager = ?');
            updates.push('role = ?');
            values.push(isManager);
            values.push(isManager ? 'manager' : 'provider');
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(targetProviderId);

        const query = `UPDATE providers SET ${updates.join(', ')} WHERE id = ?`;
        
        await pool.query(query, values);

        // Fetch updated provider data
        const [updatedProvider] = await pool.query(
            `SELECT id, name, email, phone, description, status, role, isManager, created_at
             FROM providers WHERE id = ?`,
            [targetProviderId]
        );

        res.status(200).json({
            success: true,
            message: 'Provider updated successfully',
            provider: updatedProvider[0]
        });
    } catch (error) {
        console.error('Update provider error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// DELETE /api/salon/provider/:providerId - Remove provider from salon (managers only)
router.delete('/provider/:providerId', AuthMiddleware, isManagerMiddleware, async (req, res) => {
    try {
        const targetProviderId = req.params.providerId;
        const salonId = req.salonId;
        const currentProviderId = req.user.userId;

        // Verify the target provider belongs to the same salon
        const [targetProviders] = await pool.query(
            'SELECT id, salon_id, isManager FROM providers WHERE id = ?',
            [targetProviderId]
        );

        if (targetProviders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        const targetProvider = targetProviders[0];

        if (targetProvider.salon_id !== salonId) {
            return res.status(403).json({
                success: false,
                message: 'Cannot remove providers from another salon'
            });
        }

        // Prevent self-deletion if last manager
        if (currentProviderId == targetProviderId && targetProvider.isManager) {
            const [managerCount] = await pool.query(
                'SELECT COUNT(*) as count FROM providers WHERE salon_id = ? AND isManager = TRUE',
                [salonId]
            );

            if (managerCount[0].count <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot remove last manager from salon'
                });
            }
        }

        // Soft delete by setting status to 'deleted'
        await pool.query(
            'UPDATE providers SET status = ? WHERE id = ?',
            ['deleted', targetProviderId]
        );

        res.status(200).json({
            success: true,
            message: 'Provider removed successfully'
        });
    } catch (error) {
        console.error('Delete provider error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// PUT /api/salon/status - Update salon status (managers only)
router.put('/status', AuthMiddleware, isManagerMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const salonId = req.salonId;

        if (!status || !['open', 'closed', 'renovation'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        await pool.query(
            'UPDATE salons SET status = ? WHERE id = ?',
            [status, salonId]
        );

        res.status(200).json({
            success: true,
            message: 'Salon status updated successfully'
        });
    } catch (error) {
        console.error('Update salon status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

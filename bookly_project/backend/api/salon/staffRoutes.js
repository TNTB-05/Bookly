/**
 * Staff management routes for salon API.
 * Covers: GET /providers, PUT /provider/:providerId, DELETE /provider/:providerId.
 * All use AuthMiddleware; manager-only operations use isManagerMiddleware.
 */

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../auth/AuthMiddleware');
const { isManagerMiddleware } = require('../../middleware/providerMiddleware');
const {
    getProviderSalonId,
    getSalonProviders,
    getProviderForUpdate,
    getManagerCount,
    updateProviderDetails,
    getProviderBasicInfo,
    softDeleteProvider
} = require('../../sql/providerQueries');

// GET /providers - Get all providers for the salon
router.get('/providers', AuthMiddleware, async (request, response) => {
    try {
        const providerId = request.user.userId;

        const salonId = await getProviderSalonId(providerId);

        if (!salonId) {
            return response.status(404).json({ success: false, message: 'Szolgáltató nem található' });
        }

        const salonProviders = await getSalonProviders(salonId);

        response.status(200).json({ success: true, providers: salonProviders });
    } catch (error) {
        console.error('Get providers error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// PUT /provider/:providerId - Update provider details (managers only)
router.put('/provider/:providerId', AuthMiddleware, isManagerMiddleware, async (request, response) => {
    try {
        const targetProviderId = request.params.providerId;
        const salonId = request.salonId;
        const currentProviderId = request.user.userId;
        const { name, phone, description, status, isManager } = request.body;

        const targetProvider = await getProviderForUpdate(targetProviderId);

        if (!targetProvider) {
            return response.status(404).json({ success: false, message: 'Szolgáltató nem található' });
        }

        if (targetProvider.salon_id !== salonId) {
            return response.status(403).json({ success: false, message: 'Nem módosíthat másik szalon szolgáltatóját' });
        }

        // Prevent self-demotion if last manager
        if (currentProviderId == targetProviderId && targetProvider.isManager && isManager === false) {
            const managerCount = await getManagerCount(salonId);

            if (managerCount <= 1) {
                return response.status(400).json({ success: false, message: 'Nem távolítható el a menedzser státusz – legalább egy menedzser szükséges' });
            }
        }

        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone.trim()); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description ? description.trim() : null); }
        if (status !== undefined && ['active', 'inactive', 'deleted', 'banned'].includes(status)) {
            updates.push('status = ?'); values.push(status);
        }
        if (isManager !== undefined) {
            updates.push('isManager = ?');
            updates.push('role = ?');
            values.push(isManager);
            values.push(isManager ? 'manager' : 'provider');
        }

        if (updates.length === 0) {
            return response.status(400).json({ success: false, message: 'Nincs frissítendő mező' });
        }

        await updateProviderDetails(targetProviderId, updates, values);

        const updatedProvider = await getProviderBasicInfo(targetProviderId);

        response.status(200).json({ success: true, message: 'Szolgáltató sikeresen frissítve', provider: updatedProvider });
    } catch (error) {
        console.error('Update provider error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

// DELETE /provider/:providerId - Remove provider from salon (managers only)
router.delete('/provider/:providerId', AuthMiddleware, isManagerMiddleware, async (request, response) => {
    try {
        const targetProviderId = request.params.providerId;
        const salonId = request.salonId;
        const currentProviderId = request.user.userId;

        const targetProvider = await getProviderForUpdate(targetProviderId);

        if (!targetProvider) {
            return response.status(404).json({ success: false, message: 'Szolgáltató nem található' });
        }

        if (targetProvider.salon_id !== salonId) {
            return response.status(403).json({ success: false, message: 'Nem távolíthat el szolgáltatót másik szalonból' });
        }

        // Prevent self-deletion if last manager
        if (currentProviderId == targetProviderId && targetProvider.isManager) {
            const managerCount = await getManagerCount(salonId);

            if (managerCount <= 1) {
                return response.status(400).json({ success: false, message: 'Nem távolítható el az utolsó menedzser a szalonból' });
            }
        }

        await softDeleteProvider(targetProviderId);

        response.status(200).json({ success: true, message: 'Szolgáltató sikeresen eltávolítva' });
    } catch (error) {
        console.error('Delete provider error:', error);
        response.status(500).json({ success: false, message: 'Szerverhiba' });
    }
});

module.exports = router;

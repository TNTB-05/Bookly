const express = require('express');
const router = express.Router();
const AuthMiddleware = require('./auth/AuthMiddleware');
const { getUserById } = require('../sql/users');
const { getSavedSalonsByUserId, saveSalon, unsaveSalon, getSavedSalonIds, getProvidersBySalonId } = require('../sql/database');

// Get current user's profile
router.get('/profile', AuthMiddleware, async (req, res) => {
    try {
        // req.user is set by AuthMiddleware from the JWT token
        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return user data WITHOUT password_hash
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                status: user.status,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

// Get user's saved salons
router.get('/saved-salons', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const savedSalons = await getSavedSalonsByUserId(userId);
        
        // Get providers for each salon
        const salonsWithProviders = await Promise.all(
            savedSalons.map(async (salon) => {
                const providers = await getProvidersBySalonId(salon.id);
                return {
                    ...salon,
                    providers
                };
            })
        );
        
        res.status(200).json({
            success: true,
            salons: salonsWithProviders
        });
    } catch (error) {
        console.error('Get saved salons error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching saved salons'
        });
    }
});

// Get user's saved salon IDs (for checking if a salon is saved)
router.get('/saved-salon-ids', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const savedIds = await getSavedSalonIds(userId);
        
        res.status(200).json({
            success: true,
            savedIds
        });
    } catch (error) {
        console.error('Get saved salon IDs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching saved salon IDs'
        });
    }
});

// Save a salon
router.post('/saved-salons/:salonId', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const salonId = parseInt(req.params.salonId);
        
        if (!salonId || isNaN(salonId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid salon ID'
            });
        }
        
        await saveSalon(userId, salonId);
        
        res.status(200).json({
            success: true,
            message: 'Salon saved successfully'
        });
    } catch (error) {
        console.error('Save salon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while saving salon'
        });
    }
});

// Unsave a salon
router.delete('/saved-salons/:salonId', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const salonId = parseInt(req.params.salonId);
        
        if (!salonId || isNaN(salonId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid salon ID'
            });
        }
        
        await unsaveSalon(userId, salonId);
        
        res.status(200).json({
            success: true,
            message: 'Salon removed from saved list'
        });
    } catch (error) {
        console.error('Unsave salon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while removing saved salon'
        });
    }
});

module.exports = router;

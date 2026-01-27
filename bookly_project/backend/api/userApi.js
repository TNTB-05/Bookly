const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const AuthMiddleware = require('./auth/AuthMiddleware');
const { getUserById, updateUserProfile, updateUserPassword, getUserPasswordHash, checkEmailExists } = require('../sql/users');
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

// Update current user's profile
router.put('/profile', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, email, phone, address } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        // Validate name is provided
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        // Validate email is provided
        if (!email || email.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if email is already taken by another user
        const emailExists = await checkEmailExists(email.trim(), userId);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email is already in use by another account'
            });
        }

        // Determine status: if all fields are filled, set to 'active'
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = phone?.trim() || null;
        const trimmedAddress = address?.trim() || null;

        // Check if profile is complete (all fields filled)
        const isProfileComplete = trimmedName && trimmedEmail && trimmedPhone && trimmedAddress;
        const newStatus = isProfileComplete ? 'active' : 'inactive';

        // Update the user profile
        const updated = await updateUserProfile(userId, {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            address: trimmedAddress,
            status: newStatus
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'User not found or update failed'
            });
        }

        // Fetch updated user data
        const user = await getUserById(userId);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
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
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
});

// Change user password
router.put('/password', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        // Validate all fields are provided
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required'
            });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        // Get current password hash
        const currentHash = await getUserPasswordHash(userId);
        if (!currentHash) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, currentHash);
        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const updated = await updateUserPassword(userId, newHashedPassword);
        if (!updated) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update password'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password'
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

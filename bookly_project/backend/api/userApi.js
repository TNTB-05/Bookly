const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const AuthMiddleware = require('./auth/AuthMiddleware');
const { getUserById, updateUserProfile, updateUserPassword, getUserPasswordHash, checkEmailExists, deleteUser, restoreUser, getUserDataForExport, createRating, getRatingByAppointment } = require('../sql/users');
const { 
    getSavedSalonsByUserId, 
    saveSalon, 
    unsaveSalon, 
    getSavedSalonIds, 
    getProvidersBySalonId,
    pool,
    getUserAppointments,
    getServiceById,
    getAvailableTimeSlots,
    getAppointmentById,
    getProviderById,
    getSalonById
} = require('../sql/database');
const { calculateDistance } = require('../services/locationService');

// Utazási idő számítása távolság alapján (percben)
function calculateTravelBuffer(distanceKm) {
    if (distanceKm < 1) return 5;        // < 1 km: 5 perc (gyaloglás)
    if (distanceKm < 5) return 15;       // 1-5 km: 15 perc (rövid utazás)
    if (distanceKm < 15) return 30;      // 5-15 km: 30 perc (városi utazás)
    if (distanceKm < 30) return 45;      // 15-30 km: 45 perc (külvárosi utazás)
    return 60;                            // > 30 km: 60 perc (hosszabb út)
}

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
                created_at: user.created_at,
                deleted_at: user.deleted_at || null
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

        // Check if profile is complete (name, email, and phone required for activation)
        const isProfileComplete = trimmedName && trimmedEmail && trimmedPhone;
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

// --- Rating endpoints ---

// Submit or update a rating
router.post('/ratings', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment } = req.body;

        if (!appointmentId || !salonId || !providerId || !salonRating || !providerRating) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (salonRating < 1 || salonRating > 5 || providerRating < 1 || providerRating > 5) {
            return res.status(400).json({ success: false, message: 'Ratings must be between 1 and 5' });
        }

        // Verify the appointment belongs to this user and is completed
        const appointment = await getAppointmentById(appointmentId);
        if (!appointment || appointment.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Appointment not found or not yours' });
        }
        if (appointment.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Only completed appointments can be rated' });
        }

        await createRating(userId, appointmentId, salonId, providerId, salonRating, providerRating, salonComment, providerComment);

        res.status(200).json({ success: true, message: 'Értékelés mentve!' });
    } catch (error) {
        console.error('Create rating error:', error);
        res.status(500).json({ success: false, message: 'Server error while saving rating' });
    }
});

// Get rating for a specific appointment
router.get('/ratings/appointment/:appointmentId', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const appointmentId = parseInt(req.params.appointmentId);

        const rating = await getRatingByAppointment(appointmentId);

        // Verify rating belongs to this user
        if (rating && rating.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, rating: rating });
    } catch (error) {
        console.error('Get rating error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching rating' });
    }
});

// Export user data
router.get('/export-data', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userData = await getUserDataForExport(userId);
        
        res.status(200).json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting data'
        });
    }
});

// Restore deleted account (within grace period)
router.post('/restore-account', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const restored = await restoreUser(userId);
        if (!restored) {
            return res.status(400).json({
                success: false,
                message: 'Nem lehet visszaállítani a fiókot. A törlési határidő (30 nap) lejárt, vagy a fiók nem törölt állapotban van.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fiók sikeresen visszaállítva. Kérjük, töltsd ki a profilodat.'
        });
    } catch (error) {
        console.error('Restore account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while restoring account'
        });
    }
});

// Delete user account
router.delete('/account', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { password } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        // Validate password is provided
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
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

        // Verify password
        const passwordMatch = await bcrypt.compare(password, currentHash);
        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Cancel all scheduled appointments
        await pool.execute(
            `UPDATE appointments 
             SET status = 'canceled' 
             WHERE user_id = ? AND status = 'scheduled'`,
            [userId]
        );

        // Delete saved salons
        await pool.execute(
            'DELETE FROM saved_salons WHERE user_id = ?',
            [userId]
        );

        // Delete refresh tokens
        await pool.execute(
            'DELETE FROM RefTokens WHERE user_id = ?',
            [userId]
        );

        // Soft delete the user (anonymize data)
        const deleted = await deleteUser(userId);
        if (!deleted) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete account'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting account'
        });
    }
});

// ==================== APPOINTMENT ENDPOINTS ====================

// Helper function to format date to MySQL datetime in local timezone (not UTC)
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Get user's visited salons (from past appointments)
router.get('/visited-salons', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get unique salons from user's appointments
        const query = `
            SELECT 
                sal.id,
                sal.name,
                sal.address,
                sal.type,
                sal.description,
                sal.latitude,
                sal.longitude,
                MAX(a.appointment_start) as last_visit,
                COUNT(DISTINCT a.id) as visit_count,
                (
                    SELECT COALESCE(AVG(r.salon_rating), 0)
                    FROM ratings r
                    WHERE r.salon_id = sal.id AND r.active = TRUE
                ) as average_rating,
                (
                    SELECT COUNT(r.id)
                    FROM ratings r
                    WHERE r.salon_id = sal.id AND r.active = TRUE
                ) as rating_count
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            JOIN salons sal ON p.salon_id = sal.id
            WHERE a.user_id = ? AND a.status IN ('completed', 'scheduled')
            GROUP BY sal.id
            ORDER BY last_visit DESC
        `;
        const [salons] = await pool.execute(query, [userId]);
        
        // Get providers for each salon
        const salonsWithProviders = await Promise.all(
            salons.map(async (salon) => {
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
        console.error('Get visited salons error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt a meglátogatott szalonok lekérdezésekor'
        });
    }
});

// Get user's appointments
router.get('/appointments', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const appointments = await getUserAppointments(userId);
        
        res.status(200).json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt a foglalások lekérdezésekor'
        });
    }
});

// Create new appointment (customer booking)
router.post('/appointments', AuthMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const userId = req.user.userId;
        const { provider_id, service_id, appointment_date, appointment_time, comment } = req.body;

        // Validation
        if (!provider_id || !service_id || !appointment_date || !appointment_time) {
            return res.status(400).json({
                success: false,
                message: 'Szolgáltató, szolgáltatás, dátum és időpont megadása kötelező'
            });
        }

        // Get service details
        const service = await getServiceById(service_id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'A szolgáltatás nem található'
            });
        }

        // Verify service belongs to the specified provider
        if (service.provider_id !== parseInt(provider_id)) {
            return res.status(400).json({
                success: false,
                message: 'A szolgáltatás nem tartozik ehhez a szolgáltatóhoz'
            });
        }

        // Verify provider exists and is active
        const provider = await getProviderById(provider_id);
        if (!provider || provider.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'A szolgáltató nem található vagy nem elérhető'
            });
        }

        // Parse appointment datetime
        const appointmentStart = new Date(`${appointment_date}T${appointment_time}`);
        const appointmentEnd = new Date(appointmentStart.getTime() + service.duration_minutes * 60000);

        // Validate appointment is in the future
        if (appointmentStart <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'A foglalás időpontja nem lehet a múltban'
            });
        }

        // Check if within salon hours
        const openingHour = service.opening_hours || 8;
        const closingHour = service.closing_hours || 20;
        const startHour = appointmentStart.getHours();
        const endHour = appointmentEnd.getHours();
        const endMinute = appointmentEnd.getMinutes();

        if (startHour < openingHour || (endHour > closingHour) || (endHour === closingHour && endMinute > 0)) {
            return res.status(400).json({
                success: false,
                message: 'A foglalás kívül esik a nyitvatartási időn'
            });
        }

        // Start transaction for race condition prevention
        await connection.beginTransaction();

        try {
            // Get the target salon for this appointment
            const targetSalon = await getSalonById(provider.salon_id);

            // Check for user's own conflicting appointments with distance-based buffer
            const [userAppointments] = await connection.query(
                `SELECT a.id, a.appointment_start, a.appointment_end, 
                        sal.id as salon_id, sal.name as salon_name, 
                        sal.latitude, sal.longitude
                 FROM appointments a
                 JOIN providers p ON a.provider_id = p.id
                 JOIN salons sal ON p.salon_id = sal.id
                 WHERE a.user_id = ? 
                 AND a.status = 'scheduled'
                 AND DATE(a.appointment_start) = ?
                 FOR UPDATE`,
                [userId, appointment_date]
            );

            // Check each existing appointment for conflicts with travel buffer
            for (const existingAppt of userAppointments) {
                const existingStart = new Date(existingAppt.appointment_start);
                const existingEnd = new Date(existingAppt.appointment_end);
                
                // Calculate distance between salons
                let bufferMinutes = 0;
                const isSameSalon = existingAppt.salon_id === provider.salon_id;
                
                if (!isSameSalon && targetSalon.latitude && targetSalon.longitude && 
                    existingAppt.latitude && existingAppt.longitude) {
                    // Calculate distance and required travel buffer
                    const distance = calculateDistance(
                        parseFloat(targetSalon.latitude),
                        parseFloat(targetSalon.longitude),
                        parseFloat(existingAppt.latitude),
                        parseFloat(existingAppt.longitude)
                    );
                    bufferMinutes = calculateTravelBuffer(distance);
                } else if (!isSameSalon) {
                    // No coordinates available, use default 30 min buffer for different salons
                    bufferMinutes = 30;
                }
                // Same salon = 0 buffer (back-to-back allowed)

                // Adjust existing appointment times with buffer
                const existingStartWithBuffer = new Date(existingStart.getTime() - bufferMinutes * 60000);
                const existingEndWithBuffer = new Date(existingEnd.getTime() + bufferMinutes * 60000);

                // Check for overlap with buffer
                const hasConflict = (
                    (appointmentStart < existingEndWithBuffer && appointmentEnd > existingStart) ||
                    (appointmentStart < existingEnd && appointmentEnd > existingStartWithBuffer)
                );

                if (hasConflict) {
                    await connection.rollback();
                    
                    let message = `Önnek már van foglalása erre az időpontra (${existingAppt.salon_name}).`;
                    if (bufferMinutes > 0) {
                        message = `A foglalások között ${bufferMinutes} perc utazási idő szükséges (${existingAppt.salon_name}). Kérjük, válasszon másik időpontot.`;
                    }
                    
                    return res.status(409).json({
                        success: false,
                        message
                    });
                }
            }

            // Check for conflicts with row-level locking (provider availability)
            const [conflicts] = await connection.query(
                `SELECT id FROM appointments 
                 WHERE provider_id = ? 
                 AND status = 'scheduled'
                 AND (
                     (appointment_start < ? AND appointment_end > ?)
                     OR (appointment_start < ? AND appointment_end > ?)
                     OR (appointment_start >= ? AND appointment_end <= ?)
                 )
                 FOR UPDATE`,
                [
                    provider_id,
                    formatDateTimeLocal(appointmentEnd),
                    formatDateTimeLocal(appointmentStart),
                    formatDateTimeLocal(appointmentEnd),
                    formatDateTimeLocal(appointmentStart),
                    formatDateTimeLocal(appointmentStart),
                    formatDateTimeLocal(appointmentEnd)
                ]
            );

            if (conflicts.length > 0) {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Ez az időpont már foglalt. Kérjük, válasszon másik időpontot.'
                });
            }

            // Create appointment
            const [result] = await connection.query(
                `INSERT INTO appointments (
                    user_id, provider_id, service_id, 
                    appointment_start, appointment_end, 
                    comment, price, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
                [
                    userId,
                    provider_id,
                    service_id,
                    formatDateTimeLocal(appointmentStart),
                    formatDateTimeLocal(appointmentEnd),
                    comment || null,
                    service.price
                ]
            );

            await connection.commit();

            // Get the created appointment details
            const [newAppointment] = await pool.query(
                `SELECT 
                    a.id, a.appointment_start, a.appointment_end, 
                    a.comment, a.price, a.status, a.created_at,
                    p.name as provider_name,
                    s.name as service_name,
                    sal.name as salon_name
                FROM appointments a
                JOIN providers p ON a.provider_id = p.id
                JOIN services s ON a.service_id = s.id
                JOIN salons sal ON p.salon_id = sal.id
                WHERE a.id = ?`,
                [result.insertId]
            );

            res.status(201).json({
                success: true,
                message: 'Foglalás sikeresen létrehozva',
                appointment: newAppointment[0]
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt a foglalás létrehozásakor'
        });
    } finally {
        connection.release();
    }
});

// Cancel user's appointment
router.delete('/appointments/:id', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const appointmentId = parseInt(req.params.id);

        if (!appointmentId || isNaN(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: 'Érvénytelen foglalás azonosító'
            });
        }

        // Get appointment and verify ownership
        const appointment = await getAppointmentById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'A foglalás nem található'
            });
        }

        if (appointment.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Nincs jogosultságod törölni ezt a foglalást'
            });
        }

        if (appointment.status !== 'scheduled') {
            return res.status(400).json({
                success: false,
                message: 'Csak aktív foglalás mondható le'
            });
        }

        // Update appointment status to canceled
        await pool.query(
            `UPDATE appointments SET status = 'canceled' WHERE id = ?`,
            [appointmentId]
        );

        res.status(200).json({
            success: true,
            message: 'Foglalás sikeresen lemondva'
        });

    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt a foglalás lemondásakor'
        });
    }
});

// Get available time slots for a provider on a specific date
router.get('/provider/:providerId/availability', async (req, res) => {
    try {
        const providerId = parseInt(req.params.providerId);
        const { date, serviceDuration } = req.query;

        if (!providerId || isNaN(providerId)) {
            return res.status(400).json({
                success: false,
                message: 'Érvénytelen szolgáltató azonosító'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Dátum megadása kötelező'
            });
        }

        const duration = parseInt(serviceDuration) || 60; // Default to 60 minutes

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Érvénytelen dátum formátum (YYYY-MM-DD)'
            });
        }

        // Check if date is not in the past
        const requestedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (requestedDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Múltbeli dátumra nem lehet foglalni'
            });
        }

        const slots = await getAvailableTimeSlots(providerId, date, duration);

        res.status(200).json({
            success: true,
            date,
            serviceDuration: duration,
            slots
        });

    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Hiba történt az időpontok lekérdezésekor'
        });
    }
});

module.exports = router;

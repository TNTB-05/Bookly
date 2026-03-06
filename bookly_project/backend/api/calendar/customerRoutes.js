/**
 * Customer routes for provider calendar.
 * Covers: customer stats, customer list (registered + guest), customer detail, reminder emails.
 */

const express = require('express');
const router = express.Router();
const { sendCustomerReminder } = require('../../services/emailService');
const {
    getCustomerStats,
    getRegisteredCustomers,
    getGuestCustomers,
    getRegisteredCustomerDetail,
    getGuestCustomerDetail,
    getReminderCustomerInfo,
    getReminderGuestInfo
} = require('../../sql/appointmentQueries');

// Get customer statistics strip
router.get('/stats', async (request, response) => {
    try {
        const providerId = request.providerId;
        const stats = await getCustomerStats(providerId);

        const totalCustomers = stats.registered + stats.guests;
        const returningCount = stats.returningRegistered + stats.returningGuests;
        const returningRate = totalCustomers > 0 ? Math.round((returningCount / totalCustomers) * 100) : 0;

        response.status(200).json({
            success: true,
            stats: {
                total_customers: totalCustomers,
                returning_rate: returningRate,
                top_services: stats.topServices
            }
        });
    } catch (error) {
        console.error('Get customer stats error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a statisztikák lekérdezésekor' });
    }
});

// Get all customers (registered + guests) for this provider
router.get('/', async (request, response) => {
    try {
        const providerId = request.providerId;
        const search = request.query.search ? `%${request.query.search}%` : null;

        const registeredCustomers = await getRegisteredCustomers(providerId, search);
        const guestCustomers = await getGuestCustomers(providerId, search);

        const customers = [...registeredCustomers, ...guestCustomers].sort(
            (a, b) => new Date(b.last_booking_date) - new Date(a.last_booking_date)
        );

        response.status(200).json({ success: true, customers });
    } catch (error) {
        console.error('Get customers error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt az ügyfelek lekérdezésekor' });
    }
});

// Get full detail for a registered customer
router.get('/registered/:userId', async (request, response) => {
    try {
        const providerId = request.providerId;
        const userId = parseInt(request.params.userId);

        if (isNaN(userId)) {
            return response.status(400).json({ success: false, message: 'Érvénytelen felhasználó azonosító' });
        }

        const detail = await getRegisteredCustomerDetail(providerId, userId);

        if (!detail) {
            return response.status(404).json({ success: false, message: 'Felhasználó nem található' });
        }

        const totalSpent = detail.appointments.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);

        response.status(200).json({
            success: true,
            customer: {
                ...detail.user,
                is_guest: false,
                total_bookings: detail.appointments.length,
                total_spent: totalSpent,
                first_booking_date: detail.appointments.length > 0 ? detail.appointments[detail.appointments.length - 1].appointment_start : null,
                rating: detail.rating,
                appointments: detail.appointments
            }
        });
    } catch (error) {
        console.error('Get registered customer error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt az ügyfél lekérdezésekor' });
    }
});

// Get full detail for a guest customer by email
router.get('/guest', async (request, response) => {
    try {
        const providerId = request.providerId;
        const email = request.query.email;

        if (!email) {
            return response.status(400).json({ success: false, message: 'Email cím megadása kötelező' });
        }

        const appointments = await getGuestCustomerDetail(providerId, email);

        if (appointments.length === 0) {
            return response.status(404).json({ success: false, message: 'Vendég ügyfél nem található' });
        }

        const totalSpent = appointments.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
        const first = appointments[appointments.length - 1];

        response.status(200).json({
            success: true,
            customer: {
                id: null,
                name: first.name,
                email: first.email,
                phone: first.phone,
                profile_picture_url: null,
                is_guest: true,
                total_bookings: appointments.length,
                total_spent: totalSpent,
                first_booking_date: first.appointment_start,
                rating: null,
                appointments
            }
        });
    } catch (error) {
        console.error('Get guest customer error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt a vendég ügyfél lekérdezésekor' });
    }
});

// Send reminder email to a customer
router.post('/remind', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { userId, guestEmail } = request.body;

        if (!userId && !guestEmail) {
            return response.status(400).json({ success: false, message: 'userId vagy guestEmail megadása kötelező' });
        }

        let reminderInfo;

        if (userId) {
            reminderInfo = await getReminderCustomerInfo(providerId, userId);
        } else {
            reminderInfo = await getReminderGuestInfo(providerId, guestEmail);
        }

        if (!reminderInfo) {
            return response.status(404).json({ success: false, message: userId ? 'Ügyfél nem található' : 'Vendég ügyfél nem található' });
        }

        if (!reminderInfo.customerEmail) {
            return response.status(400).json({ success: false, message: 'Az ügyfélnek nincs email címe' });
        }

        await sendCustomerReminder({
            customer_email: reminderInfo.customerEmail,
            customer_name: reminderInfo.customerName,
            salon_name: reminderInfo.salonName
        });

        response.status(200).json({ success: true, message: 'Emlékeztető sikeresen elküldve' });
    } catch (error) {
        console.error('Send reminder error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt az emlékeztető küldésekor' });
    }
});

module.exports = router;

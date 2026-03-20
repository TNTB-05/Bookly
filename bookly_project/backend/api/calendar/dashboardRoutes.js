/**
 * Dashboard routes for provider calendar.
 * Covers: /statistics, /working-hours, /fully-booked-days
 */

const express = require('express');
const router = express.Router();
const { getSalonHoursByProviderId } = require('../../sql/serviceQueries');
const { getFullyBookedDays } = require('../../services/availabilityService');
const { getDashboardStatistics } = require('../../sql/appointmentQueries');

// Get dashboard statistics
router.get('/statistics', async (request, response) => {
    try {
        const providerId = request.providerId;
        const statistics = await getDashboardStatistics(providerId);

        response.status(200).json({
            success: true,
            statistics
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt az adatok lekérdezésekor'
        });
    }
});

// Get working hours for provider's salon
router.get('/working-hours', async (request, response) => {
    try {
        const providerId = request.providerId;
        const salonHours = await getSalonHoursByProviderId(providerId);

        if (!salonHours) {
            return response.status(404).json({
                success: false,
                message: 'Szalon nem található'
            });
        }

        response.status(200).json({
            success: true,
            openingHour: salonHours.opening_hours || 8,
            closingHour: salonHours.closing_hours || 20
        });
    } catch (error) {
        console.error('Get working hours error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a nyitvatartás lekérdezésekor'
        });
    }
});

// Get fully booked days for a date range
router.get('/fully-booked-days', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { startDate, endDate } = request.query;

        if (!startDate || !endDate) {
            return response.status(400).json({
                success: false,
                message: 'startDate és endDate megadása kötelező'
            });
        }

        const fullyBookedDays = await getFullyBookedDays(providerId, startDate, endDate);

        response.status(200).json({
            success: true,
            fullyBookedDays
        });
    } catch (error) {
        console.error('Get fully booked days error:', error);
        response.status(500).json({
            success: false,
            message: 'Hiba történt a teltház napok lekérdezésekor'
        });
    }
});

module.exports = router;

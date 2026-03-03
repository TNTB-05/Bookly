/**
 * Admin statistics routes.
 * Covers: GET /statistics.
 */

const express = require('express');
const router = express.Router();
const { getDashboardStatistics, getMonthlyRevenue } = require('../../sql/adminQueries');
const { getTopRatedSalons } = require('../../sql/salonQueries');

router.get('/statistics', async (req, res) => {
    try {
        const {
            usersResult, providersResult, salonsResult,
            appointmentsThisMonthResult, totalAppointmentsResult, revenueResult,
            newUsersResult, newProvidersResult, recentAppointmentsResult, appointmentsByStatusResult,
        } = await getDashboardStatistics();

        let topSalons = [];
        try { topSalons = await getTopRatedSalons(5); } catch (e) { /* continue */ }

        let monthlyRevenueResult = [];
        try { monthlyRevenueResult = await getMonthlyRevenue(); } catch (e) { /* continue */ }

        const statusBreakdown = {};
        appointmentsByStatusResult.forEach(row => { statusBreakdown[row.status] = row.count; });

        return res.json({
            success: true,
            stats: {
                totalUsers: usersResult[0].count,
                totalProviders: providersResult[0].count,
                totalSalons: salonsResult[0].count,
                appointmentsThisMonth: appointmentsThisMonthResult[0].count,
                totalAppointments: totalAppointmentsResult[0].count,
                totalRevenue: revenueResult[0].total,
                newRegistrations: { users: newUsersResult[0].count, providers: newProvidersResult[0].count },
                appointmentsByStatus: statusBreakdown,
                monthlyRevenue: monthlyRevenueResult
            },
            recentAppointments: recentAppointmentsResult,
            topSalons
        });
    } catch (error) {
        console.error('[Admin Stats] ERROR:', error);
        return res.status(500).json({ success: false, message: 'Hiba a statisztikák lekérése során' });
    }
});

module.exports = router;

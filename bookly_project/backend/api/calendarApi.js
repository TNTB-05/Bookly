/**
 * Calendar API – thin router that mounts feature sub-routers.
 * All routes are prefixed with /api/provider/calendar in server.js.
 *
 * Shared middleware (auth + provider verification) is applied once here
 * so individual sub-routers don't need to repeat it.
 */

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('./auth/AuthMiddleware');
const { requireRole } = require('./auth/RoleMiddleware');
const { verifyProvider } = require('../middleware/providerMiddleware');

// Sub-routers
const dashboardRoutes = require('./calendar/dashboardRoutes');
const appointmentRoutes = require('./calendar/appointmentRoutes');
const serviceRoutes = require('./calendar/serviceRoutes');
const customerRoutes = require('./calendar/customerRoutes');

// Apply middleware to all routes: Auth -> Role check -> Provider verification
router.use(AuthMiddleware, requireRole(['provider']), verifyProvider);

// Mount sub-routers
router.use('/', dashboardRoutes);              // /statistics, /working-hours, /fully-booked-days
router.use('/appointments', appointmentRoutes); // CRUD appointments
router.use('/services', serviceRoutes);         // CRUD services + images
router.use('/customers', customerRoutes);       // customer list, detail, stats, remind

module.exports = router;

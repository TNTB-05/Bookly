/**
 * User API – thin router that mounts feature sub-routers.
 * All routes are prefixed with /api/user in server.js.
 *
 * No shared middleware here — each sub-router applies AuthMiddleware per-route
 * because some endpoints (e.g. availability) are public.
 */

const express = require('express');
const router = express.Router();

// Sub-routers
const profileRoutes = require('./user/profileRoutes');
const salonRoutes = require('./user/salonRoutes');
const ratingRoutes = require('./user/ratingRoutes');
const appointmentRoutes = require('./user/appointmentRoutes');

// Mount sub-routers
router.use('/', profileRoutes);       // /profile, /password, /profile/picture, /restore-account, /account
router.use('/', salonRoutes);         // /saved-salons, /saved-salon-ids, /visited-salons
router.use('/', ratingRoutes);        // /ratings, /ratings/appointment/:id
router.use('/', appointmentRoutes);   // /appointments, /provider/:id/availability

module.exports = router;

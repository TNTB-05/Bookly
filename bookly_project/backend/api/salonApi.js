/**
 * Salon API – thin router that mounts feature sub-routers.
 * All routes are prefixed with /api/salon in server.js.
 */

const express = require('express');
const router = express.Router();

const settingsRoutes = require('./salon/settingsRoutes');
const staffRoutes = require('./salon/staffRoutes');
const providerProfileRoutes = require('./salon/providerProfileRoutes');

router.use('/', settingsRoutes);        // /my-salon, /update, /status, /branding, /branding/remove-banner
router.use('/', staffRoutes);           // /providers, /provider/:id
router.use('/', providerProfileRoutes); // /me, /me/picture, /me/password

module.exports = router;

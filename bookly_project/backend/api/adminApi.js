/**
 * Admin API – thin router that mounts feature sub-routers.
 * All routes are prefixed with /api/admin in server.js.
 *
 * Shared admin auth middleware applied once here.
 */

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('./auth/AuthMiddleware');
const { requireRole } = require('./auth/RoleMiddleware');

const statisticsRoutes = require('./admin/statisticsRoutes');
const usersRoutes = require('./admin/usersRoutes');
const providersRoutes = require('./admin/providersRoutes');
const salonsRoutes = require('./admin/salonsRoutes');
const dataRoutes = require('./admin/dataRoutes');

// All admin routes require authentication + admin role
router.use(AuthMiddleware, requireRole(['admin']));

router.use('/', statisticsRoutes);  // /statistics
router.use('/', usersRoutes);       // /users, /users/:id, /users/:id/ban|unban|gdpr-delete|picture
router.use('/', providersRoutes);   // /providers, /providers/:id, /providers/:id/deactivate|activate|ban|unban|picture
router.use('/', salonsRoutes);      // /salons, /salons/:id, /salons/:id/banner|logo|description|status
router.use('/', dataRoutes);        // /ratings, /appointments, /logs

module.exports = router;

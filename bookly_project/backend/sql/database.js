/**
 * DEPRECATED SHIM — database.js
 * 
 * This file re-exports from the new domain-specific query files
 * for backward compatibility during migration.
 * 
 * ⚠️  Do NOT add new queries here. Place them in the appropriate
 *     domain file under sql/*.
 * 
 * After all API files are refactored to import from domain files directly,
 * this shim can be deleted.
 */

const pool = require('./pool');

// Domain query re-exports
const salonQueries = require('./salonQueries');
const providerQueries = require('./providerQueries');
const serviceQueries = require('./serviceQueries');
const appointmentQueries = require('./appointmentQueries');
const userQueries = require('./userQueries');
const ratingQueries = require('./ratingQueries');
const savedSalonQueries = require('./savedSalonQueries');
const timeBlockQueries = require('./timeBlockQueries');
const waitlistQueries = require('./waitlistQueries');
const searchQueries = require('./searchQueries');

// Business logic re-exports
const availabilityService = require('../services/availabilityService');

module.exports = {
    pool,

    // Salon queries
    getAllSalons: salonQueries.getAllSalons,
    getSalonById: salonQueries.getSalonById,
    getDistinctSalonTypes: salonQueries.getDistinctSalonTypes,
    getTopRatedSalons: salonQueries.getTopRatedSalons,
    getServicesBySalonId: salonQueries.getServicesBySalonId,
    updateSalon: salonQueries.updateSalon,

    // Provider queries
    getProvidersBySalonId: providerQueries.getProvidersBySalonId,
    getProviderById: providerQueries.getProviderById,

    // Service queries
    getServicesByProviderId: serviceQueries.getServicesByProviderId,
    getServiceById: serviceQueries.getServiceById,
    getSalonHoursByProviderId: serviceQueries.getSalonHoursByProviderId,

    // Appointment queries
    getUserAppointments: appointmentQueries.getUserAppointments,
    getAppointmentById: appointmentQueries.getAppointmentById,
    getProviderAppointmentsForDate: appointmentQueries.getProviderAppointmentsForDate,

    // Saved salon queries
    getSavedSalonsByUserId: savedSalonQueries.getSavedSalonsByUserId,
    saveSalon: savedSalonQueries.saveSalon,
    unsaveSalon: savedSalonQueries.unsaveSalon,
    isSalonSaved: savedSalonQueries.isSalonSaved,
    getSavedSalonIds: savedSalonQueries.getSavedSalonIds,

    // Time block queries
    getProviderTimeBlocks: timeBlockQueries.getProviderTimeBlocks,
    expandTimeBlocks: timeBlockQueries.expandTimeBlocks,
    getExpandedTimeBlocksForDate: timeBlockQueries.getExpandedTimeBlocksForDate,
    getExpandedTimeBlocksForRange: timeBlockQueries.getExpandedTimeBlocksForRange,
    checkAppointmentConflicts: appointmentQueries.checkAppointmentConflicts,
    getOverlappingTimeBlocks: timeBlockQueries.getOverlappingTimeBlocks,
    createTimeBlock: timeBlockQueries.createTimeBlock,
    updateTimeBlock: timeBlockQueries.updateTimeBlock,
    deleteTimeBlock: timeBlockQueries.deleteTimeBlock,
    getTimeBlockById: timeBlockQueries.getTimeBlockById,
    endRecurringBlockAt: timeBlockQueries.endRecurringBlockAt,

    // Availability (business logic)
    getAvailableTimeSlots: availabilityService.getAvailableTimeSlots,
    getFullyBookedDays: availabilityService.getFullyBookedDays,

    // Waitlist queries
    addToWaitlist: waitlistQueries.addToWaitlist,
    getWaitlistForFreedSlot: waitlistQueries.getWaitlistForFreedSlot,
    getUserWaitlistEntries: waitlistQueries.getUserWaitlistEntries,
    cancelWaitlistEntry: waitlistQueries.cancelWaitlistEntry,
    markWaitlistBooked: waitlistQueries.markWaitlistBooked,

    // Search queries
    getRecommendedSalons: searchQueries.getRecommendedSalons,
};

const { completeAllExpiredAppointments } = require('../sql/appointmentQueries.js');
const { logEvent } = require('./logService.js');

// Interval in milliseconds (5 minutes)
const EXPIRATION_CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * Auto-complete appointments whose appointment_end has passed
 * while the status is still 'scheduled'.
 *
 * This runs as a background heartbeat — no external scheduler needed.
 */
async function runExpirationCheck() {
    try {
        const result = await completeAllExpiredAppointments();

        if (result.affectedRows > 0) {
            console.log(`[ExpirationService] Auto-completed ${result.affectedRows} past-due appointment(s)`);
            await logEvent(
                'INFO',
                'APPOINTMENTS_AUTO_COMPLETED',
                'system',
                null,
                null,
                null,
                `Auto-completed ${result.affectedRows} appointment(s) that passed their end time`
            );
        }
    } catch (err) {
        console.error('[ExpirationService] Error during expiration check:', err.message);
    }
}

/**
 * Start the periodic expiration check.
 * Call once after the database connection is established.
 */
function startExpirationJob() {
    // Run immediately on startup
    runExpirationCheck();

    // Then run every EXPIRATION_CHECK_INTERVAL ms
    const intervalId = setInterval(runExpirationCheck, EXPIRATION_CHECK_INTERVAL);

    console.log(`[ExpirationService] Heartbeat started (every ${EXPIRATION_CHECK_INTERVAL / 1000}s)`);

    return intervalId;
}

module.exports = { startExpirationJob, runExpirationCheck };

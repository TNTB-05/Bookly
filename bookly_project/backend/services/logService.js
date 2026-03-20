const { insertLogEvent } = require('../sql/adminQueries.js');

/**
 * Log a system event to the system_logs table
 * @param {'INFO'|'WARN'|'CRITICAL'} level - Severity level
 * @param {string} action - Action identifier (e.g., 'USER_LOGIN', 'USER_BAN')
 * @param {'admin'|'user'|'provider'|'system'} actorType - Who performed the action
 * @param {number|null} actorId - ID of the actor
 * @param {string|null} targetType - Type of the target (e.g., 'user', 'provider', 'salon')
 * @param {number|null} targetId - ID of the target
 * @param {string|null} details - Additional details
 */
async function logEvent(level, action, actorType, actorId, targetType = null, targetId = null, details = null) {
    try {
        await insertLogEvent(level, action, actorType, actorId, targetType, targetId, details);
    } catch (err) {
        console.error('[LogService] Failed to log event:', err.message);
    }
}

module.exports = { logEvent };

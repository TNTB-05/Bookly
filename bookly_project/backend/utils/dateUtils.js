/**
 * Shared date utility functions.
 * Consolidates duplicated date formatting logic from calendarApi, staffApi, and userApi.
 */

/**
 * Format a Date as 'YYYY-MM-DD HH:MM:SS' in local time (no UTC conversion).
 * Used for MySQL datetime inserts.
 * @param {Date} date
 * @returns {string}
 */
function formatLocalDatetime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * Format a Date as 'YYYY-MM-DD' in local time.
 * @param {Date} date
 * @returns {string}
 */
function formatLocalDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

module.exports = {
    formatLocalDatetime,
    formatLocalDate
};

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

/**
 * Format an ISO datetime string to Hungarian locale display.
 * E.g. "2026. februar 23. 14:30"
 * @param {string} isoString
 * @returns {string}
 */
function formatHungarianDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('hu-HU', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

module.exports = {
    formatLocalDatetime,
    formatLocalDate,
    formatHungarianDateTime
};

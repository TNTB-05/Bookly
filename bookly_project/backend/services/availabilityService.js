/**
 * Availability Service.
 * Business logic for calculating available time slots & fully-booked days.
 * Extracted from database.js — these are NOT pure SQL, they combine queries + computation.
 */

const { getProviderAppointmentsForDate, getAppointmentsBatchForRange } = require('../sql/appointmentQueries');
const { getExpandedTimeBlocksForDate, getExpandedTimeBlocksForRange } = require('../sql/timeBlockQueries');
const { getSalonHoursByProviderId, getMinServiceDuration } = require('../sql/serviceQueries');

/**
 * Calculate available time slots for a provider on a given date.
 */
async function getAvailableTimeSlots(providerId, date, serviceDurationMinutes) {
    const salonHours = await getSalonHoursByProviderId(providerId);
    if (!salonHours) {
        return [];
    }

    const openingHour = salonHours.opening_hours || 8;
    const closingHour = salonHours.closing_hours || 20;

    const existingAppointments = await getProviderAppointmentsForDate(providerId, date);
    const timeBlocks = await getExpandedTimeBlocksForDate(providerId, date);

    const slots = [];
    const slotInterval = 15; // minutes

    const dateObj = new Date(date);
    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();

    for (let hour = openingHour; hour < closingHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
            const slotStart = new Date(dateObj);
            slotStart.setHours(hour, minute, 0, 0);

            const slotEnd = new Date(slotStart.getTime() + serviceDurationMinutes * 60000);

            // Skip if slot ends after closing time
            const closingTime = new Date(dateObj);
            closingTime.setHours(closingHour, 0, 0, 0);
            if (slotEnd > closingTime) {
                continue;
            }

            // Skip past times if today
            if (isToday && slotStart <= now) {
                continue;
            }

            // Check for conflicts with existing appointments
            let hasConflict = false;
            for (const apt of existingAppointments) {
                const aptStart = new Date(apt.appointment_start);
                const aptEnd = new Date(apt.appointment_end);

                if (slotStart < aptEnd && slotEnd > aptStart) {
                    hasConflict = true;
                    break;
                }
            }

            // Check for conflicts with time blocks
            if (!hasConflict) {
                for (const block of timeBlocks) {
                    const blockStart = new Date(block.start_datetime);
                    const blockEnd = new Date(block.end_datetime);

                    if (slotStart < blockEnd && slotEnd > blockStart) {
                        hasConflict = true;
                        break;
                    }
                }
            }

            if (!hasConflict) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeStr);
            }
        }
    }

    return slots;
}

/**
 * Get fully booked days for a provider in a date range.
 */
async function getFullyBookedDays(providerId, startDate, endDate) {
    // 1. Get salon working hours
    const salonHours = await getSalonHoursByProviderId(providerId);
    const openingHour = salonHours?.opening_hours || 8;
    const closingHour = salonHours?.closing_hours || 20;

    // 2. Get shortest service duration
    const minDuration = await getMinServiceDuration(providerId);
    if (!minDuration) return []; // No services → never fully booked

    // 3. Batch-fetch appointments for the range (exclude canceled)
    const appointments = await getAppointmentsBatchForRange(providerId, startDate, endDate);

    // 4. Batch-fetch and expand time blocks for the range
    const expandedBlocks = await getExpandedTimeBlocksForRange(providerId, startDate, endDate);

    // 5. Group occupied intervals by date string
    const intervalsByDate = {};

    for (const apt of appointments) {
        const dateKey = new Date(apt.appointment_start).toISOString().split('T')[0];
        if (!intervalsByDate[dateKey]) intervalsByDate[dateKey] = [];
        intervalsByDate[dateKey].push({
            start: new Date(apt.appointment_start),
            end: new Date(apt.appointment_end)
        });
    }

    for (const block of expandedBlocks) {
        const dateKey = new Date(block.start_datetime).toISOString().split('T')[0];
        if (!intervalsByDate[dateKey]) intervalsByDate[dateKey] = [];
        intervalsByDate[dateKey].push({
            start: new Date(block.start_datetime),
            end: new Date(block.end_datetime)
        });
    }

    // 6. For each day in range, compute fully-booked status
    const results = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const dateKey = current.toISOString().split('T')[0];
        const dayOpen = new Date(current);
        dayOpen.setHours(openingHour, 0, 0, 0);
        const dayClose = new Date(current);
        dayClose.setHours(closingHour, 0, 0, 0);

        const intervals = intervalsByDate[dateKey] || [];

        // No occupied intervals → whole day is free
        if (intervals.length === 0) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        // Clamp intervals to working hours and convert to minutes
        const clamped = [];
        for (const iv of intervals) {
            const s = iv.start < dayOpen ? dayOpen : iv.start;
            const e = iv.end > dayClose ? dayClose : iv.end;
            if (s < e) {
                clamped.push({
                    start: s.getHours() * 60 + s.getMinutes(),
                    end: e.getHours() * 60 + e.getMinutes()
                });
            }
        }

        // Sort by start, then merge overlapping/adjacent
        clamped.sort((a, b) => a.start - b.start);
        const merged = [];
        for (const iv of clamped) {
            if (merged.length === 0 || iv.start > merged[merged.length - 1].end) {
                merged.push({ start: iv.start, end: iv.end });
            } else {
                merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
            }
        }

        // Walk gaps between working hours boundaries and merged blocks
        const openMin = openingHour * 60;
        const closeMin = closingHour * 60;
        let fullyBooked = true;

        // Gap before first block
        if (merged.length === 0 || merged[0].start - openMin >= minDuration) {
            fullyBooked = false;
        }

        // Gaps between blocks
        if (fullyBooked) {
            for (let i = 1; i < merged.length; i++) {
                if (merged[i].start - merged[i - 1].end >= minDuration) {
                    fullyBooked = false;
                    break;
                }
            }
        }

        // Gap after last block
        if (fullyBooked && merged.length > 0 && closeMin - merged[merged.length - 1].end >= minDuration) {
            fullyBooked = false;
        }

        if (fullyBooked) {
            results.push({ date: dateKey, fullyBooked: true });
        }

        current.setDate(current.getDate() + 1);
    }

    return results;
}

module.exports = {
    getAvailableTimeSlots,
    getFullyBookedDays
};

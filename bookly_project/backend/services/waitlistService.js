const { getWaitlistForFreedSlot } = require('../sql/waitlistQueries.js');
const { sendWaitlistNotification } = require('./emailService.js');

async function notifyWaitlistForCancelledSlot(providerId, serviceId, slotStart, salonName, serviceName, providerName) {
    const freedDate = new Date(slotStart).toISOString().split('T')[0]; // YYYY-MM-DD
    const waitlisted = await getWaitlistForFreedSlot(providerId, serviceId, freedDate);
    for (const entry of waitlisted) {
        sendWaitlistNotification({
            user_email: entry.user_email,
            user_name: entry.user_name,
            salon_name: salonName,
            service_name: serviceName,
            provider_name: providerName,
            freed_slot_date: freedDate
        }).catch(err => console.error('Waitlist email error:', err));
    }
}

module.exports = { notifyWaitlistForCancelledSlot };

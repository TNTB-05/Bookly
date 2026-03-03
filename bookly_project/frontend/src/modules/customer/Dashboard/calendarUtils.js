const pad = (n) => String(n).padStart(2, '0');

function formatDateToICS(dateInput) {
    const date = typeof dateInput === 'string' ? new Date(dateInput.replace(' ', 'T')) : dateInput;
    return (
        `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    );
}

export function generateCalendarLinks(appointment) {
    const start = formatDateToICS(appointment.appointment_start);
    const end   = formatDateToICS(appointment.appointment_end);
    const title    = `${appointment.service_name} – ${appointment.salon_name}`;
    const location = appointment.salon_address || appointment.salon_name;
    const details  = `Szolgáltató: ${appointment.provider_name}\nÁr: ${Number(appointment.price).toLocaleString()} Ft`;

    const googleParams = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${start}/${end}`, details, location });
    const googleUrl = `https://calendar.google.com/calendar/render?${googleParams}`;

    const now = new Date();
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bookly//Bookly App//HU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:bookly-${appointment.id}@bookly.app`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${title}`,
        `DESCRIPTION:${details.replace(/\n/g,'\\n')}`, `LOCATION:${location}`,
        'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');

    return { googleUrl, icsContent };
}

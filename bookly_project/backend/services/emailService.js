const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('hu-HU', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

async function sendAppointmentConfirmation(appointment) {
    const { customer_email, customer_name, salon_name, service_name, provider_name, appointment_start, appointment_end, price } = appointment;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #4f46e5; padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Foglalás visszaigazolása</h1>
            </div>
            <div style="padding: 32px 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Kedves <strong>${customer_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Foglalásod sikeresen rögzítettük. Az alábbiakban találod az időpont részleteit:
                </p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px; width: 40%;">Szalon</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${salon_name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Szolgáltatás</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${service_name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Szakember</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${provider_name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Időpont kezdete</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatDateTime(appointment_start)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Időpont vége</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatDateTime(appointment_end)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Ár</td>
                        <td style="padding: 12px 0; color: #4f46e5; font-size: 16px; font-weight: 700;">${price} Ft</td>
                    </tr>
                </table>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    Ha kérdésed van, keresd fel közvetlenül a szalont. Köszönjük, hogy a Bookly-t választottad!
                </p>
            </div>
            <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Bookly — Automatikus értesítő, erre a címre ne válaszolj.</p>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: customer_email,
        subject: `Foglalás visszaigazolva — ${salon_name}`,
        html
    });
}

module.exports = { sendAppointmentConfirmation };

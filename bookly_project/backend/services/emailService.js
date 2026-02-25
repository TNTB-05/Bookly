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

async function sendWelcomeEmail(user) {
    const { email, name, role } = user;

    const isProvider = role === 'provider';
    const headerTitle = isProvider ? 'Üdvözlünk a Bookly-n!' : 'Üdvözlünk a Bookly-n!';
    const welcomeText = isProvider
        ? 'Sikeresen regisztráltál a Bookly szalonkezelő felületén. Most már kezelheted salonod naptárát, szabad időpontjait, és könnyedén kezelni tudod az előjegyzéseket.'
        : 'Sikeresen regisztráltál a Bookly-n. Most már böngérezheted a közeli szalonokat, foglalhatsz időpontot, és értékeléseket adhatsz a szolgáltatások után.';
    const nextStepsTitle = isProvider ? 'Következő lépések' : 'Hogyan kezdj el?';
    const nextStepsText = isProvider
        ? 'Lépj be a szalonkezelő felületre, add meg salonod adatait, és kezdd el kezelni az előjegyzéseket.'
        : 'Nyisd meg a Bookly alkalmazást, keress egy szalont a térképen, és foglalj egy szolgáltatást neked megfelelő időpontban.';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #4f46e5; padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${headerTitle}</h1>
            </div>
            <div style="padding: 32px 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Kedves <strong>${name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.5;">
                    ${welcomeText}
                </p>
                <div style="background: #f3f4f6; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
                    <p style="font-size: 14px; color: #111827; margin: 0 0 12px; font-weight: 600;">
                        ${nextStepsTitle}
                    </p>
                    <p style="font-size: 14px; color: #374151; margin: 0; line-height: 1.6;">
                        ${nextStepsText}
                    </p>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    Ha kérdésed van, vagy segítségre van szükséged, keress minket az ügyfélszolgálaton. Örülünk, hogy csatlakoztál hozzánk!
                </p>
            </div>
            <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Bookly — Automatikus értesítő, erre a címre ne válaszolj.</p>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Üdvözlünk a Bookly-n!',
        html
    });
}

async function sendAppointmentModification(appointment) {
    const { customer_email, customer_name, salon_name, service_name, provider_name, appointment_start, appointment_end, price } = appointment;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #4f46e5; padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Foglalásod módosítva</h1>
            </div>
            <div style="padding: 32px 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Kedves <strong>${customer_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Foglalásod sikeresen módosítottuk. Az alábbiakban találod a frissített részleteket:
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
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Új időpont kezdete</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatDateTime(appointment_start)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Új időpont vége</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatDateTime(appointment_end)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Ár</td>
                        <td style="padding: 12px 0; color: #4f46e5; font-size: 16px; font-weight: 700;">${price} Ft</td>
                    </tr>
                </table>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    Kérjük, add tudtul, ha további módosítások szükségesek. Ha kérdésed van, keresd fel közvetlenül a szalont.
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
        subject: `Foglalásod módosítva — ${salon_name}`,
        html
    });
}

async function sendAppointmentCancellation(appointment) {
    const { customer_email, customer_name, salon_name, service_name, appointment_start } = appointment;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #4f46e5; padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Foglalásod lemondva</h1>
            </div>
            <div style="padding: 32px 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Kedves <strong>${customer_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Foglalásod sikeresen lemondtuk. Az alábbiakban találod a lemondott időpont részleteit:
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
                    <tr>
                        <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Lemondott időpont</td>
                        <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatDateTime(appointment_start)}</td>
                    </tr>
                </table>
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                        Szeretnél újra foglalni?
                    </p>
                    <p style="margin: 8px 0 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                        A szalon továbbra is elérhető. Nyisd meg a Bookly alkalmazást, és foglalj egy új időpontot kedvedre.
                    </p>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    Ha kérdésed van, keresd fel közvetlenül a szalont.
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
        subject: `Foglalásod lemondva — ${salon_name}`,
        html
    });
}

async function sendPasswordChangeConfirmation(user) {
    const { email, name } = user;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #4f46e5; padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Jelszó megváltoztatva</h1>
            </div>
            <div style="padding: 32px 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Kedves <strong>${name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Jelszavad sikeresen megváltoztatva lett. Ezzel az új jelszóval tudod majd használni a Bookly fiókod.
                </p>
                <div style="background: #f3f4f6; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
                    <p style="font-size: 14px; color: #111827; margin: 0 0 12px; font-weight: 600;">
                        Biztonsági tanács
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                        <li style="margin-bottom: 8px;">Használj erős, egyedi jelszót</li>
                        <li style="margin-bottom: 8px;">Ne oszd meg a jelszót senkivel</li>
                        <li>Rendszeresen változtasd meg jelszavad</li>
                    </ul>
                </div>
                <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                        Nem te módosítottad a jelszót?
                    </p>
                    <p style="margin: 8px 0 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                        Ha nem te módosítottad a jelszót, azonnal jelezd a támogatásnál. Fiókod biztonsága fontos számunkra.
                    </p>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    Ha további segítségre van szükséged, keress minket az ügyfélszolgálaton.
                </p>
            </div>
            <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 Bookly — Automatikus értesítő, erre a címre ne válaszolj.</p>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Jelszó megváltoztatva',
        html
    });
}

async function sendCustomerReminder({ customer_email, customer_name, salon_name }) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #4f46e5; padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Hiányozol! 👋</h1>
            </div>
            <div style="padding: 32px 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Kedves <strong>${customer_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                    Már egy ideje nem jártál nálunk a <strong>${salon_name}</strong>-ban, és hiányozol!
                    Szeretnénk újra látni — foglalj időpontot, és gondoskodunk rólad.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">
                        Nyisd meg a Bookly alkalmazást, keresd meg a szalont, és foglalj egy időpontot neked megfelelő időpontban.
                    </p>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                    Várunk szeretettel!<br/>
                    <strong>${salon_name}</strong> csapata
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
        subject: `Hiányozol a ${salon_name}-tól!`,
        html
    });
}

module.exports = {
    sendAppointmentConfirmation,
    sendWelcomeEmail,
    sendAppointmentModification,
    sendAppointmentCancellation,
    sendPasswordChangeConfirmation,
    sendCustomerReminder
};

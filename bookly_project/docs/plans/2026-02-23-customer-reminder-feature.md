# Customer Reminder Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add at-risk customer detection (45-day threshold) with a "send reminder" email action on both the customer list row and detail drawer.

**Architecture:** New `sendCustomerReminder()` in `emailService.js` → new `POST /customers/remind` route in `calendarApi.js` → `CustomersSection` handles the API call and passes `onRemind` down to `CustomerListItem` and `CustomerDetailDrawer`.

**Tech Stack:** Express 5, mysql2, nodemailer (existing), React 19, Tailwind CSS 4, `useNotification` hook for toasts.

---

### Task 1: Add `sendCustomerReminder()` to emailService.js

**Files:**
- Modify: `backend/services/emailService.js`

**Step 1: Add the function before `module.exports`**

Add this function to `backend/services/emailService.js` before the `module.exports` block:

```javascript
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
```

**Step 2: Export the new function**

Change the `module.exports` block to include `sendCustomerReminder`:

```javascript
module.exports = {
    sendAppointmentConfirmation,
    sendWelcomeEmail,
    sendAppointmentModification,
    sendAppointmentCancellation,
    sendPasswordChangeConfirmation,
    sendCustomerReminder
};
```

---

### Task 2: Add `POST /customers/remind` route to calendarApi.js

**Files:**
- Modify: `backend/api/calendarApi.js`

**Step 1: Import `sendCustomerReminder` at the top of the file**

The existing import on line 6 is:
```javascript
const { sendAppointmentCancellation } = require('../services/emailService.js');
```

Change it to:
```javascript
const { sendAppointmentCancellation, sendCustomerReminder } = require('../services/emailService.js');
```

**Step 2: Add the route before `module.exports = router`**

```javascript
// Send reminder email to a customer
router.post('/customers/remind', async (request, response) => {
    try {
        const providerId = request.providerId;
        const { userId, guestEmail } = request.body;

        if (!userId && !guestEmail) {
            return response.status(400).json({ success: false, message: 'userId vagy guestEmail megadása kötelező' });
        }

        // Get salon name for the email
        const [salonResult] = await pool.query(
            `SELECT s.name FROM salons s JOIN providers p ON p.salon_id = s.id WHERE p.id = ?`,
            [providerId]
        );

        if (salonResult.length === 0) {
            return response.status(404).json({ success: false, message: 'Szalon nem található' });
        }

        const salonName = salonResult[0].name;
        let customerEmail, customerName;

        if (userId) {
            // Registered user — verify they have a booking with this provider
            const [users] = await pool.query(
                `SELECT u.name, u.email FROM users u
                 INNER JOIN appointments a ON a.user_id = u.id
                 WHERE u.id = ? AND a.provider_id = ? LIMIT 1`,
                [userId, providerId]
            );
            if (users.length === 0) {
                return response.status(404).json({ success: false, message: 'Ügyfél nem található' });
            }
            customerEmail = users[0].email;
            customerName = users[0].name;
        } else {
            // Guest — verify they have a booking with this provider
            const [guests] = await pool.query(
                `SELECT guest_name, guest_email FROM appointments
                 WHERE guest_email = ? AND provider_id = ? AND user_id IS NULL LIMIT 1`,
                [guestEmail, providerId]
            );
            if (guests.length === 0) {
                return response.status(404).json({ success: false, message: 'Vendég ügyfél nem található' });
            }
            customerEmail = guests[0].guest_email;
            customerName = guests[0].guest_name;
        }

        if (!customerEmail) {
            return response.status(400).json({ success: false, message: 'Az ügyfélnek nincs email címe' });
        }

        await sendCustomerReminder({ customer_email: customerEmail, customer_name: customerName, salon_name: salonName });

        response.status(200).json({ success: true, message: 'Emlékeztető sikeresen elküldve' });
    } catch (error) {
        console.error('Send reminder error:', error);
        response.status(500).json({ success: false, message: 'Hiba történt az emlékeztető küldésekor' });
    }
});
```

---

### Task 3: Add `handleRemind` to CustomersSection and pass it down

**Files:**
- Modify: `frontend/src/modules/Provider/provdashcomponents/CustomersSection/CustomersSection.jsx`

**Step 1: Import `useNotification`**

Add to the imports at the top:
```javascript
import { useNotification } from '../../../../components/NotificationContext';
```

**Step 2: Add `handleRemind` inside the `CustomersSection` component**

Add after the `fetchData` function:

```javascript
const { showToast } = useNotification();

const handleRemind = async (customer) => {
    try {
        const body = customer.is_guest
            ? { guestEmail: customer.email }
            : { userId: customer.id };

        const res = await authApi.post('/api/provider/calendar/customers/remind', body);
        const data = await res.json();

        if (data.success) {
            showToast('Emlékeztető sikeresen elküldve');
        } else {
            showToast(data.message || 'Hiba történt az emlékeztető küldésekor');
        }
    } catch {
        showToast('Hiba történt az emlékeztető küldésekor');
    }
};
```

**Step 3: Pass `onRemind` to `CustomerListItem` and `CustomerDetailDrawer`**

Change:
```jsx
<CustomerListItem
    key={customer.id ? `reg-${customer.id}` : `guest-${customer.email}-${index}`}
    customer={customer}
    onClick={() => setSelectedCustomer(customer)}
/>
```
To:
```jsx
<CustomerListItem
    key={customer.id ? `reg-${customer.id}` : `guest-${customer.email}-${index}`}
    customer={customer}
    onClick={() => setSelectedCustomer(customer)}
    onRemind={handleRemind}
/>
```

Change:
```jsx
<CustomerDetailDrawer
    customer={selectedCustomer}
    onClose={() => setSelectedCustomer(null)}
/>
```
To:
```jsx
<CustomerDetailDrawer
    customer={selectedCustomer}
    onClose={() => setSelectedCustomer(null)}
    onRemind={handleRemind}
/>
```

---

### Task 4: Update `CustomerListItem` — at-risk badge + quick action button

**Files:**
- Modify: `frontend/src/modules/Provider/provdashcomponents/CustomersSection/CustomerListItem.jsx`

**Step 1: Add at-risk helper and update the component signature**

Add this helper at the top of the file (after the existing helpers):
```javascript
const AT_RISK_DAYS = 45;

const getDaysSince = (dateStr) => {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};
```

**Step 2: Update the component to accept `onRemind` and use at-risk logic**

Replace the full component with:

```jsx
const CustomerListItem = ({ customer, onClick, onRemind }) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [reminding, setReminding] = useState(false);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Budapest' }) : '–';
    const formatPrice = (p) => new Intl.NumberFormat('hu-HU').format(p) + ' Ft';

    const daysSince = getDaysSince(customer.last_booking_date);
    const isAtRisk = daysSince !== null && daysSince >= AT_RISK_DAYS;

    const handleRemindClick = async (e) => {
        e.stopPropagation();
        setReminding(true);
        await onRemind(customer);
        setReminding(false);
    };

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 bg-white/40 backdrop-blur-md rounded-xl border border-white/50 hover:bg-white/60 hover:shadow-md transition-all text-left"
        >
            {/* Avatar */}
            <div className="shrink-0">
                {customer.profile_picture_url ? (
                    <img src={`${apiUrl}${customer.profile_picture_url}`} alt={customer.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/50 shadow" />
                ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(customer.name)} flex items-center justify-center text-white font-bold text-sm shadow`}>
                        {getInitials(customer.name)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 truncate">{customer.name || 'Ismeretlen'}</span>
                    {customer.is_guest ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Vendég</span>
                    ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Regisztrált</span>
                    )}
                    {isAtRisk && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            {daysSince} napja nem járt
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">{customer.email}</p>
            </div>

            {/* Stats + remind button */}
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-semibold text-dark-blue">{formatPrice(customer.total_spent)}</span>
                <span className="text-xs text-gray-500">{customer.total_bookings} foglalás</span>
                <span className="text-xs text-gray-400">Utoljára: {formatDate(customer.last_booking_date)}</span>
                {isAtRisk && customer.email && (
                    <button
                        onClick={handleRemindClick}
                        disabled={reminding}
                        className="mt-1 flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-700 border border-orange-200 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {reminding ? (
                            <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        )}
                        Emlékeztető
                    </button>
                )}
            </div>
        </button>
    );
};
```

**Step 3: Add `useState` import**

The file currently has no imports. Add at the top:
```javascript
import { useState } from 'react';
```

---

### Task 5: Add reminder button to `CustomerDetailDrawer`

**Files:**
- Modify: `frontend/src/modules/Provider/provdashcomponents/CustomersSection/CustomerDetailDrawer.jsx`

**Step 1: Update the component signature to accept `onRemind`**

Change:
```javascript
const CustomerDetailDrawer = ({ customer, onClose }) => {
```
To:
```javascript
const CustomerDetailDrawer = ({ customer, onClose, onRemind }) => {
```

**Step 2: Add `reminding` state**

Add after the existing `const [loading, setLoading] = useState(false);` line:
```javascript
const [reminding, setReminding] = useState(false);
```

**Step 3: Add `handleRemind` handler inside the component**

Add after the format helpers:
```javascript
const handleRemind = async () => {
    setReminding(true);
    await onRemind(customer);
    setReminding(false);
};
```

**Step 4: Add the button below the profile summary section**

After the closing `</div>` of the profile header block (the `flex items-center gap-4` div), add:

```jsx
{/* Reminder button */}
{detail && (
    <button
        onClick={handleRemind}
        disabled={reminding || !detail.email}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={!detail.email ? 'Nincs email cím' : undefined}
    >
        {reminding ? (
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
        )}
        Emlékeztető küldése
    </button>
)}
```

Note: place this between the profile header block and the summary stats grid, so the button is immediately visible without scrolling.

---

### Task 6: Verify everything works

**Step 1: Start the backend**
```bash
cd /Users/tokaji-nagybence/Documents/GitHub/Bookly/bookly_project/backend
npm run dev
```

**Step 2: Start the frontend**
```bash
cd /Users/tokaji-nagybence/Documents/GitHub/Bookly/bookly_project/frontend
npm run dev
```

**Step 3: Manual checklist**
- [ ] Log in as a provider with existing bookings
- [ ] Go to Ügyfelek tab
- [ ] Customers with last booking 45+ days ago show the orange "X napja nem járt" badge
- [ ] At-risk rows show the "Emlékeztető" button
- [ ] Clicking "Emlékeztető" shows a spinner then a toast (success or email error)
- [ ] Clicking a customer opens the drawer
- [ ] "Emlékeztető küldése" button is visible in the drawer for all customers
- [ ] Button is disabled for customers without email
- [ ] Button shows spinner while sending
- [ ] Toast appears on success/failure

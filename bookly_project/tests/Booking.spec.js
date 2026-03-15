import { test, expect } from './fixtures/authFixture.js';
import { navigateToBookingConfirmation, navigateToBookingDateStep } from './helpers/booking.js';

test.describe('Booking flow', () => {

  // ─── Happy path ─────────────────────────────────────────────────────────────

  test('successful booking', async ({ loggedInPage: page }) => {
    test.setTimeout(120_000);

    const ready = await navigateToBookingConfirmation(page);
    if (!ready) {
      await page.screenshot({ path: 'screenshots/booking/01-success-no-slots.png' });
      test.skip(true, 'No available time slots found across multiple months');
      return;
    }

    await page.screenshot({ path: 'screenshots/booking/01-success-confirmation.png' });

    await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();
    await expect(page.getByText('Sikeres foglalás!')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/02-success-booked.png' });

    // Verify in appointments tab
    await page.getByRole('button', { name: 'Foglalásaim megtekintése' }).click();
    await expect(page).toHaveURL(/tab=appointments/);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/03-success-appointments-tab.png' });
  });

  // ─── Negative: already reserved slot ────────────────────────────────────────

  test('user cannot book an already reserved appointment slot', async ({ loggedInPage: page }) => {
    test.setTimeout(120_000);

    const ready = await navigateToBookingConfirmation(page);
    if (!ready) {
      test.skip(true, 'No available time slots found across multiple months');
      return;
    }

    // Intercept the booking POST to simulate a 409 (slot already taken)
    await page.route('**/api/user/appointments', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Ez az időpont már foglalt. Kérjük, válasszon másik időpontot.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.screenshot({ path: 'screenshots/booking/04-reserved-before-finalize.png' });

    await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();

    // Verify error toast appears
    await expect(page.getByText('Ez az időpont már foglalt')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/booking/05-reserved-error-toast.png' });

    // Verify user is sent back to date/time selection (not success screen)
    await expect(page.getByRole('heading', { name: 'Válasszon időpontot' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sikeres foglalás!')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/06-reserved-back-to-datetime.png' });
  });

  // ─── Negative: overlapping appointments ─────────────────────────────────────

  test('user cannot create overlapping appointments', async ({ loggedInPage: page }) => {
    test.setTimeout(120_000);

    const ready = await navigateToBookingConfirmation(page);
    if (!ready) {
      test.skip(true, 'No available time slots found across multiple months');
      return;
    }

    // Intercept the booking POST to simulate a 409 (user has overlapping appointment)
    await page.route('**/api/user/appointments', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Ebben az időpontban már egy másik szalonban van foglalása (10:00-11:00), Test Salon. Kérjük válasszon másik időpontot.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.screenshot({ path: 'screenshots/booking/07-overlap-before-finalize.png' });

    await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();

    // Verify overlap error toast appears
    await expect(page.getByText('Ebben az időpontban már egy másik szalonban van foglalása')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/booking/08-overlap-error-toast.png' });

    // Verify user is sent back to date/time selection
    await expect(page.getByRole('heading', { name: 'Válasszon időpontot' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sikeres foglalás!')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/09-overlap-back-to-datetime.png' });
  });

  // ─── Edge case: past dates disabled ─────────────────────────────────────────

  test('past dates are disabled in the booking calendar', async ({ loggedInPage: page }) => {
    test.setTimeout(60_000);

    await navigateToBookingDateStep(page);
    await page.screenshot({ path: 'screenshots/booking/10-past-dates-calendar.png' });

    // Verify past days have the disabled class
    const disabledDays = page.locator('.react-datepicker__day--disabled');
    const disabledCount = await disabledDays.count();
    expect(disabledCount).toBeGreaterThan(0);

    // Click a disabled (past) day and verify no availability API call fires
    let availabilityRequested = false;
    page.on('request', (req) => {
      if (req.url().includes('/availability')) {
        availabilityRequested = true;
      }
    });

    await disabledDays.first().click({ force: true });
    await page.waitForTimeout(1000);

    expect(availabilityRequested).toBe(false);
    await page.screenshot({ path: 'screenshots/booking/11-past-dates-click-blocked.png' });
  });

  // ─── Edge case: rapid double-click ──────────────────────────────────────────

  test('rapid double-click on finalize does not create duplicate bookings', async ({ loggedInPage: page }) => {
    test.setTimeout(120_000);

    const ready = await navigateToBookingConfirmation(page);
    if (!ready) {
      test.skip(true, 'No available time slots found across multiple months');
      return;
    }

    // Count POST requests to the booking endpoint
    let bookingPostCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/user/appointments') && req.method() === 'POST') {
        bookingPostCount++;
      }
    });

    await page.screenshot({ path: 'screenshots/booking/12-dblclick-before.png' });

    // Rapidly click the finalize button twice
    const finalizeBtn = page.getByRole('button', { name: 'Foglalás véglegesítése' });
    await finalizeBtn.dblclick();

    // Wait for the booking result (success or error)
    await Promise.race([
      page.getByText('Sikeres foglalás!').waitFor({ state: 'visible', timeout: 15000 }),
      page.getByText('Ez az időpont már foglalt').waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/13-dblclick-after.png' });

    // Only one POST request should have been sent
    expect(bookingPostCount).toBe(1);
  });
});

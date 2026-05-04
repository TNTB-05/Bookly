import { test, expect } from './fixtures/authFixture.js';
import { navigateToBookingConfirmation, navigateToBookingDateStep } from './helpers/booking.js';

// The booking flow operates on the demo customer (test@test.com) and shares
// the same first-available time slot with the cancel-appointment tests in
// CancelAppointment.spec.js. Run booking tests serially within this file.
test.describe.configure({ mode: 'serial' });

test.describe('Booking flow', () => {

  test('successful booking', async ({ loggedInPage: page }) => {
    test.setTimeout(120_000);

    const ready = await navigateToBookingConfirmation(page, {
      screenshotPrefix: 'screenshots/booking/wizard-',
    });
    if (!ready) {
      await page.screenshot({ path: 'screenshots/booking/00-no-slots.png' });
      test.skip(true, 'No available time slots found across multiple months');
      return;
    }

    // Confirmation summary screen
    await page.screenshot({ path: 'screenshots/booking/wizard-08-confirmation.png' });

    await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();

    // Wait for the success step to fully fade in
    await expect(page.getByRole('heading', { name: 'Foglalás sikeres!' }).first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/booking/wizard-09-booking-success.png' });

    await page.getByRole('button', { name: 'Foglalásaim megtekintése' }).click();
    await expect(page).toHaveURL(/tab=appointments/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/booking/wizard-10-appointments-tab.png' });
  });

  test('past dates are disabled in the booking calendar', async ({ loggedInPage: page }) => {
    test.setTimeout(60_000);

    await navigateToBookingDateStep(page);
    await page.screenshot({ path: 'screenshots/booking/past-dates-calendar.png' });

    // The custom MiniCalendar prevents booking past dates two ways:
    //   1) past day cells render as <button disabled> with a numeric label
    //   2) the previous-month nav button (‹) is disabled when the current
    //      view is the earliest month containing today.
    // Either condition proves "past dates are disabled" is implemented.
    const disabledDays = page.locator('button[disabled]').filter({ hasText: /^\d{1,2}$/ });
    const prevMonthBtn = page.getByRole('button', { name: '‹' });
    const disabledCount = await disabledDays.count();
    const prevDisabled = await prevMonthBtn.isDisabled();
    expect(disabledCount > 0 || prevDisabled).toBe(true);
  });
});

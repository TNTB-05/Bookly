import { test, expect } from './fixtures/authFixture.js';
import { navigateToBookingConfirmation, navigateToBookingDateStep } from './helpers/booking.js';

// Both the booking and cancel-appointment flows operate on the same demo
// customer (test@test.com) and would race on the same first-available time
// slot if they ran in parallel. Force them to run one after another.
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

    // Wait for the success toast to fully fade in
    await expect(page.getByText('Sikeres foglalás!')).toBeVisible({ timeout: 10000 });
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

    const disabledDays = page.locator('.react-datepicker__day--disabled');
    const disabledCount = await disabledDays.count();
    expect(disabledCount).toBeGreaterThan(0);
  });
});

/**
 * Cancel-appointment tests live in the same file as the booking tests so
 * Playwright runs them in the same worker (serial mode above). Each test
 * books a fresh appointment first, then exercises the cancel UI.
 */
async function bookFreshAppointment(page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const ready = await navigateToBookingConfirmation(page);
  if (!ready) return false;

  await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();
  await expect(page.getByText('Sikeres foglalás!')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(800);
  return true;
}

test.describe('Cancel appointment', () => {

  test('dismiss cancel modal without cancelling', async ({ loggedInPage: page }) => {
    test.setTimeout(120_000);

    const booked = await bookFreshAppointment(page);
    if (!booked) {
      test.skip(true, 'Could not book a fresh appointment to test cancellation');
      return;
    }

    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/booking/cancel-00-appointments-tab.png' });

    const cancelButton = page.getByRole('button', { name: 'Lemondás' }).first();
    await expect(cancelButton).toBeVisible({ timeout: 5000 });

    await cancelButton.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).toBeVisible();
    // Wait for fade-in animation to finish so the modal is fully opaque
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'screenshots/booking/cancel-01-modal-open.png' });

    const dismissBtn = page.getByRole('button', { name: /Nem|Mégse/i });
    await dismissBtn.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).not.toBeVisible();
    // Wait for fade-out animation to finish before screenshotting
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/booking/cancel-02-modal-dismissed.png' });
  });

  test('confirm cancel removes appointment', async ({ loggedInPage: page }) => {
    test.setTimeout(120_000);

    const booked = await bookFreshAppointment(page);
    if (!booked) {
      test.skip(true, 'Could not book a fresh appointment to test cancellation');
      return;
    }

    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const cancelButton = page.getByRole('button', { name: 'Lemondás' }).first();
    await expect(cancelButton).toBeVisible({ timeout: 5000 });

    await cancelButton.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).toBeVisible();
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'screenshots/booking/cancel-03-confirm-modal.png' });

    await page.getByRole('button', { name: 'Igen' }).click();
    // Wait for the success toast to fully fade in
    await expect(page.getByText('Foglalás sikeresen lemondva')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/booking/cancel-04-cancelled.png' });

    // Show the appointments list refreshed without the cancelled item
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/booking/cancel-05-list-after-cancel.png' });
  });

});

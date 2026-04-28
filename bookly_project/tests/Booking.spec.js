import { test, expect } from './fixtures/authFixture.js';
import { navigateToBookingConfirmation, navigateToBookingDateStep } from './helpers/booking.js';

test.describe('Booking flow', () => {

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

    await page.getByRole('button', { name: 'Foglalásaim megtekintése' }).click();
    await expect(page).toHaveURL(/tab=appointments/);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/03-success-appointments-tab.png' });
  });

  test('past dates are disabled in the booking calendar', async ({ loggedInPage: page }) => {
    test.setTimeout(60_000);

    await navigateToBookingDateStep(page);
    await page.screenshot({ path: 'screenshots/booking/04-past-dates-calendar.png' });

    const disabledDays = page.locator('.react-datepicker__day--disabled');
    const disabledCount = await disabledDays.count();
    expect(disabledCount).toBeGreaterThan(0);
  });
});

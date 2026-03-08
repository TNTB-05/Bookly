import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Booking flow', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('user can book an appointment through full flow', async ({ page }) => {
    // Search for a salon
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Szalon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/booking-1-search-results.png' });

    // Open the first salon
    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/booking-2-salon-detail.png' });

    // Start the booking flow
    await page.getByRole('button', { name: 'Időpontfoglalás' }).click();
    await page.screenshot({ path: 'screenshots/booking-3-select-provider.png' });

    // Select the first provider
    await expect(page.getByText('Válasszon szolgáltatót')).toBeVisible();
    await page.locator('button').filter({ hasText: /szolgáltatás/ }).first().click();
    await page.screenshot({ path: 'screenshots/booking-4-select-service.png' });

    // Select the first service
    await expect(page.getByText('Válasszon szolgáltatást')).toBeVisible();
    await page.locator('button').filter({ hasText: /perc/ }).first().click();
    await page.screenshot({ path: 'screenshots/booking-5-select-datetime.png' });

    // Select a date — click a day button in the calendar (pick a future available day)
    await expect(page.getByText('Válasszon időpontot')).toBeVisible();
    // Click the first available day button in the date picker
    const dayButtons = page.locator('button').filter({ hasText: /^\d{1,2}$/ });
    const dayCount = await dayButtons.count();
    // Try clicking days until we find one with available time slots
    let timeSlotFound = false;
    for (let i = 0; i < Math.min(dayCount, 15); i++) {
      await dayButtons.nth(i).click();
      await page.waitForTimeout(500);
      // Check if time slots appeared
      const slots = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });
      if (await slots.count() > 0) {
        timeSlotFound = true;
        break;
      }
    }

    if (!timeSlotFound) {
      await page.screenshot({ path: 'screenshots/booking-5b-no-slots.png' });
      test.skip(true, 'No available time slots found for any date');
      return;
    }

    await page.screenshot({ path: 'screenshots/booking-6-time-slots.png' });

    // Select the first available time slot
    await page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first().click();
    await page.screenshot({ path: 'screenshots/booking-7-time-selected.png' });

    // Continue to confirmation
    await page.getByRole('button', { name: 'Tovább a megerősítéshez' }).click();
    await expect(page.getByText('Foglalás összegzése')).toBeVisible();
    await page.screenshot({ path: 'screenshots/booking-8-confirmation.png' });

    // Confirm the booking
    await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();

    // Should see the success screen
    await expect(page.getByText('Sikeres foglalás!')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/booking-9-success.png' });

    // Navigate to appointments to verify
    await page.getByRole('button', { name: 'Foglalásaim megtekintése' }).click();
    await expect(page).toHaveURL(/tab=appointments/);
    await page.screenshot({ path: 'screenshots/booking-10-appointments.png' });
  });

});

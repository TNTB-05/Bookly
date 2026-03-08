import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Cancel appointment', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('user can cancel an upcoming appointment', async ({ page }) => {
    // Navigate to the appointments tab
    await page.goto('/dashboard?tab=appointments');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/cancel-1-appointments.png' });

    // Check if there are any upcoming appointments
    const cancelButton = page.getByRole('button', { name: 'Lemondás' }).first();
    const hasAppointments = await cancelButton.isVisible().catch(() => false);

    if (!hasAppointments) {
      await page.screenshot({ path: 'screenshots/cancel-2-no-appointments.png' });
      test.skip(true, 'No upcoming appointments to cancel');
      return;
    }

    // Click the cancel button on the first upcoming appointment
    await cancelButton.click();
    await page.screenshot({ path: 'screenshots/cancel-2-confirm-modal.png' });

    // Confirm the cancellation
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).toBeVisible();
    await page.getByRole('button', { name: 'Igen' }).click();

    // Wait for the success toast
    await expect(page.getByText('Foglalás sikeresen lemondva')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/cancel-3-cancelled.png' });
  });

});

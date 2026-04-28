import { test, expect } from './fixtures/authFixture.js';

test.describe('Cancel appointment', () => {

  test('dismiss cancel modal without cancelling', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.getByRole('button', { name: 'Lemondás' }).first();
    const hasAppointments = await cancelButton.isVisible().catch(() => false);
    if (!hasAppointments) {
      test.skip(true, 'No upcoming appointments to test modal dismiss');
      return;
    }

    await cancelButton.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/cancel-01-modal-open.png' });

    const dismissBtn = page.getByRole('button', { name: /Nem|Mégse/i });
    await dismissBtn.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/cancel-02-modal-dismissed.png' });
  });

  test('confirm cancel removes appointment', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.getByRole('button', { name: 'Lemondás' }).first();
    const hasAppointments = await cancelButton.isVisible().catch(() => false);
    if (!hasAppointments) {
      test.skip(true, 'No upcoming appointments to cancel');
      return;
    }

    await cancelButton.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/cancel-03-confirm-modal.png' });

    await page.getByRole('button', { name: 'Igen' }).click();
    await expect(page.getByText('Foglalás sikeresen lemondva')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/booking/cancel-04-cancelled.png' });
  });

});

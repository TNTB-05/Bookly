import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Cancel appointment', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── Tab loading ─────────────────────────────────────────────────────────────

  test('appointments tab loads correctly', async ({ page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForTimeout(2000);
    // Either upcoming appointments or "Nincs" empty state should show
    const appointments = page.getByRole('button', { name: 'Lemondás' }).first();
    const noAppointments = page.getByText(/nincs/i);
    await expect(appointments.or(noAppointments)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/booking/cancel-01-appointments-tab.png' });
  });

  // ─── Modal dismiss ───────────────────────────────────────────────────────────

  test('dismiss cancel modal without cancelling', async ({ page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForTimeout(2000);

    const cancelButton = page.getByRole('button', { name: 'Lemondás' }).first();
    const hasAppointments = await cancelButton.isVisible().catch(() => false);
    if (!hasAppointments) {
      test.skip(true, 'No upcoming appointments to test modal dismiss');
      return;
    }

    await page.screenshot({ path: 'screenshots/booking/cancel-02-appointments-list.png' });

    await cancelButton.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/cancel-03-modal-open.png' });

    // Dismiss by clicking "Nem" / "Mégse"
    const dismissBtn = page.getByRole('button', { name: /Nem|Mégse/i });
    await dismissBtn.click();
    // Modal should close, appointment still there
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).not.toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/cancel-04-modal-dismissed.png' });
  });

  // ─── Cancel confirmation ─────────────────────────────────────────────────────

  test('confirm cancel removes appointment', async ({ page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForTimeout(2000);

    const cancelButton = page.getByRole('button', { name: 'Lemondás' }).first();
    const hasAppointments = await cancelButton.isVisible().catch(() => false);
    if (!hasAppointments) {
      test.skip(true, 'No upcoming appointments to cancel');
      return;
    }

    await page.screenshot({ path: 'screenshots/booking/cancel-05-appointments-list.png' });

    await cancelButton.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/cancel-06-confirm-modal.png' });

    await page.getByRole('button', { name: 'Igen' }).click();
    await expect(page.getByText('Foglalás sikeresen lemondva')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/cancel-07-cancelled.png' });
  });

});

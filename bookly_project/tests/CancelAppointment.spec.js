import { test, expect } from './fixtures/authFixture.js';
import { navigateToBookingConfirmation } from './helpers/booking.js';

/**
 * Each cancel test creates its OWN fresh appointment first so the suite does
 * not depend on the run order of the booking spec or on pre-seeded data.
 */
async function bookFreshAppointment(page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const ready = await navigateToBookingConfirmation(page);
  if (!ready) return false;

  await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();
  await expect(page.getByRole('heading', { name: 'Foglalás sikeres!' }).first()).toBeVisible({ timeout: 10000 });
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
    // Wait for the fade-in animation to finish so the modal is fully opaque
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'screenshots/booking/cancel-01-modal-open.png' });

    const dismissBtn = page.getByRole('button', { name: /Nem|Mégse/i });
    await dismissBtn.click();
    await expect(page.getByText('Biztosan le szeretnéd mondani ezt a foglalást?')).not.toBeVisible();
    // Wait for the fade-out animation to finish before screenshotting
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

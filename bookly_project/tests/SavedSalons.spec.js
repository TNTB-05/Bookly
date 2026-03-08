import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Saved salons', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('user can save and unsave a salon', async ({ page }) => {
    // Go to the featured salons tab
    await page.getByRole('button', { name: 'Kiemelt szalonok' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/saved-1-featured.png' });

    // Check if there are any salons to save
    const saveButton = page.locator('button[title="Mentés"]').first();
    const hasSalons = await saveButton.isVisible().catch(() => false);

    if (!hasSalons) {
      await page.screenshot({ path: 'screenshots/saved-2-no-salons.png' });
      test.skip(true, 'No salons available to save');
      return;
    }

    // Save the first salon
    await saveButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/saved-2-salon-saved.png' });

    // Navigate to saved salons tab ("Helyeim")
    await page.getByRole('button', { name: 'Helyeim' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/saved-3-saved-tab.png' });

    // Verify the saved salon appears
    await expect(page.getByRole('button', { name: 'Megnézem' }).first()).toBeVisible();

    // Unsave the salon
    const unsaveButton = page.locator('button[title="Eltávolítás a mentett helyekből"]').first();
    await unsaveButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/saved-4-unsaved.png' });
  });

});

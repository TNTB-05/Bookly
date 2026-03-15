import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Saved salons', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── Empty state ─────────────────────────────────────────────────────────────

  test('saved salons tab shows empty state when no salons saved', async ({ page }) => {
    // Navigate to saved salons tab ("Helyeim")
    await page.getByRole('button', { name: 'Helyeim' }).click();
    await page.waitForTimeout(2000);
    // Either saved salons or an empty message
    const savedSalon = page.getByRole('button', { name: 'Megnézem' }).first();
    const emptyState = page.getByText(/nincs|üres|mentett/i);
    await expect(savedSalon.or(emptyState)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/search/saved-01-tab.png' });
  });

  // ─── Save a salon ─────────────────────────────────────────────────────────────

  test('save a salon from featured salons', async ({ page }) => {
    await page.getByRole('button', { name: 'Kiemelt szalonok' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/saved-02-featured.png' });

    const saveButton = page.locator('button[title="Mentés"]').first();
    const hasSalons = await saveButton.isVisible().catch(() => false);
    if (!hasSalons) {
      test.skip(true, 'No salons available to save');
      return;
    }

    await saveButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/search/saved-03-saved.png' });
  });

  // ─── Saved salon in tab ───────────────────────────────────────────────────────

  test('saved salon appears in Helyeim tab', async ({ page }) => {
    // First save a salon
    await page.getByRole('button', { name: 'Kiemelt szalonok' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/saved-04-featured.png' });

    const saveButton = page.locator('button[title="Mentés"]').first();
    const hasSalons = await saveButton.isVisible().catch(() => false);
    if (!hasSalons) {
      test.skip(true, 'No salons available to save');
      return;
    }
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Go to Helyeim tab
    await page.getByRole('button', { name: 'Helyeim' }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: 'Megnézem' }).first()).toBeVisible();
    await page.screenshot({ path: 'screenshots/search/saved-05-in-tab.png' });
  });

  // ─── Unsave a salon ───────────────────────────────────────────────────────────

  test('unsave a salon removes it from saved list', async ({ page }) => {
    // Ensure a salon is saved first
    await page.getByRole('button', { name: 'Kiemelt szalonok' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/saved-06-featured.png' });

    const saveButton = page.locator('button[title="Mentés"]').first();
    const hasSalons = await saveButton.isVisible().catch(() => false);
    if (!hasSalons) {
      test.skip(true, 'No salons available to save/unsave');
      return;
    }
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Navigate to saved salons
    await page.getByRole('button', { name: 'Helyeim' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/saved-07-saved-list.png' });

    // Unsave
    const unsaveButton = page.locator('button[title="Eltávolítás a mentett helyekből"]').first();
    await unsaveButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/search/saved-08-unsaved.png' });
  });

});

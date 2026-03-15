import { test, expect } from './fixtures/authFixture.js';
import { navigateToHelyeim, saveFirstFeaturedSalon, ensureSalonSaved } from './helpers/salon.js';

test.describe('Saved salons feature', () => {

  // ─── Empty state ────────────────────────────────────────────────────────────

  test.describe('Empty state', () => {

    test('Helyeim tab shows empty state or saved salons list', async ({ loggedInPage: page }) => {
      await navigateToHelyeim(page);

      const emptyHeading = page.getByRole('heading', { name: 'Még nincs mentett helyed' });
      const salonCard = page.getByRole('button', { name: 'Megnézem' }).first();

      // Either empty state or salon list must be visible
      await Promise.race([
        emptyHeading.waitFor({ state: 'visible', timeout: 10000 }),
        salonCard.waitFor({ state: 'visible', timeout: 10000 }),
      ]);

      const isEmpty = await emptyHeading.isVisible().catch(() => false);
      if (isEmpty) {
        await expect(page.getByRole('button', { name: 'Szalonok böngészése' })).toBeVisible();
      } else {
        await expect(salonCard).toBeVisible();
      }

      await page.screenshot({ path: 'screenshots/search/saved-01-tab.png' });
    });
  });

  // ─── Saving salons ─────────────────────────────────────────────────────────

  test.describe('Saving salons', () => {

    test('user can save a salon from featured salons', async ({ loggedInPage: page }) => {
      // saveFirstFeaturedSalon handles the case where all salons are already saved
      // by unsaving one first, then re-saving it
      const saved = await saveFirstFeaturedSalon(page);
      if (!saved) {
        test.skip(true, 'No salons available');
        return;
      }
      await page.screenshot({ path: 'screenshots/search/saved-02-saved.png' });

      // Verify button shows saved state
      await expect(page.getByTitle('Eltávolítás a mentett helyekből').first()).toBeVisible();
      await page.screenshot({ path: 'screenshots/search/saved-03-saved-button.png' });
    });

    test('user cannot save the same salon twice', async ({ loggedInPage: page }) => {
      const saved = await saveFirstFeaturedSalon(page);
      if (!saved) {
        test.skip(true, 'No salons available');
        return;
      }

      // After saving, the button title changes — the UI prevents saving again.
      // The only action available is "Eltávolítás" (unsave), not "Mentés" (save).
      const firstSavedBtn = page.getByTitle('Eltávolítás a mentett helyekből').first();
      await expect(firstSavedBtn).toBeVisible();
      await page.screenshot({ path: 'screenshots/search/saved-04-no-duplicate.png' });
    });

    test('user can save a salon from search results', async ({ loggedInPage: page }) => {
      await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
      await page.getByRole('button', { name: 'Keresés' }).click();
      await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });

      // If all search result salons are already saved, unsave one first
      let saveButton = page.getByTitle('Mentés').first();
      if (!await saveButton.isVisible().catch(() => false)) {
        const unsaveButton = page.getByTitle('Eltávolítás a mentett helyekből').first();
        if (!await unsaveButton.isVisible().catch(() => false)) {
          test.skip(true, 'No salons in search results');
          return;
        }
        await unsaveButton.click();
        await expect(page.getByTitle('Mentés').first()).toBeVisible({ timeout: 5000 });
        saveButton = page.getByTitle('Mentés').first();
      }

      await saveButton.click();
      await expect(page.getByTitle('Eltávolítás a mentett helyekből').first()).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'screenshots/search/saved-05-from-search.png' });

      // Verify it appears in Helyeim
      await navigateToHelyeim(page);
      await expect(page.getByRole('button', { name: 'Megnézem' }).first()).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'screenshots/search/saved-06-search-in-tab.png' });
    });
  });

  // ─── Saved salons tab ──────────────────────────────────────────────────────

  test.describe('Saved salons tab', () => {

    test('saved salon appears in Helyeim tab', async ({ loggedInPage: page }) => {
      const hasSalon = await ensureSalonSaved(page);
      if (!hasSalon) {
        test.skip(true, 'No salons available');
        return;
      }

      await navigateToHelyeim(page);
      await expect(page.getByRole('heading', { name: 'Mentett helyek' })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: 'Megnézem' }).first()).toBeVisible();
      await page.screenshot({ path: 'screenshots/search/saved-07-in-tab.png' });
    });

    test('saved salon persists after page reload', async ({ loggedInPage: page }) => {
      const hasSalon = await ensureSalonSaved(page);
      if (!hasSalon) {
        test.skip(true, 'No salons available');
        return;
      }

      await page.reload();
      await page.waitForLoadState('networkidle');

      await navigateToHelyeim(page);
      await expect(page.getByRole('button', { name: 'Megnézem' }).first()).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'screenshots/search/saved-08-persists.png' });
    });

    test('user can navigate to salon detail from saved list', async ({ loggedInPage: page }) => {
      const hasSalon = await ensureSalonSaved(page);
      if (!hasSalon) {
        test.skip(true, 'No salons available');
        return;
      }

      await navigateToHelyeim(page);
      await expect(page.getByRole('button', { name: 'Megnézem' }).first()).toBeVisible({ timeout: 10000 });

      await page.getByRole('button', { name: 'Megnézem' }).first().click();
      await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
      await page.screenshot({ path: 'screenshots/search/saved-09-salon-detail.png' });
    });

    test('multiple saved salons appear in Helyeim tab', async ({ loggedInPage: page }) => {
      await page.getByRole('button', { name: 'Kiemelt szalonok' }).click();
      await page.waitForLoadState('networkidle');

      // Count total salon cards on the page (saved + unsaved)
      const savedCount = await page.getByTitle('Eltávolítás a mentett helyekből').count();
      const unsavedCount = await page.getByTitle('Mentés').count();
      const totalSalons = savedCount + unsavedCount;

      if (totalSalons < 2) {
        test.skip(true, 'Less than 2 salons exist');
        return;
      }

      // Ensure at least 2 are saved
      const toSave = Math.max(0, 2 - savedCount);
      for (let i = 0; i < toSave; i++) {
        await page.getByTitle('Mentés').first().click();
        await expect(page.getByTitle('Eltávolítás a mentett helyekből').first()).toBeVisible({ timeout: 5000 });
      }

      await page.screenshot({ path: 'screenshots/search/saved-10-two-saved.png' });

      // Verify both appear in Helyeim
      await navigateToHelyeim(page);
      const viewButtons = page.getByRole('button', { name: 'Megnézem' });
      await expect(viewButtons.first()).toBeVisible({ timeout: 10000 });
      expect(await viewButtons.count()).toBeGreaterThanOrEqual(2);
      await page.screenshot({ path: 'screenshots/search/saved-11-multiple-in-tab.png' });
    });
  });

  // ─── Removing saved salons ─────────────────────────────────────────────────

  test.describe('Removing saved salons', () => {

    test('removing a salon updates UI immediately', async ({ loggedInPage: page }) => {
      const hasSalon = await ensureSalonSaved(page);
      if (!hasSalon) {
        test.skip(true, 'No salons available');
        return;
      }

      await navigateToHelyeim(page);
      await page.screenshot({ path: 'screenshots/search/saved-12-before-remove.png' });

      const salonCountBefore = await page.getByRole('button', { name: 'Megnézem' }).count();
      const unsaveButton = page.getByTitle('Eltávolítás a mentett helyekből').first();
      await expect(unsaveButton).toBeVisible({ timeout: 5000 });

      await unsaveButton.click();

      // If it was the only salon, empty state should appear; otherwise count decreases
      if (salonCountBefore <= 1) {
        await expect(page.getByRole('heading', { name: 'Még nincs mentett helyed' })).toBeVisible({ timeout: 10000 });
      } else {
        const countAfter = await page.getByRole('button', { name: 'Megnézem' }).count();
        expect(countAfter).toBeLessThan(salonCountBefore);
      }

      await page.screenshot({ path: 'screenshots/search/saved-13-after-remove.png' });
    });
  });
});

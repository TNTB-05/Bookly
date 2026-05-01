import { expect } from '@playwright/test';

/**
 * Navigates to the "Helyeim" (Saved Salons) tab and waits for content to load.
 */
export async function navigateToHelyeim(page) {
  await page.getByRole('button', { name: 'Helyeim' }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Navigates to "Kiemelt szalonok" and saves the first unsaved salon.
 * If all salons are already saved, unsaves one first then re-saves it
 * so the test can exercise the save action.
 * Returns `false` only if no salons exist at all.
 */
export async function saveFirstFeaturedSalon(page) {
  await page.getByRole('button', { name: 'Kiemelt szalonok' }).click();
  await page.waitForLoadState('networkidle');

  // Happy path: there's an unsaved salon ready to save
  const saveButton = page.getByTitle('Mentés').first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await expect(page.getByTitle('Eltávolítás a mentett helyekből').first()).toBeVisible({ timeout: 5000 });
    return true;
  }

  // All salons already saved — unsave one first, then re-save it
  const unsaveButton = page.getByTitle('Eltávolítás a mentett helyekből').first();
  if (await unsaveButton.isVisible().catch(() => false)) {
    await unsaveButton.click();
    await expect(page.getByTitle('Mentés').first()).toBeVisible({ timeout: 5000 });
    await page.getByTitle('Mentés').first().click();
    await expect(page.getByTitle('Eltávolítás a mentett helyekből').first()).toBeVisible({ timeout: 5000 });
    return true;
  }

  // No salons at all on the page
  return false;
}

/**
 * Ensures at least one salon is saved. Unlike `saveFirstFeaturedSalon`,
 * this does NOT unsave+re-save if a salon is already saved — it simply
 * confirms one exists. Use this when the test needs a saved salon in Helyeim
 * but doesn't need to exercise the save action itself.
 * Returns `false` only if no salons exist at all.
 */
export async function ensureSalonSaved(page) {
  await page.getByRole('button', { name: 'Kiemelt szalonok' }).click();
  await page.waitForLoadState('networkidle');

  // Already have a saved salon — nothing to do
  const savedButton = page.getByTitle('Eltávolítás a mentett helyekből').first();
  if (await savedButton.isVisible().catch(() => false)) {
    return true;
  }

  // No saved salon yet — save one
  const saveButton = page.getByTitle('Mentés').first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
    await expect(page.getByTitle('Eltávolítás a mentett helyekből').first()).toBeVisible({ timeout: 5000 });
    return true;
  }

  return false;
}

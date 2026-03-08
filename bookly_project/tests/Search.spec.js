import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Salon search', () => {

  // Log in before each test in this group
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('search input is visible on the overview tab', async ({ page }) => {
    // The overview tab should be the default after login
    await expect(page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...')).toBeVisible();
    await page.screenshot({ path: 'screenshots/search-1-overview.png' });
  });

  test('search returns results', async ({ page }) => {
    // Type a search query
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Szalon');
    await page.screenshot({ path: 'screenshots/search-2-typed.png' });

    // Click the search button
    await page.getByRole('button', { name: 'Keresés' }).click();

    // Wait for results to appear
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/search-3-results.png' });
  });

  test('salon card has a view details button', async ({ page }) => {
    // Search for salons
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Szalon');
    await page.getByRole('button', { name: 'Keresés' }).click();

    // Wait for results
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });

    // Verify a "Megnézem" button exists on a salon card
    await expect(page.getByRole('button', { name: 'Megnézem' }).first()).toBeVisible();
    await page.screenshot({ path: 'screenshots/search-4-salon-card.png' });
  });

  test('clicking salon card opens salon detail', async ({ page }) => {
    // Search for salons
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Szalon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });

    // Click the first salon's view button
    await page.getByRole('button', { name: 'Megnézem' }).first().click();

    // Should navigate to the salon detail page
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/salon\/\d+/);
    await page.screenshot({ path: 'screenshots/search-5-salon-detail.png' });
  });

});

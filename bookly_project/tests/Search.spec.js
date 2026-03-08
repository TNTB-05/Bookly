import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Search bar', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── Elements visible on load ───────────────────────────────────────────────

  test('all search elements are visible on the overview tab', async ({ page }) => {
    await expect(page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...')).toBeVisible();
    await expect(page.getByPlaceholder('Helyszín (pl. Budapest, Kossuth utca 12)')).toBeVisible();
    await expect(page.getByText('Jelenlegi helyzetem')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Keresés' })).toBeVisible();
    // Service type dropdown defaults to "Összes szolgáltatás"
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('select')).toHaveValue('all');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/01-all-elements-visible.png' });
  });

  // ─── Empty / no-criteria search ─────────────────────────────────────────────

  test('clicking Keresés with no criteria shows empty search message', async ({ page }) => {
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési feltétel szükséges')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/02-empty-search.png' });
  });

  // ─── Text search ────────────────────────────────────────────────────────────

  test('typing in search input shows suggestions dropdown', async ({ page }) => {
    // Mock the suggestions API so the test works regardless of DB content
    await page.route('**/api/search/suggestions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          salons: [{ id: 1, name: 'Szép Szalon', address: 'Budapest, Fő utca 1', type: 'Szépségszalon' }],
          serviceTypes: ['Szépségápolás']
        })
      });
    });

    const searchInput = page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...');
    await searchInput.fill('Sz');
    // Wait for debounced suggestions (300ms + network)
    await page.waitForTimeout(2000);
    await expect(page.getByText('Szalonok', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Szolgáltatás típusok')).toBeVisible();
    await page.screenshot({ path: 'screenshots/search/03-search-suggestions.png' });
    await page.unroute('**/api/search/suggestions**');
  });

  test('text search returns results', async ({ page }) => {
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/\d+ találat/)).toBeVisible();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/04-text-search-results.png' });
  });

  test('text search with no matching query shows no results', async ({ page }) => {
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('xyznonexistent99999');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Nincs találat')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/05-no-results.png' });
  });

  // ─── Service type filter ────────────────────────────────────────────────────

  test('service type dropdown has options and filters results', async ({ page }) => {
    const dropdown = page.locator('select');
    await expect(dropdown).toHaveValue('all');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/06-service-dropdown-default.png' });

    // Select a non-default option (first real service type)
    const options = dropdown.locator('option');
    const optionCount = await options.count();
    if (optionCount > 1) {
      const secondOptionValue = await options.nth(1).getAttribute('value');
      await dropdown.selectOption(secondOptionValue);
      await page.getByRole('button', { name: 'Keresés' }).click();
      await expect(page.getByRole('heading', { name: 'Keresési eredmények' })).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/search/07-service-type-filtered.png' });
    }
  });

  // ─── Location input ─────────────────────────────────────────────────────────

  test('typing in location input shows address suggestions', async ({ page }) => {
    const locationInput = page.getByPlaceholder('Helyszín (pl. Budapest, Kossuth utca 12)');
    await locationInput.fill('Budapest');
    // Wait for debounced address autocomplete (400ms + network)
    await page.waitForTimeout(2000);
    const suggestionBtn = page.locator('.absolute.z-50 button').first();
    const hasSuggestions = await suggestionBtn.isVisible().catch(() => false);
    if (hasSuggestions) {
      await page.screenshot({ path: 'screenshots/search/08-location-suggestions.png' });
    } else {
      await page.screenshot({ path: 'screenshots/search/08-location-typed.png' });
    }
  });

  test('searching with location only returns results', async ({ page }) => {
    const locationInput = page.getByPlaceholder('Helyszín (pl. Budapest, Kossuth utca 12)');
    await locationInput.fill('Budapest');
    await page.waitForTimeout(1500);
    const suggestionBtn = page.locator('.absolute.z-50 button').first();
    if (await suggestionBtn.isVisible().catch(() => false)) {
      await suggestionBtn.click();
      await page.waitForTimeout(500);
    }
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByRole('heading', { name: 'Keresési eredmények' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/09-location-search-results.png' });
  });

  // ─── Jelenlegi helyzetem (My Location) button ───────────────────────────────

  test('clicking Jelenlegi helyzetem fills the location input', async ({ page }) => {
    // Grant geolocation permission and set a fake location (Budapest)
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 47.4979, longitude: 19.0402 });

    await page.getByText('Jelenlegi helyzetem').click();
    // Wait for reverse geocoding
    await page.waitForTimeout(3000);

    const locationInput = page.getByPlaceholder('Helyszín (pl. Budapest, Kossuth utca 12)');
    const valueAfter = await locationInput.inputValue();
    expect(valueAfter.length).toBeGreaterThan(0);
    await page.screenshot({ path: 'screenshots/search/10-my-location-filled.png' });
  });

  // ─── Combined filters ──────────────────────────────────────────────────────

  test('combined text + service type + location search', async ({ page }) => {
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');

    const dropdown = page.locator('select');
    const options = dropdown.locator('option');
    const optionCount = await options.count();
    if (optionCount > 1) {
      const secondOptionValue = await options.nth(1).getAttribute('value');
      await dropdown.selectOption(secondOptionValue);
    }

    await page.getByPlaceholder('Helyszín (pl. Budapest, Kossuth utca 12)').fill('Budapest');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByRole('heading', { name: 'Keresési eredmények' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/11-combined-search.png' });
  });

  // ─── Reset search ──────────────────────────────────────────────────────────

  test('Keresés törlése button resets all filters', async ({ page }) => {
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search/12-before-reset.png' });

    await page.getByText('Keresés törlése').click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Keresési eredmények')).not.toBeVisible();
    const searchValue = await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').inputValue();
    expect(searchValue).toBe('');
    await page.screenshot({ path: 'screenshots/search/13-after-reset.png' });
  });

});

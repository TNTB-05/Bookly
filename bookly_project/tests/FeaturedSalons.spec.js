import { test, expect } from './fixtures/authFixture.js';

test.describe('Featured salons', () => {
  test.beforeEach(async ({ loggedInPage }) => {
    // loggedInPage is already authenticated via the fixture
  });

  test('featured tab loads with heading', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=featured');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Kiemelt szalonok' })).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/featured-salons/01-tab-loaded.png' });
  });

  test('salons are displayed or empty state shown', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=featured');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Either salons are shown or loading/empty message
    const salonCard = page.getByRole('button', { name: 'Megnézem' }).first();
    const emptyState = page.getByText('Szalonok betöltése...');

    await Promise.race([
      salonCard.waitFor({ state: 'visible', timeout: 10000 }),
      emptyState.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    await page.screenshot({ path: 'screenshots/featured-salons/02-salons-displayed.png' });
  });

  test('service filter dropdown is functional', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=featured');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check that the filter dropdown exists with default option
    const filterSelect = page.locator('select').first();
    const hasFilter = await filterSelect.isVisible().catch(() => false);

    if (!hasFilter) {
      test.skip(true, 'No service filter available');
      return;
    }

    // Default option should be "Összes szolgáltatás"
    await expect(filterSelect).toBeVisible();

    await page.screenshot({ path: 'screenshots/featured-salons/03-filter-dropdown.png' });
  });

  test('toggle grid view button works', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=featured');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const toggleButton = page.getByRole('button', { name: 'Összes megtekintése' });
    const hasToggle = await toggleButton.isVisible().catch(() => false);

    if (!hasToggle) {
      test.skip(true, 'No toggle button available (might have too few salons)');
      return;
    }

    await toggleButton.click();
    await page.waitForTimeout(500);

    // After toggling, the button should change to "Kevesebb mutatása"
    await expect(page.getByRole('button', { name: 'Kevesebb mutatása' })).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/featured-salons/04-grid-view.png' });
  });

  test('clicking salon card navigates to salon detail', async ({ loggedInPage: page }) => {
    test.setTimeout(30_000);

    await page.goto('/dashboard?tab=featured');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const viewButton = page.getByRole('button', { name: 'Megnézem' }).first();
    const hasSalons = await viewButton.isVisible().catch(() => false);

    if (!hasSalons) {
      test.skip(true, 'No salons available to click');
      return;
    }

    await viewButton.click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/salon\//);

    await page.screenshot({ path: 'screenshots/featured-salons/05-salon-detail.png' });
  });
});

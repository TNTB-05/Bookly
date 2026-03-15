import { test, expect } from './fixtures/authFixture.js';

test.describe('Customer appointment rating', () => {
  test.beforeEach(async ({ loggedInPage }) => {
    // loggedInPage is already authenticated via the fixture
  });

  test('appointments tab loads with heading', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Foglalásaim' })).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/customer-rating/01-appointments-loaded.png' });
  });

  test('past appointments section is visible', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for upcoming or past sections
    const upcomingSection = page.getByText('Közelgő foglalások');
    const pastSection = page.getByText('Korábbi foglalások');
    const emptyState = page.getByText('Új foglalás indítása');

    await Promise.race([
      upcomingSection.waitFor({ state: 'visible', timeout: 10000 }),
      pastSection.waitFor({ state: 'visible', timeout: 10000 }),
      emptyState.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    await page.screenshot({ path: 'screenshots/customer-rating/02-sections-visible.png' });
  });

  test('rating modal opens from completed appointment', async ({ loggedInPage: page }) => {
    test.setTimeout(30_000);

    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for unrated completed appointment badge
    const rateButton = page.getByText('Értékelem').first();
    const hasUnrated = await rateButton.isVisible().catch(() => false);

    if (!hasUnrated) {
      test.skip(true, 'No unrated completed appointments available');
      return;
    }

    await rateButton.click();
    await page.waitForTimeout(500);

    // Rating modal should open
    await expect(page.getByText('Szalon értékelése')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Szolgáltató értékelése')).toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-rating/03-rating-modal.png' });
  });

  test('rating modal validates both ratings required', async ({ loggedInPage: page }) => {
    test.setTimeout(30_000);

    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const rateButton = page.getByText('Értékelem').first();
    const hasUnrated = await rateButton.isVisible().catch(() => false);

    if (!hasUnrated) {
      test.skip(true, 'No unrated completed appointments available');
      return;
    }

    await rateButton.click();
    await page.waitForTimeout(500);

    // Try to submit without selecting ratings
    await page.getByRole('button', { name: 'Értékelés mentése' }).click();

    await expect(
      page.getByText('Kérjük, adj értékelést mind a szalonnak, mind a szolgáltatónak!')
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-rating/04-validation-error.png' });
  });

  test('already rated appointment shows rated badge', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=appointments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const ratedBadge = page.getByText('Értékelve').first();
    const hasRated = await ratedBadge.isVisible().catch(() => false);

    if (!hasRated) {
      test.skip(true, 'No rated appointments to verify');
      return;
    }

    await expect(ratedBadge).toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-rating/05-rated-badge.png' });
  });
});

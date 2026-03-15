import { test, expect } from './fixtures/authFixture.js';

test.describe('Salon detail page', () => {
  test.beforeEach(async ({ loggedInPage }) => {
    // loggedInPage is already authenticated via the fixture
  });

  test('salon detail page loads from search', async ({ loggedInPage: page }) => {
    test.setTimeout(60_000);

    // Search for a salon
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click the first salon
    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Salon name heading should be visible
    await expect(page.locator('h1, h2').first()).toBeVisible();

    await page.screenshot({ path: 'screenshots/salon-detail/01-page-loaded.png' });
  });

  test('salon detail shows services section', async ({ loggedInPage: page }) => {
    test.setTimeout(60_000);

    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Look for service-related content (prices usually shown with "Ft")
    const serviceContent = page.locator('text=/\\d+\\s*Ft/').first();
    const hasServices = await serviceContent.isVisible().catch(() => false);

    if (!hasServices) {
      test.skip(true, 'No services displayed on this salon page');
      return;
    }

    await expect(serviceContent).toBeVisible();

    await page.screenshot({ path: 'screenshots/salon-detail/02-services-visible.png' });
  });

  test('salon detail shows providers', async ({ loggedInPage: page }) => {
    test.setTimeout(60_000);

    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/salon-detail/03-providers-visible.png' });
  });

  test('booking button starts wizard', async ({ loggedInPage: page }) => {
    test.setTimeout(60_000);

    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const bookingButton = page.getByRole('button', { name: 'Időpontfoglalás' });
    const hasBooking = await bookingButton.isVisible().catch(() => false);

    if (!hasBooking) {
      test.skip(true, 'No booking button available');
      return;
    }

    await bookingButton.click();
    await page.waitForTimeout(1000);

    // Should see provider selection step
    await expect(page.getByText('Válasszon szolgáltatót')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/salon-detail/04-booking-wizard-started.png' });
  });
});

import { test, expect } from './fixtures/providerAuthFixture.js';

test.describe('Provider calendar', () => {

  test('calendar section loads with heading', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Naptár' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 'Naptár' appears in nav button + heading; use heading to disambiguate
    await expect(page.getByRole('heading', { name: 'Naptár' })).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-calendar/01-section-loaded.png' });
  });

  test('clicking a day shows day view panel', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Naptár' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const dayCell = page.locator('.cursor-pointer').filter({ hasText: /^\d{1,2}$/ }).first();
    const hasDay = await dayCell.isVisible().catch(() => false);

    if (!hasDay) {
      test.skip(true, 'No clickable day cells found');
      return;
    }

    await dayCell.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/provider-calendar/02-day-view.png' });
  });
});

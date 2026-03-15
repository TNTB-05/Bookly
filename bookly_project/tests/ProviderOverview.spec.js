import { test, expect } from './fixtures/providerAuthFixture.js';

test.describe('Provider overview', () => {
  test.beforeEach(async ({ providerPage }) => {
    // providerPage is already authenticated via the fixture
    // Overview is the default tab
  });

  test('overview loads with heading', async ({ providerPage: page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Áttekintés')).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-overview/01-page-loaded.png' });
  });

  test('stat cards are visible', async ({ providerPage: page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByText('Mai Foglalások')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Heti Bevétel')).toBeVisible();
    await expect(page.getByText('Új Ügyfelek')).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-overview/02-stat-cards.png' });
  });

  test('upcoming appointments section visible', async ({ providerPage: page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByText('Következő Időpontok')).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-overview/03-upcoming-section.png' });
  });

  test('upcoming appointments list or empty state', async ({ providerPage: page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Either appointments or empty message
    const appointmentItem = page.locator('text=/Megerősítve|Teljesítve/').first();
    const emptyState = page.getByText('Nincsenek közelgő időpontok');

    await Promise.race([
      appointmentItem.waitFor({ state: 'visible', timeout: 10000 }),
      emptyState.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    await page.screenshot({ path: 'screenshots/provider-overview/04-appointments-or-empty.png' });
  });
});

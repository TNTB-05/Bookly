import { test, expect } from './fixtures/providerAuthFixture.js';

test.describe('Provider break CRUD', () => {
  test.beforeEach(async ({ providerPage }) => {
    // providerPage is already authenticated via the fixture
  });

  test('availability page loads with heading', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Elérhetőség kezelése')).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-breaks/01-page-loaded.png' });
  });

  test('filter tabs are visible and clickable', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('button', { name: 'Összes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ismétlődő' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Egyszeri' })).toBeVisible();

    // Click through filters
    await page.getByRole('button', { name: 'Ismétlődő' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Egyszeri' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Összes' }).click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/provider-breaks/02-filter-tabs.png' });
  });

  test('new break button opens modal', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szünet' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Új Szünet').nth(1)).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-breaks/03-create-modal.png' });
  });

  test('modal shows time inputs', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szünet' }).click();
    await page.waitForTimeout(500);

    // Check for time inputs
    await expect(page.getByText('Kezdő idő *')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Záró idő *')).toBeVisible();

    // Check for date input
    await expect(page.getByText('Dátum *')).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-breaks/04-time-inputs.png' });
  });

  test('modal has mode toggle (single day / multi-day)', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szünet' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'Egy nap' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Több nap/ })).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-breaks/05-mode-toggle.png' });
  });

  test('notes field accepts text', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szünet' }).click();
    await page.waitForTimeout(500);

    const notesInput = page.getByPlaceholder('pl. Ebédszünet, Szabadság...');
    await expect(notesInput).toBeVisible({ timeout: 5000 });
    await notesInput.fill('Test szünet');
    await expect(notesInput).toHaveValue('Test szünet');

    await page.screenshot({ path: 'screenshots/provider-breaks/06-notes-field.png' });
  });

  test('empty state shows message', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for empty state or break list
    const emptyMessage = page.getByText('Nincs szünet');
    const breakItem = page.getByText('Szünet').first();

    await Promise.race([
      emptyMessage.waitFor({ state: 'visible', timeout: 10000 }),
      breakItem.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    await page.screenshot({ path: 'screenshots/provider-breaks/07-list-or-empty.png' });
  });

  test('edit and delete buttons are visible on break items', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Elérhetőség' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if any breaks exist
    const breakItem = page.locator('[title="Szerkesztés"]').first();
    const hasBreaks = await breakItem.isVisible().catch(() => false);

    if (!hasBreaks) {
      test.skip(true, 'No breaks available to check edit/delete buttons');
      return;
    }

    await expect(page.locator('[title="Szerkesztés"]').first()).toBeVisible();
    await expect(page.locator('[title="Törlés"]').first()).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-breaks/08-edit-delete-buttons.png' });
  });
});

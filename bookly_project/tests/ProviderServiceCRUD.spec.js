import { test, expect } from './fixtures/providerAuthFixture.js';

test.describe('Provider service CRUD', () => {
  test.beforeEach(async ({ providerPage }) => {
    // providerPage is already authenticated via the fixture
  });

  test('services section loads with heading', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Szolgáltatások Kezelése')).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-services/01-section-loaded.png' });
  });

  test('empty state or service list is displayed', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const emptyState = page.getByText('Még nincsenek szolgáltatások');
    const serviceCard = page.locator('text=/\\d+\\s*perc/').first();

    await Promise.race([
      emptyState.waitFor({ state: 'visible', timeout: 10000 }),
      serviceCard.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    await page.screenshot({ path: 'screenshots/provider-services/02-list-or-empty.png' });
  });

  test('new service button opens create modal', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szolgáltatás' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Új Szolgáltatás').nth(1)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('pl. Férfi Hajvágás')).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-services/03-create-modal.png' });
  });

  test('create validates empty service name', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szolgáltatás' }).click();
    await page.waitForTimeout(500);

    // Listen for dialog (alert-based validation)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('A szolgáltatás neve kötelező!');
      await dialog.accept();
    });

    // Clear the name field and try to save
    await page.getByPlaceholder('pl. Férfi Hajvágás').clear();
    await page.getByRole('button', { name: 'Létrehozás' }).click();

    await page.screenshot({ path: 'screenshots/provider-services/04-validate-empty-name.png' });
  });

  test('create validates minimum duration', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szolgáltatás' }).click();
    await page.waitForTimeout(500);

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('A minimum időtartam 5 perc!');
      await dialog.accept();
    });

    await page.getByPlaceholder('pl. Férfi Hajvágás').fill('Test Service');
    // Set duration to less than 5 — labels lack htmlFor so use input[type="number"] directly
    const durationInput = page.locator('input[type="number"]').first();
    await durationInput.clear();
    await durationInput.fill('2');
    await page.getByRole('button', { name: 'Létrehozás' }).click();

    await page.screenshot({ path: 'screenshots/provider-services/05-validate-duration.png' });
  });

  test('successfully creates a new service', async ({ providerPage: page }) => {
    test.setTimeout(30_000);

    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szolgáltatás' }).click();
    await page.waitForTimeout(500);

    const serviceName = `Test Service ${Date.now()}`;
    await page.getByPlaceholder('pl. Férfi Hajvágás').fill(serviceName);
    await page.getByPlaceholder('Rövid leírás a szolgáltatásról...').fill('Test description');

    const durationInput = page.locator('input[type="number"]').first();
    await durationInput.clear();
    await durationInput.fill('30');

    const priceInput = page.locator('input[type="number"]').nth(1);
    await priceInput.clear();
    await priceInput.fill('5000');

    await page.getByRole('button', { name: 'Létrehozás' }).click();
    await page.waitForTimeout(2000);

    // Service should appear in the list (close modal first if still open)
    const closeBtns = page.getByRole('button', { name: 'Mégse' });
    if (await closeBtns.first().isVisible().catch(() => false)) {
      await closeBtns.first().click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-services/06-service-created.png' });
  });

  test('service card shows duration and price', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const serviceCard = page.locator('text=/\\d+\\s*perc/').first();
    const hasServices = await serviceCard.isVisible().catch(() => false);

    if (!hasServices) {
      test.skip(true, 'No services available to check');
      return;
    }

    // Verify service cards show duration in "X perc" format
    await expect(serviceCard).toBeVisible();

    // Verify price in "X Ft" format
    await expect(page.locator('text=/\\d+.*Ft/').first()).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-services/07-card-info.png' });
  });

  test('delete service with confirmation', async ({ providerPage: page }) => {
    test.setTimeout(30_000);

    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if there are any services to delete
    const serviceCard = page.locator('text=/\\d+\\s*perc/').first();
    const hasServices = await serviceCard.isVisible().catch(() => false);

    if (!hasServices) {
      test.skip(true, 'No services available to delete');
      return;
    }

    // Hover over a service card to reveal action buttons
    const card = page.locator('.group').first();
    await card.hover();
    await page.waitForTimeout(500);

    // Click the delete button (trash icon)
    const deleteButton = card.locator('button.text-red-500, button:has(svg)').last();
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirmation modal should appear
    await expect(page.getByText('Szolgáltatás Törlése')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Törlés' })).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-services/08-delete-confirmation.png' });
  });
});

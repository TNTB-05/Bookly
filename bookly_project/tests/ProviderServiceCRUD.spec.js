import { test, expect } from './fixtures/providerAuthFixture.js';

test.describe('Provider service CRUD', () => {

  test('services section loads with heading', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Szolgáltatások Kezelése')).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-services/01-section-loaded.png' });
  });

  test('new service button opens create modal', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szolgáltatás' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Új Szolgáltatás').nth(1)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('pl. Férfi Hajvágás')).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-services/02-create-modal.png' });
  });

  test('create validates empty service name', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Szolgáltatások' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '+ Új Szolgáltatás' }).click();
    await page.waitForTimeout(500);

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('A szolgáltatás neve kötelező!');
      await dialog.accept();
    });

    await page.getByPlaceholder('pl. Férfi Hajvágás').clear();
    await page.getByRole('button', { name: 'Létrehozás' }).click();

    await page.screenshot({ path: 'screenshots/provider-services/03-validate-empty-name.png' });
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

    const closeBtns = page.getByRole('button', { name: 'Mégse' });
    if (await closeBtns.first().isVisible().catch(() => false)) {
      await closeBtns.first().click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-services/04-service-created.png' });
  });
});

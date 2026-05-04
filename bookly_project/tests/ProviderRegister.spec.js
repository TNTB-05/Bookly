import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/provider/register');
});

test.describe('Provider registration', () => {

  test('registration page loads with choice step', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Szolgáltató Regisztráció' })).toBeVisible();
    await expect(page.getByText('Hogyan szeretne csatlakozni?')).toBeVisible();
    await expect(page.getByText('Új szalon létrehozása')).toBeVisible();
    await expect(page.getByText('Csatlakozás meglévő szalonhoz')).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-register/01-choice-step.png' });
  });

  test('create salon button advances to salon data step', async ({ page }) => {
    await page.getByText('Új szalon létrehozása').click();

    await expect(page.getByText('Szalon adatai')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#companyName')).toBeVisible();

    // The salon form contains a Leaflet map; wait for tile images to load
    // so the screenshot is not just a grey placeholder.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    await page.screenshot({ path: 'screenshots/provider-register/02-create-salon-step.png' });
  });

  test('join salon button advances to join step', async ({ page }) => {
    await page.getByText('Csatlakozás meglévő szalonhoz').click();

    await expect(page.getByText('Csatlakozás szalonhoz')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#salonCode')).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-register/03-join-salon-step.png' });
  });

  test('create salon validates empty required fields', async ({ page }) => {
    await page.getByText('Új szalon létrehozása').click();
    await expect(page.getByText('Szalon adatai')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Tovább' }).click();

    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible({ timeout: 5000 });

    // Scroll to top so the heading + error banner are visible in the screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'screenshots/provider-register/04-empty-salon-fields.png' });
  });

  test('user data step validates mismatched passwords', async ({ page }) => {
    await page.getByText('Csatlakozás meglévő szalonhoz').click();
    await expect(page.getByText('Csatlakozás szalonhoz')).toBeVisible({ timeout: 5000 });

    // Mock the salon code validation API to advance to the user step
    await page.route('**/auth/provider/validate-salon-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ salonId: 1, salonName: 'Test Szalon' }),
      });
    });

    await page.locator('#salonCode').fill('TESTCODE');
    await page.getByRole('button', { name: 'Kód ellenőrzése' }).click();
    await expect(page.getByText('Személyes adatok')).toBeVisible({ timeout: 5000 });

    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.locator('#name').fill('Test Provider');
    await page.locator('#email').fill('test@provider.com');
    await page.locator('#phone').fill('+36301234567');
    await page.locator('#password').fill('testpassword');
    await page.locator('#confirmPassword').fill('different');
    await page.getByRole('button', { name: 'Regisztráció befejezése' }).click();

    await expect(page.getByText('A jelszavak nem egyeznek')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/05-mismatched-passwords.png' });
  });
});

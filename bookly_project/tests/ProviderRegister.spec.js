import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/provider/register');
});

test.describe('Provider registration - Step 1 (Choice)', () => {
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

    await page.screenshot({ path: 'screenshots/provider-register/02-create-salon-step.png' });
  });

  test('join salon button advances to join step', async ({ page }) => {
    await page.getByText('Csatlakozás meglévő szalonhoz').click();

    await expect(page.getByText('Csatlakozás szalonhoz')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#salonCode')).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-register/03-join-salon-step.png' });
  });
});

test.describe('Provider registration - Join salon validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByText('Csatlakozás meglévő szalonhoz').click();
    await expect(page.getByText('Csatlakozás szalonhoz')).toBeVisible({ timeout: 5000 });
  });

  test('validates empty salon code', async ({ page }) => {
    await page.getByRole('button', { name: 'Kód ellenőrzése' }).click();

    await expect(page.getByText('Kérjük adja meg a szalon kódot')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/04-empty-code.png' });
  });

  test('validates short salon code', async ({ page }) => {
    await page.locator('#salonCode').fill('AB');
    await page.getByRole('button', { name: 'Kód ellenőrzése' }).click();

    await expect(page.getByText('A szalon kód legalább 6 karakter hosszú')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/05-short-code.png' });
  });
});

test.describe('Provider registration - Create salon validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByText('Új szalon létrehozása').click();
    await expect(page.getByText('Szalon adatai')).toBeVisible({ timeout: 5000 });
  });

  test('validates empty required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Tovább' }).click();

    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/06-empty-salon-fields.png' });
  });

  test('validates short company name', async ({ page }) => {
    // Mock address autocomplete so we can select a valid address (lat/lon required by validation)
    await page.route('**/api/search/address-autocomplete**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          suggestions: [{
            display_name: 'Budapest, Fő utca 1, 1011, Magyarország',
            address: { city: 'Budapest', road: 'Fő utca', house_number: '1', postcode: '1011' },
            lat: 47.4979,
            lon: 19.0402,
          }],
        }),
      });
    });

    await page.locator('#companyName').fill('A');
    await page.locator('#description').fill('Ez egy hosszú leírás a szalonról.');
    await page.locator('#salonType').selectOption('hair');

    // Type in address and click suggestion to set lat/lon in parent state
    await page.getByPlaceholder('Kezdd el beírni a címet...').fill('Budapest');
    await page.waitForTimeout(600);
    const suggestion = page.locator('button[type="button"]').filter({ hasText: 'Budapest' }).first();
    await suggestion.waitFor({ state: 'visible', timeout: 5000 });
    await suggestion.click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Tovább' }).click();

    await expect(page.getByText('A cégnév legalább 2 karakter hosszú kell legyen')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/07-short-company-name.png' });
  });

  test('validates short description', async ({ page }) => {
    // Mock address autocomplete so we can select a valid address (lat/lon required by validation)
    await page.route('**/api/search/address-autocomplete**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          suggestions: [{
            display_name: 'Budapest, Fő utca 1, 1011, Magyarország',
            address: { city: 'Budapest', road: 'Fő utca', house_number: '1', postcode: '1011' },
            lat: 47.4979,
            lon: 19.0402,
          }],
        }),
      });
    });

    await page.locator('#companyName').fill('Test Szalon');
    await page.locator('#description').fill('Rövid');
    await page.locator('#salonType').selectOption('hair');

    // Type in address and click suggestion to set lat/lon in parent state
    await page.getByPlaceholder('Kezdd el beírni a címet...').fill('Budapest');
    await page.waitForTimeout(600);
    const suggestion = page.locator('button[type="button"]').filter({ hasText: 'Budapest' }).first();
    await suggestion.waitFor({ state: 'visible', timeout: 5000 });
    await suggestion.click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Tovább' }).click();

    await expect(page.getByText('A leírás legalább 10 karakter hosszú kell legyen')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/08-short-description.png' });
  });
});

test.describe('Provider registration - User data validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to user registration step via create salon path
    // We need to fill salon data first, but we can't complete address (geocoded) easily
    // So we mock the address validation by going through join path with a mocked code
    await page.getByText('Csatlakozás meglévő szalonhoz').click();
    await expect(page.getByText('Csatlakozás szalonhoz')).toBeVisible({ timeout: 5000 });

    // Mock the salon code validation API to succeed
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
  });

  test('validates empty user fields', async ({ page }) => {
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.getByRole('button', { name: 'Regisztráció befejezése' }).click();

    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/09-empty-user-fields.png' });
  });

  test('validates short name', async ({ page }) => {
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.locator('#name').fill('A');
    await page.locator('#email').fill('test@provider.com');
    await page.locator('#phone').fill('+36301234567');
    await page.locator('#password').fill('testpassword');
    await page.locator('#confirmPassword').fill('testpassword');
    await page.getByRole('button', { name: 'Regisztráció befejezése' }).click();

    await expect(page.getByText('A név legalább 2 karakter hosszú kell legyen')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/10-short-name.png' });
  });

  test('validates invalid email', async ({ page }) => {
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.locator('#name').fill('Test Provider');
    await page.locator('#email').fill('invalid-email');
    await page.locator('#phone').fill('+36301234567');
    await page.locator('#password').fill('testpassword');
    await page.locator('#confirmPassword').fill('testpassword');
    await page.getByRole('button', { name: 'Regisztráció befejezése' }).click();

    await expect(page.getByText('Érvénytelen email cím')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/11-invalid-email.png' });
  });

  test('validates short password', async ({ page }) => {
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.locator('#name').fill('Test Provider');
    await page.locator('#email').fill('test@provider.com');
    await page.locator('#phone').fill('+36301234567');
    await page.locator('#password').fill('short');
    await page.locator('#confirmPassword').fill('short');
    await page.getByRole('button', { name: 'Regisztráció befejezése' }).click();

    await expect(page.getByText('A jelszónak legalább 8 karakter hosszúnak kell lennie')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/12-short-password.png' });
  });

  test('validates mismatched passwords', async ({ page }) => {
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.locator('#name').fill('Test Provider');
    await page.locator('#email').fill('test@provider.com');
    await page.locator('#phone').fill('+36301234567');
    await page.locator('#password').fill('testpassword');
    await page.locator('#confirmPassword').fill('different');
    await page.getByRole('button', { name: 'Regisztráció befejezése' }).click();

    await expect(page.getByText('A jelszavak nem egyeznek')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-register/13-mismatched-passwords.png' });
  });
});

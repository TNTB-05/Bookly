import { test, expect } from '@playwright/test';

test.describe('Provider login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/provider/login');
  });

  test('provider login page loads correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Szolgáltató Bejelentkezés' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bejelentkezés' })).toBeVisible();

    await page.screenshot({ path: 'screenshots/provider-login/01-page-loaded.png' });
  });

  test('login fails with both fields empty', async ({ page }) => {
    // Disable HTML5 validation to test app-level validation
    await page.locator('form').evaluate(form => form.noValidate = true);

    await page.getByRole('button', { name: 'Bejelentkezés' }).click();

    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-login/02-empty-fields.png' });
  });

  test('login fails with empty password', async ({ page }) => {
    await page.locator('form').evaluate(form => form.noValidate = true);

    await page.locator('#email').fill('test@test.com');
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();

    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-login/03-empty-password.png' });
  });

  test('login fails with invalid credentials', async ({ page }) => {
    await page.locator('#email').fill('nonexistent@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();

    await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-login/04-invalid-credentials.png' });
  });

  test('login succeeds with valid credentials', async ({ page }) => {
    test.setTimeout(30_000);

    const email = process.env.PLAYWRIGHT_PROVIDER_EMAIL || 'provider@test.com';
    const password = process.env.PLAYWRIGHT_PROVIDER_PASSWORD || 'asdasdasd';

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();

    await expect(page.getByText('Sikeres bejelentkezés!')).toBeVisible({ timeout: 5000 });
    await page.waitForURL('**/ProvDash', { timeout: 15000 });
    await expect(page).toHaveURL(/\/ProvDash/);

    await page.screenshot({ path: 'screenshots/provider-login/05-success.png' });
  });

  test('back button navigates to provider landing', async ({ page }) => {
    await page.getByRole('button', { name: 'Vissza' }).click();

    await page.waitForURL('**/provider/landing', { timeout: 10000 });
    await expect(page).toHaveURL(/\/provider\/landing/);

    await page.screenshot({ path: 'screenshots/provider-login/06-back-to-landing.png' });
  });

  test('register link navigates to provider register', async ({ page }) => {
    await page.getByRole('link', { name: 'Regisztráció' }).click();

    await page.waitForURL('**/provider/register', { timeout: 10000 });
    await expect(page).toHaveURL(/\/provider\/register/);

    await page.screenshot({ path: 'screenshots/provider-login/07-register-link.png' });
  });
});

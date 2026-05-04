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
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/provider-login/02-empty-fields.png' });
  });

  test('login fails with invalid credentials', async ({ page }) => {
    await page.locator('#email').fill('nonexistent@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/provider-login/03-invalid-credentials.png' });
  });

  test('login succeeds with valid credentials', async ({ page }) => {
    test.setTimeout(30_000);

    const email = process.env.PLAYWRIGHT_PROVIDER_EMAIL || 'provider@test.com';
    const password = process.env.PLAYWRIGHT_PROVIDER_PASSWORD || 'asdasdasd';

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.screenshot({ path: 'screenshots/provider-login/04-form-filled.png' });

    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    // Capture "Sikeres bejelentkezés!" on the form before the redirect to /ProvDash
    await expect(page.getByText(/Sikeres bejelentkezés/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/provider-login/05-login-success.png' });

    // Wait for redirect to provider dashboard
    await page.waitForURL('**/ProvDash', { timeout: 15000 });
    await expect(page).toHaveURL(/\/ProvDash/);
    // Wait for the loading placeholder to disappear and the dashboard layout
    // (heading) to render before snapshotting.
    await expect(page.getByText('Betöltés...')).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/provider-login/06-provider-dashboard.png' });
  });
});

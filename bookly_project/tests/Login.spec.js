import { test, expect } from '@playwright/test';
import { generateUser } from './helpers/testData.js';

test.describe('Customer login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page loads correctly', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('textbox', { name: 'Email cím' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Jelszó' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bejelentkezés' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/login/01-login-page.png' });
  });

  test('login fails with both fields empty', async ({ page }) => {
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible();
    await page.screenshot({ path: 'screenshots/login/02-both-empty.png' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
    await page.getByRole('textbox', { name: 'Jelszó' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await expect(page.getByText('Hibás e-mail vagy jelszó')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/login/03-wrong-password.png' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('login succeeds with correct credentials', async ({ page }) => {
    test.setTimeout(30_000);

    // Ensure user exists by registering (idempotent)
    const user = generateUser('login-test');
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill(user.name);
    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill(user.password);
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill(user.password);
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await Promise.race([
      page.waitForURL('**/login', { timeout: 10000 }),
      expect(page.getByText('Ez az e-mail cím már használatban van')).toBeVisible({ timeout: 10000 }),
    ]).catch(() => {});

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó' }).fill(user.password);
    await page.screenshot({ path: 'screenshots/login/04-form-filled.png' });

    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    // Capture the "Sikeres bejelentkezés!" message on the form before the
    // 2 second redirect to /dashboard kicks in
    await expect(page.getByText(/Sikeres bejelentkezés/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/login/05-login-success.png' });

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
    // Wait for the "Betöltés..." placeholder to disappear and the dashboard
    // navbar + overview content to render, otherwise the screenshot captures
    // a half-rendered page.
    await expect(page.getByText('Betöltés...')).toHaveCount(0, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Foglalásaim/i }).first()).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    // Allow fade-in animation + lazy images to settle
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/login/06-dashboard.png' });
  });
});

import { test, expect } from '@playwright/test';
import { generateUser } from './helpers/testData.js';

test.describe('Customer registration', () => {

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('textbox', { name: 'Név' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email cím' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Jelszó', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Jelszó megerősítése' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/register/01-register-page.png' });
  });

  test('register fails with all fields empty', async ({ page }) => {
    await page.goto('/register');
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible();
    await page.screenshot({ path: 'screenshots/register/02-all-empty.png' });
    await expect(page).toHaveURL(/\/register/);
  });

  test('register fails with mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill('differentpassword');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText('A jelszavak nem egyeznek')).toBeVisible();
    await page.screenshot({ path: 'screenshots/register/03-passwords-mismatch.png' });
    await expect(page).toHaveURL(/\/register/);
  });

  test('user can register and then login', async ({ page }) => {
    test.setTimeout(30_000);
    const user = generateUser('register-e2e');

    // Step 1: open the register page and fill in the form
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill(user.name);
    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill(user.password);
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill(user.password);
    await page.screenshot({ path: 'screenshots/register/04-form-filled.png' });

    // Step 2: submit and capture the success message on the form
    // (the form shows "Sikeres regisztráció!" for ~2s before redirecting)
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText(/Sikeres regisztráció/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/register/05-registration-success.png' });

    // Step 3: wait for redirect to /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'screenshots/register/06-login-page-after-redirect.png' });

    // Step 4: log in with the freshly registered user
    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó' }).fill(user.password);
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
    // Wait for the loading placeholder to disappear and dashboard content to
    // render before snapshotting, otherwise we capture a half-rendered page.
    await expect(page.getByText('Betöltés...')).toHaveCount(0, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Foglalásaim/i }).first()).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/register/07-dashboard.png' });
  });

});

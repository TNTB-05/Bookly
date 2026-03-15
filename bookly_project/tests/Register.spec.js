import { test, expect } from '@playwright/test';
import { generateUser } from './helpers/testData.js';

test.describe('Registration and login', () => {

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
    // Disable HTML5 native validation so React's error handler fires instead
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible();
    await page.screenshot({ path: 'screenshots/register/02-all-empty.png' });
    await expect(page).toHaveURL(/\/register/);
  });

  test('register fails with name too short', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill('A');
    await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill('password123');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText('A név legalább 2 karakter hosszú legyen')).toBeVisible();
    await page.screenshot({ path: 'screenshots/register/03-name-too-short.png' });
    await expect(page).toHaveURL(/\/register/);
  });

  test('register fails with invalid email format', async ({ page }) => {
    await page.goto('/register');
    // Disable HTML5 native validation (type="email" would catch this before React)
    await page.locator('form').evaluate(form => form.noValidate = true);
    await page.getByRole('textbox', { name: 'Név' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email cím' }).fill('notanemail');
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill('password123');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText('Kérjük, adjon meg egy érvényes email címet')).toBeVisible();
    await page.screenshot({ path: 'screenshots/register/04-invalid-email.png' });
    await expect(page).toHaveURL(/\/register/);
  });

  test('register fails with password too short', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill('123');
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill('123');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText('A jelszónak legalább 6 karakter hosszúnak kell lennie')).toBeVisible();
    await page.screenshot({ path: 'screenshots/register/05-password-too-short.png' });
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
    await page.screenshot({ path: 'screenshots/register/06-passwords-mismatch.png' });
    await expect(page).toHaveURL(/\/register/);
  });

  test('register fails with already existing email', async ({ page }) => {
    // Use a dedicated email and register it within the test first
    const email = 'playwright-duplicate@test.com';

    // Step 1: register the account (or it already exists from a prior run)
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email cím' }).fill(email);
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill('asdasdasd');
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill('asdasdasd');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await Promise.race([
      page.waitForURL('**/login', { timeout: 10000 }),
      expect(page.getByText('Ez az e-mail cím már használatban van')).toBeVisible({ timeout: 10000 }),
    ]).catch(() => {});

    // Step 2: try to register with the same email again
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill('Another User');
    await page.getByRole('textbox', { name: 'Email cím' }).fill(email);
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill('asdasdasd');
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill('asdasdasd');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page.getByText('Ez az e-mail cím már használatban van')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/register/07-duplicate-email.png' });
    await expect(page).toHaveURL(/\/register/);
  });

  test('user can register and then login', async ({ page }) => {
    // Unique email so this test always works regardless of DB state
    const user = generateUser('register-e2e');

    // Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/register/08-home.png' });

    // Open the login modal and navigate to the registration page
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await page.waitForURL('**/login');
    await page.screenshot({ path: 'screenshots/register/09-login-page.png' });

    await page.getByRole('link', { name: 'Regisztráció' }).click();
    await page.waitForURL('**/register');
    await page.screenshot({ path: 'screenshots/register/10-register-page.png' });

    // Fill in the registration form with the unique email
    await page.getByRole('textbox', { name: 'Név' }).fill(user.name);
    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill(user.password);
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill(user.password);
    await page.screenshot({ path: 'screenshots/register/11-form-filled.png' });

    // Submit the registration form and wait for redirect to login
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'screenshots/register/12-redirected-to-login.png' });

    // Fill in the login form and submit
    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó' }).fill(user.password);
    await page.screenshot({ path: 'screenshots/register/13-login-form.png' });
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: 'screenshots/register/14-dashboard.png' });
  });

});

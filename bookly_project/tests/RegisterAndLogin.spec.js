import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/register-login-1.png' });

  // Open the login modal and navigate to the registration page
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await page.waitForURL('**/login');
  await page.screenshot({ path: 'screenshots/register-login-2.png' });

  await page.getByRole('link', { name: 'Regisztráció' }).click();
  await page.waitForURL('**/register');
  await page.screenshot({ path: 'screenshots/register-login-3.png' });

  // Fill in the name field
  await page.getByRole('textbox', { name: 'Név' }).click();
  await page.getByRole('textbox', { name: 'Név' }).fill('Test User');
  await page.getByRole('textbox', { name: 'Név' }).press('Tab');
  await page.screenshot({ path: 'screenshots/register-login-4.png' });

  // Fill in the email field
  await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Email cím' }).press('Tab');
  await page.screenshot({ path: 'screenshots/register-login-5.png' });

  // Fill in the password and confirmation fields
  await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill('asdasdasd');
  await page.getByRole('textbox', { name: 'Jelszó', exact: true }).press('Tab');
  await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill('asdasdasd');
  await page.screenshot({ path: 'screenshots/register-login-6.png' });

  // Submit the registration form and wait for redirect to login
  await page.getByRole('button', { name: 'Regisztráció' }).click();
  await page.waitForURL('**/login', { timeout: 10000 });
  await expect(page).toHaveURL(/\/login/);
  await page.screenshot({ path: 'screenshots/register-login-7.png' });

  // Fill in the login form with the newly registered credentials
  await page.getByRole('textbox', { name: 'Email cím' }).click();
  await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Email cím' }).press('Tab');
  await page.getByRole('textbox', { name: 'Jelszó' }).fill('asdasdasd');
  await page.screenshot({ path: 'screenshots/register-login-8.png' });

  // Submit the login form and wait for redirect to dashboard
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);
  await page.screenshot({ path: 'screenshots/register-login-9.png' });
});

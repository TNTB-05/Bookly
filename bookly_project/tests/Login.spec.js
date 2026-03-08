import { test, expect } from '@playwright/test';

test.describe('Login page', () => {

  test('shows error with empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.screenshot({ path: 'screenshots/login-1-empty-form.png' });

    // Submit the form without filling anything in
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();

    // Expect client-side validation error
    await expect(page.locator('.text-red-700')).toContainText('Minden mező kitöltése kötelező');
    await page.screenshot({ path: 'screenshots/login-2-empty-error.png' });
  });

  test('shows error with wrong credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in wrong credentials
    await page.getByLabel('Email cím').fill('nonexistent@test.com');
    await page.getByLabel('Jelszó').fill('wrongpassword');
    await page.screenshot({ path: 'screenshots/login-3-wrong-creds.png' });

    // Submit the form
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();

    // Wait for server response error
    await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/login-4-wrong-creds-error.png' });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill in valid credentials (test user must already exist)
    await page.getByLabel('Email cím').fill('test@test.com');
    await page.getByLabel('Jelszó').fill('asdasdasd');
    await page.screenshot({ path: 'screenshots/login-5-valid-creds.png' });

    // Submit the form
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: 'screenshots/login-6-dashboard.png' });
  });

});

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
    const user = generateUser('register-e2e');

    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Név' }).fill(user.name);
    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill(user.password);
    await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill(user.password);
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);

    await page.getByRole('textbox', { name: 'Email cím' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Jelszó' }).fill(user.password);
    await page.getByRole('button', { name: 'Bejelentkezés' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: 'screenshots/register/04-dashboard.png' });
  });

});

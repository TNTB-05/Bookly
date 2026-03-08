import { test, expect } from '@playwright/test';

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
  // Disable HTML5 native validation so React's error handler fires
  await page.locator('form').evaluate(form => form.noValidate = true);
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible();
  await page.screenshot({ path: 'screenshots/login/02-both-empty.png' });
  await expect(page).toHaveURL(/\/login/);
});

test('login fails with empty email', async ({ page }) => {
  await page.locator('form').evaluate(form => form.noValidate = true);
  await page.getByRole('textbox', { name: 'Jelszó' }).fill('password123');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible();
  await page.screenshot({ path: 'screenshots/login/03-empty-email.png' });
  await expect(page).toHaveURL(/\/login/);
});

test('login fails with empty password', async ({ page }) => {
  await page.locator('form').evaluate(form => form.noValidate = true);
  await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible();
  await page.screenshot({ path: 'screenshots/login/04-empty-password.png' });
  await expect(page).toHaveURL(/\/login/);
});

test('login fails with wrong password', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Jelszó' }).fill('wrongpassword');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page.getByText('Hibás e-mail vagy jelszó')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'screenshots/login/05-wrong-password.png' });
  await expect(page).toHaveURL(/\/login/);
});

test('login fails with invalid email format', async ({ page }) => {
  // Disable HTML5 native validation (type="email" would catch this before React)
  await page.locator('form').evaluate(form => form.noValidate = true);
  await page.getByRole('textbox', { name: 'Email cím' }).fill('notanemail');
  await page.getByRole('textbox', { name: 'Jelszó' }).fill('password123');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'screenshots/login/06-invalid-email.png' });
  await expect(page).toHaveURL(/\/login/);
});

test('login fails with non-existent email', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Email cím' }).fill('nonexistent@email.com');
  await page.getByRole('textbox', { name: 'Jelszó' }).fill('password123');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page.getByText('Hibás e-mail vagy jelszó')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'screenshots/login/07-nonexistent-email.png' });
  await expect(page).toHaveURL(/\/login/);
});

test('login succeeds with correct credentials', async ({ page }) => {
  // Ensure a user exists: register first (idempotent — duplicate email is silently ignored)
  const email = 'playwright-login@test.com';
  const password = 'asdasdasd';
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Név' }).fill('Login Tester');
  await page.getByRole('textbox', { name: 'Email cím' }).fill(email);
  await page.getByRole('textbox', { name: 'Jelszó', exact: true }).fill(password);
  await page.getByRole('textbox', { name: 'Jelszó megerősítése' }).fill(password);
  await page.getByRole('button', { name: 'Regisztráció' }).click();
  await Promise.race([
    page.waitForURL('**/login', { timeout: 10000 }),
    expect(page.getByText('Ez az e-mail cím már használatban van')).toBeVisible({ timeout: 10000 }),
  ]).catch(() => {});

  // Now login with the guaranteed-existing user
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email cím' }).fill(email);
  await page.getByRole('textbox', { name: 'Jelszó' }).fill(password);
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshots/login/08-login-success.png' });
  await expect(page).toHaveURL(/\/dashboard/);
});

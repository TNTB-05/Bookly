import { test, expect } from '@playwright/test';

test.describe('Protected routes', () => {

  test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    // Try to access the dashboard without being logged in
    await page.goto('/dashboard');
    await page.screenshot({ path: 'screenshots/protected-1-dashboard-redirect.png' });

    // Should be redirected to the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user is redirected from /ProvDash to /provider/login', async ({ page }) => {
    // Try to access the provider dashboard without being logged in
    await page.goto('/ProvDash');
    await page.screenshot({ path: 'screenshots/protected-2-provdash-redirect.png' });

    // Should be redirected to the provider login page
    await expect(page).toHaveURL(/\/provider\/login/);
  });

});

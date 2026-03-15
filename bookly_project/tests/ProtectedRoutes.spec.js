import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.js';

test.describe('Protected routes', () => {

  // ─── Unauthenticated redirects ──────────────────────────────────────────────

  test('unauthenticated /dashboard redirects to customer login page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Bejelentkezés' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-01-dashboard-to-login.png' });
  });

  test('unauthenticated /dashboard/salon/:id redirects to customer login page', async ({ page }) => {
    await page.goto('/dashboard/salon/1');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Bejelentkezés' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-02-salon-subpage-to-login.png' });
  });

  test('unauthenticated /ProvDash redirects to provider login page', async ({ page }) => {
    await page.goto('/ProvDash');
    await expect(page).toHaveURL(/\/provider\/login/);
    await expect(page.getByRole('heading', { name: 'Szolgáltató Bejelentkezés' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-03-provdash-to-provider-login.png' });
  });

  test('unauthenticated /admin/dashboard redirects to admin login page', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-04-admin-to-admin-login.png' });
  });

  // ─── Catch-all (404) ────────────────────────────────────────────────────────

  test('unknown route redirects to home page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page).toHaveURL('/');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-05-404-to-home.png' });
  });

  test('deeply nested unknown route redirects to home page', async ({ page }) => {
    await page.goto('/some/deep/unknown/path');
    await expect(page).toHaveURL('/');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-06-deep-404-to-home.png' });
  });

  // ─── Wrong-role redirects (logged in as customer) ───────────────────────────

  test('logged-in customer visiting /ProvDash is redirected to /dashboard', async ({ page }) => {
    await login(page);
    await page.goto('/ProvDash');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-07-customer-to-provdash-blocked.png' });
  });

  test('logged-in customer visiting /admin/dashboard is redirected to /dashboard', async ({ page }) => {
    await login(page);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/protectedRoutes/protected-08-customer-to-admin-blocked.png' });
  });

});

import { test, expect } from './fixtures/authFixture.js';
import { test as baseTest, expect as baseExpect } from '@playwright/test';

test.describe('Customer account deletion', () => {
  test.beforeEach(async ({ loggedInPage }) => {
    // loggedInPage is already authenticated via the fixture
  });

  test('delete modal opens and can be dismissed', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Fiók törlése' }).click();
    await page.waitForTimeout(500);

    // Modal should be visible
    await expect(page.getByPlaceholder('TÖRLÉS')).toBeVisible({ timeout: 5000 });

    // Dismiss with cancel
    await page.getByRole('button', { name: 'Mégse' }).click();
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(page.getByPlaceholder('TÖRLÉS')).not.toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-account-deletion/01-dismiss-modal.png' });
  });

  test('delete validates empty password', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Fiók törlése' }).click();
    await page.waitForTimeout(500);

    // Try to delete without filling password
    await page.getByPlaceholder('TÖRLÉS').fill('TÖRLÉS');
    await page.getByRole('button', { name: 'Fiók törlése' }).nth(1).click();

    await expect(page.getByText('A jelszó megadása kötelező a fiók törléséhez')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-account-deletion/02-empty-password.png' });
  });

  test('delete validates missing confirmation text', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Fiók törlése' }).click();
    await page.waitForTimeout(500);

    // Fill password but not confirmation text — password placeholder uses bullet chars
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.last().fill('somepassword');
    await page.getByRole('button', { name: 'Fiók törlése' }).nth(1).click();

    await expect(page.getByText(/Kérjük, írd be a "TÖRLÉS" szót/)).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-account-deletion/03-missing-confirmation.png' });
  });
});

baseTest.describe('Profile reactivation', () => {
  baseTest('reactivation page redirects to login without token', async ({ page }) => {
    await page.goto('/reactivate');

    await page.waitForURL('**/login', { timeout: 10000 });
    await baseExpect(page).toHaveURL(/\/login/);

    await page.screenshot({ path: 'screenshots/customer-account-deletion/04-reactivate-no-token.png' });
  });

  baseTest('reactivation page loads with token in session storage', async ({ page }) => {
    // Set a reactivation token in sessionStorage before navigating
    await page.goto('/login');
    await page.evaluate(() => {
      sessionStorage.setItem('reactivationToken', 'test-token-123');
    });

    await page.goto('/reactivate');
    await page.waitForTimeout(1000);

    await baseExpect(page.getByRole('heading', { name: 'Fiók újraaktiválása' })).toBeVisible({ timeout: 5000 });
    await baseExpect(page.locator('#name')).toBeVisible();
    await baseExpect(page.locator('#phone')).toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-account-deletion/05-reactivate-with-token.png' });
  });
});

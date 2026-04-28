import { test, expect } from './fixtures/authFixture.js';

test.describe('Customer account deletion', () => {

  test('delete modal opens and can be dismissed', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Fiók törlése' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByPlaceholder('TÖRLÉS')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Mégse' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByPlaceholder('TÖRLÉS')).not.toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-account-deletion/01-dismiss-modal.png' });
  });

  test('delete validates empty password', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Fiók törlése' }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder('TÖRLÉS').fill('TÖRLÉS');
    await page.getByRole('button', { name: 'Fiók törlése' }).nth(1).click();

    await expect(page.getByText('A jelszó megadása kötelező a fiók törléséhez')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-account-deletion/02-empty-password.png' });
  });
});

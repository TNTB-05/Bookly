import { test, expect } from './fixtures/authFixture.js';

test.describe('Customer account deletion', () => {

  test('delete modal opens and can be dismissed', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Fiók törlése' }).click();
    // Wait for the modal fade-in animation to finish
    await page.waitForTimeout(700);

    await expect(page.getByPlaceholder('TÖRLÉS')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/customer-account-deletion/01-modal-open.png' });

    await page.getByRole('button', { name: 'Mégse' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByPlaceholder('TÖRLÉS')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/customer-account-deletion/02-modal-dismissed.png' });
  });

  test('delete validates empty password', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Fiók törlése' }).click();
    await page.waitForTimeout(700);

    await page.getByPlaceholder('TÖRLÉS').fill('TÖRLÉS');
    await page.screenshot({ path: 'screenshots/customer-account-deletion/03-confirmation-typed.png' });

    await page.getByRole('button', { name: 'Fiók törlése' }).nth(1).click();

    await expect(page.getByText('A jelszó megadása kötelező a fiók törléséhez')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/customer-account-deletion/04-empty-password-error.png' });
  });
});

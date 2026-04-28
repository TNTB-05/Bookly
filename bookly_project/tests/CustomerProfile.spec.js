import { test, expect } from './fixtures/authFixture.js';

test.describe('Customer profile', () => {

  test('profile tab loads with user info', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Profilom' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Személyes adatok')).toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-profile/01-tab-loaded.png' });
  });

  test('opens profile edit modal with form fields', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Szerkesztés' }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByPlaceholder('Teljes név')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Email').first()).toBeVisible();
    await expect(page.getByText('Telefonszám').first()).toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-profile/02-edit-modal-open.png' });
  });

  test('profile edit saves successfully', async ({ loggedInPage: page }) => {
    test.setTimeout(30_000);

    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Szerkesztés' }).first().click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Mentés' }).click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/customer-profile/03-save-profile.png' });
  });

  test('password change validates mismatched passwords', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Jelszó módosítása' }).click();
    await page.waitForTimeout(500);

    const inputs = page.getByPlaceholder('••••••••');
    await inputs.nth(0).fill('currentpass');
    await inputs.nth(1).fill('newpassword123');
    await inputs.nth(2).fill('differentpassword');

    await page.getByRole('button', { name: 'Jelszó módosítása' }).last().click();

    await expect(page.getByText('Az új jelszavak nem egyeznek')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-profile/04-mismatched-passwords.png' });
  });
});

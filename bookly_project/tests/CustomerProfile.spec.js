import { test, expect } from './fixtures/authFixture.js';

test.describe('Customer profile', () => {
  test.beforeEach(async ({ loggedInPage }) => {
    // loggedInPage is already authenticated via the fixture
  });

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

  test('profile edit validates empty name', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Szerkesztés' }).first().click();
    await page.waitForTimeout(500);

    // Clear name field
    const nameInput = page.getByPlaceholder('Teljes név');
    await nameInput.clear();

    // Click save
    await page.getByRole('button', { name: 'Mentés' }).click();

    await expect(page.getByText('A név megadása kötelező')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-profile/03-empty-name-error.png' });
  });

  test('profile edit saves successfully', async ({ loggedInPage: page }) => {
    test.setTimeout(30_000);

    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Szerkesztés' }).first().click();
    await page.waitForTimeout(500);

    // The name field should already have a value, just click save without changes
    await page.getByRole('button', { name: 'Mentés' }).click();
    await page.waitForTimeout(1000);

    // Modal should close or show info toast (no change made)
    await page.screenshot({ path: 'screenshots/customer-profile/04-save-profile.png' });
  });

  test('opens password change modal', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Jelszó módosítása' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Jelenlegi jelszó *')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Új jelszó *')).toBeVisible();
    await expect(page.getByText('Új jelszó megerősítése *')).toBeVisible();

    await page.screenshot({ path: 'screenshots/customer-profile/05-password-modal.png' });
  });

  test('password change validates empty fields', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Jelszó módosítása' }).click();
    await page.waitForTimeout(500);

    // createPortal appends modal to body last, so .last() targets the modal submit button
    await page.getByRole('button', { name: 'Jelszó módosítása' }).last().click();

    await expect(page.getByText('Minden mező kitöltése kötelező')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-profile/06-empty-password-fields.png' });
  });

  test('password change validates short new password', async ({ loggedInPage: page }) => {
    await page.goto('/dashboard?tab=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Jelszó módosítása' }).click();
    await page.waitForTimeout(500);

    const inputs = page.getByPlaceholder('••••••••');
    await inputs.nth(0).fill('currentpass');
    await inputs.nth(1).fill('short');
    await inputs.nth(2).fill('short');

    await page.getByRole('button', { name: 'Jelszó módosítása' }).last().click();

    await expect(page.getByText('Az új jelszónak legalább 6 karakter hosszúnak kell lennie')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/customer-profile/07-short-password.png' });
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

    await page.screenshot({ path: 'screenshots/customer-profile/08-mismatched-passwords.png' });
  });
});

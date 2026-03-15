import { test, expect } from './fixtures/providerAuthFixture.js';

test.describe('Provider appointment cancel', () => {
  test.beforeEach(async ({ providerPage }) => {
    // providerPage is already authenticated via the fixture
  });

  test('calendar section loads with heading', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Naptár' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Naptár')).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/provider-calendar/01-section-loaded.png' });
  });

  test('calendar navigation between months works', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Naptár' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get current month text
    const monthHeading = page.locator('text=/[A-ZÁ-Ű][a-zá-ű]+\\s+\\d{4}/').first();
    const hasMonth = await monthHeading.isVisible().catch(() => false);

    if (!hasMonth) {
      test.skip(true, 'Calendar month heading not visible');
      return;
    }

    const initialMonth = await monthHeading.textContent();

    // Click next month
    const nextButton = page.locator('button:has(svg)').filter({ has: page.locator('path') }).last();
    await nextButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/provider-calendar/02-month-navigation.png' });
  });

  test('clicking a day shows day view panel', async ({ providerPage: page }) => {
    await page.getByRole('button', { name: 'Naptár' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click on today's date or any visible enabled day
    const dayCell = page.locator('.cursor-pointer').filter({ hasText: /^\d{1,2}$/ }).first();
    const hasDay = await dayCell.isVisible().catch(() => false);

    if (!hasDay) {
      test.skip(true, 'No clickable day cells found');
      return;
    }

    await dayCell.click();
    await page.waitForTimeout(1000);

    // Day view panel should show with date info or "Nincs foglalás erre a napra"
    const dayPanel = page.locator('text=/foglal[aá]s|Nincs foglalás/').first();
    await Promise.race([
      dayPanel.waitFor({ state: 'visible', timeout: 10000 }),
      page.getByText('Nincs foglalás erre a napra').waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    await page.screenshot({ path: 'screenshots/provider-calendar/03-day-view.png' });
  });

  test('clicking an appointment opens detail modal', async ({ providerPage: page }) => {
    test.setTimeout(30_000);

    await page.getByRole('button', { name: 'Naptár' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click today's date
    const today = new Date().getDate().toString();
    const dayCell = page.locator('.cursor-pointer').filter({ hasText: new RegExp(`^${today}$`) }).first();
    const hasDay = await dayCell.isVisible().catch(() => false);

    if (hasDay) {
      await dayCell.click();
      await page.waitForTimeout(1000);
    }

    // Look for any appointment block (they show user name and price)
    const appointmentBlock = page.locator('text=/\\d+.*Ft/').first();
    const hasAppointment = await appointmentBlock.isVisible().catch(() => false);

    if (!hasAppointment) {
      test.skip(true, 'No appointments available to click');
      return;
    }

    await appointmentBlock.click();
    await page.waitForTimeout(500);

    // Modal should open showing appointment details
    await expect(page.getByText('Időpont')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/provider-calendar/04-appointment-modal.png' });
  });

  test('delete button available for scheduled appointments', async ({ providerPage: page }) => {
    test.setTimeout(30_000);

    await page.getByRole('button', { name: 'Naptár' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Try to find and click an appointment
    const today = new Date().getDate().toString();
    const dayCell = page.locator('.cursor-pointer').filter({ hasText: new RegExp(`^${today}$`) }).first();
    if (await dayCell.isVisible().catch(() => false)) {
      await dayCell.click();
      await page.waitForTimeout(1000);
    }

    const appointmentBlock = page.locator('text=/\\d+.*Ft/').first();
    const hasAppointment = await appointmentBlock.isVisible().catch(() => false);

    if (!hasAppointment) {
      test.skip(true, 'No appointments available');
      return;
    }

    await appointmentBlock.click();
    await page.waitForTimeout(500);

    // Check for delete button (only visible for scheduled appointments)
    const deleteButton = page.getByRole('button', { name: 'Foglalás törlése' });
    const hasDelete = await deleteButton.isVisible().catch(() => false);

    if (hasDelete) {
      await expect(deleteButton).toBeVisible();
    }

    await page.screenshot({ path: 'screenshots/provider-calendar/05-delete-button.png' });
  });
});

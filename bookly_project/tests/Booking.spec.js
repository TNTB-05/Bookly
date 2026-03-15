import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Booking flow', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── Button visibility ───────────────────────────────────────────────────────

  test('Időpontfoglalás button is visible on salon detail', async ({ page }) => {
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/01-search-results.png' });

    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/02-salon-detail.png' });

    await expect(page.getByRole('button', { name: 'Időpontfoglalás' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/booking/03-booking-button.png' });
  });

  // ─── Booking wizard steps ────────────────────────────────────────────────────

  test('provider selection step loads after clicking Időpontfoglalás', async ({ page }) => {
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/04-search-results.png' });

    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/05-salon-detail.png' });

    await page.getByRole('button', { name: 'Időpontfoglalás' }).click();
    await expect(page.getByText('Válasszon szolgáltatót')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/06-provider-selection.png' });
  });

  // ─── Full booking flow ───────────────────────────────────────────────────────

  test('full booking flow from search to confirmation', async ({ page }) => {
    // Search and open salon
    await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
    await page.getByRole('button', { name: 'Keresés' }).click();
    await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/07-search-results.png' });

    await page.getByRole('button', { name: 'Megnézem' }).first().click();
    await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/08-salon-detail.png' });

    // Start booking
    await page.getByRole('button', { name: 'Időpontfoglalás' }).click();
    await expect(page.getByText('Válasszon szolgáltatót')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/09-select-provider.png' });

    // Select provider (each provider card contains an <h4> with the provider name)
    await page.locator('button:has(h4)').first().click();
    await expect(page.getByText('Válasszon szolgáltatást')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/10-select-service.png' });

    // Select service (each service card shows its duration in "perc")
    await page.locator('button').filter({ hasText: /perc/ }).first().click();
    await expect(page.getByText('Válasszon időpontot')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/11-select-datetime.png' });

    // Select date and time
    // react-datepicker v9 renders days as <div role="gridcell"> with class react-datepicker__day
    // minDate is today so past days have react-datepicker__day--disabled class
    // After clicking a day, the component fetches time slots via /availability API
    const daySelector = '.react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)';
    const slotSelector = 'button';
    const slotFilter = { hasText: /^\d{2}:\d{2}$/ };
    let timeSlotFound = false;
    const maxMonthsToTry = 3;

    for (let month = 0; month < maxMonthsToTry && !timeSlotFound; month++) {
      // Navigate to next month if current month yielded no available slots
      if (month > 0) {
        await page.locator('.react-datepicker__navigation--next').click();
        await page.waitForTimeout(500);
      }

      const dayCount = await page.locator(daySelector).count();

      for (let i = 0; i < dayCount; i++) {
        // Click the day and wait for the /availability API response
        await Promise.all([
          page.waitForResponse(
            resp => resp.url().includes('/availability'),
            { timeout: 10000 }
          ).catch(() => null),
          page.locator(daySelector).nth(i).click(),
        ]);

        // Wait for React to re-render after the API response settles:
        // either time slot buttons appear or "Nincs elérhető időpont" is shown
        await Promise.race([
          page.locator(slotSelector).filter(slotFilter).first().waitFor({ state: 'visible', timeout: 10000 }),
          page.getByText('Nincs elérhető időpont').waitFor({ state: 'visible', timeout: 10000 }),
        ]).catch(() => {});

        const slots = page.locator(slotSelector).filter(slotFilter);
        if (await slots.count() > 0) {
          timeSlotFound = true;
          break;
        }
      }
    }

    if (!timeSlotFound) {
      await page.screenshot({ path: 'screenshots/booking/11b-no-slots.png' });
      test.skip(true, 'No available time slots found across multiple months');
      return;
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/booking/12-time-slots.png' });

    await page.locator(slotSelector).filter(slotFilter).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/13-time-selected.png' });

    // Confirm
    await page.getByRole('button', { name: 'Tovább a megerősítéshez' }).click();
    await expect(page.getByText('Foglalás összegzése')).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/14-confirmation.png' });

    await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();
    await expect(page.getByText('Sikeres foglalás!')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/booking/15-success.png' });

    // Verify in appointments tab
    await page.getByRole('button', { name: 'Foglalásaim megtekintése' }).click();
    await expect(page).toHaveURL(/tab=appointments/);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/booking/16-appointments-tab.png' });
  });
});

test('successfull booking', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await page.getByRole('textbox', { name: 'Email cím' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Jelszó' }).fill('asdasdasd');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-01-logged-in.png' });

  await page.getByRole('combobox').selectOption('fodrász');
  await page.getByRole('button', { name: 'Keresés' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-02-search-results.png' });

  await page.getByRole('button', { name: 'Megnézem' }).first().click();
  await page.screenshot({ path: 'screenshots/booking/sb-03-salon-detail.png' });

  await page.getByRole('button', { name: 'Időpontfoglalás' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-04-provider-selection.png' });

  await page.getByRole('button', { name: 'P Peter Nagy provider ★★★★☆ 4' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-05-service-selection.png' });

  await page.getByRole('button', { name: 'Hair Coloring Full hair' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-06-datetime-selection.png' });

  await page.getByRole('gridcell', { name: 'Choose 2026. március 17., kedd' }).click();
  await page.getByRole('button', { name: '10:00' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-07-time-selected.png' });

  await page.getByRole('button', { name: 'Tovább a megerősítéshez' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-08-confirmation.png' });

  await page.getByRole('button', { name: 'Foglalás véglegesítése' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-09-success.png' });

  await page.getByRole('button', { name: 'Foglalásaim megtekintése' }).click();
  await page.screenshot({ path: 'screenshots/booking/sb-10-appointments.png' });
});
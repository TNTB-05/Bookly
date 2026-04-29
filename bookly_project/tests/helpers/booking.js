import { expect } from '@playwright/test';

/**
 * Navigates through the booking wizard up to (and including) the confirmation step.
 * Returns `false` if no available time slot was found (caller should test.skip).
 *
 * If `screenshotPrefix` is supplied, a screenshot is saved at each wizard step
 * (e.g. "screenshots/booking/wizard-01-search.png", "...02-salon.png", ...).
 */
export async function navigateToBookingConfirmation(page, { screenshotPrefix } = {}) {
  const shot = async (name) => {
    if (screenshotPrefix) {
      await page.screenshot({ path: `${screenshotPrefix}${name}.png` });
    }
  };

  // Search and open salon
  await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
  await page.getByRole('button', { name: 'Keresés' }).click();
  await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000);
  await shot('01-search-results');

  await page.getByRole('button', { name: 'Megnézem' }).first().click();
  await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await shot('02-salon-detail');

  // Start booking
  await page.getByRole('button', { name: 'Időpontfoglalás' }).click();
  await expect(page.getByText('Válasszon szolgáltatót')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
  await shot('03-select-provider');

  // Select provider
  await page.locator('button:has(h4)').first().click();
  await expect(page.getByText('Válasszon szolgáltatást')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
  await shot('04-select-service');

  // Select service
  await page.locator('button').filter({ hasText: /perc/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Válasszon időpontot' })).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
  await shot('05-select-date');

  // Find available date and time slot
  const daySelector = '.react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)';
  const slotSelector = 'button';
  const slotFilter = { hasText: /^\d{2}:\d{2}$/ };
  let timeSlotFound = false;
  const maxMonthsToTry = 3;

  for (let month = 0; month < maxMonthsToTry && !timeSlotFound; month++) {
    if (month > 0) {
      await page.locator('.react-datepicker__navigation--next').click();
      await page.waitForTimeout(500);
    }

    const dayCount = await page.locator(daySelector).count();

    for (let i = 0; i < dayCount; i++) {
      await Promise.all([
        page.waitForResponse(
          resp => resp.url().includes('/availability'),
          { timeout: 10000 }
        ).catch(() => null),
        page.locator(daySelector).nth(i).click(),
      ]);

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
    return false;
  }

  // Select the first available time slot
  await page.waitForTimeout(500);
  await shot('06-time-slots');
  await page.locator(slotSelector).filter(slotFilter).first().click();
  await page.waitForTimeout(1000);
  await shot('07-time-slot-selected');

  // Proceed to confirmation — wait until the "Tovább" button becomes enabled
  // after the slot click (sometimes there's a brief async re-render).
  const nextBtn = page.getByRole('button', { name: 'Tovább a megerősítéshez' });
  await expect(nextBtn).toBeEnabled({ timeout: 10000 });
  await nextBtn.click();
  await expect(page.getByText('Foglalás összegzése')).toBeVisible();
  await page.waitForTimeout(1000);

  return true;
}

/**
 * Navigates through the booking wizard to the date/time selection step.
 * Used by tests that need the calendar but don't need a full booking.
 */
export async function navigateToBookingDateStep(page) {
  await page.getByPlaceholder('Keress szolgáltatót vagy szolgáltatást...').fill('Salon');
  await page.getByRole('button', { name: 'Keresés' }).click();
  await expect(page.getByText('Keresési eredmények')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.getByRole('button', { name: 'Megnézem' }).first().click();
  await page.waitForURL('**/dashboard/salon/**', { timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.getByRole('button', { name: 'Időpontfoglalás' }).click();
  await expect(page.getByText('Válasszon szolgáltatót')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);

  await page.locator('button:has(h4)').first().click();
  await expect(page.getByText('Válasszon szolgáltatást')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);

  await page.locator('button').filter({ hasText: /perc/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Válasszon időpontot' })).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000);
}

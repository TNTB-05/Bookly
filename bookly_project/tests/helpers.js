/**
 * Shared helper: logs in as the test user.
 * Assumes the user already exists in the database.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email = 'test@test.com', password = 'asdasdasd') {
  await page.goto('/login');
  await page.getByLabel('Email cím').fill(email);
  await page.getByLabel('Jelszó').fill(password);
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

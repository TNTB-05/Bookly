/**
 * Logs in as a provider test user and waits for the provider dashboard to load.
 *
 * Credentials can be set via environment variables:
 *   PLAYWRIGHT_PROVIDER_EMAIL    (default: 'provider@test.com')
 *   PLAYWRIGHT_PROVIDER_PASSWORD (default: 'asdasdasd')
 *
 * To create a provider test account navigate to /provider/register and create
 * a new salon with the desired credentials, then update the env vars or defaults.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} [email]
 * @param {string} [password]
 */
export async function providerLogin(
  page,
  email = process.env.PLAYWRIGHT_PROVIDER_EMAIL || 'provider@test.com',
  password = process.env.PLAYWRIGHT_PROVIDER_PASSWORD || 'asdasdasd'
) {
  await page.goto('/provider/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await page.waitForURL('**/ProvDash', { timeout: 10000 });
}

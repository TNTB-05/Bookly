import { test as base } from '@playwright/test';
import { providerLogin } from '../helpers/providerAuth.js';

/**
 * Custom test fixture that provides a pre-authenticated provider page.
 * Use `providerPage` instead of `page` in tests that require a logged-in provider.
 */
export const test = base.extend({
  providerPage: async ({ page }, use) => {
    await providerLogin(page);
    await use(page);
  },
});

export const expect = test.expect;

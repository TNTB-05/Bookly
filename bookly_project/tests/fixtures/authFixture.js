import { test as base } from '@playwright/test';
import { login } from '../helpers/auth.js';

/**
 * Custom test fixture that provides a pre-authenticated page.
 * Use `loggedInPage` instead of `page` in tests that require a logged-in user.
 */
export const test = base.extend({
  loggedInPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export const expect = test.expect;

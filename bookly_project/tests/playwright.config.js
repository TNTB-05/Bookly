import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',

  // Fail the build on CI if test.only is left in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI
  retries: process.env.CI ? 1 : 0,

  // Reporter: HTML report + console output
  reporter: [['html', { open: 'never' }], ['list']],

  // Output directory for failure artifacts
  outputDir: 'test-results',

  use: {
    baseURL: 'http://localhost:5173',

    // Capture screenshots automatically when a test fails
    screenshot: 'only-on-failure',

    // Record trace on first retry for detailed debugging (npx playwright show-trace)
    trace: 'on-first-retry',

    // Keep video recording on failure for visual debugging
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});

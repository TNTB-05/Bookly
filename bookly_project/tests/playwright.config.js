import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',

  // Fail the build on CI if test.only is left in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests once
  retries: 0,

  // Reporter: HTML report + console output
  reporter: [['html', { open: 'never' }], ['list']],

  // Output directory for failure artifacts
  outputDir: 'test-results',

  use: {
    baseURL: 'http://localhost:5173',

    // Only capture screenshots automatically when a test fails
    screenshot: 'only-on-failure',

    // Save trace on failure for debugging
    trace: 'retain-on-failure',

    // No video recording (saves disk space)
    video: 'off',
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

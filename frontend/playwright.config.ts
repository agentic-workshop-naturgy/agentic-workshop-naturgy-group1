import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 * Assumes the Vite dev server is already running on http://localhost:5173
 * (npm run dev), or use `webServer` to let Playwright start it automatically.
 *
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* Root directory where tests live */
  testDir: './e2e',

  /* Match only files with .spec.ts suffix */
  testMatch: '**/*.spec.ts',

  /* Run tests in each file in parallel */
  fullyParallel: true,

  /* Fail the build on CI if test.only is accidentally left in code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests once on CI */
  retries: process.env.CI ? 1 : 0,

  /* Single worker locally for easier debugging; full parallelism on CI */
  workers: process.env.CI ? '50%' : 1,

  /* Reporter: HTML report + concise console output */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  /* Global settings shared by all tests */
  use: {
    /* Base URL for page.goto('/') calls */
    baseURL: 'http://localhost:5173',

    /* Collect trace on first retry to help debug failures */
    trace: 'on-first-retry',

    /* Take screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Record video only on first retry */
    video: 'on-first-retry',

    /* Default navigation timeout */
    navigationTimeout: 15_000,
  },

  /* Folder for test output artefacts (screenshots, videos, traces) */
  outputDir: 'test-results',

  /* ------------------------------------------------------------------ */
  /* Projects: one per browser / device                                  */
  /* ------------------------------------------------------------------ */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to add more browsers:
    // { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',   use: { ...devices['Desktop Safari']  } },
    // { name: 'Mobile Chrome',  use: { ...devices['Pixel 5']   } },
  ],

  /* ------------------------------------------------------------------ */
  /* Optional: let Playwright start/stop the dev server automatically.  */
  /* Comment this block out if you prefer to start `npm run dev` manually*/
  /* ------------------------------------------------------------------ */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // reuse if already running (e.g. during dev)
    timeout: 30_000,
  },
});

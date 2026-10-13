import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5174';
const includePwa = process.env.ISLAND_PWA === '1';
const previewURL = 'http://127.0.0.1:4174';
const usePreview = baseURL === previewURL;
// Opt-in only: a diagnostic browser copy must never silently replace the
// official Playwright browser. See docs/testing-browser.md for its provenance.
const firefoxLaunch = process.env.FIREFOX_EXECUTABLE_PATH ? { executablePath: process.env.FIREFOX_EXECUTABLE_PATH } : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 12_000, toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  outputDir: 'test-results/browser',
  snapshotPathTemplate: '{testDir}/snapshots/{platform}/{projectName}/{arg}{ext}',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['json', { outputFile: 'test-results/browser-results.json' }]],
  use: { baseURL, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', colorScheme: 'light', actionTimeout: 10_000, navigationTimeout: 25_000, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'],channel:'chrome', viewport: { width: 1440, height: 1000 } }, testIgnore: /pwa\.spec\.ts/ },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'],channel:'chrome', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }, testIgnore: /pwa\.spec\.ts/ },
    { name: 'chromium-narrow', use: { ...devices['Desktop Chrome'],channel:'chrome', viewport: { width: 320, height: 740 }, deviceScaleFactor: 1, hasTouch: true }, testMatch: /layout\.spec\.ts/ },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 }, launchOptions: firefoxLaunch }, testIgnore: /pwa\.spec\.ts/ },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } }, testIgnore: /pwa\.spec\.ts/ },
    ...(includePwa ? [{ name: 'pwa-chromium', use: { ...devices['Desktop Chrome'],channel:'chrome', baseURL: previewURL, viewport: { width: 390, height: 844 } }, testMatch: /pwa\.spec\.ts/ }] : []),
    ...(includePwa ? [{ name: 'pwa-firefox', use: { ...devices['Desktop Firefox'], baseURL: previewURL, viewport: { width: 390, height: 844 }, launchOptions: firefoxLaunch }, testMatch: /pwa\.spec\.ts/ }] : []),
  ],
  webServer: [
    { command: usePreview ? 'npm run preview:demo' : 'npm run dev -- --port 5174 --strictPort', url: baseURL, reuseExistingServer: !process.env.CI, timeout: 60_000 },
    ...(includePwa && !usePreview ? [{ command: 'npm run preview:demo', url: previewURL, reuseExistingServer: !process.env.CI, timeout: 60_000 }] : []),
  ],
});

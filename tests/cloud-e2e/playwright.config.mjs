import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { APP_ORIGIN, API_ORIGIN, RESULT_DIRECTORY } from './fixture-config.mjs';
export default defineConfig({
  testDir: '.', testMatch: /cloud\.spec\.ts/, globalSetup: './global-setup.mjs',
  fullyParallel: false, workers: 1, retries: 0, forbidOnly: Boolean(process.env.CI),
  timeout: 75_000, expect: { timeout: 15_000 },
  outputDir: `../../${RESULT_DIRECTORY}/browser`,
  reporter: [['list'], ['json', { outputFile: path.resolve(RESULT_DIRECTORY, 'results.json') }], ['html', { outputFolder: path.resolve(RESULT_DIRECTORY, 'html'), open: 'never' }]],
  use: { baseURL: APP_ORIGIN, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', colorScheme: 'light', viewport: { width: 1440, height: 1000 }, actionTimeout: 10_000, navigationTimeout: 25_000, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [
    { name: 'cloud-chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'cloud-firefox', use: { ...devices['Desktop Firefox'], launchOptions: process.env.FIREFOX_EXECUTABLE_PATH ? { executablePath: process.env.FIREFOX_EXECUTABLE_PATH } : undefined } },
    { name: 'cloud-webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: { command: 'node tests/cloud-e2e/fixture-server.mjs', cwd: '../..', url: `${API_ORIGIN}/health`, reuseExistingServer: false, timeout: 60_000 },
});

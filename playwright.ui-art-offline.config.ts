import { defineConfig } from '@playwright/test';
import base from './playwright.config';
const output = process.env.UI_ART_EVIDENCE_OUTPUT ?? 'test-results/ui-art-v1/revision-2';
export default defineConfig({ ...base, workers: 1, fullyParallel: false, testMatch: /ui-art-offline\.spec\.ts/,
  projects: [{ name: 'ui-art-offline-chrome', use: { channel: 'chrome', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true } }],
  outputDir: output + '/offline/artifacts', reporter: [['list'], ['json', { outputFile: output + '/offline/results.json' }]],
});

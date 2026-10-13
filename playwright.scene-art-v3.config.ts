import { defineConfig } from '@playwright/test';
import base from './playwright.config';
const output = process.env.SCENE_ART_EVIDENCE_OUTPUT ?? 'test-results/scene-art-v3/revision-1';

export default defineConfig({ ...base,
  workers: 1, fullyParallel: false,
  testMatch: [/draft-deletion\.spec\.ts/, /scene-art-v3\.spec\.ts/, /projects\.spec\.ts/],
  grep: /draft deletion|confirmation opened|failed draft|I24 scenes|background, frame, gallery/,
  projects: [
    { name: 'scene-chrome-desktop', use: { channel: 'chrome', viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 } },
    { name: 'scene-chrome-mobile', use: { channel: 'chrome', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true } },
  ],
  outputDir: `${output}/browser/artifacts`,
  reporter: [['list'], ['json', { outputFile: `${output}/browser/results.json` }]],
});

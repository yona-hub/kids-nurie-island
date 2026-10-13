import path from 'node:path';
import base from './playwright.config.mjs';
import { RESULT_DIRECTORY } from './fixture-config.mjs';
export default {
  ...base,
  testMatch: /(?:cold|blob)-offline\.diagnostic\.ts/,
  projects: base.projects.filter(project => project.name === 'cloud-webkit'),
  outputDir: path.resolve(RESULT_DIRECTORY, 'cold-diagnostic-browser'),
  reporter: [['list'], ['json', { outputFile: path.resolve(RESULT_DIRECTORY, 'cold-diagnostic-results.json') }]],
};

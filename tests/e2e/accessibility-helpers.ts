import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, settleAnimations } from './helpers';

export async function waitForSettings(page: Page) {
  await expect(page.locator('.settings-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible();
  await expect(page.getByRole('switch')).toHaveCount(5);
  await expect(page.getByRole('slider', { name: /音量/ })).toBeVisible();
  await expect(page.locator('.loading-state')).toHaveCount(0);
}

export async function checkA11y(page: Page, name: string, settings = false) {
  if (settings) await waitForSettings(page);
  await settleAnimations(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const coverage = settings ? {
    surface: '.settings-page',
    switchCount: await page.getByRole('switch').count(),
    sliderCount: await page.getByRole('slider', { name: /音量/ }).count(),
    loadingCount: await page.locator('.loading-state').count(),
    // Native checkbox switches are covered by axe's HTML label rule. The
    // ARIA-only toggle-name rule does not apply to this native input.
    labelledSwitchNodes: results.passes.find(rule => rule.id === 'label')?.nodes.filter(node => /role="switch"/.test(node.html)).length ?? 0,
    labelledRangeNodes: results.passes.find(rule => rule.id === 'label')?.nodes.filter(node => /type="range"/.test(node.html)).length ?? 0,
  } : undefined;
  mkdirSync('test-results/a11y', { recursive: true });
  writeFileSync(`test-results/a11y/${name}.json`, JSON.stringify({ ...results, testedSurface: coverage }, null, 2));
  if (coverage) {
    expect(coverage).toEqual({ surface: '.settings-page', switchCount: 5, sliderCount: 1, loadingCount: 0, labelledSwitchNodes: 5, labelledRangeNodes: 1 });
  }
  const violations = results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical').map(item => ({ id: item.id, impact: item.impact, help: item.help, targets: item.nodes.map(node => node.target) }));
  expect.soft(violations, `Serious/critical accessibility findings on ${name}`).toEqual([]);
  return results;
}

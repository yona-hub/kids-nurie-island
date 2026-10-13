/* global document, navigator, requestAnimationFrame, CanvasRenderingContext2D */
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { performanceBuildIdentity, assertPerformanceBuildUnchanged } from './performance-evidence.mjs';

const url = process.env.PERFORMANCE_URL || 'http://127.0.0.1:4174';
const build = await performanceBuildIdentity(url);
const browser = await chromium.launch({ headless: true });
const reports = [];
try {
  for (const cpuSlowdown of [1, 4]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ja-JP' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown });
    const homeReady = () => expect(page.getByRole('button', { name: 'おひめさまのしま', exact: true })).toBeVisible();
    const startupMetrics = () => page.evaluate(() => ({ readyObservedMs: performance.now(), navigation: performance.getEntriesByType('navigation')[0].toJSON(), resources: performance.getEntriesByType('resource').map(entry => ({ name: entry.name, transferSize: entry.transferSize, decodedBodySize: entry.decodedBodySize, duration: entry.duration })) }));
    await page.goto(url); await homeReady(); const cold = await startupMetrics();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.reload(); await homeReady(); const revisit = await startupMetrics();
    await page.getByRole('button', { name: 'おひめさまのしま', exact: true }).click();
    await page.locator('.template-card').first().click();
    await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
    const projectId = page.url().split('/paint/')[1]; assert.ok(projectId);
    // Capture first display draw, not only the modal disappearing. The hook is
    // confined to this browser session; no benchmark API exists in production.
    await page.evaluate(() => {
      const canvas = document.querySelector('.artwork-transform canvas');
      globalThis.__sceneBenchmark = { pending: null };
      const original = CanvasRenderingContext2D.prototype.drawImage;
      globalThis.__sceneBenchmark.restore = () => { CanvasRenderingContext2D.prototype.drawImage = original; };
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        const result = Reflect.apply(original, this, args), sample = globalThis.__sceneBenchmark.pending;
        if (this.canvas === canvas && sample && sample.drawMs === undefined) {
          sample.drawMs = performance.now() - sample.start;
          requestAnimationFrame(() => requestAnimationFrame(() => { sample.paintOpportunityMs = performance.now() - sample.start; }));
        }
        return result;
      };
    });
    await page.getByRole('button', { name: '完成', exact: true }).click();
    await expect(page.locator('.finish-panel')).toBeVisible();
    const scenes = [];
    for (const kind of ['はいけい', 'かざりわく']) {
      for (const index of [1, 2, 3]) {
        await page.getByRole('button', { name: kind, exact: true }).click();
        const choice = page.locator('.scene-choice').nth(index); await expect(choice).toBeEnabled();
        const name = await choice.innerText();
        await choice.evaluate(element => element.addEventListener('click', () => { globalThis.__sceneBenchmark.pending = { start: performance.now() }; }, { once: true, capture: true }));
        await choice.click();
        await page.waitForFunction(() => globalThis.__sceneBenchmark.pending?.paintOpportunityMs !== undefined);
        await expect(page.getByRole('dialog')).toHaveCount(0);
        scenes.push({ kind, name, ...await page.evaluate(() => globalThis.__sceneBenchmark.pending) });
      }
    }
    await page.evaluate(() => { globalThis.__sceneBenchmark.restore(); delete globalThis.__sceneBenchmark; });
    await page.getByRole('button', { name: 'もうすこしぬる', exact: true }).click();
    await page.getByRole('button', { name: 'もどる', exact: true }).click(); await homeReady();
    const cycles = [];
    for (let cycle = 0; cycle < 30; cycle++) {
      const start = await page.evaluate(() => performance.now());
      await page.getByRole('button', { name: /つづきから/ }).click();
      await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
      assert.ok(page.url().endsWith(`/paint/${projectId}`));
      const openObservedMs = await page.evaluate(begin => performance.now() - begin, start);
      await page.getByRole('button', { name: 'もどる', exact: true }).click(); await homeReady();
      await expect(page.locator('.artwork-interactive')).toHaveCount(0);
      await cdp.send('HeapProfiler.collectGarbage');
      const heap = await cdp.send('Runtime.getHeapUsage');
      cycles.push({ cycle, warmup: cycle < 10, openObservedMs, heap });
    }
    const measured = cycles.filter(cycle => !cycle.warmup), first = measured[0].heap.usedSize, last = measured.at(-1).heap.usedSize;
    const result = { cpuSlowdown, viewport: '390x844', deviceScaleFactor: 2, cold, revisit, scenes, cycles, gcNormalizedGrowthBytes: last - first, pageErrors: errors };
    reports.push(result);
    assert.deepEqual(errors, []); assert.ok(scenes.every(sample => Number.isFinite(sample.drawMs) && Number.isFinite(sample.paintOpportunityMs)));
    await context.close();
  }
  const after = await performanceBuildIdentity(url); assertPerformanceBuildUnchanged(build, after);
  const result = { measuredAt: new Date().toISOString(), browserVersion: browser.version(), build, buildUnchanged: true, method: 'Fresh browser context startup and same-context Service Worker revisit; readyObservedMs includes automation observation overhead. Scene action click to actual display draw and two-rAF proxy. Thirty actual UI open/close cycles on the same saved work, first ten warmups, CDP GC-normalized JS heap. CPU throttling is desktop emulation, not a physical Android or GPU memory measurement.', reports };
  await fs.writeFile('test-results/lifecycle-performance.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ measuredAt: result.measuredAt, build: build.aggregateSha256, reports: reports.map(report => ({ cpuSlowdown: report.cpuSlowdown, coldReadyObservedMs: report.cold.readyObservedMs, revisitReadyObservedMs: report.revisit.readyObservedMs, scenes: report.scenes, gcNormalizedGrowthBytes: report.gcNormalizedGrowthBytes, pageErrors: report.pageErrors })) }, null, 2));
} finally { await browser.close(); }

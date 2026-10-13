/* global document, CanvasRenderingContext2D, requestAnimationFrame */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import fs from 'node:fs/promises';
import { performanceBuildIdentity, assertPerformanceBuildUnchanged } from './performance-evidence.mjs';

const url = process.env.PERFORMANCE_URL || 'http://127.0.0.1:4174';
const deviceScaleFactor = Number(process.env.PERFORMANCE_DPR || 1);
if (![1, 2, 3].includes(deviceScaleFactor)) throw new Error('PERFORMANCE_DPR must be 1, 2 or 3');
const build = await performanceBuildIdentity(url);
const themeId = process.env.PERFORMANCE_THEME || 'princess';
const themeName = { princess: 'おひめさま', dinosaurs: 'きょうりゅう' }[themeId];
if (!themeName) throw new Error('PERFORMANCE_THEME must be princess or dinosaurs');
const catalog = await (await fetch(new URL('/content/catalog.json', url))).json();
const selected = catalog.find(entry => entry.themeId === themeId);
if (!selected) throw new Error('No requested template in the served catalog');
const template = await (await fetch(new URL(selected.assetUrl, url))).json();
const hitContext = createCanvas(1, 1).getContext('2d');
const paths = template.regions.map(region => new Path2D(region.path));
const regionIndex = process.env.PERFORMANCE_REGION ? template.regions.findIndex(region => region.id === process.env.PERFORMANCE_REGION) : template.regions.reduce((largest, region, index) => region.bounds.width * region.bounds.height > template.regions[largest].bounds.width * template.regions[largest].bounds.height ? index : largest, 0);
if (regionIndex < 0) throw new Error('Requested benchmark region does not exist');
const region = template.regions[regionIndex];
let point;
for (let y = region.bounds.y + 30; y < region.bounds.y + region.bounds.height - 30 && !point; y += 10) {
  for (let x = region.bounds.x + 30; x < region.bounds.x + region.bounds.width - 30; x += 10) {
    const inside = [[0, 0], [24, 0], [-24, 0], [0, 24], [0, -24]].every(([dx, dy]) => {
      let found = -1;
      for (let i = paths.length - 1; i >= 0; i--) if (hitContext.isPointInPath(paths[i], x + dx, y + dy)) { found = i; break; }
      return found === regionIndex;
    });
    if (inside) { point = { x, y }; break; }
  }
}
if (!point) throw new Error('No stable benchmark tap point');
const percentile = (values, amount) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * amount))];
const stats = values => ({ count: values.length, p50Ms: percentile(values, 0.5), p95Ms: percentile(values, 0.95), maxMs: Math.max(...values) });
async function selectedSwatch(button) {
  const color = await button.evaluate(element => element.style.getPropertyValue('--swatch').trim());
  assert.match(color, /^#[0-9a-f]{6}$/i, 'Record the actual palette custom property, not an empty inline backgroundColor');
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
  return color;
}
const browser = await chromium.launch({ headless: true });
const reports = [];
try {
  for (const rate of [1, 4]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor, locale: 'ja-JP' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.goto(url);
    await page.getByRole('button', { name: `${themeName}のしま`, exact: true }).click();
    await page.locator('.template-card').first().click();
    await page.getByRole('button', { name: '完成', exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('.complete-button').disabled);
    await page.evaluate(() => {
      const canvas = document.querySelector('.artwork-transform canvas');
      const stage = document.querySelector('.artwork-interactive');
      const state = { samples: [], pending: null, frames: [], samplingFrames: false, nextTap: false, phase: 'uncached-colors' };
      globalThis.__islandBenchmark = state;
      stage.addEventListener('pointerup', () => {
        if (state.samplingFrames && !state.nextTap) return;
        state.nextTap = false;
        const sample = { start: performance.now(), material: state.material, color: state.color, phase: state.phase };
        state.samples.push(sample); state.pending = sample;
      }, { capture: true });
      const original = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        const result = Reflect.apply(original, this, args);
        if (this.canvas === canvas && state.pending && state.pending.drawMs === undefined) {
          const sample = state.pending;
          sample.drawMs = performance.now() - sample.start;
          requestAnimationFrame(() => requestAnimationFrame(() => { sample.paintOpportunityMs = performance.now() - sample.start; }));
        }
        return result;
      };
    });
    await cdp.send('HeapProfiler.collectGarbage');
    const initialHeap = (await cdp.send('Runtime.getHeapUsage')).usedSize;
    const materialLabels = ['なめらか', 'クレヨン', 'いろえんぴつ'];
    for (const material of materialLabels) {
      await page.evaluate(value => { globalThis.__islandBenchmark.material = value; }, material);
      await page.getByRole('group', { name: '画材', exact: true }).getByRole('button', { name: material, exact: true }).click();
      for (let sample = 0; sample < 12; sample++) {
        const shade = page.locator('.shades button').nth(sample);
        await shade.click();
        await page.evaluate(color => { globalThis.__islandBenchmark.color = color; }, await selectedSwatch(shade));
        const bounds = await page.getByTestId('artwork').boundingBox();
        await page.mouse.click(bounds.x + point.x / 1600 * bounds.width, bounds.y + point.y / 2000 * bounds.height);
        await page.waitForFunction(() => globalThis.__islandBenchmark.pending?.paintOpportunityMs !== undefined);
      }
    }
    await page.locator('.zoom-tools button').last().click();
    await page.evaluate(() => {
      const state = globalThis.__islandBenchmark;
      state.samplingFrames = true;
      state.phase = 'mixed-pan-zoom-paint';
      const frame = time => { state.frames.push(time); if (state.samplingFrames) requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    });
    const area = await page.getByTestId('artwork').boundingBox();
    for (let i = 0; i < 4; i++) {
      const x = area.x + area.width / 2, y = area.y + area.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x + (i % 2 ? -70 : 70), y + (i % 2 ? 55 : -55), { steps: 30 });
      await page.mouse.up(); await page.mouse.wheel(0, i % 2 ? 90 : -90);
      await page.getByRole('button', { name: 'もとの大きさ', exact: true }).click();
      await page.getByRole('button', { name: 'あおのしま', exact: true }).click();
      const shade = page.locator('.shades button').nth(i);
      await shade.click();
      await page.evaluate(color => { const state = globalThis.__islandBenchmark; state.color = color; state.nextTap = true; }, await selectedSwatch(shade));
      const paintBounds = await page.getByTestId('artwork').boundingBox();
      await page.mouse.click(paintBounds.x + point.x / 1600 * paintBounds.width, paintBounds.y + point.y / 2000 * paintBounds.height);
      await page.waitForFunction(() => globalThis.__islandBenchmark.pending?.phase === 'mixed-pan-zoom-paint' && globalThis.__islandBenchmark.pending?.paintOpportunityMs !== undefined);
      await page.getByRole('button', { name: 'おおきく', exact: true }).click();
    }
    await page.evaluate(() => { globalThis.__islandBenchmark.samplingFrames = false; });
    await cdp.send('HeapProfiler.collectGarbage');
    const finalHeap = (await cdp.send('Runtime.getHeapUsage')).usedSize;
    const results = await page.evaluate(() => globalThis.__islandBenchmark);
    const canvasSize = await page.getByTestId('artwork').locator('canvas').evaluate(canvas => ({ width: canvas.width, height: canvas.height }));
    const intervals = results.frames.slice(1).map((time, index) => time - results.frames[index]);
    const uncached = results.samples.filter(sample => sample.phase === 'uncached-colors'), mixed = results.samples.filter(sample => sample.phase === 'mixed-pan-zoom-paint');
    reports.push({ cpuSlowdown: rate, viewport: '390x844', deviceScaleFactor, canvasSize, samples: uncached.length, firstCanvasDraw: stats(uncached.map(sample => sample.drawMs)), afterPaintOpportunity: stats(uncached.map(sample => sample.paintOpportunityMs)), perMaterial: Object.fromEntries(materialLabels.map(material => [material, { ...stats(uncached.filter(sample => sample.material === material).map(sample => sample.drawMs)), distinctColors: new Set(uncached.filter(sample => sample.material === material).map(sample => sample.color)).size }])), mixed: { samples: mixed.length, firstCanvasDraw: stats(mixed.map(sample => sample.drawMs)), afterPaintOpportunity: stats(mixed.map(sample => sample.paintOpportunityMs)) }, rawSamples: results.samples, activeGestureFrameIntervals: stats(intervals), estimatedActiveFps: 1000 / (intervals.reduce((sum, value) => sum + value, 0) / intervals.length), initialHeap, finalHeap, pageErrors: errors });
    await context.close();
  }
  const after = await performanceBuildIdentity(url); assertPerformanceBuildUnchanged(build, after);
  const result = { measuredAt: new Date().toISOString(), browserVersion: browser.version(), build, buildUnchanged: true, environment: `Headless Chromium on this Windows desktop; 390x844 viewport, DPR ${deviceScaleFactor}, CPU 1x/4x. This is not a physical Android device or GPU memory measurement.`, method: 'Actual pointerup to first display-canvas draw, then two requestAnimationFrame callbacks as a conservative paint-opportunity proxy. Each material uses twelve distinct colors with no artificial pause. A further four uncached colors are interleaved with drag/wheel/zoom. Heap is GC-normalized JS heap before/after these 40 paints.', reports };
  await fs.mkdir('test-results', { recursive: true });
  Object.assign(result, { templateId: template.id, regionId: region.id });
  result.pass = reports.every(report => report.samples === 36 && report.mixed.samples === 4 && Object.values(report.perMaterial).every(material => material.distinctColors === 12) && report.rawSamples.every(sample => Number.isFinite(sample.drawMs) && Number.isFinite(sample.paintOpportunityMs)) && report.firstCanvasDraw.p95Ms <= 100 && report.mixed.firstCanvasDraw.p95Ms <= 100 && Number.isFinite(report.estimatedActiveFps) && report.pageErrors.length === 0);
  const suffix = `${themeId === 'princess' ? '' : `-${themeId}`}${deviceScaleFactor === 1 ? '' : `-dpr${deviceScaleFactor}`}`;
  const output = `test-results/interaction-performance${suffix}.json`;
  await fs.writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ ...result, build: { aggregateSha256: build.aggregateSha256, sourceAggregateSha256: build.sourceAggregateSha256 }, reports: reports.map(report => ({ ...report, rawSamples: undefined })) }, null, 2));
  if (!result.pass) process.exitCode = 1;
} finally { await browser.close(); }

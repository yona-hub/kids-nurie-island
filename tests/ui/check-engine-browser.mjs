/* global document, window, DOMMatrix, getComputedStyle, createImageBitmap */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, firefox, webkit } from '@playwright/test';
import { build } from 'vite';
import { checkBrowser } from '../../scripts/check-browser.mjs';

// Bundle the real component/engine separately so app HMR and changing UI copy
// cannot invalidate the renderer probe. The browser route serves only this fixture.
const outDir = resolve('test-results/engine-browser-bundle');
await build({
  configFile: false, logLevel: 'error',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { outDir, emptyOutDir: false, target: 'es2022', lib: { entry: resolve('tests/ui/browser-engine-entry.tsx'), formats: ['es'], fileName: () => 'fixture.js' } },
  resolve: { alias: { '@island/engine': resolve('packages/coloring-engine/src/index.ts'), '@island/content': resolve('packages/content-schema/src/index.ts'), '@island/shared': resolve('packages/shared-types/src/index.ts') } },
});
const source = await readFile(resolve(outDir, 'fixture.js'), 'utf8');
const launchers = { chromium, firefox, webkit };
const selectedBrowsers = process.env.ENGINE_BROWSERS?.split(',').map(name => name.trim()) ?? ['chromium', 'webkit'];
assert.ok(selectedBrowsers.length > 0 && selectedBrowsers.every(name => Object.hasOwn(launchers, name)), 'ENGINE_BROWSERS must contain chromium, firefox, or webkit');
assert.equal(new Set(selectedBrowsers).size, selectedBrowsers.length, 'ENGINE_BROWSERS contains duplicate names');
const templateDirectory = 'apps/web/public/content/templates';
const catalogPath = 'apps/web/public/content/catalog.json';
const catalogBytes = await readFile(catalogPath);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalogSha256 = digest(catalogBytes);
const catalog = JSON.parse(catalogBytes.toString('utf8'));
assert.ok(catalog.length > 0, 'No catalog templates available for the renderer probe');
assert.equal(new Set(catalog.map(entry => entry.id)).size, catalog.length, 'Duplicate catalog template IDs');
// Follow the same immutable asset URLs as the app. Old unversioned files may
// remain for saved projects and must not silently enter the current-art probe.
const inputs = await Promise.all(catalog.map(async entry => {
  const match = /^\/content\/templates\/([a-z0-9-]+\.([a-f0-9]{64})\.json)$/.exec(entry.assetUrl);
  assert.ok(match, `Expected an immutable template URL: ${entry.id}`);
  const file = match[1], bytes = await readFile(`${templateDirectory}/${file}`);
  const sha256 = digest(bytes), template = JSON.parse(bytes.toString('utf8'));
  assert.equal(sha256, match[2], `Asset content hash: ${entry.id}`);
  assert.equal(template.id, entry.id, `Catalog template identity: ${entry.id}`);
  assert.equal(template.regions.length, entry.regionCount, `Catalog region count: ${entry.id}`);
  assert.equal(template.approved, true, `Catalog template is not enabled: ${entry.id}`);
  return { file, sha256, template };
}));
const templateFiles = inputs.map(input => input.file);
const templates = inputs.map(input => input.template);
const checksum = createHash('sha256').update(JSON.stringify(templates)).digest('hex');
const reportBase = templates.every(template => template.id.startsWith('gen-')) ? 'engine-browser-generated' : 'engine-browser-regression';
// Keep explicit single-browser runs separate from the earlier cross-browser evidence.
const reportName = process.env.ENGINE_BROWSERS ? `${reportBase}-${selectedBrowsers.join('-')}` : reportBase;
const html = '<!doctype html><html><head><style>body{margin:0}.artwork-viewport{width:400px;height:500px;overflow:hidden;touch-action:none;position:relative}.artwork-transform{width:100%;height:100%;transform-origin:0 0}.artwork-transform canvas{display:block;width:100%;height:100%}</style></head><body><div id="root"></div><script type="module">import * as api from "/fixture.js";window.engineFixture=api</script></body></html>';
checkBrowser();
const reports = [];
for (const name of selectedBrowsers) {
  const launcher = launchers[name];
  const executableOverride = name === 'firefox' ? process.env.FIREFOX_EXECUTABLE_PATH : undefined;
  const executablePath = executableOverride ? resolve(executableOverride) : launcher.executablePath();
  const executableSha256 = digest(await readFile(executablePath));
  const browser = await launcher.launch({ headless: true, ...(executableOverride ? { executablePath } : {}) });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 800, height: 700 }, deviceScaleFactor: 1, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('http://engine-fixture.test/**', route => route.fulfill({ contentType: route.request().url().endsWith('/fixture.js') ? 'text/javascript' : 'text/html', body: route.request().url().endsWith('/fixture.js') ? source : html }));
    await page.goto('http://engine-fixture.test/');
    await page.waitForFunction(() => Boolean(window.engineFixture));
    const rendering = [];
    for (const template of templates) {
      for (const width of [320, 800, 1280]) {
        const result = await page.evaluate(async ({ template, width }) => {
          const Engine = window.engineFixture.ColoringEngine;
          const actualCanvas = document.createElement('canvas');
          const referenceCanvas = document.createElement('canvas');
          const actual = new Engine(actualCanvas), reference = new Engine(referenceCanvas);
          actual.resize(width, width * 1.25, 1); reference.resize(width, width * 1.25, 1);
          const compare = phase => {
            reference.loadTemplate(template, actual.getPaints());
            const pixels = actualCanvas.getContext('2d').getImageData(0, 0, width, width * 1.25).data;
            const expected = referenceCanvas.getContext('2d').getImageData(0, 0, width, width * 1.25).data;
            let differentPixels = 0, maxChannelDifference = 0;
            for (let offset = 0; offset < pixels.length; offset += 4) {
              let changed = false;
              for (let channel = 0; channel < 4; channel++) {
                const difference = Math.abs(pixels[offset + channel] - expected[offset + channel]);
                maxChannelDifference = Math.max(maxChannelDifference, difference);
                if (difference) changed = true;
              }
              if (changed) differentPixels++;
            }
            return { phase, differentPixels, maxChannelDifference };
          };
          try {
            actual.loadTemplate(template);
            template.regions.forEach((region, index) => actual.paint(region.id, { color: ['#FF6AA3', '#4EAEFF', '#25C95B'][index % 3], paintType: ['smooth', 'crayon', 'pencil'][index % 3] }, undefined, true));
            const phases = [compare('paint-every-region')];
            template.regions.slice(0, 4).forEach((region, index) => actual.paint(region.id, index % 2 ? null : { color: '#FFD8B2', paintType: 'pencil' }, undefined, true));
            phases.push(compare('overwrite-and-erase'));
            let exported = null;
            if (width === 320) {
              const png = await actual.exportPng(), thumbnail = await actual.exportThumbnail();
              const pngImage = await createImageBitmap(png), thumbnailImage = await createImageBitmap(thumbnail);
              exported = { png: { type: png.type, bytes: png.size, width: pngImage.width, height: pngImage.height }, thumbnail: { type: thumbnail.type, bytes: thumbnail.size, width: thumbnailImage.width, height: thumbnailImage.height } };
              pngImage.close(); thumbnailImage.close();
            }
            return { templateId: template.id, width, phases, exported };
          } finally { actual.dispose(); reference.dispose(); }
        }, { template, width });
        rendering.push(result);
      }
    }
    const gesture = await page.evaluate(async template => {
      window.artworkGesture = await window.engineFixture.mountArtwork(document.getElementById('root'), template);
      window.artworkGesture.zoom(2);
      return { expected: { scale: 1.5, x: 0, y: 0 } };
    }, templates[0]);
    const view = () => page.locator('.artwork-transform').evaluate(element => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return { scale: matrix.a, x: matrix.e, y: matrix.f };
    });
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.artwork-transform')).transform).a === 2);
    await page.mouse.move(100, 100); await page.mouse.down(); await page.mouse.move(400, 400, { steps: 4 }); await page.mouse.up();
    assert.deepEqual(await view(), { scale: 2, x: 0, y: 0 });
    if (name === 'chromium') {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: 100, y: 250 }, { id: 2, x: 300, y: 250 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: 100, y: 250 }, { id: 2, x: 250, y: 250 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    } else {
      const stage = page.getByTestId('artwork');
      // Playwright has no multi-touch protocol for Firefox/WebKit. Synthetic PointerEvents
      // cannot acquire native capture; Chromium above covers that lifecycle.
      await stage.evaluate(element => {
        element.setPointerCapture = () => undefined;
        element.hasPointerCapture = () => false;
      });
      await stage.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 250, button: 0 });
      await stage.dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 300, clientY: 250, button: 0 });
      await stage.dispatchEvent('pointermove', { pointerId: 2, pointerType: 'touch', clientX: 250, clientY: 250 });
      await stage.dispatchEvent('pointerup', { pointerId: 2, pointerType: 'touch', clientX: 250, clientY: 250 });
      await stage.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 250 });
    }
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.artwork-transform')).transform).a === 1.5);
    gesture.actual = await view();
    gesture.paintCount = await page.evaluate(() => window.artworkGesture.paints.length);
    await page.screenshot({ path: `test-results/${reportName}-pinch-${name}.png` });
    await page.evaluate(() => window.artworkGesture.dispose());
    reports.push({ browser: name, version: browser.version(), executablePath, executableSha256, executableOverride: Boolean(executableOverride), rendering, gesture, errors });
    await context.close();
  } finally { await browser.close(); }
}
assert.equal(digest(await readFile(catalogPath)), catalogSha256, 'Catalog changed during renderer QA; rerun against the final catalog');
for (const input of inputs) assert.equal(digest(await readFile(`${templateDirectory}/${input.file}`)), input.sha256, `Template changed during renderer QA: ${input.file}`);
const result = { measuredAt: new Date().toISOString(), catalogSource: catalogPath, catalogSha256, templateSource: templateDirectory, templateFiles, templateChecksum: checksum, templates: inputs.map(input => ({ id: input.template.id, sha256: input.sha256, regionCount: input.template.regions.length })), totalRegions: templates.reduce((sum, template) => sum + template.regions.length, 0), method: 'Real bundled engine and ArtworkCanvas. Uses only current catalog immutable template URLs and verifies each asset SHA-256 and enabled approval flag without modifying it. All regions painted incrementally, then overwritten/erased, compared bytewise with a fresh full redraw at 3 resolutions. Catalog and asset hashes are checked again after the run. Chromium pinch uses native CDP touch events; Firefox/WebKit use synthetic DOM PointerEvents with capture stubbed because Playwright does not expose native multi-touch for them.', reports };
await mkdir('test-results', { recursive: true });
await writeFile(`test-results/${reportName}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ measuredAt: result.measuredAt, report: `test-results/${reportName}.json`, templateChecksum: checksum, templateCount: templates.length, totalRegions: result.totalRegions, reports: reports.map(report => ({ browser: report.browser, version: report.version, cases: report.rendering.length, renderingFailureCount: report.rendering.filter(test => test.phases.some(phase => phase.differentPixels > 0)).length, maximumDifference: Math.max(...report.rendering.flatMap(test => test.phases.map(phase => phase.maxChannelDifference))), gesture: report.gesture, errors: report.errors })) }, null, 2));
for (const report of reports) {
  assert.deepEqual(report.errors, [], `${report.browser} console errors`);
  assert.deepEqual(report.gesture.actual, report.gesture.expected, `${report.browser} A04-01 pinch regression`);
  assert.equal(report.gesture.paintCount, 0, `${report.browser} pinch must not paint`);
  assert.ok(report.rendering.every(test => test.phases.every(phase => phase.differentPixels === 0)), `${report.browser} dirty rectangles must match full redraws`);
  for (const test of report.rendering.filter(test => test.exported)) {
    const { png, thumbnail } = test.exported;
    assert.deepEqual([png.type, png.width, png.height], ['image/png', 2048, 2560], `${report.browser} ${test.templateId} PNG export`);
    assert.ok(png.bytes > 0 && thumbnail.bytes > 0, 'Both image exports must contain bytes');
    assert.ok(['image/webp', 'image/png'].includes(thumbnail.type), 'Thumbnail format must be supported');
    assert.deepEqual([thumbnail.width, thumbnail.height], [320, 400], `${report.browser} ${test.templateId} thumbnail dimensions`);
  }
}

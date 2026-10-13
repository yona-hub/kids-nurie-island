/* global document, window, DOMMatrix, getComputedStyle, requestAnimationFrame, KeyboardEvent */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, firefox, webkit } from '@playwright/test';
import { build } from 'vite';
import { checkBrowser } from '../../scripts/check-browser.mjs';

// This separate fixture has the production component, engine and focus styles.
// It exposes no test hooks in the application shipped to users.
const directory = resolve('test-results/keyboard-browser-component');
await mkdir(directory, { recursive: true });
await build({
  configFile: false, logLevel: 'error',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { outDir: `${directory}/bundle`, emptyOutDir: false, target: 'es2022', lib: { entry: resolve('tests/ui/browser-engine-entry.tsx'), formats: ['es'], fileName: () => 'fixture.js' } },
  resolve: { alias: { '@island/engine': resolve('packages/coloring-engine/src/index.ts'), '@island/content': resolve('packages/content-schema/src/index.ts'), '@island/shared': resolve('packages/shared-types/src/index.ts') } },
});
const source = await readFile(`${directory}/bundle/fixture.js`, 'utf8');
const styles = await readFile('apps/web/src/styles-editor.css', 'utf8');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalogPath = 'apps/web/public/content/catalog.json';
const catalogBytes = await readFile(catalogPath), catalogSha256 = digest(catalogBytes);
const inputs = await Promise.all(JSON.parse(catalogBytes).map(async entry => {
  const path = `apps/web/public${entry.assetUrl}`, bytes = await readFile(path), template = JSON.parse(bytes);
  assert.equal(template.id, entry.id); assert.equal(template.approved, true);
  assert.ok(entry.assetUrl.endsWith(`.${digest(bytes)}.json`), 'Must use current immutable templates');
  return { path, sha256: digest(bytes), template };
}));
const eyeMap = JSON.parse(await readFile('content/generated-lineart/eye-region-map.json', 'utf8'));
const html = '<!doctype html><html><head><link rel="stylesheet" href="/style.css"><style>*{box-sizing:border-box}body{margin:0}#root{width:400px;height:500px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style></head><body><div id="root"></div><button id="outside">Outside canvas</button><script type="module">import * as api from "/fixture.js";window.engineFixture=api</script></body></html>';
const launchers = { chromium, firefox, webkit };
const names = process.env.KEYBOARD_BROWSERS?.split(',') ?? ['chromium', 'firefox', 'webkit'];
assert.ok(names.length > 0 && names.every(name => Object.hasOwn(launchers, name)));
const reports = [];
const readiness = checkBrowser();
for (const name of names) {
  const override = name === 'firefox' ? process.env.FIREFOX_EXECUTABLE_PATH : undefined;
  const executablePath = override ? resolve(override) : launchers[name].executablePath();
  const browser = await launchers[name].launch({ headless: true, ...(override ? { executablePath } : {}) });
  const errors = [], results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 800, height: 700 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('http://keyboard-fixture.test/**', route => {
      const path = new URL(route.request().url()).pathname;
      return route.fulfill({ contentType: path === '/fixture.js' ? 'text/javascript' : path === '/style.css' ? 'text/css' : 'text/html', body: path === '/fixture.js' ? source : path === '/style.css' ? styles : html });
    });
    await page.goto('http://keyboard-fixture.test/');
    await page.waitForFunction(() => Boolean(window.engineFixture));
    for (const { template } of inputs) {
      const eyes = eyeMap.find(entry => entry.templateId === template.id)?.eyes ?? [];
      const result = await page.evaluate(async ({ template, eyes }) => {
        const frame = () => new Promise(requestAnimationFrame);
        const check = (condition, message) => { if (!condition) throw new Error(`${template.id}: ${message}`); };
        const fixture = await window.engineFixture.mountArtwork(document.getElementById('root'), template);
        window.keyboardFixture = fixture;
        const engine = fixture.engine(), before = JSON.stringify(engine.getMetrics());
        const initialLookupMs = [], anchors = {};
        for (const region of template.regions) {
          const start = performance.now(), point = engine.getRegionPoint(region.id);
          initialLookupMs.push(performance.now() - start);
          check(point && engine.hitTest(point, false) === region.id, `invalid anchor ${region.id}`);
          anchors[region.id] = point;
        }
        check(JSON.stringify(engine.getMetrics()) === before, 'anchor lookup must not render or allocate texture surfaces');
        const stage = document.querySelector('[data-testid="artwork"]');
        stage.focus(); await frame();
        const view = () => new DOMMatrix(getComputedStyle(document.querySelector('.artwork-transform')).transform);
        const press = key => stage.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        const verifySelection = (region, scale) => {
          const marker = document.querySelector('.region-focus-marker'), area = stage.getBoundingClientRect(), box = marker.getBoundingClientRect();
          check(marker.dataset.regionId === region.id, `selection ${region.id}`);
          check(view().a === scale, `changed zoom ${region.id} at ${scale}`);
          check(box.left >= area.left - .1 && box.top >= area.top - .1 && box.right <= area.right + .1 && box.bottom <= area.bottom + .1, `clipped focus marker ${region.id} at ${scale}: ${JSON.stringify({ box: box.toJSON(), area: area.toJSON() })}`);
          const path = document.querySelector('.region-focus-overlay path');
          const cssStrokeWidth = Number(path.getAttribute('stroke-width')) * area.width / 1600 * scale;
          check(Math.abs(cssStrokeWidth - 2) < .01, 'outline must remain 2 CSS pixels at every zoom');
        };
        let selected = 0, checks = 0;
        for (const scale of [1, 2, 4]) {
          fixture.zoom(scale / view().a); await frame();
          for (const direction of [1, -1]) {
            for (let i = 0; i < template.regions.length; i++) {
              selected = (selected + direction + template.regions.length) % template.regions.length;
              press(direction === 1 ? 'ArrowRight' : 'ArrowLeft'); await frame();
              const region = template.regions[selected];
              verifySelection(region, scale);
              const count = fixture.paints.length;
              press('Enter');
              check(fixture.paints.length === count + 1, `Enter did not paint ${region.id}`);
              const painted = fixture.paints.at(-1);
              check(painted.regionId === region.id && engine.hitTest(painted.point, false) === region.id, `wrong Enter target ${region.id}`);
              check(engine.getPaints()[region.id]?.color === '#FF6AA3', `paint not committed ${region.id}`);
              checks++;
            }
          }
        }
        // White highlights must remain visibly distinct while their exact cells
        // are selected. Uses the canvas pixels, never the SVG focus indicator.
        engine.setScene({ regions: {} });
        for (const eye of eyes) for (const id of eye.pupilIds) engine.paint(id, { color: '#000000', paintType: 'smooth' }, anchors[id], true);
        const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
        const pixel = id => {
          const point = anchors[id];
          return [...ctx.getImageData(Math.round(point.x / 1600 * canvas.width), Math.round(point.y / 2000 * canvas.height), 1, 1).data];
        };
        const highlights = [];
        for (const eye of eyes) {
          const index = template.regions.findIndex(region => region.id === eye.highlightId);
          while (selected !== index) {
            selected = (selected + 1) % template.regions.length;
            press('ArrowRight'); await frame();
          }
          verifySelection(template.regions[selected], 4);
          const white = pixel(eye.highlightId);
          check(white[0] > 245 && white[1] > 245 && white[2] > 245, `highlight center not white before painting ${eye.highlightId}: ${white}`);
          press('Enter');
          check(engine.getPaints()[eye.highlightId]?.color === '#FF6AA3', `highlight Enter did not paint ${eye.highlightId}`);
          engine.paint(eye.highlightId, null, anchors[eye.highlightId], true);
          const erased = pixel(eye.highlightId);
          check(erased[0] > 245 && erased[1] > 245 && erased[2] > 245, `highlight erase not white ${eye.highlightId}`);
          for (const id of eye.pupilIds) check(engine.getPaints()[id]?.color === '#000000', `pupil changed ${id}`);
          highlights.push({ id: eye.highlightId, whiteBefore: white, whiteAfterErase: erased, independentPupilIds: eye.pupilIds });
        }
        return { templateId: template.id, regions: template.regions.length, scales: [1, 2, 4], directions: ['forward', 'reverse'], checks, initialLookupMs, anchorLookupRerenders: 0, highlights };
      }, { template, eyes });
      // Native browser key dispatch supplements the exhaustive synthetic matrix.
      await page.getByTestId('artwork').press('ArrowRight');
      await page.getByTestId('artwork').press('Enter');
      const native = await page.evaluate(() => {
        const fixture = window.keyboardFixture, marker = document.querySelector('.region-focus-marker');
        return { selected: marker.dataset.regionId, painted: fixture.paints.at(-1).regionId };
      });
      assert.equal(native.selected, native.painted, `${name} native keyboard ${template.id}`);
      result.native = native;
      if (eyes.length) {
        // Leave a selected white highlight with its black pupil for visual QA.
        await page.getByTestId('artwork').press('ArrowLeft');
        const image = `${directory}/${name}-${template.id}-highlight4.png`;
        await page.getByTestId('artwork').screenshot({ path: image });
        result.screenshot = image;
      }
      await page.evaluate(() => window.keyboardFixture.dispose());
      results.push(result);
      console.log(`${name}: ${template.id} ${result.checks} selection/Enter checks, ${result.highlights.length} white highlights PASS`);
    }
    const times = results.flatMap(result => result.initialLookupMs).sort((a, b) => a - b);
    reports.push({ browser: name, version: browser.version(), executablePath, executableSha256: digest(await readFile(executablePath)), executableOverride: Boolean(override), checks: results.reduce((sum, result) => sum + result.checks, 0), highlights: results.reduce((sum, result) => sum + result.highlights.length, 0), lookupP95Ms: times[Math.floor(times.length * .95)], lookupMaxMs: times.at(-1), errors, templates: results });
    await context.close();
  } finally { await browser.close(); }
}
assert.equal(digest(await readFile(catalogPath)), catalogSha256, 'Catalog changed during validation');
for (const input of inputs) assert.equal(digest(await readFile(input.path)), input.sha256, `Template changed: ${input.template.id}`);
const result = { measuredAt: new Date().toISOString(), catalogSha256, sourceSha256: digest(source), stylesSha256: digest(styles), totalRegions: inputs.reduce((sum, input) => sum + input.template.regions.length, 0), templates: inputs.map(input => ({ id: input.template.id, sha256: input.sha256 })), method: 'Production ArtworkCanvas/engine and focus CSS. Exhaustive DOM KeyboardEvent matrix in real Canvas2D browsers at 1/2/4× forward/reverse; requestAnimationFrame after each selection permits React commit. Visible full marker, unchanged scale, exact hit and committed Enter paint asserted. Native Playwright key pair per template supplements the matrix; full application keyboard behavior is separately tested in keyboard.spec.ts. No raster analysis in anchor lookup. Existing approved template hashes must remain unchanged.', readiness, reports };
await writeFile(`${directory}/results.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ report: `${directory}/results.json`, totalRegions: result.totalRegions, reports: reports.map(({ browser, checks, highlights, lookupP95Ms, lookupMaxMs, errors }) => ({ browser, checks, highlights, lookupP95Ms, lookupMaxMs, errors })) }, null, 2));
for (const report of reports) assert.deepEqual(report.errors, [], `${report.browser} console errors`);

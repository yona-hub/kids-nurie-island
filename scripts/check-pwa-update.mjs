/* global indexedDB, navigator, document, IDBObjectStore, ServiceWorker, window, CustomEvent, location */
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';
import { checkBrowser } from './check-browser.mjs';
import { performanceBuildIdentity, assertPerformanceBuildUnchanged } from './performance-evidence.mjs';

const root = path.resolve('dist-demo');
const workerBytes = await fs.readFile(path.join(root, 'sw.js'));
let revision = 1;
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (target !== root && !target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    let file = target;
    try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
    catch { file = path.join(root, 'index.html'); }
    const data = url.pathname === '/sw.js' ? Buffer.concat([workerBytes, Buffer.from(`\n// update-test-revision:${revision}\n`)]) : await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(data);
  } catch { response.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const build = await performanceBuildIdentity(origin);
const output = 'test-results/vector-improvement/pwa';
await fs.mkdir(output, { recursive: true });
checkBrowser();
const browser = await chromium.launch({ channel:'chrome',headless: true });
const errors = [];
const resourceErrors = [], failedRequests = [], expectedOfflineChecks = [];
let offlinePhase = false;
const watchErrors = page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText, offlinePhase }));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const record = { text: message.text(), location: message.location(), offlinePhase };
    resourceErrors.push(record);
    // An automatic SW update check may try the network after an offline reload.
    // Only this exact background worker URL/error is expected; app assets fail.
    if (offlinePhase && record.location.url === `${origin}/sw.js` && record.text === 'Failed to load resource: net::ERR_INTERNET_DISCONNECTED') expectedOfflineChecks.push(record);
    else errors.push(record.text);
  });
};
const projects = page => page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('kids-nurie-island-v1');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('projects', 'readonly').objectStore('projects').getAll();
      request.onsuccess = () => resolve(request.result.filter(row => !row.deleted).map(row => row.project));
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
});
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const drawing = await context.newPage();
  watchErrors(drawing);
  await drawing.goto(origin + '/#/home');
  await drawing.getByRole('button', { name: 'おひめさまのしま', exact: true }).click();
  await drawing.locator('.template-card').first().click();
  await expect(drawing.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await drawing.getByRole('button', { name: 'こまかく',exact:true }).click();
  await expect.poll(() => drawing.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await drawing.getByTestId('artwork').focus();
  await drawing.getByTestId('artwork').press('Enter');
  await expect.poll(async () => Object.keys((await projects(drawing))[0].regions).length).toBe(1);
  await drawing.getByRole('button', { name: 'おおきく', exact: true }).click();
  const transform = await drawing.locator('.artwork-transform').getAttribute('data-view-scale');
  expect(Number(transform)).toBeGreaterThan(1);
  const saved = (await projects(drawing))[0];
  await drawing.evaluate(() => { globalThis.__updateTestDocument = 'original-editor'; });
  const home = await context.newPage();
  watchErrors(home);
  await home.goto(origin + '/#/home');
  await home.getByRole('button', { name: 'おひめさまのしま',exact:true }).waitFor();
  revision = 2;
  await home.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
  await expect.poll(() => home.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(true);
  await home.getByRole('button', { name: '更新する', exact: true }).click();
  await expect(home.getByText('ほかのタブを閉じてから、もういちど更新してください', { exact: true })).toBeVisible();
  for (const name of ['更新する', 'あとで']) {
    const bounds = await home.getByRole('button', { name, exact: true }).boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
  expect(await drawing.evaluate(() => globalThis.__updateTestDocument)).toBe('original-editor');
  expect(await drawing.locator('.artwork-transform').getAttribute('data-view-scale')).toBe(transform);
  expect((await projects(drawing))[0].regions).toEqual(saved.regions);
  expect(await home.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(true);
  await home.screenshot({ path: `${output}/update-other-tab-blocked.png`, fullPage: true });
  await drawing.close();

  // The demo has no live cloud. Delay the real exported service's flush
  // completion boundary; keep App's actual button/await and the native SW real.
  await home.evaluate(async () => {
    const url = document.querySelector('script[type="module"][src]').src;
    const module = await import(url);
    const services = Object.values(module).find(value => value && typeof value === 'object' && typeof value.sync?.flush === 'function' && value.projects);
    if (!services) throw new Error('The built application service export was not found');
    const flush = services.sync.flush;
    const put = IDBObjectStore.prototype.put;
    const post = ServiceWorker.prototype.postMessage;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const state = globalThis.__delayedUpdate = { syncHeld: true, saveHeld: false, flushStarted: 0, flushCompleted: 0, writes: 0, applyEvents: 0, activationRequests: 0, controllerChanges: 0 };
    globalThis.__updateTestDocument = 'delayed-update-editor';
    window.addEventListener('island-apply-update', () => { state.applyEvents++; });
    navigator.serviceWorker.addEventListener('controllerchange', () => { state.controllerChanges++; });
    ServiceWorker.prototype.postMessage = function (...args) {
      if (args[0]?.type === 'ISLAND_ACTIVATE_UPDATE') state.activationRequests++;
      return post.apply(this, args);
    };
    services.sync.flush = async (...args) => {
      await flush(...args);
      if (state.syncHeld) { state.flushStarted++; await gate; }
      state.flushCompleted++;
    };
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (this.name === 'projects' && state.saveHeld) {
        state.writes++;
        const keepAlive = () => {
          if (!state.saveHeld) return;
          this.get('__pwa_uncommitted__').onsuccess = keepAlive;
        };
        keepAlive();
      }
      return request;
    };
    state.releaseSync = () => { state.syncHeld = false; release(); };
    state.restore = () => { services.sync.flush = flush; IDBObjectStore.prototype.put = put; ServiceWorker.prototype.postMessage = post; };
  });
  await home.getByRole('button', { name: '更新する', exact: true }).click();
  await expect.poll(() => home.evaluate(() => globalThis.__delayedUpdate.flushStarted)).toBe(1);
  await home.evaluate(id => { location.hash = `/paint/${id}`; }, saved.id);
  await expect(home.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await home.evaluate(() => { globalThis.__delayedUpdate.saveHeld = true; });
  await home.getByTestId('artwork').focus();
  await home.getByTestId('artwork').press('ArrowRight');
  await home.getByTestId('artwork').press('Enter');
  await expect.poll(() => home.evaluate(() => globalThis.__delayedUpdate.writes)).toBe(1);
  await home.getByRole('button', { name: 'もどる', exact: true }).click();
  await expect(home.getByRole('dialog', { name: 'まだ保存できていない変更があります' })).toBeVisible();
  await expect(home).toHaveURL(/#\/home$/);
  await home.evaluate(() => { globalThis.__delayedUpdate.releaseSync(); });
  await expect.poll(() => home.evaluate(() => globalThis.__delayedUpdate.flushCompleted)).toBeGreaterThanOrEqual(1);
  const delayed = await home.evaluate(() => ({
    document: globalThis.__updateTestDocument,
    applyEvents: globalThis.__delayedUpdate.applyEvents,
    activationRequests: globalThis.__delayedUpdate.activationRequests,
    controllerChanges: globalThis.__delayedUpdate.controllerChanges,
    saveHeld: globalThis.__delayedUpdate.saveHeld,
  }));
  expect(delayed).toEqual({ document: 'delayed-update-editor', applyEvents: 0, activationRequests: 0, controllerChanges: 0, saveHeld: true });
  expect(await home.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(true);
  // Independently bypass the button's guard: registration still rejects an
  // update while the actual editor is retained behind URL #/home.
  await home.evaluate(() => { window.dispatchEvent(new CustomEvent('island-apply-update')); });
  expect(await home.evaluate(() => globalThis.__delayedUpdate.activationRequests)).toBe(0);
  await home.screenshot({ path: `${output}/update-delayed-editor-blocked.png`, fullPage: true });
  await home.evaluate(() => { globalThis.__delayedUpdate.saveHeld = false; });
  await expect.poll(async () => Object.keys((await projects(home))[0].regions).length).toBe(2);
  await home.getByRole('button', { name: 'ぬりえにもどる', exact: true }).click();
  await expect(home).toHaveURL(new RegExp(`#/paint/${saved.id}$`));
  await home.getByRole('button', { name: 'もどる', exact: true }).click();
  await home.getByRole('button', { name: 'おひめさまのしま',exact:true }).waitFor();
  const finalSaved = (await projects(home))[0];
  await home.evaluate(() => { globalThis.__delayedUpdate.restore(); });
  const reloaded = home.waitForEvent('load');
  await home.getByRole('button', { name: '更新する', exact: true }).click();
  await reloaded;
  await home.getByRole('button', { name: 'おひめさまのしま',exact:true }).waitFor();
  expect(await home.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(false);
  offlinePhase = true;
  await context.setOffline(true);
  await home.reload();
  await home.getByRole('button', { name: 'おひめさまのしま',exact:true }).waitFor();
  await home.goto(origin + `/#/paint/${saved.id}`);
  await expect(home.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect((await projects(home))[0].regions).toEqual(finalSaved.regions);
  const icon = await sharp('apps/web/public/icons/maskable-512.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let nonOpaquePixels = 0;
  for (let i = 3; i < icon.data.length; i += 4) if (icon.data[i] !== 255) nonOpaquePixels++;
  expect(nonOpaquePixels).toBe(0);
  await fs.writeFile(`${output}/network-observations.json`, JSON.stringify({ errors, resourceErrors, failedRequests, expectedOfflineChecks }, null, 2));
  expect(errors).toEqual([]);
  const buildAfter = await performanceBuildIdentity(origin);
  assertPerformanceBuildUnchanged(build, buildAfter);
  await fs.writeFile(`${output}/build-identity.json`, JSON.stringify({ build, buildAfter, unchanged: true }, null, 2));
  const report = { measuredAt: new Date().toISOString(), browser: 'Chromium on Windows, two real tabs', workerSha256: createHash('sha256').update(workerBytes).digest('hex'), updateMethod: 'Serve the production SW unchanged except a version comment, install the second worker and use the real update UI.', delayedSyncBoundary: 'Delay the exported real service flush completion; no live cloud outage is simulated.', delayedUpdate: delayed, retainedEditorRegistrationGuard: true, pendingNativeIdbCommitProtected: true, otherTabUpdateBlocked: true, editorDocumentPreserved: true, zoomPreserved: true, savedPaintPreserved: true, explicitUpdateAfterClosingOtherTab: true, offlineReloadAfterUpdate: true, maskableNonOpaquePixels: nonOpaquePixels, errors, pass: true };
  await fs.writeFile('test-results/vector-improvement/pwa-update.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

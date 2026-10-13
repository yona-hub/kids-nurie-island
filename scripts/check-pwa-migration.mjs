/* global indexedDB, navigator, IDBObjectStore, ServiceWorker, MessageChannel, window, location, self, Event */
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { checkBrowser } from './check-browser.mjs';

// Serve two real, unmodified releases on one isolated origin. No skipWaiting,
// unregister, storage-state import, cleared caches, or edited worker bytes.
const oldRoot = path.resolve('test-results/firefox-validation-fixed/site');
const newRoot = path.resolve('dist-demo');
const output = path.resolve(process.env.PWA_MIGRATION_OUTPUT ?? 'test-results/a09-migration');
await fs.mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const entry = html => html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
const oldHtml = await fs.readFile(path.join(oldRoot, 'index.html'), 'utf8');
const newHtml = await fs.readFile(path.join(newRoot, 'index.html'), 'utf8');
const oldEntry = entry(oldHtml), newEntry = entry(newHtml);
if (oldEntry !== '/assets/index-BDz80J0o.js' || !newEntry || oldEntry === newEntry) throw new Error('Expected the archived legacy release and a different current build');
const sourcePaths = [oldRoot, newRoot].flatMap(root => ['index.html', 'sw.js', 'manifest.webmanifest'].map(file => path.join(root, file)));
for (const root of [oldRoot, newRoot]) sourcePaths.push(...(await fs.readdir(path.join(root, 'assets'))).filter(file => /\.(js|css)$/.test(file)).map(file => path.join(root, 'assets', file)));
const snapshot = async () => Promise.all(sourcePaths.sort().map(async file => ({ path: path.relative(process.cwd(), file).replaceAll('\\', '/'), sha256: hash(await fs.readFile(file)) })));
const before = await snapshot();
await fs.writeFile(path.join(output, 'build-before.json'), JSON.stringify(before, null, 2));
const network = [], errors = [];
let release = 'old';
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  try {
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const root = release === 'old' ? oldRoot : newRoot;
    let file = path.resolve(root, '.' + pathname), servedRelease = release;
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    let bytes;
    try { bytes = await fs.readFile(file); }
    catch {
      // Content-addressed old assets remain deployable during a normal rollout.
      // HTML, worker, and mutable catalogs always come from the selected release.
      if (release !== 'new' || !/^\/(?:assets\/|content\/.*\.[a-f0-9]{64}\.)/.test(pathname)) throw new Error('missing');
      file = path.resolve(oldRoot, '.' + pathname);
      if (!file.startsWith(oldRoot + path.sep)) throw new Error('outside archive');
      bytes = await fs.readFile(file); servedRelease = 'old-immutable-retained';
    }
    network.push({ pathname, release: servedRelease, bytes: bytes.length, sha256: hash(bytes) });
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch {
    network.push({ pathname: url.pathname, release, status: 404 });
    response.writeHead(404).end('Not found');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const report = { startedAt: new Date().toISOString(), origin, oldEntry, newEntry, browser: 'Chromium on Windows; ordinary desktop browser tabs, no installed PWA', oldWorkerSha256: hash(await fs.readFile(path.join(oldRoot, 'sw.js'))), newWorkerSha256: hash(await fs.readFile(path.join(newRoot, 'sw.js'))), pass: false, phases: {} };
const writeReport = async () => {
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ ...report, errors }, null, 2));
  await fs.writeFile(path.join(output, 'network.json'), JSON.stringify(network, null, 2));
};
const saved = page => page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('kids-nurie-island-v1');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(['projects', 'settings'], 'readonly');
      const projects = tx.objectStore('projects').getAll(), settings = tx.objectStore('settings').getAll();
      tx.oncomplete = () => resolve({ projects: projects.result.filter(row => !row.deleted).map(row => row.project), settings: settings.result.map(row => ({ userId: row.userId, value: row.value })) });
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
});
const pageProof = page => page.evaluate(() => ({ marker: globalThis.__migration.marker, controllerChanges: globalThis.__migration.controllerChanges, requests: globalThis.__migration.requests, replies: globalThis.__migration.replies, documentLoads: performance.getEntriesByType('navigation').length }));
const waiting = page => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
const workerState = page => page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return { active: registration?.active?.state, waiting: registration?.waiting?.state, controlled: !!navigator.serviceWorker.controller };
});
const legacyProbe = page => page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  const channel = new MessageChannel();
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Legacy response did not arrive')), 5000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data); };
    globalThis.__migration.probing = true;
    registration.waiting.postMessage({ type: 'ISLAND_ACTIVATE_UPDATE' }, [channel.port2]);
    globalThis.__migration.probing = false;
  });
});
function interior(template, index) {
  const context = createCanvas(1, 1).getContext('2d'), paths = template.regions.map(region => new Path2D(region.path));
  const bounds = template.regions[index].bounds;
  const hit = (x, y) => paths.findLastIndex(shape => context.isPointInPath(shape, x, y));
  for (const margin of [24, 16, 8]) for (let y = bounds.y + margin; y < bounds.y + bounds.height - margin; y += 8) for (let x = bounds.x + margin; x < bounds.x + bounds.width - margin; x += 8) {
    if (hit(x, y) === index && [[margin, 0], [-margin, 0], [0, margin], [0, -margin]].every(([dx, dy]) => hit(x + dx, y + dy) === index)) return { id: template.regions[index].id, x, y };
  }
  throw new Error(`No safe tap point in region ${index}`);
}
async function tap(page, point) {
  const canvas = page.getByTestId('artwork');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + point.x / 1600 * box.width, box.y + point.y / 2000 * box.height);
}
async function pinkPixel(page, point) {
  await expect.poll(() => page.getByTestId('artwork').locator('canvas').evaluate((canvas, point) => {
    const pixel = canvas.getContext('2d').getImageData(Math.floor(point.x / 1600 * canvas.width), Math.floor(point.y / 2000 * canvas.height), 1, 1).data;
    return pixel[0] - pixel[1] > 30 && pixel[2] - pixel[1] > 10 && pixel[3] === 255;
  }, point)).toBe(true);
}
let browser;
try {
  const readiness = checkBrowser();
  await fs.writeFile(path.join(output, 'browser-readiness.json'), JSON.stringify(readiness, null, 2));
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'ja-JP' });
  await context.addInitScript(() => {
    const proof = globalThis.__migration = { marker: crypto.randomUUID(), controllerChanges: 0, requests: [], replies: [], probing: false, holdSave: false, heldWrites: 0 };
    navigator.serviceWorker.addEventListener('controllerchange', () => { proof.controllerChanges++; });
    const post = ServiceWorker.prototype.postMessage;
    ServiceWorker.prototype.postMessage = function (...args) {
      if (args[0]?.type === 'ISLAND_ACTIVATE_UPDATE') proof.requests.push({ data: structuredClone(args[0]), source: proof.probing ? 'negative-probe' : 'real-legacy-registration' });
      return post.apply(this, args);
    };
    const NativeChannel = MessageChannel;
    globalThis.MessageChannel = class ObservedMessageChannel extends NativeChannel {
      constructor() {
        super();
        this.port1.addEventListener('message', event => { if (event.data?.status) proof.replies.push(structuredClone(event.data)); });
      }
    };
  });
  const observe = page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  const home = await context.newPage(); observe(home);
  await home.goto(origin + '/#/home');
  await expect(home.getByRole('heading', { name: 'どのしまへ、あそびにいく？' })).toBeVisible();
  expect(await home.locator('script[type="module"][src]').getAttribute('src')).toBe(oldEntry);
  await expect.poll(() => home.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await home.getByRole('button', { name: '設定', exact: true }).click();
  await expect(home.getByRole('switch', { name: '演出をひかえめにする', exact: true })).toBeVisible();
  for (const [label, key, value] of [['演出をひかえめにする', 'reducedMotion', true], ['効果音', 'soundEffects', false], ['タップ操作の補助', 'tapAssist', false]]) {
    await home.getByText(label, { exact: true }).click();
    await expect.poll(async () => (await saved(home)).settings[0]?.value[key]).toBe(value);
  }
  await home.getByRole('button', { name: 'もどる', exact: true }).click();
  await home.getByRole('button', { name: 'おひめさまのしま', exact: true }).click();
  await home.locator('.template-card').first().click();
  await expect(home.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  const initial = (await saved(home)).projects[0];
  const catalog = JSON.parse(await fs.readFile(path.join(oldRoot, 'content/catalog.json'), 'utf8'));
  const template = JSON.parse(await fs.readFile(path.join(oldRoot, catalog.find(item => item.id === initial.templateId).assetUrl), 'utf8'));
  const points = [interior(template, 0), interior(template, 1)];
  await tap(home, points[0]);
  await expect.poll(async () => (await saved(home)).projects[0].regions[points[0].id]?.color).toBe('#F64C91');
  await home.getByRole('button', { name: 'もどる', exact: true }).click();
  await expect(home.getByRole('heading', { name: 'どのしまへ、あそびにいく？' })).toBeVisible();
  const beforeUpdate = await saved(home), homeBefore = await pageProof(home);
  console.log('Legacy page saved three settings changes and one paint; installing the actual current worker.');
  release = 'new';
  const newWorkerPromise = context.waitForEvent('serviceworker');
  await home.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
  const newWorker = await newWorkerPromise;
  await newWorker.evaluate(() => {
    globalThis.__migrationActivation = [];
    self.addEventListener('activate', () => {
      const record = { event: 'activate', time: Date.now(), windowClients: null };
      globalThis.__migrationActivation.push(record);
      void self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => { record.windowClients = clients.length; });
    });
  });
  await expect.poll(() => waiting(home), { timeout: 20000 }).toBe(true);
  for (let attempt = 1; attempt <= 3; attempt++) {
    await home.getByRole('button', { name: '更新する', exact: true }).click();
    await expect.poll(async () => (await pageProof(home)).replies.length).toBe(attempt);
    await expect(home.getByText('保存が終わってから、ホームで更新してください', { exact: true })).toBeVisible();
  }
  const single = await pageProof(home);
  expect(single.requests).toHaveLength(3);
  expect(single.requests.every(request => request.source === 'real-legacy-registration' && !('requestId' in request.data))).toBe(true);
  expect(single.replies).toEqual(Array.from({ length: 3 }, () => ({ status: 'blocked', reason: 'busy' })));
  expect(single.marker).toBe(homeBefore.marker); expect(single.controllerChanges).toBe(homeBefore.controllerChanges);
  expect(await saved(home)).toEqual(beforeUpdate);
  expect(await newWorker.evaluate(() => globalThis.__migrationActivation.length)).toBe(0);
  report.phases.savedHome = { ...single, worker: await workerState(home), dataRetained: true, attempts: 3 };
  await home.screenshot({ path: path.join(output, 'legacy-home-rejected.png'), fullPage: true, animations: 'disabled' });
  await writeReport();

  await home.evaluate(id => { location.hash = `/paint/${id}`; }, initial.id);
  await expect(home.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await home.evaluate(() => {
    const put = IDBObjectStore.prototype.put, proof = globalThis.__migration;
    proof.holdSave = true;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (this.name === 'projects' && proof.holdSave) {
        proof.heldWrites++;
        const hold = () => { if (proof.holdSave) this.get('__migration_uncommitted__').onsuccess = hold; };
        hold();
      }
      return request;
    };
  });
  await home.locator('.shades button').nth(4).click();
  await tap(home, points[1]);
  await expect.poll(() => home.evaluate(() => globalThis.__migration.heldWrites)).toBe(1);
  await pinkPixel(home, points[1]);
  await home.evaluate(() => window.dispatchEvent(new Event('island-apply-update')));
  expect((await pageProof(home)).requests).toHaveLength(3); // Old registration still guards an actual editor hash.
  expect(await legacyProbe(home)).toEqual({ status: 'blocked', reason: 'busy' });
  expect((await pageProof(home)).marker).toBe(homeBefore.marker);
  expect(await newWorker.evaluate(() => globalThis.__migrationActivation.length)).toBe(0);
  report.phases.pendingEditor = { proof: await pageProof(home), nativeTransactionHeld: true, registrationRequestCount: 0, directLegacyNegativeProbe: 'blocked/busy', worker: await workerState(home) };
  await home.screenshot({ path: path.join(output, 'legacy-editor-save-held.png'), fullPage: true, animations: 'disabled' });

  // A new tab's first local count read also waits for this native transaction.
  // Finish the explicit save before opening the separate multiple-tab case.
  await home.evaluate(() => { globalThis.__migration.holdSave = false; });
  await expect.poll(async () => (await saved(home)).projects[0].regions[points[1].id]?.color).toBe('#FF6AA3');
  const committed = await saved(home);
  const other = await context.newPage(); observe(other);
  await other.goto(origin + '/#/home');
  await expect(other.getByRole('heading', { name: 'どのしまへ、あそびにいく？' })).toBeVisible();
  expect(await other.locator('script[type="module"][src]').getAttribute('src')).toBe(oldEntry);
  const otherBefore = await pageProof(other);
  await other.getByRole('button', { name: '更新する', exact: true }).click();
  await expect.poll(async () => (await pageProof(other)).replies.length).toBe(1);
  expect((await pageProof(other)).replies[0]).toEqual({ status: 'blocked', reason: 'busy' });
  expect((await pageProof(other)).marker).toBe(otherBefore.marker);
  expect((await pageProof(home)).marker).toBe(homeBefore.marker);
  expect(await newWorker.evaluate(() => globalThis.__migrationActivation.length)).toBe(0);
  report.phases.multipleTabs = { proof: await pageProof(other), windows: context.pages().length, worker: await workerState(other), bothDocumentsRetained: true };
  await other.screenshot({ path: path.join(output, 'legacy-multiple-tabs-rejected.png'), fullPage: true, animations: 'disabled' });
  await writeReport();
  console.log('Legacy home, pending editor and multiple tabs reject old requests. Closing all clients after commit.');

  await home.close();
  expect(await waiting(other)).toBe(true);
  await other.close();
  expect(context.pages()).toHaveLength(0);
  await expect.poll(() => newWorker.evaluate(() => globalThis.__migrationActivation[0]?.windowClients), { timeout: 20000 }).toBe(0);
  await expect.poll(() => newWorker.evaluate(() => self.registration.active?.state), { timeout: 20000 }).toBe('activated');
  const activation = await newWorker.evaluate(() => ({ events: globalThis.__migrationActivation, waiting: self.registration.waiting?.state ?? null, active: self.registration.active?.state }));
  expect(activation.events).toHaveLength(1); expect(activation.waiting).toBeNull(); expect(activation.active).toBe('activated');
  report.phases.allClientsClosed = { contextPreserved: true, pagesRemaining: 0, activation, usedSkipWaiting: false, usedUnregister: false };

  const reopened = await context.newPage(); observe(reopened);
  await reopened.goto(origin + `/#/paint/${initial.id}`);
  await expect(reopened.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect(await reopened.locator('script[type="module"][src]').getAttribute('src')).toBe(newEntry);
  expect(await saved(reopened)).toEqual(committed);
  for (const point of points) await pinkPixel(reopened, point);
  await reopened.getByRole('button', { name: 'もどる', exact: true }).click();
  await reopened.getByRole('button', { name: '設定', exact: true }).click();
  await expect(reopened.getByRole('switch', { name: '演出をひかえめにする', exact: true })).toBeChecked();
  await expect(reopened.getByRole('switch', { name: /^効果音/ })).not.toBeChecked();
  await expect(reopened.getByRole('switch', { name: /^タップ操作の補助/ })).not.toBeChecked();
  await context.setOffline(true);
  await reopened.close();
  const offline = await context.newPage(); observe(offline);
  await offline.goto(origin + `/#/paint/${initial.id}`);
  await expect(offline.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect(await offline.locator('script[type="module"][src]').getAttribute('src')).toBe(newEntry);
  expect(await saved(offline)).toEqual(committed);
  for (const point of points) await pinkPixel(offline, point);
  await offline.screenshot({ path: path.join(output, 'migrated-offline-artwork.png'), fullPage: true, animations: 'disabled' });
  report.phases.reopened = { newEntry, saved: committed, bothPaintPixelsVisible: true, settingsControlsCorrect: true, offlineNewTabRestart: true, storageImported: false, cacheCleared: false };
  expect(errors).toEqual([]);
  const after = await snapshot();
  await fs.writeFile(path.join(output, 'build-after.json'), JSON.stringify(after, null, 2));
  expect(after).toEqual(before);
  report.buildFilesUnchanged = after.length;
  report.completedAt = new Date().toISOString(); report.pass = true;
  await writeReport();
  console.log(JSON.stringify({ pass: true, oldEntry, newEntry, origin, phases: Object.keys(report.phases), buildFilesUnchanged: after.length, errors: errors.length }, null, 2));
} catch (error) {
  report.failure = error.stack ?? String(error);
  await writeReport();
  throw error;
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

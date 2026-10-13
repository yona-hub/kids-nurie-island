import { test as base, expect, type Page, type APIRequestContext, type BrowserContext, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import type { Project } from '../../packages/shared-types/src/index';
import { startArtwork, tapRegion, project, storedProjects } from '../e2e/helpers';
import { APP_ORIGIN, API_ORIGIN, CONTROL_KEY, RESULT_DIRECTORY, USER_ID } from './fixture-config.mjs';

type CloudEvent = { sequence: number; at: string; method: string; path: string; status?: number; pkceVerified?: boolean; pkceChallenge?: boolean; injectedFailure?: boolean; connectionClosed?: boolean; device?: number; resultKind?: string; expectedVersion?: number; version?: number; operationId?: string; projectId?: string; userId?: string };
type CloudState = { userId: string; events: CloudEvent[]; projects: Array<{ id: string; payload: Project; deleted_at: string | null }>; receipts: unknown[]; thumbnails: string[] };
const headers = { 'x-fixture-control': CONTROL_KEY };
const cloud = async (request: APIRequestContext): Promise<CloudState> => { const response = await request.get(`${API_ORIGIN}/__control/state`, { headers }); expect(response.ok()).toBe(true); return response.json(); };
const control = async (request: APIRequestContext, action: string, data: unknown) => { const response = await request.post(`${API_ORIGIN}/__control/${action}`, { headers, data }); expect(response.ok()).toBe(true); };
const test = base.extend<{ observe: (page: Page) => void }>({
  observe: [async ({ page }, use, info) => {
    const errors: string[] = [], resources: Array<{ text: string; location: { url: string }; pageUrl: string }> = [], failedResponses: Array<{ url: string; status: number }> = [], failedRequests: Array<{ url: string; error?: string; pageUrl: string }> = [];
    const observe = (target: Page) => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') resources.push({ text: message.text(), location: message.location(), pageUrl: target.url() }); });
      target.on('response', response => { if (response.status() >= 400) failedResponses.push({ url: response.url(), status: response.status() }); });
      target.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText, pageUrl: target.url() }));
    };
    observe(page); await use(observe);
    await info.attach('browser-errors', { body: JSON.stringify({ errors, resourceConsoleMessages: resources, failedResponses, failedRequests }, null, 2), contentType: 'application/json' });
    expect(errors, 'No unhandled browser JavaScript exceptions').toEqual([]);
    // Intentional 503s/optional thumbnail misses are retained as evidence, not called JS success.
    expect(failedResponses.filter(value => !(
      value.status === 503 && value.url === `${API_ORIGIN}/rest/v1/rpc/save_project` && info.title.includes('HTTP sync failure')
      || value.status === 404 && value.url.startsWith(`${API_ORIGIN}/storage/v1/object/`) && value.url.includes('/thumbnails/')
    )), 'No unexpected HTTP failure').toEqual([]);
    const state = await cloud(page.request);
    expect(resources.filter(value => !failedResponses.some(response => response.url === value.location.url && value.text.includes(String(response.status))) && !(
      info.project.name === 'cloud-webkit' && failedRequests.some(request => request.url === value.location.url) && state.events.some(event => event.connectionClosed && value.location.url === `${API_ORIGIN}${event.path}`) && /Failed to load resource/.test(value.text)
    )), 'Console resource errors must match a specifically injected or allowed HTTP failure').toEqual([]);
  }, { auto: true }],
});
test.beforeEach(async ({ request }, info) => { await control(request, 'reset', { caseName: `${info.project.name}: ${info.title}` }); });

async function login(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Googleでログイン', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'この端末でためす', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Googleでログイン', exact: true }).click();
  await expect(page.getByRole('button', { name: 'おひめさまのしま', exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe(''); expect(new URL(page.url()).pathname).toBe('/');
  await expect(page.getByText('この端末でおためし中', { exact: true })).toHaveCount(0);
}
async function pending(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('kids-nurie-island-v1'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      const tx = db.transaction(['projects', 'thumbnails'], 'readonly');
      const counts = await Promise.all(['projects', 'thumbnails'].map(name => new Promise<string[]>((resolve, reject) => {
        const request = tx.objectStore(name).getAll(); request.onsuccess = () => resolve(request.result.filter((row: { dirty: boolean }) => row.dirty).map((row: { key: string }) => row.key)); request.onerror = () => reject(request.error);
      })));
      return new Set(counts.flat()).size;
    } finally { db.close(); }
  });
}
async function openSettings(page: Page) { await page.evaluate(() => { location.hash = '/settings'; }); await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible(); }
async function openEditor(page: Page, id: string) { await page.evaluate(value => { location.hash = `/paint/${value}`; }, id); await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled(); }
async function connectivity(context: BrowserContext, request: APIRequestContext, info: TestInfo, device: number, online: boolean) {
  if (info.project.name === 'cloud-webkit') await control(request, 'connection', { device, online });
  else await context.setOffline(!online);
}
async function expectDisconnected(page: Page, request: APIRequestContext, info: TestInfo, device: number) {
  if (info.project.name === 'cloud-webkit') {
    await expect.poll(async () => (await cloud(request)).events.some(event => event.device === device && event.connectionClosed)).toBe(true);
    await expect(page.locator('.sync-banner')).toContainText('ネット接続後');
  } else expect(await page.evaluate(() => navigator.onLine)).toBe(false);
}
async function expectSynced(page: Page) {
  await expect.poll(() => pending(page)).toBe(0);
  await openSettings(page);
  await expect(page.getByText('すべての作品を保存しています', { exact: true })).toBeVisible();
  await expect(page.locator('.sync-banner')).toHaveCount(0);
}
async function evidence(info: TestInfo, request: APIRequestContext, pages: Page[], name: string) {
  const state = await cloud(request), locals = await Promise.all(pages.map(async page => ({ projects: await storedProjects(page), pending: await pending(page) })));
  const document = { at: new Date().toISOString(), browser: info.project.name, browserVersion: pages[0].context().browser()?.version(), connectivity: info.project.name === 'cloud-webkit' ? 'per-device API TCP disconnect; SDK automatic auth retry' : 'BrowserContext.setOffline; native online event', scenario: name, cloud: state, devices: locals };
  await writeFile(`${RESULT_DIRECTORY}/${info.project.name}-${name}.json`, JSON.stringify(document, null, 2));
  await info.attach('cloud-and-devices', { body: JSON.stringify(document, null, 2), contentType: 'application/json' });
  await pages[0].screenshot({ path: `${RESULT_DIRECTORY}/${info.project.name}-${name}.png`, fullPage: true, animations: 'disabled' });
}

test('offline UI edit automatically reconnects through real SDK and drains pending work', async ({ page, context, request }, info) => {
  await login(page); const id = await startArtwork(page);
  await expect.poll(async () => (await cloud(request)).projects.find(row => row.id === id)?.payload.version).toBe(1);
  await expect.poll(() => pending(page)).toBe(0);
  // The sync check uses a previously loaded settings screen; cold offline chunk
  // loading and Service Worker support have separate PWA tests.
  await openSettings(page);
  await expect(page.getByText('すべての作品を保存しています', { exact: true })).toBeVisible();
  await openEditor(page, id);
  await info.attach('offline-preconditions', { body: JSON.stringify(await page.evaluate(() => ({ online: navigator.onLine, serviceWorkerSupported: 'serviceWorker' in navigator, controlled: 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller) }))), contentType: 'application/json' });
  const before = await cloud(request), writesBefore = before.events.filter(event => event.path.endsWith('/save_project')).length;
  expect(before.events.some(event => event.pkceVerified)).toBe(true);
  await connectivity(context, request, info, 1, false);
  await page.getByRole('button', { name: 'クレヨン', exact: true }).click();
  await page.locator('.shades button').nth(4).click(); const region = await tapRegion(page, 0);
  await expect.poll(async () => (await project(page, id)).regions[region]).toEqual({ color: '#FF6AA3', paintType: 'crayon' });
  await expect.poll(() => pending(page)).toBe(1);
  await expectDisconnected(page, request, info, 1);
  await openSettings(page); await expect(page.getByText('未同期の作品が1件あります', { exact: true })).toBeVisible();
  const disconnected = await cloud(request);
  expect(disconnected.projects.find(row => row.id === id)?.payload.regions[region]).toBeUndefined();
  expect(disconnected.events.filter(event => event.path.endsWith('/save_project') && !event.connectionClosed)).toHaveLength(writesBefore);
  await connectivity(context, request, info, 1, true); // No manual flush, reload, or application test hook.
  await expect.poll(async () => (await cloud(request)).projects.find(row => row.id === id)?.payload.regions[region]).toEqual({ color: '#FF6AA3', paintType: 'crayon' });
  await expectSynced(page);
  const after = await cloud(request);
  expect(after.events.some(event => event.path === '/auth/v1/user' && event.status === 200)).toBe(true);
  expect(after.projects.find(row => row.id === id)?.payload.userId).toBe(USER_ID);
  expect(after.projects.find(row => row.id === id)?.payload.version).toBeGreaterThan(1);
  await evidence(info, request, [page], 'reconnect');
});

test('HTTP sync failure retains local work and the UI retry commits it', async ({ page, request }, info) => {
  await login(page); const id = await startArtwork(page);
  await expect.poll(() => pending(page)).toBe(0);
  const initialVersion = (await cloud(request)).projects.find(row => row.id === id)!.payload.version;
  await control(request, 'failures', { save: true });
  await page.locator('.shades button').nth(8).click(); const region = await tapRegion(page, 0);
  await expect(page.locator('.sync-banner')).toContainText('同期できていません');
  await expect.poll(() => pending(page)).toBe(1);
  expect((await project(page, id)).regions[region]?.color).toBe('#D12F7B');
  const failed = await cloud(request), attempt = failed.events.find(event => event.injectedFailure);
  expect(attempt?.status).toBe(503); expect(failed.projects.find(row => row.id === id)?.payload.version).toBe(initialVersion);
  await control(request, 'failures', { save: false });
  await page.locator('.sync-banner').getByRole('button', { name: '再試行', exact: true }).click();
  await expect.poll(async () => (await cloud(request)).projects.find(row => row.id === id)?.payload.regions[region]?.color).toBe('#D12F7B');
  await expectSynced(page);
  const accepted = (await cloud(request)).events.find(event => event.operationId === attempt?.operationId && event.resultKind === 'saved');
  expect(accepted?.expectedVersion).toBe(initialVersion); expect(accepted?.version).toBe(initialVersion + 1);
  await evidence(info, request, [page], 'retry');
});

test('two isolated browser devices resolve a server version conflict by retaining both works', async ({ page, browser, request, observe }, info) => {
  let otherContext: BrowserContext | undefined;
  try {
    await login(page); const id = await startArtwork(page); await expect.poll(() => pending(page)).toBe(0);
    const baselineVersion = (await cloud(request)).projects.find(row => row.id === id)!.payload.version;
    otherContext = await browser.newContext({ baseURL: APP_ORIGIN, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', viewport: { width: 1440, height: 1000 } });
    expect(otherContext).not.toBe(page.context());
    const other = await otherContext.newPage(); observe(other);
    await login(other);
    await expect.poll(async () => (await storedProjects(other)).map(item => item.id)).toContain(id);
    await openEditor(other, id); await connectivity(otherContext, request, info, 2, false);
    await other.getByRole('button', { name: 'クレヨン', exact: true }).click();
    await other.locator('.shades button').nth(8).click(); const region = await tapRegion(other, 0);
    await expect.poll(async () => (await project(other, id)).regions[region]?.color).toBe('#D12F7B');
    await expectDisconnected(other, request, info, 2);
    expect((await project(page, id)).regions[region]).toBeUndefined(); // Prove IDB is not shared.
    await page.locator('.shades button').nth(4).click(); await tapRegion(page, 0);
    await expect.poll(async () => (await cloud(request)).projects.find(row => row.id === id)?.payload.regions[region]?.color).toBe('#FF6AA3');
    await expect.poll(() => pending(page)).toBe(0);
    expect((await project(other, id)).version).toBe(baselineVersion);
    await connectivity(otherContext, request, info, 2, true);
    await expect(other.locator('.sync-banner')).toContainText('別の作品');
    await expect.poll(async () => (await cloud(request)).projects.filter(row => !row.deleted_at).length).toBe(2);
    await expect.poll(() => pending(other)).toBe(0);
    const state = await cloud(request), original = state.projects.find(row => row.id === id)!.payload, copy = state.projects.find(row => row.id !== id)!.payload;
    expect(original.regions[region]).toEqual({ color: '#FF6AA3', paintType: 'smooth' });
    expect(copy.regions[region]).toEqual({ color: '#D12F7B', paintType: 'crayon' }); expect(copy.title).toContain('別の作品');
    expect(state.events.some(event => event.resultKind === 'conflict' && event.expectedVersion === baselineVersion && event.version === original.version)).toBe(true);
    expect(state.events.filter(event => event.pkceVerified)).toHaveLength(2);
    await page.reload();
    await expect.poll(async () => (await storedProjects(page)).length).toBe(2);
    await expect.poll(() => pending(page)).toBe(0);
    await other.reload(); await expect(other.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
    expect((await project(other, copy.id)).regions).toEqual(copy.regions);
    expect((await project(other, id)).regions).toEqual(original.regions);
    await page.evaluate(() => { location.hash = '/gallery'; });
    await expect(page.getByRole('heading', { name: 'さくひん', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: /^途中/ }).click();
    await expect(page.locator('.gallery-card')).toHaveCount(2);
    await expect(page.locator('.gallery-card').filter({ hasText: '別の作品' })).toHaveCount(1);
    await evidence(info, request, [page, other], 'conflict');
  } finally { await otherContext?.close(); }
});

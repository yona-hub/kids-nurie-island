import { test, expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { startArtwork } from '../e2e/helpers';
import { APP_ORIGIN, API_ORIGIN, CONTROL_KEY, RESULT_DIRECTORY } from './fixture-config.mjs';

async function cacheState(page: Page) {
  return page.evaluate(async () => ({
    online: navigator.onLine,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    controller: navigator.serviceWorker?.controller ? { url: navigator.serviceWorker.controller.scriptURL, state: navigator.serviceWorker.controller.state } : null,
    registrations: 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).map(value => ({ scope: value.scope, active: value.active?.state, installing: value.installing?.state, waiting: value.waiting?.state })) : [],
    caches: 'caches' in window ? await Promise.all((await caches.keys()).map(async name => ({ name, urls: (await (await caches.open(name)).keys()).map(request => request.url) }))) : [],
  }));
}

for (const precondition of ['immediate', 'precache-ready', 'precache-origin-unavailable']) test(`cold offline Settings: ${precondition} observation`, async ({ page, context, request }, info) => {
  await request.post(`${API_ORIGIN}/__control/reset`, { headers: { 'x-fixture-control': CONTROL_KEY }, data: { caseName: `cold-settings-${precondition}` } });
  const consoleErrors: unknown[] = [], failedRequests: unknown[] = [], responses: unknown[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() }); });
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (/\.js(?:\?|$)|sw\./.test(response.url())) responses.push({ url: response.url(), status: response.status(), fromServiceWorker: response.fromServiceWorker() }); });
  await page.goto('/'); await page.getByRole('button', { name: 'Googleでログイン', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'どのしまへ、あそびにいく？' })).toBeVisible();
  const id = await startArtwork(page);
  await expect.poll(async () => {
    const response = await request.get(`${API_ORIGIN}/__control/state`, { headers: { 'x-fixture-control': CONTROL_KEY } });
    const body = await response.json() as { projects: Array<{ id: string }> }; return body.projects.some(value => value.id === id);
  }).toBe(true);
  if (precondition.startsWith('precache-')) {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(async () => Boolean((await cacheState(page)).controller)).toBe(true);
    await expect.poll(async () => (await cacheState(page)).caches.flatMap(value => value.urls).some(url => /\/assets\/Settings-.*\.js/.test(url))).toBe(true);
  }
  const before = await cacheState(page);
  let originState: unknown;
  if (precondition === 'precache-origin-unavailable') {
    const stopped = await request.post(`${API_ORIGIN}/__control/app-network`, { headers: { 'x-fixture-control': CONTROL_KEY }, data: { available: false } });
    originState = await stopped.json(); expect(originState).toEqual({ listening: false });
    await expect(request.get(`${APP_ORIGIN}/uncached-probe`, { timeout: 1500 })).rejects.toThrow();
  } else await context.setOffline(true);
  const settingsUrl = before.caches.flatMap(cache => cache.urls).find(url => /\/assets\/Settings-.*\.js/.test(url));
  const cachedAndFetch = settingsUrl ? await page.evaluate(async url => {
    const cached = await caches.match(url);
    const cachedBody = cached ? { status: cached.status, type: cached.headers.get('content-type'), bytes: (await cached.arrayBuffer()).byteLength } : null;
    try { const response = await fetch(url); return { cachedBody, fetch: { status: response.status, bytes: (await response.arrayBuffer()).byteLength } }; }
    catch (error) { return { cachedBody, fetch: { error: String(error) } }; }
  }, settingsUrl) : null;
  await page.evaluate(() => { location.hash = '/settings'; });
  let opened = false;
  try { await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible({ timeout: 8000 }); opened = true; } catch { /* Record the failed cold route as a diagnostic, not as product success. */ }
  const observation = { at: new Date().toISOString(), precondition, opened, originState, cachedAndFetch, before, after: await cacheState(page), consoleErrors, failedRequests, responses };
  await writeFile(`${RESULT_DIRECTORY}/cold-settings-${precondition}.json`, JSON.stringify(observation, null, 2));
  await info.attach('cold-settings-observation', { body: JSON.stringify(observation, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: `${RESULT_DIRECTORY}/cold-settings-${precondition}.png`, fullPage: true });
  await context.setOffline(false);
  if (precondition === 'precache-origin-unavailable') await request.post(`${API_ORIGIN}/__control/app-network`, { headers: { 'x-fixture-control': CONTROL_KEY }, data: { available: true } });
  if (precondition.startsWith('precache-')) expect(opened, 'Unvisited Settings should load from the verified precache').toBe(true);
});

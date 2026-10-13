import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { Template } from '../../packages/shared-types/src/index';
import { test, expect, catalog, startArtwork, project, regionPoint, captureUi } from './helpers';

test.use({ serviceWorkers: 'block' });

async function thumbnail(page: Page, id: string) {
  return page.evaluate(async id => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kids-nurie-island-v1');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      const rows = await new Promise<{ projectId: string; renderKey?: string; revision: number; projectRevision: number }[]>((resolve, reject) => {
        const request = db.transaction('thumbnails').objectStore('thumbnails').getAll();
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      return rows.find(row => row.projectId === id);
    } finally { db.close(); }
  }, id);
}

test('same-version asset updates regenerate gallery images and survive a second reload @a02', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const entry = catalog.find(item => item.themeId === 'vehicles')!;
  const original: Template = JSON.parse(readFileSync(`apps/web/public${entry.assetUrl}`, 'utf8'));
  const changed = structuredClone(original);
  // V2 uses authored group shading and material response rather than the old
  // per-region flags. Change a consumed render input at the same template ID.
  for (const region of changed.regions) region.material = 'skin';
  const bodies = [JSON.stringify(original), JSON.stringify(changed)];
  const urls = bodies.map(body => `/content/templates/${original.id}.${createHash('sha256').update(body).digest('hex')}.json`);
  let phase = 0;
  await page.route('**/content/catalog.json', route => route.fulfill({ json: catalog.map(item => item.id === entry.id ? { ...item, assetUrl: urls[phase] } : item) }));
  await page.route(`**/content/templates/${original.id}.*.json`, route => {
    const index = urls.indexOf(new URL(route.request().url()).pathname);
    return index < 0 ? route.continue() : route.fulfill({ contentType: 'application/json', body: bodies[index] });
  });
  const id = await startArtwork(page, 'のりもの');
  await page.getByRole('button', { name: 'あおのしま', exact: true }).click();
  await page.locator('.shades button').nth(5).click();
  const artwork = page.getByTestId('artwork');
  await artwork.focus();
  for (let index = 0; index < original.regions.length; index++) {
    await artwork.press('Enter');
    await expect.poll(async () => Object.keys((await project(page, id)).regions).length).toBe(index + 1);
    await artwork.press('ArrowRight');
  }
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: 'さくひんへ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'PNG保存', exact: true })).toBeEnabled();
  await page.goto('/#/gallery');
  const image = page.locator('.gallery-thumb img');
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth === 320)).toBe(true);
  const before = await thumbnail(page, id), saved = await project(page, id);
  expect(before?.renderKey).toMatch(/^[a-f0-9]{64}$/);
  const imageHash = () => image.evaluate(async (element: HTMLImageElement) => {
    // Inspect the visible decoded image. Fetching its old blob URL while React
    // replaces it creates a test-only request after URL.revokeObjectURL.
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 400;
    const context = canvas.getContext('2d')!; context.drawImage(element, 0, 0);
    const pixels = new Uint8Array(context.getImageData(0, 0, 320, 400).data);
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', pixels))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  });
  const beforeImage = await imageHash();
  phase = 1; await page.reload();
  await expect.poll(async () => { const key = (await thumbnail(page, id))?.renderKey; return typeof key === 'string' && key !== before!.renderKey; }).toBe(true);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth === 320)).toBe(true);
  await expect.poll(imageHash).not.toBe(beforeImage);
  const after = await thumbnail(page, id), afterImage = await imageHash();
  expect(afterImage).not.toBe(beforeImage); expect(await project(page, id)).toEqual(saved);
  await page.reload();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth === 320)).toBe(true);
  expect(await imageHash()).toBe(afterImage);
  expect((await thumbnail(page, id))?.revision).toBe(after!.revision);
  await captureUi(page, `a02-thumbnail-current-${testInfo.project.name}`);
  const point = regionPoint(original.id, 0);
  const thumbnailPixel = await image.evaluate((element: HTMLImageElement, point) => {
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 400;
    const context = canvas.getContext('2d')!; context.drawImage(element, 0, 0);
    return [...context.getImageData(Math.round(point.x / 5), Math.round(point.y / 5), 1, 1).data];
  }, point);
  await page.locator('.gallery-card').click();
  await expect(page.getByRole('button', { name: 'PNG保存', exact: true })).toBeEnabled();
  const shown = await page.getByTestId('artwork').locator('canvas').evaluate((element: HTMLCanvasElement, point) => [...element.getContext('2d')!.getImageData(Math.round(point.x / 1600 * element.width), Math.round(point.y / 2000 * element.height), 1, 1).data], point);
  for (let channel = 0; channel < 4; channel++) expect(Math.abs(thumbnailPixel[channel] - shown[channel])).toBeLessThanOrEqual(12);
  expect(shown[2]).toBeGreaterThan(shown[0]);expect(shown[3]).toBe(255);
  mkdirSync('test-results/a02-thumbnail', { recursive: true });
  writeFileSync(`test-results/a02-thumbnail/${testInfo.project.name}.json`, JSON.stringify({ before, after, beforeImage, afterImage, projectUnchanged: true, reloadReusedCurrentImage: true, thumbnailPixel, shown }, null, 2));
});

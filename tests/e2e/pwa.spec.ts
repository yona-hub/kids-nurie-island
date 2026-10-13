import { test, expect, home, startArtwork, tapRegion, project } from './helpers';

test('production PWA has an installable manifest and caches the shell without prefetching the catalog art @pwa', async ({ page, request }) => {
  const templateRequests: string[] = [];
  page.on('request', request => { if (/\/content\/templates\/.*\.json/.test(request.url())) templateRequests.push(request.url()); });
  await home(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestUrl).toBeTruthy();
  const response = await request.get(manifestUrl!);
  const manifest = await response.json() as { name: string; start_url: string; display: string; icons: { src: string; sizes: string }[] };
  expect(manifest.name).toBe('キッズ塗り絵アイランド'); expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBeTruthy();
  expect(manifest.icons.some(icon => icon.sizes === '192x192')).toBe(true);
  expect(manifest.icons.some(icon => icon.sizes === '512x512')).toBe(true);
  expect(templateRequests).toHaveLength(0);
});

test('offline reload restores paint, decorations and edits before reconnect @pwa', async ({ page, context }) => {
  const id = await startArtwork(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const first = await tapRegion(page, 0);
  await expect.poll(async () => Boolean((await project(page, id)).regions[first])).toBe(true);
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.locator('.finish-panel')).toBeVisible();
  await page.getByRole('button', { name: 'はいけい', exact: true }).click();
  await page.getByRole('button', { name: 'あおぞらのしま', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'かざりわく', exact: true }).click();
  await page.getByRole('button', { name: 'カラードット', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const before = await project(page, id);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  const restored = await project(page, id);
  expect(restored.regions).toEqual(before.regions); expect(restored.backgroundId).toBe('sky-island-scenic-v3'); expect(restored.frameId).toBe('color-dots-atelier-v3');
  await page.getByRole('button', { name: 'クレヨン', exact: true }).click();
  const second = await tapRegion(page, 1);
  await expect.poll(async () => (await project(page, id)).regions[second]?.paintType).toBe('crayon');
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect((await project(page, id)).regions[second].paintType).toBe('crayon');
});

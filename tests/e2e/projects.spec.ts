import { readFileSync } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { test, expect, startArtwork, tapRegion, project, storedProjects, captureUi } from './helpers';
import {sceneSamples} from './scene-samples';

test('completion persists first, shows its sequence, and permits finishing an unpainted picture', async ({ page }, testInfo) => {
  const id = await startArtwork(page);
  const before = Date.now();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.locator('.stage-celebrate')).toBeVisible();
  await expect.poll(async () => (await project(page, id)).status).toBe('completed');
  await expect(page.getByText('できた！', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'さくひんのしあげ' })).toBeVisible();
  const returnTarget = await page.getByRole('button', { name: 'もうすこしぬる', exact: true }).boundingBox();
  expect(returnTarget!.width).toBeGreaterThanOrEqual(44); expect(returnTarget!.height).toBeGreaterThanOrEqual(44);
  const elapsed = Date.now() - before;
  expect(elapsed).toBeGreaterThanOrEqual(1_600); expect(elapsed).toBeLessThan(5_000);
  await captureUi(page, `finish-${testInfo.project.name}`);
  await page.getByRole('button', { name: 'もうすこしぬる', exact: true }).click();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
});

test('background, frame, gallery, PNG and duplicate retain the correct state', async ({ page }, testInfo) => {
  const id = await startArtwork(page);
  const region = await tapRegion(page, 0);
  await expect.poll(async () => Boolean((await project(page, id)).regions[region])).toBe(true);
  const painted = (await project(page, id)).regions;
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.locator('.finish-panel')).toBeVisible();
  await page.getByRole('button', { name: 'はいけい', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.locator('.scene-choice').count()).toBeGreaterThanOrEqual(10);
  await page.getByRole('button', { name: 'あおぞらのしま', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await project(page, id)).backgroundId).toBe('sky-island-scenic-v3');
  await page.getByRole('button', { name: 'かざりわく', exact: true }).click();
  await expect(page.locator('.scene-choice')).toHaveCount(21);
  await page.getByRole('button', { name: 'カラードット', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await project(page, id)).frameId).toBe('color-dots-atelier-v3');
  expect((await project(page, id)).regions).toEqual(painted);
  await page.getByRole('button', { name: 'さくひんへ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'PNG保存', exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('gallery-detail.png'), fullPage: true, animations: 'disabled' });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG保存', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path(); if (!path) throw new Error('PNG was not downloaded');
  const png = readFileSync(path);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([2048, 2560]);
  const exported = await loadImage(png);
  const decoded = createCanvas(2048, 2560).getContext('2d');
  decoded.drawImage(exported, 0, 0);
  // The export must match the authored scene at world coordinates. Compare
  // the display with a copy of the export at the same pixel dimensions: the
  // generated jewelry has fine detail which a fit-sized display filters.
  for (const sample of await sceneSamples()) {
    const pngPixel = [...decoded.getImageData(Math.round(sample.x * 1.28), Math.round(sample.y * 1.28), 1, 1).data].slice(0, 3);
    expect(Math.max(...pngPixel.map((channel,i)=>Math.abs(channel-sample.rgb[i])))).toBeLessThanOrEqual(sample.tolerance);
    const shown = await page.getByTestId('artwork').locator('canvas').evaluate((element, point) => {
      const canvas = element as HTMLCanvasElement;
      const x = Math.round(point.x / 1600 * canvas.width) - 2, y = Math.round(point.y / 2000 * canvas.height) - 2;
      const data = canvas.getContext('2d')!.getImageData(x, y, 5, 5).data;
      const rgb = [0, 1, 2].map(channel => Array.from({ length: 25 }, (_, index) => data[index * 4 + channel]).reduce((sum, value) => sum + value, 0) / 25);
      return { width: canvas.width, height: canvas.height, x, y, rgb };
    }, sample);
    const fit = createCanvas(shown.width, shown.height).getContext('2d');
    fit.drawImage(exported, 0, 0, shown.width, shown.height);
    const data = fit.getImageData(shown.x, shown.y, 5, 5).data;
    const fitRgb = [0, 1, 2].map(channel => Array.from({ length: 25 }, (_, index) => data[index * 4 + channel]).reduce((sum, value) => sum + value, 0) / 25);
    expect(Math.max(...shown.rgb.map((channel,i)=>Math.abs(channel-fitRgb[i])))).toBeLessThanOrEqual(sample.tolerance);
  }
  const original = await project(page, id);
  await page.getByRole('button', { name: 'もういちどぬる', exact: true }).click();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  const copyId = page.url().split('/paint/')[1];
  expect(copyId).not.toBe(id);
  const copy = await project(page, copyId);
  expect(copy.status).toBe('draft'); expect(copy.regions).toEqual(original.regions);
  expect(copy.backgroundId).toBe('sky-island-scenic-v3'); expect(copy.frameId).toBe('color-dots-atelier-v3');
  await page.getByRole('button', { name: 'けす', exact: true }).click(); await tapRegion(page, 0);
  await expect.poll(async () => (await project(page, copyId)).regions[region]).toBeUndefined();
  expect((await project(page, id)).regions).toEqual(original.regions);
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await page.getByRole('button', { name: /^さくひん/ }).click();
  await expect(page.getByRole('tab', { name: /^完成/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.gallery-card')).toHaveCount(1);
  await page.getByRole('tab', { name: /^途中/ }).click();
  await expect(page.locator('.gallery-card')).toHaveCount(1);
  expect(await storedProjects(page)).toHaveLength(2);
});

test('backup restore adds copies without overwriting existing work and deletion affects only the selected copy', async ({ page }) => {
  const id = await startArtwork(page);
  const region = await tapRegion(page, 0);
  await expect.poll(async () => Boolean((await project(page, id)).regions[region])).toBe(true);
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'バックアップ', exact: true }).click();
  const download = await promise; const path = await download.path(); if (!path) throw new Error('No backup download');
  const backup = readFileSync(path);
  expect(JSON.parse(backup.toString())).toBeTruthy();
  await page.getByLabel('バックアップファイル').setInputFiles({ name: 'island-backup.json', mimeType: 'application/json', buffer: backup });
  await expect(page.getByRole('dialog', { name: 'バックアップを復元しますか？' })).toBeVisible();
  await page.getByRole('button', { name: '復元する', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await storedProjects(page)).length).toBe(2);
  expect((await project(page, id)).regions[region]).toBeDefined();
  const copy = (await storedProjects(page)).find(item => item.id !== id)!;
  await page.goto(`/#/paint/${copy.id}`);
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: 'さくひんへ', exact: true }).click();
  await page.getByRole('button', { name: 'この作品を削除', exact: true }).click();
  await page.getByRole('button', { name: '削除する', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'さくひん', exact: true })).toBeVisible();
  await expect.poll(async () => (await storedProjects(page)).length).toBe(1);
  expect((await project(page, id)).regions[region]).toBeDefined();
});

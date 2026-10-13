import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { test, expect, startArtwork, project, captureUi } from './helpers';
import {sceneSamples} from './scene-samples';

test('finished paper, artwork and exported scenes share the same 4:5 composition @a18', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const results = [];
  for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    const id = await startArtwork(page);
    await page.getByRole('button', { name: '完成', exact: true }).click();
    await expect(page.getByRole('region', { name: 'さくひんのしあげ' })).toBeVisible();
    const checkRect = async () => {
      const [paper, artwork] = await Promise.all([page.locator('.artwork-shadow').boundingBox(), page.getByTestId('artwork').boundingBox()]);
      expect(paper).not.toBeNull(); expect(artwork).not.toBeNull();
      for (const field of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(paper![field] - artwork![field]), `${viewport.width}×${viewport.height} ${field}`).toBeLessThan(.5);
      expect(Math.abs(paper!.width / paper!.height - .8)).toBeLessThan(.002);
      return { paper, artwork };
    };
    const plain = await checkRect();
    await page.getByRole('button', { name: 'はいけい', exact: true }).click();
    await page.getByRole('button', { name: 'あおぞらのしま', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(async () => (await project(page, id)).backgroundId).toBe('sky-island-scenic-v3');
    await page.getByRole('button', { name: 'かざりわく', exact: true }).click();
    await page.getByRole('button', { name: 'カラードット', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(async () => (await project(page, id)).frameId).toBe('color-dots-atelier-v3');
    const decorated = await checkRect();
    const points = await sceneSamples();
    const shown = await page.getByTestId('artwork').locator('canvas').evaluate((element, points) => {
      const canvas = element as HTMLCanvasElement, context = canvas.getContext('2d')!;
      return points.map(point => [...context.getImageData(Math.round(point.x / 1600 * canvas.width), Math.round(point.y / 2000 * canvas.height), 1, 1).data]);
    }, points);
    await captureUi(page, `a18-finish-${viewport.width}x${viewport.height}-${testInfo.project.name}`);
    await page.getByRole('button', { name: 'さくひんへ', exact: true }).click();
    await expect(page.getByRole('button', { name: 'PNG保存', exact: true })).toBeEnabled();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PNG保存', exact: true }).click();
    const path = await (await downloadPromise).path();
    if (!path) throw new Error('No exported PNG');
    const png = readFileSync(path), image = await loadImage(png);
    expect([image.width, image.height]).toEqual([2048, 2560]);
    const context = createCanvas(2048, 2560).getContext('2d'); context.drawImage(image, 0, 0);
    const exported = points.map(point => [...context.getImageData(Math.round(point.x * 1.28), Math.round(point.y * 1.28), 1, 1).data]);
    for(const [i,point]of points.entries()){
      expect(Math.max(...exported[i].slice(0,3).map((channel,j)=>Math.abs(channel-point.rgb[j])))).toBeLessThanOrEqual(point.tolerance);
      expect(Math.max(...shown[i].slice(0,3).map((channel,j)=>Math.abs(channel-exported[i][j])))).toBeLessThanOrEqual(point.tolerance);
      expect(shown[i][3]).toBe(255);expect(exported[i][3]).toBe(255);
    }
    results.push({ viewport, plain, decorated, samples: points.map((point, index) => ({ point, shown: shown[index], png: exported[index] })), png: { width: image.width, height: image.height } });
  }
  mkdirSync('test-results/a11y', { recursive: true });
  writeFileSync(`test-results/a11y/a18-geometry-${testInfo.project.name}.json`, JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2));
});

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Template } from '../../packages/shared-types/src/index';
import { test, expect, home, startArtwork, tapRegion, project, catalog } from './helpers';

const evidenceRoot = process.env.UI_ART_EVIDENCE_OUTPUT ?? 'test-results/ui-art-v1/revision-2';
const compiled = JSON.parse(readFileSync('content/ui-art-v1/compiled.json', 'utf8')) as { outputs: Record<string, { src: string }> };
const wood = JSON.parse(readFileSync('content/palette-i30/compiled.json','utf8')) as {output:{src:string}};
const expectedURLs = [...Object.entries(compiled.outputs).filter(([id]) => !['palette-board','island-skin','palette'].includes(id)).map(([, output]) => output.src),wood.output.src].sort();
const templateId = catalog.find(item => item.themeId === 'princess')!.id;
const template = JSON.parse(readFileSync('apps/web/public/content/templates/' + templateId + '.json', 'utf8')) as Template;
const skin = template.paintingProfile!.groups.find(group => group.name === 'おひめさまの肌')!;
const face = template.regions.filter(region => skin.regionIds.includes(region.id)).sort((a, b) => b.bounds.width * b.bounds.height - a.bounds.width * a.bounds.height)[0];
const faceIndex = template.regions.findIndex(region => region.id === face.id);

async function decodedIcons(page: import('@playwright/test').Page) {
  await expect.poll(() => page.locator('img.illustrated-icon').evaluateAll(images => images.length > 0 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  return page.locator('img.illustrated-icon').evaluateAll(images => images.map(image => ({ src: new URL((image as HTMLImageElement).src).pathname, naturalWidth: (image as HTMLImageElement).naturalWidth })));
}

test('I30 generated wood and unified brown edits survive offline reload @pwa', async ({ page, context }, info) => {
  const folder = evidenceRoot + '/' + info.project.name;
  mkdirSync(folder, { recursive: true });
  await home(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  // I30 displays 23 assets after visiting finish; old board/skin/palette icons remain unused.
  // Previously unseen artwork is deliberately not prefetched for offline use.
  await page.reload();
  await decodedIcons(page);
  const id = await startArtwork(page, 'おひめさま', 0, 'group');
  await decodedIcons(page);
  await page.getByRole('button',{name:'完成',exact:true}).click();
  await expect(page.locator('.finish-panel')).toBeVisible();await decodedIcons(page);
  await page.getByRole('button',{name:'もうすこしぬる',exact:true}).click();
  await decodedIcons(page);
  expect(expectedURLs).toHaveLength(23);
  await expect.poll(() => page.evaluate(async () => {
    const cache = await caches.open('island-ui-illustrations-v1');
    return (await cache.keys()).map(request => new URL(request.url).pathname).sort();
  })).toEqual(expectedURLs);
  await page.getByRole('button', { name: 'ちゃいろのしま', exact: true }).click();
  const shades = page.getByRole('group', { name: 'ちゃいろの12色', exact: true }).getByRole('button');
  await shades.nth(10).click();
  await tapRegion(page, faceIndex, templateId);
  await expect.poll(async () => (await project(page, id)).regions[face.id]?.color).toBe('#392015');
  const before = await project(page, id);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  const editorIcons = await decodedIcons(page);
  expect((await project(page, id)).regions).toEqual(before.regions);
  const cssAssets = await page.evaluate(async () => {
    if (getComputedStyle(document.querySelector('.palette-panel')!).backgroundImage !== 'none') throw Error('The wooden board must remain absent offline');
    const sources = [{source:getComputedStyle(document.querySelector('.shade > span')!, '::before').maskImage,mask:true},{source:getComputedStyle(document.querySelector('.palette-lane-shades')!).backgroundImage,mask:false}];
    return Promise.all(sources.map(async ({source,mask}) => {
      const url = source.match(/url\(["']?([^"')]+)/)?.[1];
      if (!url) throw Error('Generated CSS asset is missing');
      // A CSS mask uses CORS (Origin header), unlike a background image.
      // Decode with the same request mode so a Vary: Origin response matches.
      const image = new Image();
      if(mask)image.crossOrigin = 'anonymous';
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0, painted = 0;
      for (let offset = 3; offset < pixels.length; offset += 4) { if (pixels[offset] === 0) transparent++; else painted++; }
      return { src: new URL(url).pathname, requestMode: mask?'cors':'ordinary-image', width: image.naturalWidth, height: image.naturalHeight, transparent, painted };
    }));
  });
  expect(cssAssets.map(asset => asset.src)).toEqual([compiled.outputs['paint-dab'].src,wood.output.src]);
  for (const asset of cssAssets) { expect(asset.width).toBeGreaterThan(0); if(asset.requestMode==='cors')expect(asset.transparent).toBeGreaterThan(0);else expect(asset.transparent).toBe(0); expect(asset.painted).toBeGreaterThan(0); }
  await page.getByRole('button', { name: 'ちゃいろのしま', exact: true }).click();
  await page.getByRole('button', { name: 'いろえんぴつ', exact: true }).click();
  await page.getByRole('group', { name: 'ちゃいろの12色', exact: true }).getByRole('button').nth(11).click();
  await tapRegion(page, faceIndex, templateId);
  await expect.poll(async () => { const current = await project(page, id); return skin.regionIds.every(regionId => current.regions[regionId]?.color === '#291711' && current.regions[regionId]?.paintType === 'pencil'); }).toBe(true);
  const offlineSaved = await project(page, id);
  await page.screenshot({ path: folder + '/editor-offline.png', fullPage: true });
  await home(page);
  const homeIcons = await decodedIcons(page);
  expect(new Set(homeIcons.map(icon => icon.src))).toEqual(new Set(['brand-island', 'settings', 'continue', 'gallery'].map(id => compiled.outputs[id].src)));
  await page.screenshot({ path: folder + '/home-offline.png', fullPage: true });
  await context.setOffline(false);
  await page.goto('/#/paint/' + id);
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect((await project(page, id)).regions).toEqual(offlineSaved.regions);
  writeFileSync(folder + '/offline-evidence.json', JSON.stringify({ expectedURLs, editorIcons, homeIcons, cssAssets, skinRegions: skin.regionIds, restoredRegions: before.regions, offlineSavedRegions: offlineSaved.regions, limit: 'Previously displayed assets after a controlled visit; first-ever offline visit is not supported.' }, null, 2));
});

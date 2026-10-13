import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { test, expect, startArtwork, project, catalog, settleAnimations, noHorizontalOverflow } from './helpers';
import type { SceneAsset, Template } from '../../packages/shared-types/src/index';
import type { Page } from '@playwright/test';

const output = process.env.SCENE_ART_EVIDENCE_OUTPUT ?? 'test-results/scene-art-v3/revision-1';
const entry = catalog.find(template => template.themeId === 'princess')!;
const template = JSON.parse(readFileSync(`apps/web/public${entry.assetUrl}`, 'utf8')) as Template;
const choices = (kind: string) => (JSON.parse(readFileSync(`apps/web/public/content/${kind}.json`, 'utf8')) as SceneAsset[]).filter(asset => asset.catalogVisible !== false && asset.compositionUrl);
const colors: Record<string, [string, number]> = { g1: ['ちゃいろ', 5], g2: ['ちゃいろ', 1], g3: ['ピンク', 4], g4: ['ピンク', 4], g5: ['きいろ', 4], g6: ['ピンク', 5], g7: ['しろ', 2], g8: ['ピンク', 2], g9: ['みどり', 3], g10: ['ちゃいろ', 6], g11: ['ちゃいろ', 6], g12: ['きいろ', 4], g13: ['あか', 3], g14: ['ピンク', 3], g15: ['あか', 3] };

async function select(page: Page, label: string, asset: SceneAsset, count: number) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.locator('.scene-choice')).toHaveCount(count);
  await page.getByRole('dialog').getByRole('button', { name: asset.name, exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.finish-panel')).toBeVisible();
  await settleAnimations(page);
}

test('I24 scenes: all ten landscapes and twenty designed frames render, persist, and export', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const directory = `${output}/browser/scenes/${testInfo.project.name}`; mkdirSync(directory, { recursive: true });
  const requests: string[] = [];
  page.on('request', request => { if (/\/content\/decor\/.*-(?:scenic|atelier)-v3-/.test(request.url())) requests.push(new URL(request.url()).pathname); });
  const id = await startArtwork(page, 'おひめさま', 0, 'group'), stage = page.getByTestId('artwork');
  expect(requests).toEqual([]);
  for (const [index, group] of template.paintingProfile!.groups.entries()) {
    const [family, shade] = colors[group.id];
    await page.getByRole('button', { name: `${family}のしま`, exact: true }).click();
    await page.locator('.shades button').nth(shade).click();
    await stage.focus(); if (index) await stage.press('ArrowRight'); await stage.press('Enter');
  }
  await page.getByRole('button', { name: 'もとの大きさ', exact: true }).click();
  await expect.poll(async () => Object.keys((await project(page, id)).regions).length).toBe(template.regions.length - template.paintingProfile!.eyes.length);
  const painted = (await project(page, id)).regions;
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.locator('.finish-panel')).toBeVisible();
  const evidence = [];
  for (const background of choices('backgrounds')) {
    await select(page, 'はいけい', background, 11);
    await expect.poll(async () => (await project(page, id)).backgroundId).toBe(background.id);
    await stage.screenshot({ path: `${directory}/${background.id}.png` });
    evidence.push({ kind: 'background', id: background.id, image: `${background.id}.png` });
  }
  const garden = choices('backgrounds').find(asset => asset.legacyId === 'castle-garden')!;
  await select(page, 'はいけい', garden, 11);
  for (const frame of choices('frames')) {
    await select(page, 'かざりわく', frame, 21);
    await expect.poll(async () => (await project(page, id)).frameId).toBe(frame.id);
    await stage.screenshot({ path: `${directory}/${frame.id}.png` });
    evidence.push({ kind: 'frame', id: frame.id, image: `${frame.id}.png` });
  }
  const royal = choices('frames').find(asset => asset.legacyId === 'royal-jewels')!;
  await select(page, 'かざりわく', royal, 21);
  expect((await project(page, id)).regions).toEqual(painted);
  await noHorizontalOverflow(page);
  await page.reload();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect(await project(page, id)).toMatchObject({ backgroundId: garden.id, frameId: royal.id, regions: painted });
  await settleAnimations(page); await stage.screenshot({ path: `${directory}/reloaded-garden-royal.png` });
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: 'さくひんへ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'PNG保存', exact: true })).toBeEnabled();
  await settleAnimations(page); await page.screenshot({ path: `${directory}/gallery-detail.png`, fullPage: true });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG保存', exact: true }).click();
  const file = await (await download).path(); if (!file) throw Error('No scene PNG');
  const bytes = readFileSync(file); expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([2048, 2560]);
  writeFileSync(`${directory}/garden-royal-2048.png`, bytes);
  writeFileSync(`${directory}/evidence.json`, JSON.stringify({ templateId: entry.id, scenes: evidence, requestedParts: [...new Set(requests)], project: await project(page, id) }, null, 2));
});

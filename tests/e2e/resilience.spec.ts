import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect, startArtwork, tapRegion, project, storedProjects, home } from './helpers';

test('at 500 works, new copies are refused while existing PNG export and deletion remain available', async ({ page }) => {
  test.setTimeout(120_000);
  const id = await startArtwork(page);
  const region = await tapRegion(page, 0);
  await expect.poll(async () => Boolean((await project(page, id)).regions[region])).toBe(true);
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: 'さくひんへ', exact: true }).click();
  const original = await project(page, id);
  await page.goto('/#/settings');
  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'バックアップ', exact: true }).click();
  const backupPath = await (await backupPromise).path();
  if (!backupPath) throw new Error('No backup download');
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
  backup.projects = Array.from({ length: 499 }, (_, index) => ({ ...original, id: randomUUID(), title: `上限確認 ${index + 1}` }));
  await page.getByLabel('バックアップファイル').setInputFiles({ name: '499-works.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: '復元する', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await storedProjects(page)).length).toBe(500);
  await expect(page.getByText('500 / 500作品', { exact: true })).toBeVisible();

  await home(page);
  await page.getByRole('button', { name: 'おひめさまのしま', exact: true }).click();
  await page.locator('.template-card').first().click();
  await expect(page.getByRole('status')).toContainText('作品が500件になりました');
  await expect(page).toHaveURL(/#\/theme\//);
  expect(await storedProjects(page)).toHaveLength(500);
  expect((await project(page, id)).regions).toEqual(original.regions);

  await page.goto(`/#/art/${id}`);
  await expect(page.getByRole('button', { name: 'PNG保存', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'もういちどぬる', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('作品が500件になりました');
  await expect(page).toHaveURL(new RegExp(`#/art/${id}$`));
  const pngPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG保存', exact: true }).click();
  const pngPath = await (await pngPromise).path();
  if (!pngPath) throw new Error('No PNG download at the work limit');
  const png = readFileSync(pngPath);
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([2048, 2560]);
  const copy = (await storedProjects(page)).find(item => item.id !== id)!;
  await page.goto(`/#/art/${copy.id}`);
  await page.getByRole('button', { name: 'この作品を削除', exact: true }).click();
  await page.getByRole('button', { name: '削除する', exact: true }).click();
  await expect.poll(async () => (await storedProjects(page)).length).toBe(499);
  expect((await project(page, id)).regions).toEqual(original.regions);
  const newId = await startArtwork(page);
  expect(newId).not.toBe(id);
  expect(await storedProjects(page)).toHaveLength(500);
});

test('editing the same work in two tabs preserves both versions', async ({ page, context }) => {
  const id = await startArtwork(page);
  const other = await context.newPage();
  const errors: string[] = [];
  other.on('pageerror', error => errors.push(error.message));
  other.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await other.goto(`/#/paint/${id}`);
    await expect(other.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
    await page.bringToFront();
    await page.locator('.shades button').nth(4).click();
    const region = await tapRegion(page, 0);
    await expect.poll(async () => (await project(page, id)).regions[region]?.color).toBe('#FF6AA3');
    await other.bringToFront();
    await other.getByRole('button', { name: 'クレヨン', exact: true }).click();
    await other.locator('.shades button').nth(8).click();
    await tapRegion(other, 0);
    await expect.poll(async () => (await storedProjects(other)).length).toBe(2);
    const versions = await storedProjects(other);
    const preserved = versions.find(item => item.id === id)!;
    const copy = versions.find(item => item.id !== id)!;
    expect(preserved.regions[region]).toMatchObject({ color: '#FF6AA3', paintType: 'smooth' });
    expect(copy.regions[region]).toEqual({ color: '#D12F7B', paintType: 'crayon' });
    expect(copy.title).toContain('別の作品');
    await other.reload();
    await expect(other.getByTestId('artwork')).toBeVisible();
    expect(await storedProjects(other)).toHaveLength(2);
    expect((await project(other, id)).regions).toEqual(preserved.regions);
    expect((await project(other, copy.id)).regions).toEqual(copy.regions);
  } finally {
    await other.close();
    expect(errors, 'The second tab should not report errors').toEqual([]);
  }
});

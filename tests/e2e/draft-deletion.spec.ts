import { test, expect, startArtwork, tapRegion, project, storedProjects, settleAnimations } from './helpers';

async function drafts(page: import('@playwright/test').Page) {
  await page.goto('/#/gallery');
  await page.getByRole('tab', { name: /^途中/ }).click();
  await settleAnimations(page);
}

test('draft deletion can be cancelled, removes only the selected work, and survives reload', async ({ page }, testInfo) => {
  const firstId = await startArtwork(page);
  const region = await tapRegion(page, 0);
  await expect.poll(async () => Boolean((await project(page, firstId)).regions[region])).toBe(true);
  const original = await project(page, firstId);
  const secondId = await startArtwork(page, 'まほう');
  const other = await project(page, secondId);
  await drafts(page);
  await page.screenshot({ path: testInfo.outputPath('draft-gallery.png'), fullPage: true });
  const remove = page.getByRole('button', { name: `「${original.title}」を削除`, exact: true });
  await remove.click();
  await expect(page).toHaveURL(/#\/gallery$/);
  await expect(page.getByRole('dialog')).toContainText(original.title);
  await page.screenshot({ path: testInfo.outputPath('draft-confirm.png'), fullPage: true });
  await page.getByRole('button', { name: 'やめる', exact: true }).click();
  expect(await project(page, firstId)).toEqual(original);
  await remove.click();
  await page.getByRole('button', { name: '削除する', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await storedProjects(page)).map(item => item.id)).toEqual([secondId]);
  expect(await project(page, secondId)).toEqual(other);
  await expect(remove).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: /^途中/ }).click();
  await expect(page.locator('.gallery-card')).toHaveCount(1);
  expect(await project(page, secondId)).toEqual(other);
});

test('a confirmation opened before another tab saves cannot delete the newer draft', async ({ page, context }) => {
  const id = await startArtwork(page), saved = await project(page, id);
  await drafts(page);
  await page.getByRole('button', { name: `「${saved.title}」を削除`, exact: true }).click();
  const editor = await context.newPage();
  try {
    await editor.goto(`/#/paint/${id}`);
    await expect(editor.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
    await editor.getByRole('button', { name: 'こまかく', exact: true }).click();
    const region = await tapRegion(editor, 0);
    await expect.poll(async () => Boolean((await project(editor, id)).regions[region])).toBe(true);
    const newer = await project(editor, id);
    await page.bringToFront();
    await page.getByRole('button', { name: '削除する', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await project(page, id)).toEqual(newer);
    await expect(page.locator('.toast[role="status"]')).toContainText('作品が新しくなっています');
    await expect(page.getByText('途中の作品を削除しました', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: `「${saved.title}」を削除`, exact: true })).toBeVisible();
  } finally { await editor.close(); }
});

test('a failed draft deletion keeps the work and leaves a usable retry', async ({ page }) => {
  const id = await startArtwork(page), saved = await project(page, id);
  await drafts(page);
  await page.getByRole('button', { name: `「${saved.title}」を削除`, exact: true }).click();
  await page.evaluate(() => {
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args: Parameters<typeof transaction>) {
      if (args[1] === 'readwrite' && Array.isArray(args[0]) && args[0].includes('projects') && args[0].includes('thumbnails') && args[0].includes('leases')) {
        IDBDatabase.prototype.transaction = transaction;
        throw new DOMException('Test storage failure', 'QuotaExceededError');
      }
      return transaction.apply(this, args);
    };
  });
  await page.getByRole('button', { name: '削除する', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '削除する', exact: true })).toBeEnabled();
  expect(await project(page, id)).toEqual(saved);
  await page.getByRole('button', { name: '削除する', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await storedProjects(page)).length).toBe(0);
});

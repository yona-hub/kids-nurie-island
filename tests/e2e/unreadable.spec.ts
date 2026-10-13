import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect, startArtwork, tapRegion, project, captureUi } from './helpers';

async function rows(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const open = indexedDB.open('kids-nurie-island-v1'); open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error); });
    try {
      return await new Promise<Array<{ key: string; project: { id: string; regions: object } | null; quarantine?: unknown }>>((resolve, reject) => {
        const request = db.transaction('projects', 'readonly').objectStore('projects').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
}

test('@a19 unreadable data preserves healthy works, raw download, backup restoration and explicit cleanup', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const firstId = await startArtwork(page);
  const region = await tapRegion(page, 0);
  await expect.poll(async () => Boolean((await project(page, firstId)).regions[region])).toBe(true);
  const paints = (await project(page, firstId)).regions;
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  const secondId = await startArtwork(page);
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  const damagedId = await startArtwork(page);
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  const raw = await page.evaluate(async id => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const open = indexedDB.open('kids-nurie-island-v1'); open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error); });
    try {
      return await new Promise<{ key: string; operationId: string; revision: number }>((resolve, reject) => {
        const tx = db.transaction('projects', 'readwrite'), store = tx.objectStore('projects'), request = store.getAll();
        let selected: { key: string; operationId: string; revision: number };
        request.onsuccess = () => { const row = request.result.find(item => item.project.id === id); selected = row; store.put({ ...row, project: null }); };
        tx.oncomplete = () => resolve(selected); tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, damagedId);
  await page.reload();
  await expect(page.getByText('読み取れない作品が1件あります。元データはこの端末に残しています。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^さくひん/ }).click();
  await page.getByRole('tab', { name: /^途中/ }).click();
  await expect(page.locator('.gallery-card')).toHaveCount(2);
  await page.getByRole('button', { name: '設定で確認する', exact: true }).click();
  const recovery = page.getByRole('region', { name: '読み取れない作品', exact: true });
  await expect(recovery).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const button of await recovery.getByRole('button').all()) {
    const box = await button.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await captureUi(page, `a19-unreadable-settings-${testInfo.project.name}`);
  const rawDownload = page.waitForEvent('download');
  await recovery.getByRole('button', { name: '元データを保存', exact: true }).click();
  const rawPath = await (await rawDownload).path(); if (!rawPath) throw new Error('No raw recovery download');
  const exported = JSON.parse(readFileSync(rawPath, 'utf8'));
  expect(exported.record).toMatchObject({ key: raw.key, operationId: raw.operationId, revision: raw.revision, project: null });
  const backupDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'バックアップ', exact: true }).click();
  const backupPath = await (await backupDownload).path(); if (!backupPath) throw new Error('No healthy backup download');
  const backup = readFileSync(backupPath), parsed = JSON.parse(backup.toString());
  expect(parsed.projects.map((value: { id: string }) => value.id).sort()).toEqual([firstId, secondId].sort());
  expect(parsed.projects.find((value: { id: string }) => value.id === firstId).regions).toEqual(paints);
  expect(parsed.excludedUnreadableRecords).toHaveLength(1);
  await page.getByLabel('バックアップファイル').setInputFiles({ name: 'healthy-backup.json', mimeType: 'application/json', buffer: backup });
  await page.getByRole('button', { name: '復元する', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await rows(page)).length).toBe(5);
  expect((await rows(page)).find(row => row.key === raw.key)?.project).toBeNull();
  await recovery.getByRole('button', { name: 'この端末から整理', exact: true }).click();
  await page.getByRole('button', { name: 'やめる', exact: true }).click();
  expect(await rows(page)).toHaveLength(5);
  await recovery.getByRole('button', { name: 'この端末から整理', exact: true }).click();
  await page.getByRole('button', { name: 'このデータを削除', exact: true }).click();
  await expect(recovery).toHaveCount(0);
  expect(await rows(page)).toHaveLength(4);
  expect((await rows(page)).find(row => row.project?.id === firstId)?.project?.regions).toEqual(paints);
  await page.reload(); await expect(recovery).toHaveCount(0);
  expect(await rows(page)).toHaveLength(4);
});

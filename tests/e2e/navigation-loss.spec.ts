import type { Page } from '@playwright/test';
import { expect, test, project, regionPoint, startArtwork, tapRegion } from './helpers';

type Fault = { active: boolean; mode: 'quota' | 'hold'; writes: number };

async function storageFault(page: Page, mode: Fault['mode']) {
  await page.evaluate((mode) => {
    const fault: Fault = { active: true, mode, writes: 0 };
    Object.defineProperty(window, '__a19Fault', { configurable: true, value: fault });
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (this.name !== 'projects' || !fault.active) return put.call(this, value, key);
      fault.writes++;
      if (fault.mode === 'quota') throw new DOMException('検証用の保存容量不足', 'QuotaExceededError');
      const result = put.call(this, value, key);
      // Keep this real native read/write transaction uncommitted, without a
      // sleep or a fake save promise. A readonly connection cannot see it yet.
      const keepAlive = () => {
        if (!fault.active) return;
        const request = this.get('__a19_keep_alive__');
        request.onsuccess = keepAlive;
      };
      keepAlive();
      return result;
    };
  }, mode);
}
async function recover(page: Page) {
  await page.evaluate(() => { (window as unknown as { __a19Fault: Fault }).__a19Fault.active = false; });
}
async function localSaveFailed(page: Page) {
  return page.evaluate(async () => {
    const dev = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/src/main.tsx"]');
    const entry = document.querySelector<HTMLScriptElement>('script[type="module"][src]')!;
    const module = await import(dev ? new URL('./app-context.tsx', dev.src).href : entry.src);
    const app = Object.values(module).find(value => value && typeof value === 'object' && 'sync' in value && 'projects' in value) as { sync: { status: { localSaveFailed?: boolean } } } | undefined;
    if (!app) throw new Error('Built application services export not found');
    return app.sync.status.localSaveFailed === true;
  });
}
// Only the SW boundary is synthetic here. The real App, navigation guard,
// persistence and registerPwaUpdates must authorize and issue the request.
async function installWaitingUpdate(page: Page) {
  await page.addInitScript(() => {
    const proof = { activationRequests: 0, updateEvents: 0 };
    Object.defineProperty(window, '__a19Update', { value: proof });
    window.addEventListener('island-apply-update', () => { proof.updateEvents++; });
    const registration = Object.assign(new EventTarget(), {
      installing: null,
      waiting: { postMessage(message: { type?: string }, ports: MessagePort[]) {
        if (message.type === 'ISLAND_ACTIVATE_UPDATE') proof.activationRequests++;
        ports[0]?.postMessage({ status: 'accepted' });
        ports[0]?.close();
      } },
    });
    const container = Object.assign(new EventTarget(), { controller: {}, register: async () => registration });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container });
  });
}
async function pixel(page: Page, point: { x: number; y: number }) {
  return page.getByTestId('artwork').locator('canvas').evaluate((canvas: HTMLCanvasElement, point) => {
    return [...canvas.getContext('2d')!.getImageData(Math.floor(point.x / 1600 * canvas.width), Math.floor(point.y / 2000 * canvas.height), 1, 1).data];
  }, point);
}
async function painted(page: Page, point: { x: number; y: number }) {
  await expect.poll(async () => {
    const [red, green, blue] = await pixel(page, point);
    return red - green > 35 && blue - green > 12;
  }).toBe(true);
}
const dialogTitle = 'まだ保存できていない変更があります';

test('@a19 quota failure retains paint across history back/forward and persists after recovery', async ({ page }, info) => {
  const id = await startArtwork(page);
  const source = await project(page, id), point = regionPoint(source.templateId, 0);
  await storageFault(page, 'quota');
  const region = await tapRegion(page, 0, source.templateId);
  await expect(page.getByRole('button', { name: '保存をやりなおす' })).toBeVisible();
  await painted(page, point);
  await page.evaluate(() => history.back());
  await expect(page.getByRole('dialog', { name: dialogTitle })).toBeVisible();
  await painted(page, point);
  expect((await project(page, id)).regions).toEqual({});
  await page.screenshot({ path: info.outputPath('quota-history-retained.png'), fullPage: true });
  await page.evaluate(() => history.forward());
  await expect(page).toHaveURL(new RegExp(`/paint/${id}$`));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await recover(page);
  await page.getByRole('button', { name: '保存をやりなおす' }).click();
  await expect.poll(async () => (await project(page, id)).regions[region]?.color).toBe('#F64C91');
  await page.evaluate(() => history.back());
  await expect(page.locator('.theme-navigation')).toBeVisible();
  await page.evaluate(() => history.forward());
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await painted(page, point);
  await page.reload();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await painted(page, point);
});

test('@a19 app back, another failed save, raw hash cancel and explicit discard preserve the last saved version', async ({ page }, info) => {
  await installWaitingUpdate(page);
  const id = await startArtwork(page);
  const source = await project(page, id), point = regionPoint(source.templateId, 0);
  const retainedRegion = await tapRegion(page, 1, source.templateId);
  const retainedPoint = regionPoint(source.templateId, 1);
  await expect.poll(async () => (await project(page, id)).regions[retainedRegion]?.color).toBe('#F64C91');
  await storageFault(page, 'quota');
  await tapRegion(page, 0, source.templateId);
  await expect(page.getByRole('button', { name: '保存をやりなおす' })).toBeVisible();
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: dialogTitle });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '保存して移動' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await painted(page, point);
  const length = await page.evaluate(() => history.length);
  await dialog.getByRole('button', { name: 'ぬりえにもどる' }).click();
  await expect(page).toHaveURL(new RegExp(`/paint/${id}$`));
  expect(await page.evaluate(() => history.length)).toBe(length);
  await page.evaluate(() => { location.hash = '/home'; });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(new RegExp(`/paint/${id}$`));
  await painted(page, point);
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await dialog.getByRole('button', { name: '未保存の変更を破棄して移動' }).click();
  await expect(page.locator('.storybook-home')).toBeVisible();
  expect((await project(page, id)).regions).toEqual({ [retainedRegion]: { color: '#F64C91', paintType: 'smooth' } });
  await expect.poll(() => localSaveFailed(page)).toBe(false);
  await expect(page.getByText('この端末に保存できていません。画面を閉じずに、保存をやりなおしてください。')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('discarded-home-no-warning.png'), fullPage: true });
  // PWA registration is intentionally production-only in main.tsx.
  if (await page.locator('script[type="module"][src*="/src/main.tsx"]').count() === 0) {
    await page.getByRole('button', { name: '更新する', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __a19Update: { activationRequests: number; updateEvents: number } }).__a19Update)).toEqual({ activationRequests: 1, updateEvents: 1 });
    await info.attach('a19-discard-update-proof', { contentType: 'application/json', body: JSON.stringify({ localSaveFailed: await localSaveFailed(page), retainedRegions: (await project(page, id)).regions, update: await page.evaluate(() => (window as unknown as { __a19Update: unknown }).__a19Update), serviceWorkerBoundary: 'synthetic waiting worker; real application authorization and MessageChannel request' }) });
  }
  await recover(page);
  await page.evaluate((id) => { location.hash = `/paint/${id}`; }, id);
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await expect.poll(async () => (await pixel(page, point)).slice(0, 3).every(value => value > 248)).toBe(true);
  await painted(page, retainedPoint);
});

test('@a19 native first transaction remains mounted and cancelling the navigation wins over late commit', async ({ page }) => {
  const id = await startArtwork(page);
  const source = await project(page, id), point = regionPoint(source.templateId, 0);
  await storageFault(page, 'hold');
  const region = await tapRegion(page, 0, source.templateId);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __a19Fault: Fault }).__a19Fault.writes)).toBe(1);
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: dialogTitle });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: '未保存の変更を破棄して移動' })).toBeDisabled();
  await dialog.getByRole('button', { name: '保存して移動' }).click();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(new RegExp(`/paint/${id}$`));
  await recover(page);
  await expect.poll(async () => (await project(page, id)).regions[region]?.color).toBe('#F64C91');
  await painted(page, point);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/paint/${id}$`));
});

test('@a19 native first transaction commits before an explicitly confirmed navigation', async ({ page }) => {
  const id = await startArtwork(page);
  const source = await project(page, id);
  await storageFault(page, 'hold');
  const region = await tapRegion(page, 0, source.templateId);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __a19Fault: Fault }).__a19Fault.writes)).toBe(1);
  await page.evaluate(() => { location.hash = '/home'; });
  const dialog = page.getByRole('dialog', { name: dialogTitle });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '保存して移動' }).click();
  await expect(page.getByTestId('artwork')).toBeVisible();
  await recover(page);
  await expect(page.locator('.storybook-home')).toBeVisible();
  expect((await project(page, id)).regions[region]?.color).toBe('#F64C91');
});

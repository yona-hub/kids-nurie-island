import { test, expect, home, startArtwork, tapRegion, project } from './helpers';

test('settings persist, Japanese speech safely falls back, and reduced motion is short', async ({ page }) => {
  await page.addInitScript(() => {
    const speech = Object.assign(new EventTarget(), { getVoices: () => [], speak: () => { throw new Error('Speech should not be used without a Japanese voice'); }, cancel: () => undefined });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await home(page);
  await page.getByRole('button', { name: '設定', exact: true }).click();
  const speechSwitch = page.getByRole('switch', { name: /色の名前を読み上げる/ });
  await expect(speechSwitch).toBeDisabled(); await expect(speechSwitch).not.toBeChecked();
  await expect(page.getByText('この端末では日本語の音声を利用できません')).toBeVisible();
  await page.getByText('演出をひかえめにする', { exact: true }).click();
  await expect(page.getByRole('switch', { name: '演出をひかえめにする', exact: true })).toBeChecked();
  await page.getByText('効果音', { exact: true }).click();
  await expect(page.getByRole('switch', { name: /^効果音/ })).not.toBeChecked();
  await page.getByText('タップ操作の補助', { exact: true }).click();
  await expect(page.getByRole('switch', { name: /^タップ操作の補助/ })).not.toBeChecked();
  // Switches update optimistically. Verify the native transaction committed
  // before reloading; the checked state alone is not a persistence assertion.
  await expect.poll(() => page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kids-nurie-island-v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const tx = database.transaction('settings', 'readonly');
        const request = tx.objectStore('settings').getAll();
        tx.oncomplete = () => resolve(request.result.map(row => ({
          reducedMotion: row.value.reducedMotion,
          soundEffects: row.value.soundEffects,
          tapAssist: row.value.tapAssist,
        })));
        tx.onerror = () => reject(tx.error);
      });
    } finally { database.close(); }
  })).toEqual([{ reducedMotion: true, soundEffects: false, tapAssist: false }]);
  await page.reload();
  await expect(page.getByRole('switch', { name: '演出をひかえめにする', exact: true })).toBeChecked();
  await expect(page.getByRole('switch', { name: /^効果音/ })).not.toBeChecked();
  await expect(page.getByRole('switch', { name: /^タップ操作の補助/ })).not.toBeChecked();
  const id = await startArtwork(page);
  await page.locator('.shades button').nth(4).click();
  const region = await tapRegion(page, 0);
  await expect.poll(async () => (await project(page, id)).regions[region]?.color).toBe('#FF6AA3');
  const before = Date.now();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByRole('region', { name: 'さくひんのしあげ' })).toBeVisible();
  expect(Date.now() - before).toBeLessThan(1_500);
});

test('local sign-out and sign-in preserve work and expose the appropriate login copy', async ({ page }) => {
  const id = await startArtwork(page);
  const region = await tapRegion(page, 0);
  await expect.poll(async () => Boolean((await project(page, id)).regions[region])).toBe(true);
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'ログアウト', exact: true }).click();
  await expect(page.getByText('作品を保存するため、ログインしてください', { exact: true })).toBeVisible();
  await expect(page.getByText(/保護者の方がログイン/)).toHaveCount(0);
  await page.getByRole('button', { name: 'この端末でためす', exact: true }).click();
  await expect(page.locator('.storybook-home')).toBeVisible();
  await page.getByRole('button', { name: /つづきから/ }).click();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect(page.url()).toContain(id);
  expect((await project(page, id)).regions[region]).toBeDefined();
});

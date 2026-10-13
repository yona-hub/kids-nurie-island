import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { test, expect, home, startArtwork, tapRegion, project } from './helpers';
import { checkA11y, waitForSettings } from './accessibility-helpers';
import { textContrast } from './contrast-helpers';

// Fresh lazy chunks must reach the route gate, not a previously installed SW.
test.use({ serviceWorkers: 'block' });

test('editor titles, dates and related supporting text retain 4.5 contrast on their actual backgrounds @a13', async ({ page }, testInfo) => {
  const measurements: { surface: string; text: Awaited<ReturnType<typeof textContrast>> }[] = [];
  const measure = async (surface: string, selector: string) => measurements.push({ surface, text: await textContrast(page, selector) });
  await home(page);
  await measure('home', '.eyebrow,.home-subtitle,.local-mode-note,.app-footer > span');
  await page.getByRole('button', { name: 'おひめさまのしま', exact: true }).click();
  await expect(page.locator('.template-card')).toBeVisible();
  await measure('theme', '.theme-heading p,.eyebrow,.gentle-note');
  await page.locator('.template-card').first().click();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await measure('editor', '.editor-title');
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: 'さくひんへ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'PNG保存', exact: true })).toBeEnabled();
  await measure('detail', '.detail-heading p,.detail-actions > .muted');
  await page.goto('/#/gallery');
  await expect(page.locator('.gallery-card')).toHaveCount(1);
  await measure('gallery', '.eyebrow,.section-intro p,.gallery-card > span');
  await page.goto('/#/settings');
  await waitForSettings(page);
  await measure('settings', '.setting-row small,.muted,.app-footer > span');
  mkdirSync('test-results/a11y', { recursive: true });
  writeFileSync(`test-results/a11y/contrast-a13-${testInfo.project.name}.json`, JSON.stringify({ measuredAt: new Date().toISOString(), viewport: page.viewportSize(), method: 'CSS foreground vs every actual background pixel under text ranges; text made transparent only for background capture; ancestor opacity included', measurements }, null, 2));
  for (const group of measurements) for (const row of group.text) {
    expect(row.samples, `${group.surface}: ${row.text}`).toBeGreaterThan(0);
    expect(row.minContrast, `${group.surface}: ${row.text} (${row.color} on ${row.worstBackground})`).toBeGreaterThanOrEqual(4.5);
  }
});

test('settings axe waits for its real inputs after a deliberately held lazy chunk @a13', async ({ page }, testInfo) => {
  let release!: () => void, requestedUrl = '';
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/(?:assets\/Settings-[^/]+\.js|src\/pages\/Settings\.tsx)(?:\?|$)/, async route => {
    requestedUrl = route.request().url();
    await gate;
    await route.continue();
  });
  try {
    await home(page);
    await page.getByRole('button', { name: '設定', exact: true }).click();
    await expect.poll(() => requestedUrl).not.toBe('');
    await expect(page.locator('.loading-state')).toBeVisible();
    await expect(page.locator('.settings-page')).toHaveCount(0);
    release();
    await waitForSettings(page);
    await checkA11y(page, `settings-delayed-${testInfo.project.name}`, true);
    await testInfo.attach('delayed-settings-proof', { body: JSON.stringify({ requestedUrl, loadingBeforeRelease: true, settingsBeforeRelease: 0, switchesAfterRelease: 5, slidersAfterRelease: 1 }), contentType: 'application/json' });
  } finally { release(); }
});

test('restore has one visible keyboard entry, chooser keys and cancellation return focus @a13', async ({ page }, testInfo) => {
  await home(page);
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await waitForSettings(page);
  const restore = page.getByRole('button', { name: '復元', exact: true });
  const input = page.getByLabel('バックアップファイル');
  await expect(input).toBeHidden();
  await expect(input).toHaveAttribute('tabindex', '-1');
  await restore.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'ログアウト', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(restore).toBeFocused();
  const cancellation = [];
  for (const key of ['Enter', 'Space']) {
    const chooserPromise = page.waitForEvent('filechooser');
    await restore.press(key);
    const chooser = await chooserPromise;
    expect(await chooser.element().getAttribute('type')).toBe('file');
    // Headless Playwright intercepts the OS chooser. Native key -> chooser is
    // real; cancel delivery is explicitly a DOM event, not an OS-dialog claim.
    await restore.evaluate(element => (element as HTMLButtonElement).blur());
    await input.dispatchEvent('cancel');
    await expect(restore).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    cancellation.push({ key, realChooserOpened: true, syntheticCancelReturnedFocus: true });
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'バックアップ', exact: true }).click();
  const backupPath = await (await downloadPromise).path();
  if (!backupPath) throw new Error('Backup download missing');
  // The download event can precede the React commit that releases busy.
  // Unlike click(), press() does not wait for an enabled button.
  await expect(restore).toBeEnabled();
  const chooserPromise = page.waitForEvent('filechooser');
  await restore.press('Enter');
  await (await chooserPromise).setFiles({ name: 'keyboard-backup.json', mimeType: 'application/json', buffer: readFileSync(backupPath) });
  await expect(page.getByRole('dialog', { name: 'バックアップを復元しますか？' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(restore).toBeFocused();
  const keyboardTargets = await page.locator('.settings-page button:not(:disabled),.settings-page input:not(:disabled):not([type="file"]),.settings-page a[href]').count();
  await page.getByRole('button', { name: 'もどる', exact: true }).focus();
  const visited = new Set<number>();
  for (let i = 0; i < keyboardTargets + 2; i++) {
    const focused = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      const all = [...document.querySelectorAll('.settings-page button:not(:disabled),.settings-page input:not(:disabled):not([type="file"]),.settings-page a[href]')];
      return { index: all.indexOf(active), hiddenFile: active instanceof HTMLInputElement && active.type === 'file' };
    });
    expect(focused.hiddenFile).toBe(false);
    if (focused.index >= 0) visited.add(focused.index);
    if (visited.size === keyboardTargets) break;
    await page.keyboard.press('Tab');
  }
  expect(visited.size).toBe(keyboardTargets);
  for (let i = 0; i < keyboardTargets - 1; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await input.evaluate(element => element === document.activeElement)).toBe(false);
  }
  await expect(page.getByRole('button', { name: 'もどる', exact: true })).toBeFocused();
  await testInfo.attach('restore-keyboard-proof', { body: JSON.stringify({ cancellation, keyboardTargets, visited: visited.size, modalEscapeReturnedFocus: true }), contentType: 'application/json' });
});

test('gallery tabs associate panels and preserve one roving tab stop with matching work @a13', async ({ page }) => {
  const completedId = await startArtwork(page);
  await tapRegion(page, 0);
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByRole('region', { name: 'さくひんのしあげ' })).toBeVisible();
  const completed = await project(page, completedId);
  const draftId = await startArtwork(page, 'うみ');
  const draft = await project(page, draftId);
  await page.goto('/#/gallery');
  const doneTab = page.getByRole('tab', { name: /^完成/ }), draftTab = page.getByRole('tab', { name: /^途中/ });
  await expect(doneTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: /^完成/ }).locator('.gallery-card strong')).toHaveText(completed.title);
  for (const tab of [doneTab, draftTab]) {
    const relation = await tab.evaluate(element => {
      const panel = document.getElementById(element.getAttribute('aria-controls')!);
      return { role: panel?.getAttribute('role'), labelledBy: panel?.getAttribute('aria-labelledby'), tabId: element.id };
    });
    expect(relation.role).toBe('tabpanel'); expect(relation.labelledBy).toBe(relation.tabId);
  }
  await doneTab.focus();
  for (const [key, expected] of [['ArrowRight', 'draft'], ['ArrowRight', 'completed'], ['ArrowLeft', 'draft'], ['Home', 'completed'], ['End', 'draft']] as const) {
    await page.keyboard.press(key);
    const active = expected === 'draft' ? draftTab : doneTab, other = expected === 'draft' ? doneTab : draftTab;
    await expect(active).toBeFocused(); await expect(active).toHaveAttribute('aria-selected', 'true'); await expect(active).toHaveAttribute('tabindex', '0');
    await expect(other).toHaveAttribute('aria-selected', 'false'); await expect(other).toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel').locator('.gallery-card strong')).toHaveText(expected === 'draft' ? draft.title : completed.title);
  }
  await page.keyboard.press('Tab'); await expect(page.getByRole('tabpanel')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(draftTab).toBeFocused();
  await doneTab.focus(); await page.keyboard.press('Enter'); await expect(doneTab).toHaveAttribute('aria-selected', 'true');
  await draftTab.focus(); await page.keyboard.press('Space'); await expect(draftTab).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tabpanel').locator('.gallery-card').press('Enter');
  await expect(page.getByTestId('artwork')).toBeVisible(); expect(page.url()).toContain(draftId);
});

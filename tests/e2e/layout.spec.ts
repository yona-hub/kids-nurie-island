import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect, home, startArtwork, noHorizontalOverflow, captureUi as defaultCaptureUi, settleAnimations } from './helpers';
import { checkA11y } from './accessibility-helpers';

async function captureUi(page: Page, name: string): Promise<void> {
  const folder=process.env.UI_ART_EVIDENCE_OUTPUT;
  if(!folder)return defaultCaptureUi(page,name);
  mkdirSync(folder+'/screenshots',{recursive:true});
  await page.screenshot({path:`${folder}/screenshots/${name}.png`,fullPage:true,animations:'disabled'});
}

test('responsive home and editor have no overflow and usable color targets @narrow', async ({ page }, testInfo) => {
  await home(page);
  await noHorizontalOverflow(page);
  const columns = await page.locator('.island-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(columns).toBe((page.viewportSize()?.width ?? 0) >= 1000 ? 4 : (page.viewportSize()?.width ?? 0) >= 700 ? 3 : 2);
  await captureUi(page, `home-${testInfo.project.name}`);
  await startArtwork(page);
  await page.mouse.move(0, 0);
  await settleAnimations(page);
  await noHorizontalOverflow(page);
  const sizes = await page.locator('.color-families button,.shades button,.paint-tools button,.erase-button,.complete-button,.tool-back,.scene-buttons button,.paint-mode button').evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return { label: element.getAttribute('aria-label') ?? element.textContent, width: box.width, height: box.height }; }));
  expect(sizes.filter(item => item.width < 43.5 || item.height < 43.5), 'Primary controls should offer a 44 CSS px touch target').toEqual([]);
  const palette = await page.locator('.palette-panel').boundingBox();
  expect(palette, 'The color palette should be laid out').not.toBeNull();
  expect(palette!.y + palette!.height, 'Every shade should be available inside the initial viewport').toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  const islands = await page.locator('.color-families button').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().y)));
  const shades = await page.locator('.shades button').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().y)));
  expect(new Set(islands).size).toBe(1); expect(new Set(shades).size).toBe(1);
  await captureUi(page, `editor-${testInfo.project.name}`);
});

test('home, editor, modal and settings have zero serious accessibility findings @narrow', async ({ page }, testInfo) => {
  await home(page);
  await checkA11y(page, `home-${testInfo.project.name}`);
  await startArtwork(page);
  await checkA11y(page, `editor-${testInfo.project.name}`);
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.locator('.finish-panel')).toBeVisible();
  await page.getByRole('button', { name: 'はいけい', exact: true }).focus();
  await page.getByRole('button', { name: 'はいけい', exact: true }).press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await checkA11y(page, `scene-dialog-${testInfo.project.name}`);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'はいけい', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'もうすこしぬる', exact: true }).click();
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await checkA11y(page, `settings-${testInfo.project.name}`, true);
});

test('fixed home and editor visual baselines @visual @narrow', async ({ page }, testInfo) => {
  await home(page);
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  await startArtwork(page);
  await expect(page).toHaveScreenshot('editor.png', { fullPage: true });
  await captureUi(page, `visual-editor-${testInfo.project.name}`);
});

test('short phone screens keep both single rows reachable, including a sync notice @narrow', async ({ page }, testInfo) => {
  const measurements = [];
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 568 }, { width: 320, height: 740 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.querySelectorAll('[data-layout-fixture]').forEach(element => element.remove()));
    await startArtwork(page);
    // A mouse left over the resized palette lifts one hovered island by 2px.
    // Compare the stable row layout after leaving that transient hover state.
    await page.mouse.move(0, 0);
    await settleAnimations(page);
    for (const withBanner of [false, true]) {
      if (withBanner) {
        // Stress only the banner's CSS layout contract. Cloud/auth behavior
        // is exercised by the separate persistence and offline tests.
        await page.evaluate(() => {
          const banner = document.createElement('aside');
          banner.className = 'sync-banner sync-error';
          banner.dataset.layoutFixture = 'true';
          const text = document.createElement('span'); text.textContent = 'この端末に保存済みです';
          const detail = document.createElement('span'); detail.className = 'sync-detail'; detail.textContent = '同期できていません';
          const retry = document.createElement('button'); retry.textContent = '再試行';
          text.append(detail); banner.append(text, retry); document.querySelector('.app')!.prepend(banner);
        });
      }
      await expect(page.locator('.zoom-tools')).toHaveCount(1);
      const zoom=await page.locator('.zoom-tools').boundingBox(),stage=await page.locator('.editor-stage').boundingBox();
      expect(zoom!.y+zoom!.height).toBeLessThanOrEqual(stage!.y);
      const boxes = await page.locator('.shades button,.color-families button,.palette-arrow:visible,.sync-banner button,.paint-mode button,.zoom-tools button').evaluateAll(elements => elements.map(element => {
        const box = element.getBoundingClientRect(); return { width: box.width, height: box.height, top: box.top, bottom: box.bottom, label: element.getAttribute('aria-label') ?? element.textContent };
      }));
      expect(boxes.filter(box => box.width < 43.5 || box.height < 43.5 || box.top < 0 || box.bottom > viewport.height + 1), `${viewport.width}×${viewport.height}, banner=${withBanner}`).toEqual([]);
      const artwork = await page.getByTestId('artwork').boundingBox();
      expect(artwork!.width, 'Short screens keep at least 192×240 CSS px for the picture').toBeGreaterThanOrEqual(191.5);
      expect(artwork!.height).toBeGreaterThanOrEqual(239.5);
      const families = await page.locator('.color-families button').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)));
      const shades = await page.locator('.shades button').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)));
      expect(new Set(families).size).toBe(1);
      expect(new Set(shades).size).toBe(1);
      measurements.push({ viewport, withBanner, artwork, stage, zoom, palette: await page.locator('.palette-panel').boundingBox(), controls: boxes, familyRows: families, shadeRows: shades });
      await noHorizontalOverflow(page);
      await captureUi(page, `editor-${viewport.width}x${viewport.height}-${withBanner ? 'banner' : 'plain'}-${testInfo.project.name}`);
    }
  }
  const folder=process.env.UI_ART_EVIDENCE_OUTPUT??'test-results/a11y';
  mkdirSync(folder, { recursive: true });
  writeFileSync(`${folder}/a18-short-${testInfo.project.name}.json`, JSON.stringify({ measuredAt: new Date().toISOString(), measurements }, null, 2));
});

test('all selected drawing tools retain readable label contrast @narrow', async ({ page }) => {
  await startArtwork(page);
  for (const name of ['なめらか', 'クレヨン', 'いろえんぴつ', 'けす']) {
    await page.getByRole('button', { name, exact: true }).click();
    const result = await new AxeBuilder({ page }).include('.editor-toolbar').withRules(['color-contrast']).analyze();
    expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) })), name).toEqual([]);
  }
});

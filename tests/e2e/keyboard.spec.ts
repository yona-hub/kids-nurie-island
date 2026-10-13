import { test, expect, startArtwork, project, catalog, noHorizontalOverflow, captureUi } from './helpers';

const transform = (page: import('@playwright/test').Page) => page.locator('.artwork-transform').evaluate(element => {
  const view = (element as HTMLElement).dataset;
  return { scale: Number(view.viewScale), x: Number(view.viewX), y: Number(view.viewY) };
});

test('browser shortcuts are not cancelled when the drawing has keyboard focus @keyboard', async ({ page }, testInfo) => {
  await startArtwork(page);
  const stage = page.getByTestId('artwork'); await stage.focus();
  await stage.press('+'); await expect.poll(async () => (await transform(page)).scale).toBe(1.25);
  await stage.press('-'); await expect.poll(async () => (await transform(page)).scale).toBe(1);
  await page.evaluate(() => {
    const log: { key: string; prevented: boolean; ctrl: boolean; meta: boolean; alt: boolean }[] = [];
    Object.assign(window, { keyboardAudit: log });
    document.addEventListener('keydown', event => log.push({ key: event.key, prevented: event.defaultPrevented, ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey }));
  });
  const browserDefaults = [];
  for (const target of ['canvas', 'outside'] as const) {
    for (const shortcut of ['Control+Equal', 'Control+Minus', 'Meta+Equal', 'Meta+Minus', 'Alt+Equal', 'Alt+Minus']) {
      await (target === 'canvas' ? stage : page.getByRole('button', { name: '完成', exact: true })).focus();
      const before = (await transform(page)).scale;
      await page.keyboard.press(shortcut);
      const event = await page.evaluate(() => (window as unknown as { keyboardAudit: { key: string; prevented: boolean; ctrl: boolean; meta: boolean; alt: boolean }[] }).keyboardAudit.at(-1)!);
      expect(event.ctrl || event.meta || event.alt).toBe(true);
      expect(event.prevented, `${target} ${shortcut}`).toBe(false);
      expect((await transform(page)).scale, `${target} ${shortcut}`).toBe(before);
      browserDefaults.push({ target, shortcut, event, devicePixelRatio: await page.evaluate(() => devicePixelRatio) });
    }
  }
  await testInfo.attach('browser-default-shortcuts', { body: JSON.stringify(browserDefaults, null, 2), contentType: 'application/json' });
});

test('a selected crown region is visible before Enter paints it at fourfold zoom @keyboard', async ({ page }) => {
  const id = await startArtwork(page), stage = page.getByTestId('artwork');
  await stage.focus();
  for (let i = 0; i < 7; i++) await stage.press('+');
  expect((await transform(page)).scale).toBe(4);
  await stage.press('ArrowRight');
  const marker = page.locator('.region-focus-marker');
  await expect(marker).toHaveAttribute('data-region-id', 'r02');
  const [stageBox, markerBox] = await Promise.all([stage.boundingBox(), marker.boundingBox()]);
  expect(markerBox!.x).toBeGreaterThanOrEqual(stageBox!.x);
  expect(markerBox!.y).toBeGreaterThanOrEqual(stageBox!.y);
  expect(markerBox!.x + markerBox!.width).toBeLessThanOrEqual(stageBox!.x + stageBox!.width);
  expect(markerBox!.y + markerBox!.height).toBeLessThanOrEqual(stageBox!.y + stageBox!.height);
  await stage.press('Enter');
  await expect.poll(async () => Boolean((await project(page, id)).regions.r02)).toBe(true);
  expect(Object.keys((await project(page, id)).regions)).toEqual(['r02']);
  expect((await project(page, id)).templateId).toBe(catalog.find(entry => entry.themeId === 'princess')!.id);
});

test('controls remain reachable at desktop 200% and 400% viewport equivalents @keyboard', async ({ page }, testInfo) => {
  const controls = '.paint-tools button,.erase-button,.complete-button,.tool-back,.zoom-tools button,.scene-buttons button,.color-families button,.shades button';
  for (const factor of [2, 4]) {
    // CSS viewport reflow equivalent of a 1440×1000 desktop at browser zoom.
    // This does not claim that headless browser chrome zoom itself was changed.
    await page.setViewportSize({ width: 1440 / factor, height: 1000 / factor });
    await startArtwork(page);
    await noHorizontalOverflow(page);
    const artwork = await page.getByTestId('artwork').boundingBox();
    expect(artwork!.width, `${factor * 100}% artwork width`).toBeGreaterThan(80);
    expect(artwork!.height, `${factor * 100}% artwork height`).toBeGreaterThan(100);
    await page.getByTestId('artwork').focus();
    await page.getByTestId('artwork').press('ArrowRight');
    await expect.poll(() => page.locator('.region-focus-marker').evaluate(element => {
      const box = element.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
    }), { message: `${factor * 100}% selected region is visible on screen` }).toBe(true);
    const count = await page.locator(controls).count();
    const reached = new Set<number>();
    await page.getByRole('button', { name: 'もどる', exact: true }).focus();
    for (let i = 0; i < count + 4; i++) {
      const active = await page.evaluate(selector => {
        const element = document.activeElement as HTMLElement;
        const index = [...document.querySelectorAll(selector)].indexOf(element);
        const box = element.getBoundingClientRect();
        return { index, top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
      }, controls);
      if (active.index >= 0) {
        reached.add(active.index);
        // Focus-triggered browser scrolling can finish after keyup. Wait for
        // the actual visible result, including its full focus outline.
        await expect.poll(() => page.evaluate(() => {
          const element = document.activeElement!, box = element.getBoundingClientRect(), style = getComputedStyle(element);
          const outline = style.outlineStyle === 'none' ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
          return box.top - outline >= -1 && box.bottom + outline <= innerHeight + 1 && box.left - outline >= -1 && box.right + outline <= innerWidth + 1;
        }), { message: `${factor * 100}% control ${active.index} is fully in view` }).toBe(true);
        expect(active.width).toBeGreaterThanOrEqual(43.5); expect(active.height).toBeGreaterThanOrEqual(43.5);
      }
      if (reached.size === count) break;
      await page.keyboard.press('Tab');
    }
    expect(reached.size, `${factor * 100}% Tab-reachable controls`).toBe(count);
    await captureUi(page, `keyboard-reflow-${factor * 100}-${testInfo.project.name}`);
  }
});

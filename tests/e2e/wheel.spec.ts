import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect, startArtwork, project, regionPoint, catalog, tapRegion } from './helpers';

const view = (page: Page) => page.locator('.artwork-transform').evaluate(element => {
  const view = (element as HTMLElement).dataset;
  return { scale: Number(view.viewScale), x: Number(view.viewX), y: Number(view.viewY) };
});

async function wheel(page: Page, mode: number, deltaY: number, modifier?: string, point?: { x: number; y: number }) {
  return page.getByTestId('artwork').evaluate((element, input) => {
    const rect = element.getBoundingClientRect();
    const point = input.point ?? { x: element.clientWidth * .37, y: element.clientHeight * .62 };
    const event = new WheelEvent('wheel', { deltaMode: input.mode, deltaY: input.deltaY, clientX: rect.left + point.x, clientY: rect.top + point.y, bubbles: true, cancelable: true, ...(input.modifier ? { [input.modifier]: true } : {}) });
    element.dispatchEvent(event);
    // MouseEvent coordinates may be rounded by the browser. Compare the
    // handler's effective cursor, not the fractional constructor argument.
    return { mode: input.mode, deltaY: input.deltaY, point: { x: event.clientX - rect.left, y: event.clientY - rect.top }, requestedPoint: point, defaultPrevented: event.defaultPrevented };
  }, { mode, deltaY, modifier, point });
}

function saveEvidence(name: string, data: unknown) {
  mkdirSync('test-results/a15-wheel-evidence', { recursive: true });
  writeFileSync(`test-results/a15-wheel-evidence/${name}.json`, JSON.stringify({ measuredAt: new Date().toISOString(), eventSource: 'synthetic WheelEvent in the actual UI; no physical mouse/OS setting claim', data }, null, 2));
}

test('pixel, line and page wheel units give equivalent cursor-anchored zoom @a15', async ({ page }, testInfo) => {
  const id = await startArtwork(page);
  const metrics = await page.getByTestId('artwork').evaluate(element => {
    const style = getComputedStyle(element), height = parseFloat(style.lineHeight), fontSize = parseFloat(style.fontSize);
    return { lineHeight: Number.isFinite(height) && height > 0 ? height : fontSize * 1.2, pageHeight: element.clientHeight, computedLineHeight: style.lineHeight, fontSize: style.fontSize };
  });
  const results = [];
  for (const { mode, deltaY } of [{ mode: 0, deltaY: -100 }, { mode: 1, deltaY: -100 / metrics.lineHeight }, { mode: 2, deltaY: -100 / metrics.pageHeight }]) {
    await page.getByRole('button', { name: 'もとの大きさ', exact: true }).click();
    const input = await wheel(page, mode, deltaY);
    expect(input.defaultPrevented).toBe(true);
    await expect.poll(async () => (await view(page)).scale).toBeCloseTo(Math.exp(.15), 4);
    const after = await view(page);
    expect((input.point.x - after.x) / after.scale).toBeCloseTo(input.point.x, 2);
    expect((input.point.y - after.y) / after.scale).toBeCloseTo(input.point.y, 2);
    await wheel(page, mode, -deltaY, undefined, input.point);
    await expect.poll(async () => { const current = await view(page); return Math.max(Math.abs(current.scale - 1), Math.abs(current.x), Math.abs(current.y)); }).toBeLessThan(.0001);
    results.push({ input, normalizedPixels: -100, actual: after, reversed: await view(page) });
  }
  const onePage = await wheel(page, 2, -1);
  const expectedPageScale = Math.min(4, Math.exp(metrics.pageHeight * .0015));
  await expect.poll(async () => (await view(page)).scale).toBeCloseTo(expectedPageScale, 4);
  expect((await view(page)).scale).toBeGreaterThan(1.25);
  const pageResult = { input: onePage, expectedPageScale, actual: await view(page) };
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await expect(page.locator('.storybook-home')).toBeVisible();
  expect((await project(page, id)).regions).toEqual({});
  saveEvidence(`units-${testInfo.project.name}`, { metrics, results, onePage: pageResult, paintedRegions: 0 });
});

test('wheel clamps every unit to 1–4 and preserves modified browser defaults @a15', async ({ page }, testInfo) => {
  const id = await startArtwork(page), results = [], modifiers = [];
  for (const mode of [0, 1, 2]) {
    const out = await wheel(page, mode, -10_000);
    await expect.poll(async () => (await view(page)).scale).toBe(4);
    const maximum = await view(page);
    const into = await wheel(page, mode, 10_000, undefined, out.point);
    await expect.poll(() => view(page)).toEqual({ scale: 1, x: 0, y: 0 });
    results.push({ mode, out, maximum, into, minimum: await view(page) });
  }
  await wheel(page, 0, -Math.log(2) / .0015);
  await expect.poll(async () => (await view(page)).scale).toBeCloseTo(2, 4);
  for (const mode of [0, 1, 2]) for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
    const before = await view(page), input = await wheel(page, mode, -100, modifier);
    expect(input.defaultPrevented).toBe(false);
    expect(await view(page)).toEqual(before);
    modifiers.push({ mode, modifier, input, before, after: await view(page) });
  }
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await expect(page.locator('.storybook-home')).toBeVisible();
  expect((await project(page, id)).regions).toEqual({});
  saveEvidence(`limits-${testInfo.project.name}`, { results, modifiers, paintedRegions: 0 });
});

test('wheel during a held pointer cannot turn its release into paint @a15', async ({ page }, testInfo) => {
  const id = await startArtwork(page);
  const templateId = catalog.find(template => template.themeId === 'princess')!.id;
  const region = regionPoint(templateId, 0), stage = page.getByTestId('artwork'), bounds = (await stage.boundingBox())!;
  const point = { x: region.x / 1600 * bounds.width, y: region.y / 2000 * bounds.height };
  await page.mouse.move(bounds.x + point.x, bounds.y + point.y);
  await page.mouse.down();
  await wheel(page, 2, -1, undefined, point);
  await expect.poll(async () => (await view(page)).scale).toBeGreaterThan(1.25);
  await page.mouse.up();
  await page.getByRole('button', { name: 'もどる', exact: true }).click();
  await expect(page.locator('.storybook-home')).toBeVisible();
  expect((await project(page, id)).regions).toEqual({});
  await page.goto(`/#/paint/${id}`);
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  await tapRegion(page, 0, templateId);
  await expect.poll(async () => Object.keys((await project(page, id)).regions)).toEqual([region.id]);
  saveEvidence(`tap-${testInfo.project.name}`, { wheelReleasePaintedRegions: 0, nextOrdinaryTapRegion: region.id });
});

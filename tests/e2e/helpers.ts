import { expect, test as base, type Page } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import type { Project, Template, TemplateSummary } from '../../packages/shared-types/src/index';

export const catalog = JSON.parse(readFileSync('apps/web/public/content/catalog.json', 'utf8')) as TemplateSummary[];
const defaultTemplateId = catalog.find(template => template.themeId === 'princess')?.id;

export const test = base.extend<{ cleanConsole: void }>({
  cleanConsole: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await use();
    if (errors.length) await testInfo.attach('browser-console-errors', { body: errors.join('\n'), contentType: 'text/plain' });
    expect(errors, 'The browser should not report JavaScript or console errors').toEqual([]);
  }, { auto: true }],
});

export { expect };

export async function home(page: Page): Promise<void> {
  await page.goto('/#/home');
  await expect(page.locator('.storybook-home')).toBeVisible();
  await expect(page.locator('.island-card')).toHaveCount(12);
  await page.evaluate(() => document.fonts.ready);
  await settleAnimations(page);
}

export async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => undefined)));
  });
}

export async function startArtwork(page: Page, theme = 'おひめさま', index = 0, mode: 'group' | 'region' = 'region'): Promise<string> {
  await home(page);
  await page.getByRole('button', { name: `${theme}のしま`, exact: true }).click();
  await expect(page.locator('.theme-navigation')).toBeVisible();
  await expect(page.locator('.template-grid')).toBeVisible();
  await page.locator('.template-card').nth(index).click();
  await expect(page.getByTestId('artwork')).toBeVisible();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  if (mode === 'region') await page.getByRole('button', { name: 'こまかく', exact: true }).click();
  return page.url().split('/paint/')[1];
}

export async function storedProjects(page: Page): Promise<Project[]> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kids-nurie-island-v1');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Project[]>((resolve, reject) => {
        const request = database.transaction('projects', 'readonly').objectStore('projects').getAll();
        request.onsuccess = () => resolve(request.result.filter((row: { deleted: boolean }) => !row.deleted).map((row: { project: Project }) => row.project));
        request.onerror = () => reject(request.error);
      });
    } finally { database.close(); }
  });
}

export async function project(page: Page, id?: string): Promise<Project> {
  const projects = await storedProjects(page);
  const selected = id ? projects.find(item => item.id === id) : projects[0];
  if (!selected) throw new Error(`No persisted project for ${id ?? 'first'}`);
  return selected;
}

export function regionPoint(templateId: string, index: number) {
  const template = JSON.parse(readFileSync(`apps/web/public/content/templates/${templateId}.json`, 'utf8')) as Template;
  const region = template.regions[index];
  const context = createCanvas(1, 1).getContext('2d');
  const paths = template.regions.map(item => new Path2D(item.path));
  const hit = (x: number, y: number) => {
      let front = -1;
      for (let pathIndex = paths.length - 1; pathIndex >= 0; pathIndex--) {
        if (context.isPointInPath(paths[pathIndex], x, y, template.regions[pathIndex].fillRule??'nonzero')) { front = pathIndex; break; }
      }
      return front;
  };
  // Keep a physical touch comfortably away from outlines and overlap edges;
  // fractional logical points can round to another shape at 320 CSS pixels.
  for (const margin of [24, 16, 8]) {
    for (let y = region.bounds.y + margin; y < region.bounds.y + region.bounds.height - margin; y += 8) {
      for (let x = region.bounds.x + margin; x < region.bounds.x + region.bounds.width - margin; x += 8) {
        if (hit(x, y) === index && [[margin, 0], [-margin, 0], [0, margin], [0, -margin]].every(([dx, dy]) => hit(x + dx, y + dy) === index)) return { id: region.id, x, y };
      }
    }
  }
  throw new Error(`Region ${region.id} has no available tap point`);
}

export async function tapRegion(page: Page, index: number, templateId = defaultTemplateId): Promise<string> {
  if (!templateId) throw new Error('No current princess template in the catalog');
  const point = regionPoint(templateId, index);
  const artwork = page.getByTestId('artwork');
  await artwork.scrollIntoViewIfNeeded();
  const bounds = await artwork.boundingBox();
  if (!bounds) throw new Error('Artwork was not laid out');
  await page.mouse.click(bounds.x + point.x / 1600 * bounds.width, bounds.y + point.y / 2000 * bounds.height);
  return point.id;
}

export async function captureUi(page: Page, name: string): Promise<void> {
  mkdirSync('test-results/ui', { recursive: true });
  await page.screenshot({ path: `test-results/ui/${name}.png`, fullPage: true, animations: 'disabled' });
}

export async function noHorizontalOverflow(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);
}

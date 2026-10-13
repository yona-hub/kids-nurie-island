import { test, expect, home, startArtwork, tapRegion, project, storedProjects, catalog } from './helpers';

const themeNames: Record<string, string> = { princess: 'おひめさま', magic: 'まほう', animals: 'どうぶつ', ocean: 'うみ', dinosaurs: 'きょうりゅう', vehicles: 'のりもの', construction: 'はたらくくるま', robots: 'ロボット', space: 'うちゅう', flowers: 'おはな' };

test('all ten original drawings can be opened and painted through the UI', async ({ page }) => {
  for (const template of catalog) {
    const id = await startArtwork(page, themeNames[template.themeId]);
    const regionId = await tapRegion(page, 0, template.id);
    await expect.poll(async () => (await project(page, id)).regions[regionId]?.paintType).toBe('smooth');
  }
  expect(await storedProjects(page)).toHaveLength(10);
});

test('all eleven islands expose twelve selectable shades in two actions', async ({ page }) => {
  test.setTimeout(120_000);
  await startArtwork(page);
  for (const name of ['あか', 'ピンク', 'オレンジ', 'きいろ', 'みどり', 'あお', 'むらさき', 'ちゃいろ', 'はいいろ', 'しろ', 'くろ']) {
    const island = page.getByRole('button', { name: `${name}のしま`, exact: true });
    await island.click();
    await expect(island).toHaveAttribute('aria-pressed', 'true');
    const shades = page.getByRole('group', { name: `${name}の12色`, exact: true }).getByRole('button');
    await expect(shades).toHaveCount(12);
    for (let shade = 0; shade < 12; shade++) {
      await shades.nth(shade).click();
      await expect(shades.nth(shade)).toHaveAttribute('aria-pressed', 'true');
      expect(await shades.nth(shade).getAttribute('aria-label')).toBeTruthy();
    }
  }
  const region = await tapRegion(page, 0);
  await expect.poll(async () => (await project(page)).regions[region]?.color).toBe('#000000');
  for (const forbidden of ['ぬる', 'もどす', 'やりなおす']) await expect(page.getByRole('button', { name: forbidden, exact: true })).toHaveCount(0);
});

test('materials coexist, replacements are complete, and erase follows the specified selection rules', async ({ page }) => {
  const id = await startArtwork(page);
  const first = await tapRegion(page, 0);
  await page.getByRole('button', { name: 'クレヨン', exact: true }).click();
  const second = await tapRegion(page, 1);
  await page.getByRole('button', { name: 'いろえんぴつ', exact: true }).click();
  const third = await tapRegion(page, 2);
  await expect.poll(async () => new Set(Object.values((await project(page, id)).regions).map(paint => paint.paintType)).size).toBe(3);
  await page.getByRole('button', { name: 'けす', exact: true }).click();
  await page.getByRole('button', { name: 'クレヨン', exact: true }).click();
  await expect(page.getByRole('button', { name: 'けす', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await tapRegion(page, 0);
  await expect.poll(async () => (await project(page, id)).regions[first]).toBeUndefined();
  await page.locator('.shades button').nth(3).click();
  await expect(page.getByRole('button', { name: 'けす', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await tapRegion(page, 0);
  await expect.poll(async () => (await project(page, id)).regions[first]).toEqual({ color: '#FF8FBA', paintType: 'crayon' });
  expect((await project(page, id)).regions[second].paintType).toBe('crayon');
  expect((await project(page, id)).regions[third].paintType).toBe('pencil');
  await page.reload();
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
  expect((await project(page, id)).regions[first]).toEqual({ color: '#FF8FBA', paintType: 'crayon' });
});

test('drag out and back never paints, zoom stays bounded, and keyboard operation works', async ({ page }) => {
  const id = await startArtwork(page);
  const artwork = page.getByTestId('artwork');
  const bounds = await artwork.boundingBox();
  if (!bounds) throw new Error('No artwork bounds');
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await page.mouse.move(center.x, center.y); await page.mouse.down();
  await page.mouse.move(center.x + 55, center.y + 30, { steps: 5 });
  await page.mouse.move(center.x, center.y, { steps: 5 }); await page.mouse.up();
  expect((await project(page, id)).regions).toEqual({});
  await page.mouse.wheel(0, -520);
  await expect.poll(() => page.locator('.artwork-transform').evaluate(element => Number((element as HTMLElement).dataset.viewScale))).toBeGreaterThan(1.1);
  await page.mouse.move(center.x, center.y); await page.mouse.down();
  await page.mouse.move(center.x + 1200, center.y + 1200, { steps: 8 }); await page.mouse.up();
  const transform = await page.locator('.artwork-transform').evaluate(element => { const view = (element as HTMLElement).dataset; return { x: Number(view.viewX), y: Number(view.viewY), scale: Number(view.viewScale) }; });
  expect(transform.x).toBeLessThanOrEqual(0); expect(transform.y).toBeLessThanOrEqual(0); expect(transform.scale).toBeLessThanOrEqual(4);
  expect((await project(page, id)).regions).toEqual({});
  await page.getByRole('button', { name: 'もとの大きさ' }).click();
  await artwork.focus(); await artwork.press('ArrowRight'); await artwork.press('Enter');
  await expect.poll(async () => Object.keys((await project(page, id)).regions).length).toBe(1);
});

test('mobile pinch zoom does not trigger an accidental paint', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Real multi-touch dispatch is exercised in the touch Chromium project.');
  const id = await startArtwork(page);
  const bounds = await page.getByTestId('artwork').boundingBox();
  if (!bounds) throw new Error('No artwork bounds');
  const session = await context.newCDPSession(page);
  const x = bounds.x + bounds.width / 2; const y = bounds.y + bounds.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 25, y, id: 1 }, { x: x + 25, y, id: 2 }] });
  for (const distance of [35, 45, 55, 70]) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - distance, y, id: 1 }, { x: x + distance, y, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.locator('.artwork-transform').evaluate(element => Number((element as HTMLElement).dataset.viewScale))).toBeGreaterThan(1.2);
  expect((await project(page, id)).regions).toEqual({});
  await session.detach();
});

test('empty prototype themes and the no-draft shortcut lead somewhere useful', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: 'たべもののしま', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'このしまのぬりえは 準備中です' })).toBeVisible();
  await page.getByRole('button', { name: 'ほかのしまへ', exact: true }).click();
  await page.getByRole('button', { name: /つづきから/ }).click();
  await expect(page.getByRole('heading', { name: 'さくひん', exact: true })).toBeVisible();
  await expect(page.getByRole('tablist')).toHaveCount(0);
});

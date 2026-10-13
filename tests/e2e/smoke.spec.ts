import { test, expect, home, startArtwork, captureUi } from './helpers';

test('starts the real home and coloring screen @smoke', async ({ page }, testInfo) => {
  await home(page);
  await captureUi(page, `home-${testInfo.project.name}`);
  await startArtwork(page);
  await expect(page.getByRole('group', { name: '画材', exact: true }).getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('group', { name: '色のしま', exact: true }).getByRole('button')).toHaveCount(11);
  await expect(page.locator('.shades button')).toHaveCount(12);
  await captureUi(page, `editor-${testInfo.project.name}`);
});

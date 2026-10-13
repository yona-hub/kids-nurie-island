import { test, expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { RESULT_DIRECTORY } from './fixture-config.mjs';

async function probe(page: Page) {
  return page.evaluate(async () => {
    const url = URL.createObjectURL(new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>'], { type: 'image/svg+xml' }));
    try {
      const fetched = await fetch(url).then(async response => ({ status: response.status, bytes: (await response.arrayBuffer()).byteLength })).catch(error => ({ error: String(error) }));
      const decoded = await new Promise<{ width?: number; error?: string }>(resolve => {
        const image = new Image(), timer = setTimeout(() => resolve({ error: 'decode timeout' }), 3000);
        image.onload = () => { clearTimeout(timer); resolve({ width: image.naturalWidth }); };
        image.onerror = () => { clearTimeout(timer); resolve({ error: 'image error' }); };
        image.src = url;
      });
      return { online: navigator.onLine, controlled: Boolean(navigator.serviceWorker.controller), url, fetched, decoded };
    } finally { URL.revokeObjectURL(url); }
  });
}
test('local Blob fetch and Image under WebKit offline emulation observation', async ({ page, context }, info) => {
  const errors: unknown[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push({ text: message.text(), location: message.location() }); });
  await page.goto('/'); await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const before = await probe(page);
  await context.setOffline(true); const offline = await probe(page);
  await context.setOffline(false); const after = await probe(page);
  const observation = { at: new Date().toISOString(), before, offline, after, errors };
  await writeFile(`${RESULT_DIRECTORY}/blob-offline-observation.json`, JSON.stringify(observation, null, 2));
  await info.attach('blob-offline-observation', { body: JSON.stringify(observation, null, 2), contentType: 'application/json' });
  expect(before.decoded.width).toBe(2); expect(after.decoded.width).toBe(2);
  expect(offline.decoded.width, 'An in-memory Blob should not require a network connection').toBe(2);
});

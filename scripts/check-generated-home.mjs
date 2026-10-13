/* global document */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir('test-results/ui', { recursive: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('http://127.0.0.1:4174/#/home');
    await page.getByRole('heading', { name: 'どのしまへ、あそびにいく？' }).waitFor();
    const images = await page.locator('.island-card .island-art').evaluateAll(async elements => {
      elements.forEach(element => { element.loading = 'eager'; });
      await Promise.all(elements.map(element => element.decode()));
      await document.fonts.ready;
      return elements.map(element => ({ src: element.currentSrc, width: element.naturalWidth, height: element.naturalHeight, displayed: element.getBoundingClientRect().toJSON() }));
    });
    await page.evaluate(async () => Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => undefined))));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (images.length !== 12 || images.some(image => image.width === 0) || overflow || errors.length) throw new Error(JSON.stringify({ width, images, overflow, errors }));
    await page.screenshot({ path: `test-results/ui/generated-home-${width}.png`, fullPage: true, animations: 'disabled' });
    results.push({ width, images, overflow, errors });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile('test-results/generated-home.json', JSON.stringify(results, null, 2) + '\n');
console.log('Generated home: 12/12 images loaded at 390px and 1440px; no horizontal overflow or HTTP/browser errors.');

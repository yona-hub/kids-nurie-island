import { createCanvas, loadImage } from '@napi-rs/canvas';
import type { Page } from '@playwright/test';
import { expect, settleAnimations } from './helpers';

const luminance = (color: number[]) => color.slice(0, 3).map(value => {
  const srgb = value / 255;
  return srgb <= .04045 ? srgb / 12.92 : ((srgb + .055) / 1.055) ** 2.4;
}).reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);

/** CSS foreground against every actual background pixel under each text range.
 * Only glyph color is hidden while sampling; background gradients remain real.
 * This is not a contrast calculation from anti-aliased glyph edge pixels. */
export async function textContrast(page: Page, selectors: string) {
  await settleAnimations(page);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  const records = await page.evaluate(selector => {
    const seen = new Set<Node>(), records = [];
    for (const root of document.querySelectorAll(selector)) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement!;
        if (seen.has(node) || !node.textContent?.trim() || parent.closest('[aria-hidden="true"],svg,[role="img"],[hidden]')) continue;
        seen.add(node);
        const style = getComputedStyle(parent), range = document.createRange();
        if (style.visibility !== 'visible') continue;
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0).map(rect => ({ x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height }));
        if (!rects.length) continue;
        let opacity = 1;
        for (let element: HTMLElement | null = parent; element; element = element.parentElement) opacity *= Number(getComputedStyle(element).opacity);
        const rgba = style.color.match(/[\d.]+/g)!.map(Number);
        records.push({ text: node.textContent.trim(), color: style.color, rgb: rgba.slice(0, 3), alpha: (rgba[3] ?? 1) * opacity, rects });
        parent.setAttribute('data-contrast-mask', '');
      }
    }
    return records;
  }, selectors);
  expect(records.length, `No visible text found for ${selectors}`).toBeGreaterThan(0);
  const dimensions = await page.evaluate(() => ({ width: Math.max(document.documentElement.scrollWidth, innerWidth), height: Math.max(document.documentElement.scrollHeight, innerHeight) }));
  const style = await page.addStyleTag({ content: '[data-contrast-mask], [data-contrast-mask] * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }' });
  let screenshot: Buffer;
  try { screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' }); }
  finally { await style.evaluate(element => (element as HTMLStyleElement).remove()); await page.evaluate(() => document.querySelectorAll('[data-contrast-mask]').forEach(element => element.removeAttribute('data-contrast-mask'))); }
  const image = await loadImage(screenshot), canvas = createCanvas(image.width, image.height), context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, image.width, image.height);
  const scaleX = image.width / dimensions.width, scaleY = image.height / dimensions.height;
  return records.map(record => {
    let minContrast = Infinity, worstBackground: number[] = [], samples = 0;
    for (const rect of record.rects) {
      for (let y = Math.max(0, Math.ceil(rect.y * scaleY)); y < Math.min(image.height, Math.floor((rect.y + rect.height) * scaleY)); y++) {
        for (let x = Math.max(0, Math.ceil(rect.x * scaleX)); x < Math.min(image.width, Math.floor((rect.x + rect.width) * scaleX)); x++) {
          const offset = (y * image.width + x) * 4, background = [data[offset], data[offset + 1], data[offset + 2]];
          const foreground = record.rgb.map((value, channel) => value * record.alpha + background[channel] * (1 - record.alpha));
          const a = luminance(foreground), b = luminance(background), contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          if (contrast < minContrast) { minContrast = contrast; worstBackground = background; }
          samples++;
        }
      }
    }
    return { ...record, minContrast, worstBackground, samples };
  });
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { root } from './build.mjs';

// Diagnostic contact sheets only. Original artwork and compiler masks are not edited.
const output = path.join(root, 'tools/asset-pipeline/output');
const latest = new Map();
for (const id of await fs.readdir(output)) {
  const match = /^(gen-[a-z0-9-]+)-v(\d+)$/.exec(id);
  if (match && (!latest.has(match[1]) || latest.get(match[1]).version < Number(match[2]))) latest.set(match[1], { id, version: Number(match[2]) });
}
const entries = [];
for (const { id } of latest.values()) {
  const directory = path.join(output, id);
  const qa = JSON.parse(await fs.readFile(path.join(directory, 'qa.json'), 'utf8'));
  entries.push({ id, qa, image: await loadImage(path.join(directory, 'normalized-lineart.png')) });
}
const sheet = createCanvas(2000, Math.ceil(entries.length / 5) * 570), context = sheet.getContext('2d');
context.fillStyle = '#f2f2f2'; context.fillRect(0, 0, sheet.width, sheet.height);
for (let index = 0; index < entries.length; index++) {
  const { id, qa, image } = entries[index], x = index % 5 * 400, y = Math.floor(index / 5) * 570;
  context.drawImage(image, x + 8, y + 8, 384, 480);
  context.fillStyle = '#111111'; context.font = '15px sans-serif';
  context.fillText(id, x + 10, y + 515);
  context.fillText(`${qa.regionCount} paint regions / QA ${qa.pass ? 'PASS' : 'FAIL'}`, x + 10, y + 536);
  context.fillText('Human approval pending', x + 10, y + 557);
}
await fs.writeFile(path.join(output, 'generated-lineart-review.png'), sheet.toBuffer('image/png'));
const small = entries.flatMap(entry => [
  ...entry.qa.tinyRegionDetails.map((region, index) => ({ ...entry, region, point: region.point, label: `tiny ${index + 1}` })),
  ...entry.qa.regions.filter(region => region.usableDiameter < 17).map(region => ({ ...entry, region, point: region.labelPoint, label: region.id })),
]);
if (small.length) {
  const detail = createCanvas(1600, Math.ceil(small.length / 4) * 375), ctx = detail.getContext('2d');
  ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, detail.width, detail.height);
  for (let index = 0; index < small.length; index++) {
    const { id, image, region, point, label } = small[index], x = index % 4 * 400, y = Math.floor(index / 4) * 375;
    ctx.drawImage(image, point[0] - 90, point[1] - 90, 180, 180, x + 50, y + 5, 300, 300);
    ctx.strokeStyle = '#d51c4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 200, y + 155, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#111111'; ctx.font = '15px sans-serif';
    ctx.fillText(id, x + 8, y + 326);
    ctx.fillText(`${label}: diameter ${region.usableDiameter.toFixed(2)} px`, x + 8, y + 349);
  }
  await fs.writeFile(path.join(output, 'generated-small-area-review.png'), detail.toBuffer('image/png'));
}
console.log(JSON.stringify({ whiteLineartSheet: 'tools/asset-pipeline/output/generated-lineart-review.png', count: entries.length, smallAreaCount: small.length }));

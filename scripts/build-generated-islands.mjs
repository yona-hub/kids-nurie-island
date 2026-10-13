import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'content/brand-generated/prompts.json'), 'utf8'));
const out = path.join(root, 'apps/web/public/images/islands');
await mkdir(out, { recursive: true });
const summary = [];
for (const asset of manifest.assets) {
  const original = path.join(root, asset.original);
  const metadata = await sharp(original).metadata();
  if (!metadata.hasAlpha) throw new Error(`${asset.id}: generated transparency is required`);
  for (const [suffix, width] of [['', 768], ['-small', 384], ['-tiny', 192]]) {
    const output = path.join(out, `${asset.id}-v1${suffix}.webp`);
    const info = await sharp(original).resize({ width }).webp({ quality: 82, alphaQuality: 92, effort: 6 }).toFile(output);
    summary.push({ id: asset.id, file: path.relative(root, output), width: info.width, height: info.height, bytes: info.size });
  }
}
await writeFile(path.join(root, 'content/brand-generated/delivery.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`Built ${summary.length} responsive illustrations (${Math.round(summary.reduce((n, x) => n + x.bytes, 0) / 1024)} KiB).`);

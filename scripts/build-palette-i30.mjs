import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = 'content/palette-i30';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const specification = JSON.parse(await fs.readFile(root + '/prompt.json', 'utf8'));
const original = await fs.readFile(specification.sourceOriginal);
const originalMetadata = await sharp(original).metadata();
const pixels = await sharp(original).resize(1200, 400).webp({ lossless: true }).toBuffer();
const hash = sha(pixels);
const src = '/images/ui-art-v1/palette-wood-' + hash.slice(0, 16) + '.webp';
await fs.mkdir('apps/web/public/images/ui-art-v1', { recursive: true });
try { await fs.writeFile('apps/web/public' + src, pixels, { flag: 'wx' }); }
catch (error) { if (error.code !== 'EEXIST' || sha(await fs.readFile('apps/web/public' + src)) !== hash) throw error; }
const output = {
  tool: specification.tool, humanAdoption: false,
  original: { file: specification.sourceOriginal, sha256: sha(original), width: originalMetadata.width, height: originalMetadata.height },
  output: { src, sha256: hash, width: 1200, height: 400, bytes: pixels.length },
  derivation: 'Resize only, lossless WebP. No crop, recolor, frame, or new illustration.',
};
await fs.writeFile(root + '/compiled.json', JSON.stringify(output, null, 2) + '\n');
await fs.writeFile('apps/web/src/styles-palette-art.css', '/* Built-in image_gen original; derive with scripts/build-palette-i30.mjs. */\n:root { --palette-wood: url("' + src + '"); }\n');
console.log(JSON.stringify(output));

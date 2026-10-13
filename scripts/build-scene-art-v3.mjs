import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { backgrounds, frames } from '../tools/asset-pipeline/scenes.mjs';
import { publishRevision } from '../tools/asset-pipeline/revisions.mjs';

const root = path.resolve('apps/web/public/content');
const output = 'content/scene-art-v3/compiled';
const partial = process.argv.includes('--preview');
const pretty = value => JSON.stringify(value, null, 2) + '\n';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await fs.readFile('content/scene-art-v3/manifest.json', 'utf8'));
await fs.mkdir(output, { recursive: true });
await fs.mkdir(path.join(root, 'decor'), { recursive: true });

async function publishPart(id, bytes) {
  const sha256 = digest(bytes), url = `/content/decor/${id}.${sha256}.png`;
  const file = path.join(root, 'decor', path.posix.basename(url));
  try { await fs.writeFile(file, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!(await fs.readFile(file)).equals(bytes)) throw Error(`Immutable scene part differs: ${id}`, { cause: error });
  }
  return url;
}

// Keep the generated frame's proportions, rather than compressing sculptures
// into a tiny rail. These frames go BEHIND the opaque artwork, so a larger
// corner decoration can never cover a hand, hair, face or the drawing itself.
function fitFrame(image) {
  const canvas = createCanvas(1600, 2000), ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, 1600, 2000);
  ctx.clearRect(320, 320, 960, 1360);
  return canvas;
}

const catalogs = {}, published = [];
for (const [kind, items] of [['backgrounds', backgrounds], ['frames', frames]]) {
  const originalFile = `${output}/before-${kind}.json`;
  let before;
  try { before = JSON.parse(await fs.readFile(originalFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const bytes = await fs.readFile(path.join(root, `${kind}.json`));
    await fs.writeFile(originalFile, bytes, { flag: 'wx' }); before = JSON.parse(bytes);
  }
  const next = [];
  for (const item of items) {
    if (item.id === 'white' || item.id === 'none') {
      const old = before.find(entry => entry.id === item.id);
      if (!old) throw Error(`Missing retained scene ${item.id}`);
      next.push({ ...old, catalogVisible: true }); continue;
    }
    const source = manifest.assets.find(asset => asset.kind === kind && asset.id === item.id);
    if (!source) { if (partial) continue; throw Error(`Generate the individual scene first: ${kind}/${item.id}`); }
    const bytes = await fs.readFile(source.originalFile);
    if (digest(bytes) !== source.sha256) throw Error(`Source hash differs: ${source.originalFile}`);
    const id = `${item.id}-${kind === 'backgrounds' ? 'scenic' : 'atelier'}-v3`;
    const layers = [];
    let full;
    if (kind === 'backgrounds') {
      const metadata = await sharp(bytes).metadata();
      const alpha = await sharp(bytes).stats();
      if (metadata.hasAlpha && alpha.channels[3].min !== 255) throw Error(`Background must be opaque: ${id}`);
      // Keep the real generated resolution; do not pretend upsampling adds detail.
      const plate = await sharp(bytes).resize(1120, 1400, { fit: 'fill' }).png().toBuffer();
      layers.push({ assetUrl: await publishPart(`${id}-landscape`, plate), x: 0, y: 0, width: 1600, height: 2000, opacity: 1 });
      full = createCanvas(1600, 2000); full.getContext('2d').drawImage(await loadImage(plate), 0, 0, 1600, 2000);
    } else {
      const alpha = await sharp(bytes).stats();
      if (!alpha.channels[3] || alpha.channels[3].min !== 0 || alpha.channels[3].max < 64) throw Error(`Frame requires real alpha: ${id}`);
      full = fitFrame(await loadImage(bytes));
      const png = full.toBuffer('image/png');
      // Four edge assets keep runtime decoding small, and guarantee the opening
      // is transparent independently of the generated frame's original width.
      const strips = [
        { label: 'top', left: 0, top: 0, width: 1600, height: 320 },
        { label: 'bottom', left: 0, top: 1680, width: 1600, height: 320 },
        { label: 'left', left: 0, top: 320, width: 320, height: 1360 },
        { label: 'right', left: 1280, top: 320, width: 320, height: 1360 },
      ];
      for (const strip of strips) {
        const { label, ...crop } = strip;
        const part = await sharp(png).extract(crop).png().toBuffer();
        layers.push({ assetUrl: await publishPart(`${id}-${label}`, part), x: crop.left, y: crop.top, width: crop.width, height: crop.height, opacity: 1 });
      }
    }
    const composition = { schemaVersion: 1, width: 1600, height: 2000, ...(kind === 'frames' ? { placement: 'behind-artwork' } : {}), layers };
    const compositionUrl = await publishRevision(root, kind, id, 'json', pretty(composition));
    const raster = full.toBuffer('image/png');
    const assetUrl = await publishRevision(root, kind, id, 'png', await sharp(raster).resize(800, 1000).png().toBuffer());
    const thumbnailUrl = await publishRevision(root, kind, `${id}-thumb`, 'png', await sharp(raster).resize(160, 200).png().toBuffer());
    next.push({ id, name: item.name, ...(item.themeId ? { themeId: item.themeId } : {}), assetUrl, thumbnailUrl, compositionUrl, catalogVisible: true, legacyId: item.id });
    published.push({ id, kind, sourceSha256: source.sha256, originalFile: source.originalFile, compositionUrl, layers: layers.length });
  }
  catalogs[kind] = next;
  if (!partial) {
    const common = kind === 'backgrounds' ? 'white' : 'none';
    const retained = before.filter(entry => entry.id !== common).map(entry => ({ ...entry, catalogVisible: false }));
    await fs.writeFile(path.join(root, `${kind}.json`), pretty([...next, ...retained]));
  }
}
await fs.writeFile(`${output}/assets.json`, pretty({ tool: manifest.tool, humanAdoption: 'not-received', backgrounds: catalogs.backgrounds, frames: catalogs.frames, published, protectedOpening: { x: 320, y: 320, width: 960, height: 1360 }, artworkInFront: true }));
GlobalFonts.registerFromPath('C:/Windows/Fonts/meiryo.ttc', 'Scene Review Japanese');
for (const kind of ['backgrounds', 'frames']) {
  const entries = catalogs[kind].filter(entry => entry.compositionUrl), columns = kind === 'backgrounds' ? 5 : 5;
  const sheet = createCanvas(columns * 256, Math.ceil(entries.length / columns) * 350), ctx = sheet.getContext('2d');
  ctx.fillStyle = '#eaf1ee'; ctx.fillRect(0, 0, sheet.width, sheet.height); ctx.font = '17px "Scene Review Japanese"';
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index], x = index % columns * 256, y = Math.floor(index / columns) * 350;
    ctx.fillStyle = '#fff9ef'; ctx.fillRect(x + 8, y + 8, 240, 300);
    ctx.drawImage(await loadImage(path.join('apps/web/public', entry.assetUrl)), x + 8, y + 8, 240, 300);
    ctx.fillStyle = '#314d53'; ctx.fillText(entry.name, x + 12, y + 333, 232);
  }
  await fs.writeFile(`${output}/${kind}-review.png`, sheet.toBuffer('image/png'));
}
console.log(JSON.stringify({ partial, backgrounds: catalogs.backgrounds.length, frames: catalogs.frames.length, generated: published.length, legacyRetained: true }));

import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const folder = 'test-results/ui-art-v1/revision-1/brand-failure';
const identity = JSON.parse(await fs.readFile('test-results/ui-art-v1/revision-1/identity-before.json', 'utf8'));
await fs.mkdir(folder, { recursive: true });
const files = [];
for (const relative of ['brand.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'ogp.png']) {
  const bytes = await fs.readFile('dist-demo/' + relative);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (identity.identity.files.find(file => file.path === relative)?.sha256 !== sha256) throw Error('Revision-1 derivative changed: ' + relative);
  const output = folder + '/' + relative.replaceAll('/', '-');
  await fs.writeFile(output, bytes, { flag: 'wx' });
  files.push({ relative, output, sha256 });
}
await fs.writeFile(folder + '/record.json', JSON.stringify({ build: identity.identity.aggregateSha256, files, finding: 'Independent UI-E01: generated island absent in PWA and OGP. Main UI WebP displayed correctly.' }, null, 2) + '\n', { flag: 'wx' });
const firstRepair = 'test-results/ui-art-v1/revision-2/brand-first-repair';
await fs.mkdir(firstRepair, { recursive: true });
await fs.copyFile('apps/web/public/ogp.png', firstRepair + '/ogp.png', 1);
await fs.writeFile(firstRepair + '/record.json', JSON.stringify({ finding: 'PNG embedded in SVG fixes sharp PWA output, but napi SVG decode still omits the bitmap from OGP. Non-empty brand check caught this before rebuild.', next: 'Draw the retained generated PNG directly in Canvas for OGP.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ preservedRevision1Files: files.length, firstRepairOgp: firstRepair + '/ogp.png' }));

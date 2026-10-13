import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function inventory(directory, prefix = '') {
  const files = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relativePath = `${prefix}${entry.name}`, fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await inventory(fullPath, `${relativePath}/`));
    else if (entry.isFile()) { const bytes = await readFile(fullPath); files.push({ path: relativePath, bytes: bytes.length, sha256: sha256(bytes) }); }
  }
  return files;
}

/** Bind measurements to the served bundle and exact source, without shipping test hooks. */
export async function performanceBuildIdentity(url) {
  const directory = path.resolve(process.env.PERFORMANCE_BUILD_DIR || 'dist-demo');
  const files = await inventory(directory);
  const sources = [...await inventory('apps/web/src', 'apps/web/src/'), ...await inventory('packages', 'packages/')];
  for (const file of ['package-lock.json', 'vite.config.ts']) { const bytes = await readFile(file); sources.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) }); }
  const harness = [];
  for (const file of ['scripts/performance-evidence.mjs', 'scripts/check-performance.mjs', 'scripts/check-interaction-performance.mjs', 'scripts/check-lifecycle-performance.mjs']) { const bytes = await readFile(file); harness.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) }); }
  const response = await fetch(new URL('/index.html', url), { cache: 'no-store' });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(sha256(html), files.find(file => file.path === 'index.html')?.sha256, 'The served HTML must match the benchmark build directory');
  const servedEntries = [];
  for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
    const assetURL = new URL(match[1], url), assetResponse = await fetch(assetURL, { cache: 'no-store' });
    assert.equal(assetResponse.status, 200);
    const assetHash = sha256(Buffer.from(await assetResponse.arrayBuffer()));
    assert.equal(assetHash, files.find(file => file.path === assetURL.pathname.slice(1))?.sha256, 'The served JS/CSS must match the recorded files');
    servedEntries.push({ url: assetURL.href, sha256: assetHash });
  }
  assert.ok(servedEntries.some(entry => entry.url.endsWith('.js')));
  return { directory, aggregateSha256: sha256(JSON.stringify(files)), sourceAggregateSha256: sha256(JSON.stringify(sources)), harnessAggregateSha256: sha256(JSON.stringify(harness)), nodeVersion: process.version, platform: process.platform, files, sources, harness, servedEntries };
}

export function assertPerformanceBuildUnchanged(before, after) {
  assert.equal(after.aggregateSha256, before.aggregateSha256, 'Build changed during measurement; discard this run');
  assert.equal(after.sourceAggregateSha256, before.sourceAggregateSha256, 'Source changed during measurement; discard this run');
  assert.equal(after.harnessAggregateSha256, before.harnessAggregateSha256, 'Measurement code changed during the run; discard this run');
  assert.deepEqual(after.servedEntries, before.servedEntries);
}

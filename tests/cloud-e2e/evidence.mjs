import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BUILD_DIRECTORY, RESULT_DIRECTORY } from './fixture-config.mjs';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
async function inventory(directory, prefix = '') {
  const files = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(directory, entry.name), relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await inventory(full, `${relative}/`));
    else if (entry.isFile()) { const bytes = await readFile(full); files.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes) }); }
  }
  return files;
}
export async function sourceIdentity() {
  const files = [...await inventory('apps/web/src', 'apps/web/src/'), ...await inventory('apps/web/public', 'apps/web/public/'), ...await inventory('packages', 'packages/'), ...await inventory('supabase/migrations', 'supabase/migrations/')];
  for (const file of ['package.json', 'package-lock.json', 'vite.config.ts']) { const bytes = await readFile(file); files.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) }); }
  return { sha256: sha256(JSON.stringify(files)), files };
}
export async function buildIdentity() { const files = await inventory(BUILD_DIRECTORY); return { sha256: sha256(JSON.stringify(files)), files }; }
export async function harnessIdentity() {
  const files = await inventory('tests/cloud-e2e', 'tests/cloud-e2e/');
  for (const file of ['tests/e2e/helpers.ts', 'scripts/build-cloud-e2e.mjs', '.github/workflows/quality.yml']) {
    const bytes = await readFile(file); files.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return { sha256: sha256(JSON.stringify(files)), files };
}
export async function saveEvidence(filename, value) { await mkdir(RESULT_DIRECTORY, { recursive: true }); await writeFile(path.join(RESULT_DIRECTORY, filename), JSON.stringify(value, null, 2)); }

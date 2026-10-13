import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { firefox } from '@playwright/test';

// Explicit, workspace-only diagnostic for this exact Playwright Firefox build.
// A new upstream binary must be investigated afresh instead of blindly patched.
const known = {
  originalSha256: 'b11acb767018bf61ddc15aa3c1dd5e74f5395892fc83659219ac2a0bcd0a95c0',
  repairedSha256: '4450708783c4114b3491d07677ae082f27a1705231ac31ce3feb9fe118c0befe',
  byteOffset: 659048,
};
assert.equal(process.platform, 'win32', 'This diagnostic concerns the Windows Firefox build only');
const sourceExecutable = firefox.executablePath();
const sourceDirectory = dirname(sourceExecutable);
const original = readFileSync(resolve(sourceDirectory, 'mozglue.dll'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(original), known.originalSha256, 'The installed mozglue.dll is not the diagnosed build; no change performed');
assert.equal(original.readUInt32LE(known.byteOffset), 2, 'Unexpected RT_MANIFEST resource ID');
const destination = resolve('test-results/firefox-isolated/firefox-1543-manifest1');
const report = {
  measuredAt: new Date().toISOString(),
  sourceExecutable,
  sourceExecutableSha256: hash(readFileSync(sourceExecutable)),
  sourceDirectory,
  destination,
  originalSha256: hash(original),
  repairedSha256: known.repairedSha256,
  change: { resource: 'mozglue.dll RT_MANIFEST', offset: known.byteOffset, before: 2, after: 1, bytes: 1 },
  reference: 'https://learn.microsoft.com/en-us/windows/win32/sbscs/assembly-searching-sequence',
  prepared: false,
};
if (process.argv.includes('--prepare')) {
  const workspace = realpathSync(process.cwd());
  const parent = dirname(destination);
  mkdirSync(parent, { recursive: true });
  assert.ok(realpathSync(parent).startsWith(workspace + sep), 'Destination must remain inside the workspace');
  if (!existsSync(destination)) {
    const repaired = Buffer.from(original);
    repaired[known.byteOffset] = 1;
    assert.equal(hash(repaired), known.repairedSha256, 'Repaired hash does not match the reviewed one-byte change');
    cpSync(sourceDirectory, destination, { recursive: true, force: false, errorOnExist: true });
    writeFileSync(resolve(destination, 'mozglue.dll'), repaired);
  }
  assert.ok(realpathSync(destination).startsWith(realpathSync(parent) + sep), 'Existing copy must remain inside the isolated directory');
  assert.equal(hash(readFileSync(resolve(destination, 'mozglue.dll'))), known.repairedSha256, 'Existing copy differs; no overwrite performed');
  assert.equal(hash(readFileSync(resolve(destination, 'firefox.exe'))), report.sourceExecutableSha256, 'Executable machine code differs from the source');
  assert.equal(hash(readFileSync(resolve(sourceDirectory, 'mozglue.dll'))), known.originalSha256, 'Source DLL changed during preparation');
  report.prepared = true;
  report.sourceStillUnmodified = true;
  writeFileSync(resolve(parent, 'preparation.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));

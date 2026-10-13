import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { performanceBuildIdentity, assertPerformanceBuildUnchanged } from './performance-evidence.mjs';

// Record identity only. This does not resume the stopped performance measurements.
const output = 'test-results/ui-art-v1/revision-3';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const before = JSON.parse(await fs.readFile(`${output}/identity-before.json`, 'utf8'));
const identity = await performanceBuildIdentity('http://127.0.0.1:4174');
assertPerformanceBuildUnchanged(before.identity, identity);
assert.equal(identity.aggregateSha256, '547dd061e035290c533f2fdf067fbd326ea30ad21524d202a99cff14ac5244b5');
assert.equal(identity.sourceAggregateSha256, '87706559ed4d8deefbc3ab0cefb2a15ea225da52c3f09271dbd90e281dd141d5');
const harness = [];
for (const entry of before.harness) {
  const sha256 = digest(await fs.readFile(entry.file));
  assert.equal(sha256, entry.sha256, `${entry.file} changed after verification`);
  harness.push({ file: entry.file, sha256 });
}
const recorder = { file: 'scripts/finalize-ui-art-v1-evidence.mjs' };
recorder.sha256 = digest(await fs.readFile(recorder.file));
const recordedAt = new Date().toISOString();
await fs.writeFile(`${output}/identity-after-audit.json`, JSON.stringify({
  stage: 'after-audit', recordedAt, identity, harness, recorder, unchanged: true,
  scope: 'Build/source/served-entry/harness identity only; no performance measurement.',
}, null, 2) + '\n', { flag: 'wx' });

const files = [];
async function add(file) {
  const bytes = await fs.readFile(file);
  files.push({ file: file.replaceAll('\\', '/'), bytes: bytes.length, sha256: digest(bytes) });
}
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.isFile() && !['evidence-index.json', 'handoff-record.json'].includes(entry.name)) await add(file);
  }
}
await walk('content/ui-art-v1');
await walk('test-results/ui-art-v1');
for (const file of [
  recorder.file,
  'docs/ui-art-v1-progress.md', 'docs/storybook-improvement.md',
  'docs/work-log.md', 'docs/testing.md', 'docs/asset-pipeline.md',
  'docs/user-art-decisions.md', 'docs/release-checklist.md', 'docs/audit-tracker.md',
  'docs/audits/ui-art-v1-engine-20261010.md', 'docs/audits/ui-art-v1-visual-20261010.md',
  ...harness.map(entry => entry.file),
]) {
  if (!files.some(entry => entry.file === file)) await add(file);
}
files.sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
await fs.writeFile(`${output}/evidence-index.json`, JSON.stringify({
  recordedAt, buildSha256: identity.aggregateSha256,
  sourceSha256: identity.sourceAggregateSha256,
  fileListSha256: digest(JSON.stringify(files)), recorder,
  status: 'I25 listed local checks and independent audits complete; whole project NOT READY; human adoption not received.',
  checks: {
    uiChrome: { passed: 6, results: 'test-results/ui-art-v1/revision-2/browser/results.json' },
    offlineChrome: { passed: 1, results: `${output}/offline/results.json` },
    regressionChrome: { passed: 8, results: `${output}/regression/browser/results.json` },
    relatedUnit: { passed: 37, files: 3, results: `${output}/unit.json` },
  },
  exclusions: 'This index and the subsequently generated handoff record are excluded to avoid self-references. Earlier failures remain indexed. Counts are scoped to the linked checks, not full project acceptance.',
  files,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ build: identity.aggregateSha256, source: identity.sourceAggregateSha256, unchanged: true, indexedFiles: files.length, output }));

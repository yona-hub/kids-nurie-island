import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { performanceBuildIdentity, assertPerformanceBuildUnchanged } from './performance-evidence.mjs';

const stage = process.argv[2];
if (!['before-audit', 'after-audit'].includes(stage)) throw Error('Use before-audit or after-audit.');
const directory = process.env.SCENE_ART_EVIDENCE_OUTPUT ?? 'test-results/scene-art-v3/revision-1';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const identity = await performanceBuildIdentity('http://127.0.0.1:4174');
const files = [
  'scripts/build-scene-art-v3.mjs', 'scripts/register-scene-art-v3.mjs', 'scripts/scene-art-v3-specs.mjs', 'scripts/check-scene-art-v3-evidence.mjs',
  'tests/scene-art-v3.test.ts', 'tests/storybook-assets.test.ts', 'tests/e2e/draft-deletion.spec.ts', 'tests/e2e/scene-art-v3.spec.ts', 'tests/e2e/helpers.ts',
  'tests/e2e/projects.spec.ts', 'tests/e2e/scene-samples.ts', 'tests/e2e/pwa.spec.ts', 'playwright.scene-art-v3.config.ts', 'playwright.princess-offline.config.ts',
  'content/scene-art-v3/manifest.json', 'content/scene-art-v3/prompts.json', 'content/scene-art-v3/compiled/assets.json',
];
const harness = await Promise.all(files.map(async file => ({ file, sha256: sha(await fs.readFile(file)) })));
const result = { stage, recordedAt: new Date().toISOString(), taskDateJst: '2026-10-10', identity, harness };
if (stage === 'after-audit') {
  const before = JSON.parse(await fs.readFile(`${directory}/identity-before-audit.json`, 'utf8'));
  assertPerformanceBuildUnchanged(before.identity, identity);
  if (JSON.stringify(before.harness) !== JSON.stringify(harness)) throw Error('Scene verification harness changed.');
  result.unchanged = true;
}
await fs.mkdir(directory, { recursive: true });
await fs.writeFile(`${directory}/identity-${stage}.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, build: identity.aggregateSha256, source: identity.sourceAggregateSha256, unchanged: result.unchanged }));

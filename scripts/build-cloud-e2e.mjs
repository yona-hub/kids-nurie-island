import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { API_ORIGIN, BUILD_DIRECTORY, PUBLISHABLE_KEY } from '../tests/cloud-e2e/fixture-config.mjs';
import { sourceIdentity, buildIdentity, saveEvidence } from '../tests/cloud-e2e/evidence.mjs';

const startedAt = new Date().toISOString(), before = await sourceIdentity();
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', `../../${BUILD_DIRECTORY}`], {
  stdio: 'inherit', windowsHide: true,
  env: { ...process.env, VITE_DEMO_MODE: 'false', VITE_SUPABASE_URL: API_ORIGIN, VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const after = await sourceIdentity(); assert.equal(after.sha256, before.sha256, 'Source changed while building the cloud E2E artifact');
await saveEvidence('build-manifest.json', { startedAt, completedAt: new Date().toISOString(), mode: 'production', demoMode: false, apiOrigin: API_ORIGIN, outDir: BUILD_DIRECTORY, node: process.version, platform: process.platform, source: before, build: await buildIdentity() });

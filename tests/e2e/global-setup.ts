import { spawnSync } from 'node:child_process';
export default function setup() {
  const result = spawnSync(process.execPath, ['scripts/check-browser.mjs'], { stdio: 'inherit', timeout: 45_000, windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Browser readiness check did not finish.');
}

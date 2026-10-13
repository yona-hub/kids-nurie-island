import { spawnSync } from 'node:child_process';
import { verifyReleaseAssets } from './release-assets.mjs';
try { await verifyReleaseAssets(); } catch (error) { console.error(error.message); process.exit(1); }
for (const args of [['scripts/build-licenses.mjs'],['node_modules/typescript/bin/tsc','--noEmit'],['node_modules/vite/bin/vite.js','build']]) {
  const result = spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,VITE_DEMO_MODE:'false'}});
  if(result.status!==0)process.exit(result.status??1);
}

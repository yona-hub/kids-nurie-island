import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performanceBuildIdentity,assertPerformanceBuildUnchanged} from './performance-evidence.mjs';

const stage=process.argv[2];
if(!['before-audit','after-audit'].includes(stage))throw Error('Use before-audit or after-audit.');
const directory=process.env.PRINCESS_EVIDENCE_OUTPUT??'test-results/princess-master',sha=b=>createHash('sha256').update(b).digest('hex');
const identity=await performanceBuildIdentity('http://127.0.0.1:4174');
const files=['scripts/build-princess-master.mjs','scripts/build-princess-blank-eyes.mjs','scripts/render-princess-master.mjs','scripts/check-princess-compatibility.mjs','scripts/check-princess-crop-equivalence.mjs','scripts/check-storybook-performance.mjs','scripts/check-princess-evidence.mjs','playwright.princess.config.ts','playwright.princess-offline.config.ts','tests/princess-master.test.ts','tests/storybook-engine.test.ts','tests/e2e/princess-master.spec.ts','tests/e2e/princess-menu.spec.ts','tests/e2e/helpers.ts','tests/e2e/storybook-upgrade.spec.ts'];
const harness=await Promise.all(files.map(async file=>({file,sha256:sha(await fs.readFile(file))})));
const manifest=JSON.parse(await fs.readFile('content/princess-master/manifest.json','utf8'));
const result={stage,recordedAt:new Date().toISOString(),taskDateJst:'2026-10-10',identity,harness,templateId:manifest.templateId,contentHash:manifest.contentHash,masterSha256:manifest.masterSha256,formSha256:manifest.formSha256};
if(stage==='after-audit'){
  const before=JSON.parse(await fs.readFile(`${directory}/identity-before-audit.json`,'utf8'));
  assertPerformanceBuildUnchanged(before.identity,identity);
  if(JSON.stringify(before.harness)!==JSON.stringify(harness))throw Error('Pilot verification harness changed.');
  result.unchanged=true;
}
await fs.mkdir(directory,{recursive:true});await fs.writeFile(`${directory}/identity-${stage}.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,build:identity.aggregateSha256,source:identity.sourceAggregateSha256,templateId:result.templateId,unchanged:result.unchanged}));

import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performanceBuildIdentity,assertPerformanceBuildUnchanged} from './performance-evidence.mjs';
const stage=process.argv[2];if(!['before','after'].includes(stage))throw Error('Use before or after.');
const root=process.env.UI_ART_EVIDENCE_OUTPUT??'test-results/ui-art-v1/revision-1';
const identity=await performanceBuildIdentity('http://127.0.0.1:4174');
const names=['scripts/build-ui-art-v1.mjs','scripts/register-ui-art-v1.mjs','scripts/check-ui-art-v1-assets.mjs','scripts/build-brand.mjs','scripts/check-ui-art-v1-evidence.mjs','tests/e2e/palette-illustrations.spec.ts','playwright.ui-art-v1.config.ts','tests/e2e/ui-art-offline.spec.ts','playwright.ui-art-offline.config.ts','tests/e2e/draft-deletion.spec.ts','tests/e2e/projects.spec.ts','playwright.scene-art-v3.config.ts','tests/e2e/helpers.ts','content/ui-art-v1/prompts.json','content/ui-art-v1/manifest.json','content/ui-art-v1/compiled.json'];
const harness=await Promise.all(names.map(async file=>({file,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')})));
const record={stage,recordedAt:new Date().toISOString(),identity,harness};
if(stage==='after'){const previous=JSON.parse(await fs.readFile(root+'/identity-before.json','utf8'));assertPerformanceBuildUnchanged(previous.identity,identity);if(JSON.stringify(previous.harness)!==JSON.stringify(harness))throw Error('UI evidence harness changed');record.unchanged=true;}
await fs.mkdir(root,{recursive:true});await fs.writeFile(root+'/identity-'+stage+'.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,build:identity.aggregateSha256,source:identity.sourceAggregateSha256,unchanged:record.unchanged}));

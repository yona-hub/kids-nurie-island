import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {templateHash} from '../tools/asset-pipeline/build.mjs';
const out='test-results/storybook-improvement/traceability-20261008';
// This one-time historical snapshot must never overwrite recorded evidence.
// A later observation needs a new directory and conclusions for that revision.
await fs.mkdir(out,{recursive:false});
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const artifactFiles=[
 'docs/product-spec.md','docs/user-art-decisions.md',
 'packages/shared-types/src/index.ts','packages/coloring-engine/src/painting.ts',
 'packages/coloring-engine/src/storybook-texture.ts','packages/coloring-engine/src/storybook-engine.ts',
 'packages/coloring-engine/src/storybook-scene.ts','packages/coloring-engine/src/canvas.ts',
 'packages/persistence/src/index.ts','apps/web/src/pages/Editor.tsx','apps/web/src/pages/Gallery.tsx',
 'apps/web/src/pages/Home.tsx','apps/web/src/components/ArtworkCanvas.tsx','apps/web/src/styles.css',
 'scripts/build-storybook-content.mjs','scripts/build-storybook-scenes.mjs','scripts/check-storybook-performance.mjs',
 'tools/asset-pipeline/storybook-groups.mjs','tools/asset-pipeline/trace_storybook_ink.py',
 'content/storybook-generated/manifest.json','content/generated-lineart/user-adoption.json',
 'test-results/storybook-improvement/unit-final.json',
 'test-results/storybook-improvement/regression-initial/browser-results.json',
 'docs/audits/storybook-content.md','docs/audits/storybook-engine.md',
 'test-results/storybook-content-audit/revision-4/home-vs-princess-brown-eyes.png',
 'test-results/storybook-improvement/princess-eye-states.png',
 'test-results/storybook-improvement/three-media-review.png',
 'test-results/storybook-improvement/all-eyes-review.png',
 'dist-demo/index.html'
];
const artifacts=[];
for(const file of artifactFiles){try{const bytes=await fs.readFile(file);artifacts.push({file,sha256:sha(bytes),bytes:bytes.length});if(file.includes('test-results/')||file.includes('docs/audits/')){const target=path.join(out,'frozen',file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);}}catch(e){if(e.code==='ENOENT')artifacts.push({file,exists:false});else throw e;}}
const pasted='C:/Users/yonaf/.codex/attachments/661607c6-093a-48d4-a830-4320978be898/貼り付けたテキスト.txt';
const initialBytes=await fs.readFile(pasted),productBytes=await fs.readFile('docs/product-spec.md');
const adoption=await read('content/generated-lineart/user-adoption.json'),oldPreservation=[];
for(const a of adoption.templates){const t=await read(`apps/web/public/content/templates/${a.id}.json`),original=await fs.readFile(a.originalFile);oldPreservation.push({id:a.id,contentHash:templateHash(t),adoptionHash:a.contentHash,originalSha256:sha(original),adoptionOriginalSha256:a.originalSha256,unchanged:templateHash(t)===a.contentHash&&sha(original)===a.originalSha256});}
const catalog=await read('apps/web/public/content/catalog.json'),templates=[];
for(const c of catalog){const file=`apps/web/public${c.assetUrl}`,bytes=await fs.readFile(file),t=JSON.parse(bytes);templates.push({id:t.id,assetUrl:c.assetUrl,assetSha256:sha(bytes),contentHash:templateHash(t),groups:t.paintingProfile.groups.length,eyes:t.paintingProfile.eyes.length,selectableRegions:t.regions.length-t.paintingProfile.eyes.length});}
const manifest=await read('content/storybook-generated/manifest.json'),media=[];
for(const a of [...manifest.assets,...manifest.history])media.push({id:a.id,file:a.originalFile,sha256:sha(await fs.readFile(a.originalFile)),manifestSha256:a.sha256,unchanged:sha(await fs.readFile(a.originalFile))===a.sha256});
const unit=await read('test-results/storybook-improvement/unit-final.json'),browser=await read('test-results/storybook-improvement/regression-initial/browser-results.json');
const result={observedAt:new Date().toISOString(),purpose:'Requirement reconciliation snapshot. File hashes prove observed bytes, not a test run against current bytes.',initialSource:{file:pasted,sha256:sha(initialBytes),projectFile:'docs/product-spec.md',projectSha256:sha(productBytes),byteIdentical:initialBytes.equals(productBytes)},artifacts,oldPreservation,templates,media,tests:{unit:{startTime:unit.startTime,total:unit.numTotalTests,passed:unit.numPassedTests,failed:unit.numFailedTests,success:unit.success,scope:'Pre-latest-eye-fix run. 380 passed; no pre/post source identity recorded. Not proof of the subsequent eyelid/pupil/catchlight changes.'},browser:{stats:browser.stats,scope:'Initial regression build: 144 passed / 38 failed / 6 skipped. Not current-source completion proof.'}},currentState:{eyeVisualAcceptance:'FAIL: independent revision-4 comparison. Later corrective source edits not generated, built, rendered or verified yet.',sourceVsServedBuild:'Latest eye source edits postdate dist-demo build; current files and current compiled candidate are different revisions.',overall:'NOT READY'}};
await fs.writeFile(`${out}/evidence.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({file:`${out}/evidence.json`,initialByteIdentical:result.initialSource.byteIdentical,oldPreserved:oldPreservation.filter(x=>x.unchanged).length,templates:templates.length,groups:templates.reduce((n,x)=>n+x.groups,0),eyes:templates.reduce((n,x)=>n+x.eyes,0),mediaOriginals:media.length,mediaHashMatches:media.filter(x=>x.unchanged).length,unit:result.tests.unit,browser:browser.stats,currentState:result.currentState},null,2));

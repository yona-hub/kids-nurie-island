import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkBrowser } from '../../scripts/check-browser.mjs';
import { APP_ORIGIN, RESULT_DIRECTORY, SOURCE_PREVIEW } from './fixture-config.mjs';
import { buildIdentity, sourceIdentity, harnessIdentity, saveEvidence, sha256 } from './evidence.mjs';

export default async function setup() {
  const readiness = checkBrowser();
  await saveEvidence('browser-readiness.json', readiness);
  if(SOURCE_PREVIEW){
    const startedAt=new Date().toISOString(),source=await sourceIdentity(),harness=await harnessIdentity();
    const response=await fetch(`${APP_ORIGIN}/index.html`),html=await response.text();
    assert.equal(response.status,200);assert.ok(html.includes('/@vite/client'),'Source preview must be identified as development mode');
    await saveEvidence('run-identity-start.json',{startedAt,mode:'non-demo source preview',build:null,source,harness,servedHtmlSha256:sha256(html),publicAssetCachePolicy:'public, max-age=3600; original public bytes, no production SW',productionBuildVerified:false});
    return async()=>{
      const sourceAfter=await sourceIdentity(),harnessAfter=await harnessIdentity();
      const unchanged=sourceAfter.sha256===source.sha256&&harnessAfter.sha256===harness.sha256;
      await saveEvidence('run-identity.json',{startedAt,completedAt:new Date().toISOString(),mode:'non-demo source preview',demoMode:false,build:null,sourceSha256:source.sha256,sourceAfterSha256:sourceAfter.sha256,harnessSha256:harness.sha256,harnessAfterSha256:harnessAfter.sha256,artifactAndHarnessUnchanged:unchanged,productionBuildVerified:false,node:process.version,firefoxExecutable:process.env.FIREFOX_EXECUTABLE_PATH??'official Playwright distribution'});
      assert.equal(unchanged,true,'Source or harness changed during non-demo source preview regression');
    };
  }
  const manifest = JSON.parse(await readFile(`${RESULT_DIRECTORY}/build-manifest.json`, 'utf8'));
  const source = await sourceIdentity(), build = await buildIdentity(), harness = await harnessIdentity();
  assert.equal(build.sha256, manifest.build.sha256, 'Dedicated cloud build changed after its recorded build');
  const served = await fetch(`${APP_ORIGIN}/index.html`), html = await served.text();
  assert.equal(served.status, 200); assert.equal(sha256(html), build.files.find(file => file.path === 'index.html').sha256);
  const entries = [];
  for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
    const response = await fetch(new URL(match[1], APP_ORIGIN)), bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, 200); assert.equal(sha256(bytes), build.files.find(file => file.path === match[1].slice(1)).sha256);
    entries.push({ path: match[1], sha256: sha256(bytes) });
  }
  const startedAt = new Date().toISOString();
  await saveEvidence('run-identity-start.json', { startedAt, source: manifest.source, workingSource: source, build, harness, servedEntries: entries });
  return async () => {
    const sourceAfter = await sourceIdentity(), buildAfter = await buildIdentity(), harnessAfter = await harnessIdentity();
    const artifactAndHarnessUnchanged = buildAfter.sha256 === build.sha256 && harnessAfter.sha256 === harness.sha256;
    await saveEvidence('run-identity.json', { startedAt, completedAt: new Date().toISOString(), node: process.version, platform: process.platform, firefoxExecutable: process.env.FIREFOX_EXECUTABLE_PATH ?? 'official Playwright distribution', sourceSha256: manifest.source.sha256, buildSha256: build.sha256, harnessSha256: harness.sha256, workingSourceStartSha256: source.sha256, workingSourceAfterSha256: sourceAfter.sha256, workingSourceMatchesBuild: source.sha256 === manifest.source.sha256 && sourceAfter.sha256 === manifest.source.sha256, buildAfterSha256: buildAfter.sha256, harnessAfterSha256: harnessAfter.sha256, artifactAndHarnessUnchanged, servedEntries: entries });
    assert.equal(artifactAndHarnessUnchanged, true, 'Fixture or served build changed during cloud E2E execution');
  };
}

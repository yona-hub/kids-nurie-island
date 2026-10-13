/* global requestAnimationFrame, Event */
/** Real HTTP/UI regression with actual QA and an injected, memory-only review store. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { chromium, expect } from '@playwright/test';
import { inspectTemplate, loadMasters, templateHash } from '../tools/asset-pipeline/build.mjs';
import { startReviewServer } from '../tools/asset-pipeline/review-server.mjs';
import { createReviewApi } from '../tools/asset-pipeline/review-api.mjs';

const id='gen-princess-bunny-v6',port=Number(process.env.A06_REVIEW_PORT??4338),base=`http://127.0.0.1:${port}`;
const read=file=>fs.readFile(file,'utf8').then(JSON.parse);
const allMasters=await loadMasters(),master=allMasters.find(item=>item.id===id),otherId='gen-wizard-lantern-v6',otherMaster=allMasters.find(item=>item.id===otherId);
const original={template:await read(`content/templates/${id}.json`),review:await read(`content/templates/reviews/${id}.json`),qa:await read(`content/qa/${id}.json`),sampleColors:master.regions.map(r=>r.sampleColor),originalImageUrl:`/api/originals/${id}`,analysisImageUrl:`/api/analysis/${id}`};
const otherOriginal={template:await read(`content/templates/${otherId}.json`),review:await read(`content/templates/reviews/${otherId}.json`),qa:await read(`content/qa/${otherId}.json`),sampleColors:otherMaster.regions.map(r=>r.sampleColor),originalImageUrl:`/api/originals/${otherId}`,analysisImageUrl:`/api/analysis/${otherId}`};
const eyes=(await read('content/generated-lineart/eye-region-map.json')).find(item=>item.templateId===id).eyes;
const pupil=eyes[0].pupilIds[0];
async function realApprovalSnapshot(){
 const directory='content/templates/reviews';
 const files=(await fs.readdir(directory)).filter(file=>file.endsWith('.json')).sort();
 return Promise.all(files.map(async file=>({file,sha:createHash('sha256').update(await fs.readFile(path.join(directory,file))).digest('hex')})));
}
const before=await realApprovalSnapshot();
let state,writes,pending,otherState,otherPending,pendingId=id,failNext=false;
function reset(){state=structuredClone(original);pending=structuredClone(original.review);otherState=structuredClone(otherOriginal);otherPending=structuredClone(otherOriginal.review);pendingId=id;writes=[];failNext=false;}
reset();
const store={
 getData:async(requestedId)=>structuredClone(requestedId===otherId?otherState:state),
 writeReview:async(requestedId,review)=>{pendingId=requestedId;if(requestedId===otherId)otherPending=structuredClone(review);else pending=structuredClone(review);writes.push(structuredClone(review));},
 rebuild:async()=>{
  if(failNext){failNext=false;throw Error('simulated IO failure after review staging');}
  const baseline=pendingId===otherId?otherOriginal:original,review=pendingId===otherId?otherPending:pending,source=pendingId===otherId?otherMaster:master;
  const template={...structuredClone(baseline.template),approved:false,regions:baseline.template.regions.map(r=>({...r,...review.regions[r.id]}))};
  const {qa}=await inspectTemplate(source,template),contentHash=templateHash(template);
  template.approved=qa.pass&&['human','author-technical'].includes(review.approval?.kind)&&review.approval.contentHash===contentHash;
  const saved={...baseline,template,review:structuredClone(review),qa:{...qa,contentHash,approval:review.approval}};
  if(pendingId===otherId)otherState=saved;else state=saved;
 },
};
const handlerOnly=process.argv.includes('--handler-only');
const server=handlerOnly?null:await startReviewServer({port,store,masters:[master,otherMaster]});
let browser;
const results=[];
function record(result){results.push(result);if(!handlerOnly)console.log(JSON.stringify({case:result.case,surface:result.surface,pass:result.pass}));}
const releasePending=new Set();
const cases=[
 {name:'pupil-highlight',change:regions=>{regions[pupil].highlight=true;},status:409,error:'自動の陰影',ui:page=>page.getByLabel(`${pupil} ハイライト`,{exact:true}).check()},
 {name:'low-confidence',change:regions=>{regions.r01.confidence=.25;},status:409,error:'素材区分が未確認',ui:page=>page.getByLabel('r01 信頼度',{exact:true}).fill('0.25')},
 {name:'normal-material',change:regions=>{regions.r01.material='fabric';},status:200,ui:page=>page.getByLabel('r01 素材',{exact:true}).selectOption('fabric')},
];
const token=handlerOnly?'isolated-regression-token':(await (await fetch(base)).text()).match(/name="review-token" content="([^"]+)"/)[1];
const handler=createReviewApi({port,store,masters:[master,otherMaster],token});
function edits(){return Object.fromEntries(original.template.regions.map(r=>[r.id,Object.fromEntries(['name','material','confidence','shade','highlight','texture','direction'].map(k=>[k,r[k]]))]));}
async function post(regions){
 const body=JSON.stringify({regions,approve:true,confirmAll:true,reviewer:'隔離回帰テスト（保存先はメモリ）'});
 if(!handlerOnly)return fetch(`${base}/api/templates/${id}`,{method:'POST',headers:{'Content-Type':'application/json','X-Review-Token':token},body});
 const request=Readable.from([Buffer.from(body)]);request.method='POST';request.headers={'content-type':'application/json','x-review-token':token};
 let status,result;const response={writeHead:value=>{status=value;},end:value=>{result=JSON.parse(value);}};
 assert.equal(await handler(request,response,new URL(`${base}/api/templates/${id}`)),true);
 return {status,json:async()=>result};
}
function checkOutcome(test,status,body){
 assert.equal(status,test.status);
 if(test.status===409){assert.equal(body.saved,false);assert.equal(body.qa.pass,false);assert.ok(body.qa.errors.some(message=>message.includes(test.error)));assert.equal(writes.length,0);assert.deepEqual(state,original);}
 else {assert.equal(body.qa.pass,true);assert.equal(body.template.approved,true);assert.equal(state.review.approval.kind,'human');assert.equal(body.qa.contentHash,state.review.approval.contentHash);assert.equal(body.qa.contentHash,templateHash(body.template));assert.equal(body.template.regions[0].material,'fabric');assert.equal(writes.length,1);}
}
try{
 for(const test of cases){reset();const regions=edits();test.change(regions);const response=await post(regions),body=await response.json();checkOutcome(test,response.status,body);record({surface:handlerOnly?'request handler':'HTTP',case:test.name,status:response.status,candidateQaPass:body.qa.pass,recordKind:state.review.approval.kind,recordWrites:writes.length,pass:true});}
 reset();failNext=true;
 const response=await post(edits()),body=await response.json();assert.equal(response.status,500);assert.equal(body.saved,false);assert.deepEqual(state,original);assert.deepEqual(pending,original.review);
 record({surface:handlerOnly?'request handler':'HTTP',case:'post-validation-build-failure-rollback',status:500,recordKind:state.review.approval.kind,pass:true});
 if(!handlerOnly&&!process.argv.includes('--http-only')){
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const test of cases){
   reset();await page.goto(base);await page.locator('#region-rows tr').nth(50).waitFor();
   await test.ui(page);await page.locator('#reviewer').fill('隔離回帰テスト（保存先はメモリ）');await page.locator('#confirm').check();
   const observed=page.waitForResponse(response=>response.url()===`${base}/api/templates/${id}`&&response.request().method()==='POST');
   await page.getByRole('button',{name:'承認して保存',exact:true}).click();
   const response=await observed,body=await response.json();checkOutcome(test,response.status(),body);
   if(test.status===409){await page.locator('#message.error').getByText('編集後のQAが不合格', {exact:false}).waitFor();assert.match(await page.locator('#status').innerText(),/QA 不合格/);assert.match(await page.locator('#status').innerText(),/保存・承認されていません/);assert.doesNotMatch(await page.locator('#status').innerText(),/人間承認:/);}
   else {await page.locator('#message').getByText('QA合格を確認し、承認と修正を保存しました。',{exact:false}).waitFor();assert.match(await page.locator('#status').innerText(),/人間承認:/);assert.equal(await page.locator('#message').evaluate(el=>el.classList.contains('error')),false);}
   const fetched=await (await fetch(`${base}/api/templates/${id}`)).json();assert.deepEqual(fetched.review,state.review);
   await page.locator('#message').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/a06-review-${test.name}.png`});
   record({surface:'browser + HTTP',case:test.name,status:response.status(),candidateQaPass:body.qa.pass,recordKind:state.review.approval.kind,message:await page.locator('#message').innerText(),pass:true});
  }
  // Saving replaces the API data object. A subsequent edit must target that
  // new object, rather than the object captured by the original table events.
  reset();await page.goto(base);await page.locator('#region-rows tr').nth(50).waitFor();
  const revisions=[
   {approve:false,values:{name:'最初に保存する領域',material:'fabric',confidence:.9,shade:false,highlight:false,texture:.15,direction:45}},
   {approve:false,values:{name:'保存後に再編集した領域',material:'wood',confidence:.95,shade:true,highlight:false,texture:.25,direction:90}},
   {approve:true,values:{name:'連続編集後に確認した領域',material:'metal',confidence:1,shade:true,highlight:true,texture:.4,direction:135}},
  ];
  const previewDigest=async()=>createHash('sha256').update(await page.locator('#materials').evaluate(canvas=>canvas.toDataURL())).digest('hex');
  for(const revision of revisions){
   const previewBefore=await previewDigest();
   await page.getByLabel('r01 領域名',{exact:true}).fill(revision.values.name);
   await page.getByLabel('r01 素材',{exact:true}).selectOption(revision.values.material);
   await page.getByLabel('r01 信頼度',{exact:true}).fill(String(revision.values.confidence));
   await page.getByLabel('r01 陰影',{exact:true}).setChecked(revision.values.shade);
   await page.getByLabel('r01 ハイライト',{exact:true}).setChecked(revision.values.highlight);
   await page.getByLabel('r01 質感',{exact:true}).fill(String(revision.values.texture));
   await page.getByLabel('r01 向き',{exact:true}).fill(String(revision.values.direction));
   await expect.poll(previewDigest,{message:`Preview must update for ${revision.values.name}`}).not.toBe(previewBefore);
   await page.locator('#reviewer').fill('連続編集の隔離回帰テスト');
   if(revision.approve)await page.locator('#confirm').check();
   const observed=page.waitForResponse(response=>response.url()===`${base}/api/templates/${id}`&&response.request().method()==='POST');
   await page.locator(revision.approve?'#approve':'#save').click();
   const response=await observed,body=await response.json();
   assert.equal(response.status(),200);assert.equal(body.qa.pass,true);
   const sent=response.request().postDataJSON().regions.r01;
   assert.deepEqual(sent,revision.values,'Every field displayed after a prior save must be submitted');
   for(const [key,value]of Object.entries(revision.values))assert.equal(body.template.regions[0][key],value);
   assert.equal(body.qa.contentHash,templateHash(body.template));
   if(revision.approve)assert.equal(body.review.approval.contentHash,body.qa.contentHash);
   await expect(page.locator('#save')).toBeEnabled();
   await expect(page.getByLabel('r01 素材',{exact:true})).toHaveValue(revision.values.material);
   assert.deepEqual(state.review.regions.r01,revision.values);
  }
  record({surface:'browser + HTTP',case:'edit-save-edit-save-edit-approve-all-fields-and-preview',revisions:revisions.length,pass:true});
  reset();await page.goto(base);await page.locator('#region-rows tr').nth(50).waitFor();
  let resumePost;const heldPost=new Promise(resolve=>{resumePost=resolve;});
  await page.route(`**/api/templates/${id}`,async route=>{if(route.request().method()==='POST')await heldPost;await route.continue();});
  const heldResponse=page.waitForResponse(response=>response.url()===`${base}/api/templates/${id}`&&response.request().method()==='POST');
  await page.locator('#save').click();
  try{
   for(const control of ['#save','#approve','#template-select','#reviewer','#confirm'])await expect(page.locator(control)).toBeDisabled();
   for(const label of ['領域名','素材','信頼度','陰影','ハイライト','質感','向き'])await expect(page.getByLabel(`r01 ${label}`,{exact:true})).toBeDisabled();
  }finally{resumePost();}
  assert.equal((await heldResponse).status(),200);
  await expect(page.getByLabel('r01 素材',{exact:true})).toBeEnabled();
  await page.unroute(`**/api/templates/${id}`);
  record({surface:'browser + HTTP',case:'pending-save-cannot-discard-a-later-edit',pass:true});
  // Delayed GET cannot race a save, overwrite a newer selection, or drop the
  // unsaved draft when returning to the previously selected template.
  reset();await page.goto(base);await page.locator('#region-rows tr').nth(50).waitFor();
  const selection=page.locator('#template-select'),nameField=page.getByLabel('r01 領域名',{exact:true});
  await nameField.fill('切り替えても保持する編集');
  let releaseGet,reportGetStarted;
  const getHold=new Promise(resolve=>{releaseGet=resolve;}),getStarted=new Promise(resolve=>{reportGetStarted=resolve;});
  releasePending.add(releaseGet);
  await page.route(`**/api/templates/${otherId}`,async route=>{reportGetStarted();await getHold;await route.continue();});
  const delayedGet=page.waitForResponse(response=>response.url()===`${base}/api/templates/${otherId}`&&response.request().method()==='GET');
  console.log('A06: delaying template GET');
  await selection.selectOption(otherId);
  console.log('A06: template selection dispatched');
  let getStartedTimer;try{await Promise.race([getStarted,new Promise((_,reject)=>{getStartedTimer=setTimeout(()=>reject(Error('Expected delayed template GET within 5 seconds')),5000);})]);}finally{clearTimeout(getStartedTimer);}
  await expect(page.locator('#save')).toBeDisabled();await expect(page.locator('#approve')).toBeDisabled();await expect(nameField).toBeDisabled();
  await page.locator('#save').dispatchEvent('click');assert.equal(writes.length,0,'Loading must reject even a dispatched save');
  console.log('A06: switching back while GET is pending');
  await selection.selectOption(id);await expect(nameField).toBeEnabled();await expect(nameField).toHaveValue('切り替えても保持する編集');
  console.log('A06: completing stale GET');
  releaseGet();await (await delayedGet).finished();await page.evaluate(()=>new Promise(requestAnimationFrame));
  await expect(selection).toHaveValue(id);await expect(page.locator('#status')).toHaveAttribute('data-template-id',id);await expect(nameField).toHaveValue('切り替えても保持する編集');
  await page.unroute(`**/api/templates/${otherId}`);
  record({surface:'browser + HTTP',case:'pending-get-blocks-post-and-stale-get-preserves-current-draft',pass:true});
  // Complete the newer load first, then hold its POST. The selection and all
  // recreated controls must stay bound to that POST's template throughout.
  await selection.selectOption(otherId);await expect(page.locator('#status')).toHaveAttribute('data-template-id',otherId);await expect(nameField).toBeEnabled();
  await nameField.fill('魔法使いだけへ保存する領域');await page.locator('#reviewer').fill('線画切替の隔離回帰');await page.locator('#confirm').check();
  let releaseOtherPost;const otherPostHold=new Promise(resolve=>{releaseOtherPost=resolve;});
  releasePending.add(releaseOtherPost);
  await page.route(`**/api/templates/${otherId}`,async route=>{if(route.request().method()==='POST')await otherPostHold;await route.continue();});
  const otherPosted=page.waitForResponse(response=>response.url()===`${base}/api/templates/${otherId}`&&response.request().method()==='POST');
  await page.locator('#approve').click();await expect(selection).toBeDisabled();await expect(nameField).toBeDisabled();
  await selection.evaluate((element,value)=>{element.value=value;element.dispatchEvent(new Event('change',{bubbles:true}));},id);
  await expect(selection).toHaveValue(otherId);await expect(page.locator('#status')).toHaveAttribute('data-template-id',otherId);
  releaseOtherPost();const otherResponse=await otherPosted,otherBody=await otherResponse.json();assert.equal(otherResponse.status(),200);
  assert.equal(otherBody.template.id,otherId);assert.equal(otherBody.template.regions[0].name,'魔法使いだけへ保存する領域');assert.equal(otherBody.qa.contentHash,otherBody.review.approval.contentHash);
  await expect(selection).toBeEnabled();await expect(nameField).toHaveValue('魔法使いだけへ保存する領域');await page.unroute(`**/api/templates/${otherId}`);
  await selection.selectOption(id);await expect(nameField).toHaveValue('切り替えても保持する編集');assert.equal(state.template.regions[0].name,original.template.regions[0].name);
  record({surface:'browser + HTTP',case:'get-then-post-selection-display-target-and-approval-match',pass:true});
  // Both load and save failures retain the editable draft; switching away and
  // back must not replace it with the last server copy.
  await page.route(`**/api/templates/${otherId}`,route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"temporary load failure"}'}));
  await selection.selectOption(otherId);await expect(page.locator('#message.error')).toContainText('線画を読み込めません');
  await expect(selection).toHaveValue(id);await expect(nameField).toBeEnabled();await expect(nameField).toHaveValue('切り替えても保持する編集');await page.unroute(`**/api/templates/${otherId}`);
  failNext=true;const failedSave=page.waitForResponse(response=>response.url()===`${base}/api/templates/${id}`&&response.request().method()==='POST');
  await page.locator('#save').click();assert.equal((await failedSave).status(),500);await expect(nameField).toBeEnabled();await expect(nameField).toHaveValue('切り替えても保持する編集');
  await selection.selectOption(otherId);await expect(page.locator('#status')).toHaveAttribute('data-template-id',otherId);await selection.selectOption(id);await expect(nameField).toHaveValue('切り替えても保持する編集');
  await page.locator('#reviewer').fill('失敗後の編集を再確認');await page.locator('#confirm').check();const retried=page.waitForResponse(response=>response.url()===`${base}/api/templates/${id}`&&response.request().method()==='POST');
  await page.locator('#approve').click();const retryResponse=await retried,retryBody=await retryResponse.json();assert.equal(retryResponse.status(),200);assert.equal(retryBody.template.regions[0].name,'切り替えても保持する編集');assert.equal(retryBody.review.approval.contentHash,retryBody.qa.contentHash);await expect(selection).toBeEnabled();
  record({surface:'browser + HTTP',case:'get-and-post-failure-retain-draft-through-switch-and-retry',pass:true});
  // A defensive client check also rejects contradictory success responses.
  reset();await page.goto(base);await page.locator('#region-rows tr').nth(50).waitFor();
  await page.route(`**/api/templates/${id}`,async route=>{
   if(route.request().method()!=='POST'){await route.continue();return;}
   const bad=structuredClone(original);bad.qa.pass=false;bad.template.approved=false;bad.review.approval={kind:'human',contentHash:bad.qa.contentHash};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bad)});
  });
  await page.locator('#reviewer').fill('隔離回帰テスト');await page.locator('#confirm').check();await page.locator('#approve').click();
  await page.locator('#message.error').getByText('承認の成立を確認できませんでした。',{exact:false}).waitFor();assert.equal(writes.length,0);
  record({surface:'browser',case:'contradictory-http-200-not-success',pass:true});
  assert.deepEqual(errors,[]);
 }
 assert.deepEqual(await realApprovalSnapshot(),before,'real approval records must remain byte-for-byte unchanged');
 const result={pass:true,storage:'memory-only; no actual human approval is written',realReviewFilesUnchanged:true,templateId:id,results};
 await fs.mkdir('test-results',{recursive:true});await fs.writeFile(`test-results/a06-review-${handlerOnly?'handler':process.argv.includes('--http-only')?'http':'browser'}-results.json`,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
}finally{for(const release of releasePending)release();await browser?.close();await server?.close();}

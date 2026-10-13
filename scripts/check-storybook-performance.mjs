/* global document, CanvasRenderingContext2D, requestAnimationFrame, indexedDB */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {checkBrowser} from './check-browser.mjs';
import {performanceBuildIdentity,assertPerformanceBuildUnchanged} from './performance-evidence.mjs';

checkBrowser();
const url=process.env.PERFORMANCE_URL??'http://127.0.0.1:4174';
const themeFilter=process.env.PERFORMANCE_THEME;
const output=process.env.PERFORMANCE_OUTPUT??'test-results/vector-improvement/performance.json';
const scriptHash=()=>fs.readFile('scripts/check-storybook-performance.mjs').then(bytes=>createHash('sha256').update(bytes).digest('hex'));
const hash=await scriptHash(),build=await performanceBuildIdentity(url);
const catalog=await(await fetch(new URL('/content/catalog.json',url))).json(),candidates=[];
const themeNames={princess:'おひめさま',magic:'まほう',animals:'どうぶつ',ocean:'うみ',dinosaurs:'きょうりゅう',vehicles:'のりもの',construction:'はたらくくるま',robots:'ロボット',space:'うちゅう',flowers:'おはな'};
for(const entry of catalog){
 if(themeFilter&&entry.themeId!==themeFilter)continue;
 const t=await(await fetch(new URL(entry.assetUrl,url))).json(),ctx=createCanvas(400,500).getContext('2d');ctx.scale(.25,.25);
 const automatic=new Set(t.paintingProfile.eyes.map(e=>e.highlightId)),regions=t.regions.filter(r=>!automatic.has(r.id));
 for(const [i,r]of regions.entries()){ctx.fillStyle=`rgb(${i+1},0,0)`;ctx.fill(new Path2D(r.path),r.fillRule??'nonzero');}
 const data=ctx.getImageData(0,0,400,500).data,areas=regions.map(()=>0);for(let i=0;i<data.length;i+=4)if(data[i+3]===255&&data[i]>0&&data[i]<=regions.length)areas[data[i]-1]++;
 for(const g of t.paintingProfile.groups)candidates.push({template:t,group:g,filledPixels:g.regionIds.reduce((n,id)=>n+areas[regions.findIndex(r=>r.id===id)],0),members:g.regionIds.length});
}
const largestArea=candidates.reduce((a,b)=>a.filledPixels>b.filledPixels?a:b),largestMembership=candidates.reduce((a,b)=>a.members>b.members?a:b);
const targets=[largestArea,...(largestArea.group===largestMembership.group?[]:[largestMembership])],reports=[];
const p95=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length*.95)];
const stats=values=>({count:values.length,p95Ms:p95(values),maxMs:Math.max(...values)});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const target of targets){
  const t=target.template,g=target.group,ctx=createCanvas(1,1).getContext('2d'),automatic=new Set(t.paintingProfile.eyes.map(e=>e.highlightId)),regions=t.regions.filter(r=>!automatic.has(r.id)),paths=regions.map(r=>new Path2D(r.path));
  const hit=(x,y)=>{for(let i=regions.length-1;i>=0;i--)if(ctx.isPointInPath(paths[i],x,y,regions[i].fillRule??'nonzero'))return regions[i].id;return null;};
  let point;for(const id of g.regionIds){const r=regions.find(r=>r.id===id);for(let y=r.bounds.y+24;y<r.bounds.y+r.bounds.height-24&&!point;y+=8)for(let x=r.bounds.x+24;x<r.bounds.x+r.bounds.width-24;x+=8)if([[0,0],[18,0],[-18,0],[0,18],[0,-18]].every(([dx,dy])=>hit(x+dx,y+dy)===id)){point={x,y,regionId:id};break;}if(point)break;}
  assert.ok(point,'Stable interior point for largest group');
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'ja-JP'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.goto(url);
  await page.getByRole('button',{name:`${themeNames[t.themeId]}のしま`,exact:true}).click();await page.locator('.template-card').first().click();await page.waitForFunction(()=>document.querySelector('.complete-button')&&!document.querySelector('.complete-button').disabled);
  assert.equal(await page.getByRole('button',{name:'まとめて',exact:true}).getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{
   const canvas=document.querySelector('.artwork-transform canvas'),stage=document.querySelector('.artwork-interactive'),state={samples:[],pending:null};globalThis.__storybookPerf=state;
   stage.addEventListener('pointerup',()=>{state.pending={start:performance.now(),medium:state.medium,color:state.color};state.samples.push(state.pending);},{capture:true});
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...args){const result=Reflect.apply(draw,this,args);if(this.canvas===canvas&&state.pending){const sample=state.pending;sample.lastCanvasDrawMs=performance.now()-sample.start;if(sample.firstCanvasDrawMs===undefined){sample.firstCanvasDrawMs=sample.lastCanvasDrawMs;requestAnimationFrame(()=>requestAnimationFrame(()=>{sample.paintOpportunityMs=performance.now()-sample.start;}));}}return result;};
  });
  for(const medium of ['なめらか','クレヨン','いろえんぴつ']){
   await page.getByRole('group',{name:'画材',exact:true}).getByRole('button',{name:medium,exact:true}).click();
   for(let i=0;i<12;i++){const shade=page.locator('.shades button').nth(i);await shade.click();const color=await shade.evaluate(e=>e.style.getPropertyValue('--swatch').trim());assert.match(color,/^#[0-9a-f]{6}$/i);
    await page.evaluate(values=>Object.assign(globalThis.__storybookPerf,values),{medium,color});const b=await page.getByTestId('artwork').boundingBox();await page.mouse.click(b.x+point.x/1600*b.width,b.y+point.y/2000*b.height);await page.waitForFunction(()=>globalThis.__storybookPerf.pending?.paintOpportunityMs!==undefined);
   }
  }
  const projectId=page.url().split('/paint/')[1];
  await page.waitForFunction(async({id,ids})=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('kids-nurie-island-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise(resolve=>{const r=db.transaction('projects','readonly').objectStore('projects').getAll();r.onsuccess=()=>{const project=r.result.find(row=>!row.deleted&&row.project.id===id)?.project;resolve(ids.every(key=>project?.regions[key]?.paintType==='pencil'));};});}finally{db.close();}},{id:projectId,ids:g.regionIds});
  const samples=await page.evaluate(()=>globalThis.__storybookPerf.samples),summary={templateId:t.id,groupId:g.id,groupName:g.name,memberRegionIds:g.regionIds,filledPixelsAt400x500:target.filledPixels,selection:target===largestArea?'largest visible mask area':'largest member count',point,cpuSlowdown:4,dpr:2,viewport:{width:390,height:844},samples,firstCanvasDraw:stats(samples.map(s=>s.firstCanvasDrawMs)),lastCanvasDraw:stats(samples.map(s=>s.lastCanvasDrawMs)),paintOpportunity:stats(samples.map(s=>s.paintOpportunityMs)),perMedium:Object.fromEntries(['なめらか','クレヨン','いろえんぴつ'].map(m=>[m,{...stats(samples.filter(s=>s.medium===m).map(s=>s.firstCanvasDrawMs)),distinctColors:new Set(samples.filter(s=>s.medium===m).map(s=>s.color)).size}])),errors};
  summary.pass=samples.length===36&&summary.firstCanvasDraw.p95Ms<=100&&Object.values(summary.perMedium).every(m=>m.distinctColors===12)&&samples.every(s=>[s.firstCanvasDrawMs,s.lastCanvasDrawMs,s.paintOpportunityMs].every(Number.isFinite))&&!errors.length;
  reports.push(summary);await context.close();
 }
 assertPerformanceBuildUnchanged(build,await performanceBuildIdentity(url));assert.equal(await scriptHash(),hash);
 const result={measuredAt:new Date().toISOString(),build,measurementScriptSha256:hash,buildUnchanged:true,browserVersion:browser.version(),templateScope:themeFilter??'all ten templates',method:'Largest authored group selected by visible mask pixel count at 400×500 within templateScope; largest member count also measured. Actual pointerup → first/last display-canvas draw; two RAF callbacks are a paint-opportunity proxy. CPU4/DPR2, 12 distinct uncached palette colors per medium. UI group mode and persisted membership verified. Not a physical-device benchmark.',groupRanking:candidates.map(c=>({templateId:c.template.id,groupId:c.group.id,members:c.members,filledPixels:c.filledPixels})),reports,pass:reports.every(r=>r.pass)};
 await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pass:result.pass,buildSha256:build.aggregateSha256,reports:reports.map(({samples,...r})=>({...r,sampleCount:samples.length}))},null,2));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}

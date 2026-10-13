import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createCanvas, loadImage, Path2D } from '@napi-rs/canvas';
import type { Template, TemplateSummary, SceneAsset } from '../packages/shared-types/src/index';

const root=path.resolve('apps/web/public/content');
const read=<T>(file:string):Promise<T>=>fs.readFile(file,'utf8').then(JSON.parse);
const ranges=[[30,35],[25,30],[20,25],[22,28],[20,25],[25,30],[30,35],[30,40],[25,30],[30,40]];
const legacyIds=['princess-bunny','wizard-lantern','tree-friends','ocean-friends','dinosaur-eggs','round-sports-car','excavator-cones','explorer-robot','rocket-astronaut','bouquet-butterfly'];

describe('retained original production coloring assets',()=>{
 it('retains the retired ten templates for existing saved project edits',async()=>{
  const catalog=await Promise.all(legacyIds.map(async id=>{const template=await read<Template>(path.join(root,'templates',id+'.json'));return {...template,regionCount:template.regions.length,assetUrl:`/content/templates/${id}.json`,thumbnailUrl:`/content/templates/${id}.svg`,coloredThumbnailUrl:`/content/templates/${id}.svg`};}));
  expect(catalog).toHaveLength(10);expect(new Set(catalog.map(t=>t.id)).size).toBe(10);
  expect(catalog.map(t=>t.themeId)).toEqual(['princess','magic','animals','ocean','dinosaurs','vehicles','construction','robots','space','flowers']);
  for(let i=0;i<catalog.length;i++){
   const summary=catalog[i],template=await read<Template>(path.resolve('apps/web/public','.'+summary.assetUrl));
   expect(template.approved).toBe(true);expect(template.width).toBe(1600);expect(template.height).toBe(2000);expect(template.lineWidth).toBe(12);
   expect(template.regions.length).toBeGreaterThanOrEqual(ranges[i][0]);expect(template.regions.length).toBeLessThanOrEqual(ranges[i][1]);expect(template.regions.length).toBe(summary.regionCount);
   const canvas=createCanvas(800,1000),ctx=canvas.getContext('2d');ctx.scale(.5,.5);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1600,2000);
   for(let j=0;j<template.regions.length;j++){
    const region=template.regions[j],shape=new Path2D(region.path),b=shape.computeTightBounds();
    expect(region.path).toMatch(/Z\s*$/i);expect(b[0]).toBeGreaterThanOrEqual(region.bounds.x);expect(b[1]).toBeGreaterThanOrEqual(region.bounds.y);expect(b[2]).toBeLessThanOrEqual(region.bounds.x+region.bounds.width);expect(b[3]).toBeLessThanOrEqual(region.bounds.y+region.bounds.height);
    expect(region.bounds.x).toBeGreaterThanOrEqual(128);expect(region.bounds.y).toBeGreaterThanOrEqual(128);expect(region.bounds.x+region.bounds.width).toBeLessThanOrEqual(1472);expect(region.bounds.y+region.bounds.height).toBeLessThanOrEqual(1872);
    expect(Number.isInteger(region.seed)).toBe(true);expect(region.name).toMatch(/[ぁ-んァ-ヶ一-龠]/);
    ctx.fillStyle=`rgb(${j+1},0,0)`;ctx.fill(shape);
   }
   const pixels=ctx.getImageData(0,0,800,1000).data,counts=new Uint32Array(template.regions.length);
   for(let p=0;p<pixels.length;p+=4)if(pixels[p+1]===0&&pixels[p+2]===0&&pixels[p]>=1&&pixels[p]<=counts.length)counts[pixels[p]-1]++;
   expect(Math.min(...counts)).toBeGreaterThan(60); // every region remains visible despite overlap
   const qa=await read<{pass:boolean;contentHash:string;approval:{kind:string;contentHash:string}}>(path.resolve('content/qa',summary.id+'.json'));
   expect(qa.pass).toBe(true);expect(['human','author-technical']).toContain(qa.approval.kind);
   const fingerprint=createHash('sha256').update(JSON.stringify({...template,approved:false})).digest('hex');
   expect(qa.contentHash).toBe(fingerprint);expect(qa.approval.contentHash).toBe(fingerprint);
   for(const asset of [summary.thumbnailUrl,summary.coloredThumbnailUrl]){const svg=await fs.readFile(path.resolve('apps/web/public','.'+asset),'utf8');expect(svg).toContain('viewBox="0 0 1600 2000"');expect(svg).not.toMatch(/<script|https?:\/\/(?!www\.w3\.org)/);}
  }
 });
 it('selects ten generated uncolored originals only after raster QA and technical review pass',async()=>{
  const catalog=await read<TemplateSummary[]>('content/storybook-generated/compiled/legacy-catalog.json');
  expect(catalog,'Generated replacements are still incomplete or failed QA; legacy assets must not be substituted.').toHaveLength(10);
  expect(new Set(catalog.map(item=>item.themeId)).size).toBe(10);
  for(const summary of catalog){
   expect(summary.id).toMatch(/^gen-/);expect(legacyIds).not.toContain(summary.id);
   expect(summary.thumbnailUrl).toMatch(/\.[a-f0-9]{64}\.png$/);expect(summary.coloredThumbnailUrl).toBe(summary.thumbnailUrl);
   const template=await read<Template>(path.resolve('apps/web/public','.'+summary.assetUrl));
   expect(template.approved).toBe(true);expect(template.lineWidth).toBe(0);expect(template.details.every(detail=>detail.strokeWidth===0)).toBe(true);
   const qa=await read<{pass:boolean;contentHash:string;rasterEvidence:{pass:boolean;originalSha256:string;originalFile:string;materialReviewRequired:boolean};approval:{kind:string;contentHash:string}}>(path.resolve('content/qa',summary.id+'.json'));
   expect(qa.pass).toBe(true);expect(qa.rasterEvidence.pass).toBe(true);expect(qa.rasterEvidence.materialReviewRequired).toBe(false);
   expect(createHash('sha256').update(await fs.readFile(qa.rasterEvidence.originalFile)).digest('hex')).toBe(qa.rasterEvidence.originalSha256);
   const fingerprint=createHash('sha256').update(JSON.stringify({...template,approved:false})).digest('hex');
   expect(qa.contentHash).toBe(fingerprint);expect(qa.approval.contentHash).toBe(fingerprint);
  }
 });
 it('names every published asset with its exact bytes hash and retains equivalent migration aliases',async()=>{
  const catalog=await read<TemplateSummary[]>('content/storybook-generated/compiled/legacy-catalog.json');
  const assets: {url:string;alias:string}[]=catalog.flatMap(item=>[
   {url:item.assetUrl,alias:`/content/templates/${item.id}.json`},
   {url:item.thumbnailUrl,alias:`/content/templates/${item.id}${path.extname(item.thumbnailUrl)}`},
  ]);
  for(const kind of ['backgrounds','frames'])for(const scene of await read<SceneAsset[]>(`content/storybook-generated/compiled/legacy-${kind}.json`)){assets.push({url:scene.assetUrl,alias:`/content/${kind}/${scene.id}.svg`});expect(scene.thumbnailUrl).toBe(scene.assetUrl);}
  for(const {url,alias}of assets){
   const hash=/\.([a-f0-9]{64})\.(json|svg|png)$/.exec(url)?.[1];expect(hash).toBeTruthy();
   const contents=await fs.readFile(path.resolve('apps/web/public','.'+url));
   expect(createHash('sha256').update(contents).digest('hex')).toBe(hash);
   expect(contents.equals(await fs.readFile(path.resolve('apps/web/public','.'+alias)))).toBe(true);
  }
 });
 it('keeps one explicit white highlight per pupil and publishes no generated colored examples',async()=>{
  const catalog=await read<TemplateSummary[]>('content/storybook-generated/compiled/legacy-catalog.json');
  const mapping=await read<{templateId:string;originalSha256:string;eyes:{name:string;pupilIds:string[];highlightId:string}[];automaticHighlights:boolean}[]>(path.resolve('content/generated-lineart/eye-region-map.json'));
  expect(mapping.map(item=>item.templateId).sort()).toEqual(catalog.map(item=>item.id).sort());
  expect(mapping.reduce((count,item)=>count+item.eyes.length,0)).toBe(22);
  for(const item of mapping){
   const template=await read<Template>(path.join(root,'templates',item.templateId+'.json'));
   expect(item.automaticHighlights).toBe(false);
   for(const eye of item.eyes){
    expect(eye.pupilIds).not.toContain(eye.highlightId);expect(eye.pupilIds).toHaveLength(1);
    for(const id of [...eye.pupilIds,eye.highlightId]){
     const region=template.regions.find(region=>region.id===id)!;
     expect(region.name).toContain('瞳');expect(region.highlight).toBe(false);expect(region.shade).toBe(false);expect(region.texture).toBe(0);
    }
   }
  }
  expect((await fs.readdir(path.join(root,'templates'))).filter(name=>name.startsWith('gen-')&&name.includes('colored'))).toEqual([]);
  expect(catalog.find(item=>item.themeId==='princess')?.defaultColorFamily).toBe('pink');
 });
 it('provides all backgrounds and confines every frame to the outer 100px',async()=>{
  const backgrounds=await read<SceneAsset[]>('content/storybook-generated/compiled/legacy-backgrounds.json'),frames=await read<SceneAsset[]>('content/storybook-generated/compiled/legacy-frames.json');
  expect(backgrounds.length).toBeGreaterThanOrEqual(10);expect(backgrounds[0].id).toBe('white');expect(frames.length).toBeGreaterThanOrEqual(20);expect(frames[0].id).toBe('none');
  expect(backgrounds.find(b=>b.id==='future-city')?.themeId).toBe('robots');expect(backgrounds.find(b=>b.id==='outer-space')?.themeId).toBe('space');
  for(const frame of frames){
   const svg=await fs.readFile(path.resolve('apps/web/public','.'+frame.assetUrl));const image=await loadImage(svg);const canvas=createCanvas(800,1000),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,800,1000);
   const pixels=ctx.getImageData(51,51,698,898).data;
   for(let p=3;p<pixels.length;p+=4)if(pixels[p]!==0)throw new Error(`${frame.id} overlaps the 100px artwork safety zone`);
  }
 });
});

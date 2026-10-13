import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {describe,it,expect} from 'vitest';
import {validatePaintingProfile} from '../packages/coloring-engine/src/painting';
import type {Template,TemplateSummary,SceneAsset,SceneComposition} from '../packages/shared-types/src/index';
const read=async<T>(file:string)=>JSON.parse(await fs.readFile(file,'utf8')) as T;
const file=(url:string)=>`apps/web/public${url}`;
const verifyHash=async(url:string)=>expect(createHash('sha256').update(await fs.readFile(file(url))).digest('hex')).toBe(url.match(/\.([a-f0-9]{64})\./)![1]);
describe('new source-derived coloring and individually generated compositions',()=>{
 it('binds every candidate to a new ID and exact bytes, with its old approved drawing retained',async()=>{
  const catalog=await read<TemplateSummary[]>('apps/web/public/content/catalog.json');expect(catalog).toHaveLength(10);
  for(const entry of catalog){await verifyHash(entry.assetUrl);await verifyHash(entry.thumbnailUrl);const t=await read<Template>(file(entry.assetUrl));validatePaintingProfile(t);expect(t.id).toMatch(t.themeId==='princess'?/-master-v4$/:/-smooth-v3$/);expect(t.paintingProfile!.version).toBe(t.themeId==='princess'?4:3);let old=await read<Template>(`apps/web/public/content/templates/${t.paintingProfile!.upgradeFrom}.json`);expect(old.paintingProfile!.smoothArtwork!.ink).toBe('pigment-v1');expect(t.regions).toEqual(old.regions);const seen=new Set<string>();while(old.paintingProfile){expect(seen.has(old.id),'upgrade chain must not cycle').toBe(false);seen.add(old.id);old=await read<Template>(`apps/web/public/content/templates/${old.paintingProfile.upgradeFrom}.json`);}expect(t.regions.map(r=>r.id)).toEqual(old.regions.filter(r=>!t.paintingProfile!.retiredRegionIds?.includes(r.id)).map(r=>r.id));for(const url of Object.values(t.paintingProfile!.mediumAssets))await verifyHash(url);}
 });
 it('retains 40 current generated assets and two superseded originals, 11 backgrounds and 21 safe frames',async()=>{
  const generation=await read<{assets:{id:string;sha256:string;originalFile:string}[];history:{id:string;sha256:string;originalFile:string}[]}>('content/storybook-generated/manifest.json');expect(generation.assets).toHaveLength(40);expect(new Set(generation.assets.map(x=>x.id)).size).toBe(40);expect(generation.history).toHaveLength(2);
  for(const asset of [...generation.assets,...generation.history])expect(createHash('sha256').update(await fs.readFile(asset.originalFile)).digest('hex')).toBe(asset.sha256);
  for(const [kind,count]of [['backgrounds',11],['frames',21]] as const){const items=(await read<SceneAsset[]>(`apps/web/public/content/${kind}.json`)).filter(x=>x.catalogVisible!==false);expect(items).toHaveLength(count);
   for(const asset of items){await verifyHash(asset.assetUrl);if(!asset.compositionUrl)continue;await verifyHash(asset.compositionUrl);const c=await read<SceneComposition>(file(asset.compositionUrl));expect(c.layers.length).toBeLessThanOrEqual(80);for(const url of new Set(c.layers.map(l=>l.assetUrl)))await verifyHash(url);
    if(kind==='frames'){const canvas=createCanvas(320,400),ctx=canvas.getContext('2d');ctx.drawImage(await loadImage(file(asset.assetUrl)),0,0,320,400);const behind=c.placement==='behind-artwork';const pixels=ctx.getImageData(behind?65:21,behind?65:21,behind?190:278,behind?270:358).data;for(let i=3;i<pixels.length;i+=4)expect(pixels[i],`${asset.id} transparent opening`).toBe(0);}
   }
  }
 });
});

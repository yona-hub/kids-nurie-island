import {readFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import type {SceneAsset,SceneComposition} from '../../packages/shared-types/src/index';

/** Samples of the actual generated compositions, away from the character. */
export async function sceneSamples(){
 const backgrounds=JSON.parse(readFileSync('apps/web/public/content/backgrounds.json','utf8')) as SceneAsset[],frames=JSON.parse(readFileSync('apps/web/public/content/frames.json','utf8')) as SceneAsset[];
 const background=backgrounds.find(x=>x.legacyId==='sky-island')!,frame=frames.find(x=>x.legacyId==='color-dots')!;
 const ctx=createCanvas(1600,2000).getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1600,2000);
 for(const asset of [background,frame]){
  const composition=JSON.parse(readFileSync(`apps/web/public${asset.compositionUrl}`,'utf8')) as SceneComposition;
  if(composition.baseColor){ctx.fillStyle=composition.baseColor;ctx.fillRect(0,0,1600,2000);}
  for(const layer of composition.layers){ctx.save();ctx.globalAlpha=layer.opacity??1;ctx.translate(layer.x+layer.width/2,layer.y+layer.height/2);ctx.rotate((layer.rotation??0)*Math.PI/180);ctx.drawImage(await loadImage(`apps/web/public${layer.assetUrl}`),-layer.width/2,-layer.height/2,layer.width,layer.height);ctx.restore();}
 }
 return [{x:1200,y:400},{x:45,y:1000}].map(point=>({...point,rgb:[...ctx.getImageData(point.x,point.y,1,1).data].slice(0,3),tolerance:25}));
}

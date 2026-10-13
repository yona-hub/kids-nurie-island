import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {backgrounds,frames} from '../tools/asset-pipeline/scenes.mjs';
import {publishRevision} from '../tools/asset-pipeline/revisions.mjs';
import {motifSubjects,landscapeSubjects} from './storybook-asset-specs.mjs';

const root=path.resolve('apps/web/public/content'),out='content/storybook-generated/compiled';
const pretty=x=>JSON.stringify(x,null,2)+'\n';
const manifest=JSON.parse(await fs.readFile('content/storybook-generated/manifest.json','utf8'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/meiryo.ttc','Review Japanese');
await fs.mkdir(path.join(root,'decor'),{recursive:true});
const urls={},images={},sizes={},published=[];
for(const id of [...Object.keys(motifSubjects),...Object.keys(landscapeSubjects)]){
 const a=manifest.assets.find(x=>x.id===id);if(!a)throw Error(`個別生成した素材がありません: ${id}`);
 const original=await fs.readFile(a.originalFile);
 if(createHash('sha256').update(original).digest('hex')!==a.sha256)throw Error(`生成原画のhash不一致: ${id}`);
 const alpha=await sharp(original).ensureAlpha().stats();
 if(alpha.channels[3].min!==0||alpha.channels[3].max<32)throw Error(`透明背景を確認できません: ${id}`);
 const bytes=await sharp(original).trim({threshold:18}).resize({width:id in motifSubjects?512:1024,height:id in motifSubjects?512:1024,fit:'inside',withoutEnlargement:true}).png().toBuffer();
 const hash=createHash('sha256').update(bytes).digest('hex');
 urls[id]=`/content/decor/${id}.${hash}.png`;await fs.writeFile(path.join(root,'decor',`${id}.${hash}.png`),bytes);
 const m=await sharp(bytes).metadata();sizes[id]={width:m.width,height:m.height};images[id]=await loadImage(bytes);
 published.push({id,url:urls[id],sha256:hash,sourceSha256:a.sha256,width:m.width,height:m.height});
}
const layer=(id,x,y,width,{rotation=0,opacity=1}={})=>({assetUrl:urls[id],x,y,width,height:width*sizes[id].height/sizes[id].width,rotation,opacity});
const borderMotif=(id,cx,cy,extent,rotation,opacity)=>{
 const ratio=sizes[id].height/sizes[id].width,angle=rotation*Math.PI/180;
 const width=extent/Math.max(Math.abs(Math.cos(angle))+ratio*Math.abs(Math.sin(angle)),Math.abs(Math.sin(angle))+ratio*Math.abs(Math.cos(angle)));
 return layer(id,cx-width/2,cy-width*ratio/2,width,{rotation,opacity});
};
const bgLayouts={
 'sky-island':['#f1faff',layer('cloud',40,130,430,{opacity:.35}),layer('cloud',1260,390,380,{opacity:.30}),layer('floating-ground',-60,1640,1720,{opacity:.42})],
 'flower-meadow':['#fffdf3',layer('grass-cluster',-150,1580,670,{opacity:.46}),layer('flower-cluster',-50,1760,480,{opacity:.70}),layer('flower-cluster',1180,1660,500,{opacity:.65}),layer('leaf',1410,240,190,{opacity:.28,rotation:25})],
 'sunset-sea':['#fff5ef',layer('sea-surface',-150,1590,1900,{opacity:.48}),layer('cloud',30,280,460,{opacity:.35}),layer('shell',1410,1800,150,{opacity:.48})],
 'starry-sky':['#f5f2fc',layer('moon',1300,150,210,{opacity:.43}),layer('star',80,150,120,{opacity:.43}),layer('star',1450,1030,90,{opacity:.35}),layer('cloud',-50,1720,620,{opacity:.28})],
 'forest-clearing':['#f7fbf0',layer('distant-tree',-340,560,660,{opacity:.40}),layer('distant-tree',1300,650,660,{opacity:.37}),layer('grass-cluster',-40,1730,590,{opacity:.48}),layer('grass-cluster',1100,1760,590,{opacity:.45})],
 'future-city':['#f1f9fc',layer('future-city',-60,1480,1740,{opacity:.36}),layer('cloud',80,210,400,{opacity:.32}),layer('gear',1420,350,130,{opacity:.23})],
 'underwater':['#eefbfd',layer('sea-surface',-50,-240,1730,{opacity:.18}),layer('seaweed',-130,1310,370,{opacity:.55}),layer('coral',1300,1650,430,{opacity:.62}),layer('shell',60,1810,150,{opacity:.54}),layer('drop',1410,450,90,{opacity:.30})],
 'outer-space':['#f4f3fc',layer('planet',1280,230,320,{opacity:.43,rotation:-12}),layer('star',70,220,90,{opacity:.38}),layer('star',1440,1410,110,{opacity:.38}),layer('cloud',-130,1810,620,{opacity:.18})],
 'castle-garden':['#fff8f6',layer('castle-tower',-130,760,430,{opacity:.34}),layer('castle-tower',1370,570,390,{opacity:.30}),layer('grass-cluster',-120,1650,720,{opacity:.38}),layer('flower-cluster',1220,1750,420,{opacity:.63}),layer('flower-cluster',-60,1770,390,{opacity:.55})],
 'planet-surface':['#faf4fb',layer('planet',1280,150,270,{opacity:.33}),layer('rock-cluster',-100,1700,570,{opacity:.52}),layer('rock-cluster',1210,1740,470,{opacity:.48}),layer('star',60,490,85,{opacity:.27})],
};
const frameKinds={
 'simple-white':['dot'],'color-dots':['dot'],'color-drops':['drop'],'rainbow-clouds':['rainbow','cloud'],'little-stars':['star'],'gentle-waves':['wave'],'crayons':['crayon'],'pencils':['pencil'],
 'royal-jewels':['crown','gem'],'magic-night':['moon','star'],'forest-paws':['paw','leaf'],'ocean-shells':['shell','wave'],'dino-fossils':['bone','leaf'],'happy-road':['tire','road'],'work-zone':['cone','road'],'robot-circuit':['gear','circuit'],'space-orbit':['planet','star'],'sweet-fruit':['fruit','candy'],'flower-leaves':['flower','leaf'],'toy-box':['block','ball'],
};
const framePalette={'royal-jewels':'#ebc8c3','magic-night':'#dad1ee','forest-paws':'#c9dfc5','ocean-shells':'#bfdee9','dino-fossils':'#d3dfc4','work-zone':'#edd5b3','flower-leaves':'#edcbd6','space-orbit':'#d5cfea'};
const catalogs={};
for(const [kind,items]of [['backgrounds',backgrounds],['frames',frames]]){
 const old=JSON.parse(await fs.readFile(path.join(root,`${kind}.json`),'utf8'));
 const original=old.filter(x=>!x.compositionUrl);
 await fs.writeFile(`${out}/legacy-${kind}.json`,pretty(original));
 const next=[];
 for(const item of items){
  if(item.id==='white'||item.id==='none'){const previous=original.find(x=>x.id===item.id);if(!previous)throw Error(`共通素材がありません: ${item.id}`);next.push({...previous,catalogVisible:true});continue;}
  const id=`${item.id}-storybook-v1`;
  let composition;
  if(kind==='backgrounds') {const [baseColor,...layers]=bgLayouts[item.id];composition={schemaVersion:1,width:1600,height:2000,baseColor,layers};}
  else{
   const kinds=frameKinds[item.id],layers=[];
   if(item.id!=='simple-white'){
    // Each theme has its own rhythm, corner emphasis and orientation. Side pieces
    // stay in the outside 75 logical pixels, away from faces, hair and hands.
    const variant=frames.findIndex(x=>x.id===item.id)%4;
    for(let i=0;i<6;i++){
     const extent=76+(i+variant)%3*6,x=95+i*280+(i%2?10:0);
     layers.push(borderMotif(kinds[(i+variant)%kinds.length],x,50,extent,(i%2?-1:1)*(5+variant*3),.90));
     layers.push(borderMotif(kinds[(i+1+variant)%kinds.length],x,1950,extent,(i%2?1:-1)*(8+variant*3),.91));
    }
    for(let i=0;i<4;i++){
     const motif=kinds[(i+variant)%kinds.length];
     layers.push(borderMotif(motif,45,400+i*360,78,-13+variant*5,.77));
     layers.push(borderMotif(motif,1555,470+i*360,78,12-variant*3,.78));
    }
   }
   composition={schemaVersion:1,width:1600,height:2000,borderColor:framePalette[item.id]??'#cfe4e7',layers};
  }
  const compositionUrl=await publishRevision(root,kind,id,'json',pretty(composition));
  const canvas=createCanvas(320,400),ctx=canvas.getContext('2d');ctx.scale(.2,.2);
  if(composition.baseColor){ctx.fillStyle=composition.baseColor;ctx.fillRect(0,0,1600,2000);}
  if(composition.borderColor){ctx.strokeStyle=composition.borderColor;ctx.lineWidth=12;ctx.strokeRect(25,25,1550,1950);}
  for(const l of composition.layers){const asset=published.find(x=>x.url===l.assetUrl);ctx.save();ctx.globalAlpha=l.opacity;ctx.translate(l.x+l.width/2,l.y+l.height/2);ctx.rotate(l.rotation*Math.PI/180);ctx.drawImage(images[asset.id],-l.width/2,-l.height/2,l.width,l.height);ctx.restore();}
  const assetUrl=await publishRevision(root,kind,id,'png',canvas.toBuffer('image/png'));
  next.push({id,name:item.name,...(item.themeId?{themeId:item.themeId}:{}),assetUrl,thumbnailUrl:assetUrl,compositionUrl,catalogVisible:true,legacyId:item.id});
 }
 catalogs[kind]=next;
 const legacy=original.filter(x=>x.id!=='white'&&x.id!=='none').map(x=>({...x,catalogVisible:false}));
 await fs.writeFile(path.join(root,`${kind}.json`),pretty([...next,...legacy]));
}
await fs.writeFile(`${out}/decor-assets.json`,pretty({assets:published,backgrounds:catalogs.backgrounds,frames:catalogs.frames,tool:'built-in image_gen',humanVisualAcceptance:'pending'}));
const sheet=createCanvas(1600,1600),ctx=sheet.getContext('2d');ctx.fillStyle='#eef5f6';ctx.fillRect(0,0,1600,1600);ctx.font='17px "Review Japanese"';
const all=[...catalogs.backgrounds,...catalogs.frames];
for(let i=0;i<all.length;i++){const x=i%8*200,y=Math.floor(i/8)*400;ctx.fillStyle='#fff';ctx.fillRect(x+8,y+8,184,350);ctx.drawImage(await loadImage(path.join(root,all[i].assetUrl.slice('/content/'.length))),x+8,y+8,184,230);ctx.fillStyle='#3b6270';ctx.fillText(all[i].name,x+12,y+270,176);}
await fs.writeFile(`${out}/scenes-review.png`,sheet.toBuffer('image/png'));
console.log(JSON.stringify({generatedParts:published.length,backgrounds:catalogs.backgrounds.length,frames:catalogs.frames.length,legacyRetained:true,humanVisualAcceptance:'pending'}));

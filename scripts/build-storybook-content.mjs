import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import {Path2D, PathOp, createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {groupsByTheme,eyesByTheme,regionId} from '../tools/asset-pipeline/storybook-groups.mjs';
import {templateSvg,templateHash} from '../tools/asset-pipeline/build.mjs';
import {publishRevision} from '../tools/asset-pipeline/revisions.mjs';

const root=path.resolve('.'),publicRoot=path.join(root,'apps/web/public/content');
const out='content/storybook-generated/compiled';
await fs.mkdir(out,{recursive:true});
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const pretty=x=>JSON.stringify(x,null,2)+'\n';
GlobalFonts.registerFromPath('C:/Windows/Fonts/meiryo.ttc','Review Japanese');
const authoredShading={
 princess:{'髪全体':{kind:'hair',curves:[[.33,.09,.13,.28,.38,.40,.12,.77],[.63,.16,.98,.36,.73,.60,.84,.90],[.20,.24,.41,.22,.58,.18,.68,.05]]},'ドレスの上':{kind:'fabric',curves:[[.18,.04,.20,.30,.21,.65,.32,.96],[.72,.03,.75,.33,.63,.65,.65,.97]]},'スカート':{kind:'fabric',curves:[[.26,.03,.27,.33,.12,.64,.09,.98],[.52,.03,.43,.35,.43,.67,.45,.98],[.76,.05,.80,.32,.91,.73,.94,.98]]}},
 magic:{'髪全体':{kind:'hair',curves:[[.05,.4,.35,.2,.65,.3,.8,.1],[.6,.1,.65,.5,.85,.4,.95,.8]]},'帽子':{kind:'fabric',curves:[[.35,.02,.30,.35,.50,.46,.80,.57]]},'マントと袖':{kind:'fabric',curves:[[.52,.03,.47,.33,.27,.51,.06,.98],[.54,.02,.58,.24,.64,.53,.70,.97],[.56,.08,.70,.20,.90,.14,.94,.32]]}},
};
const manifest=await read('content/storybook-generated/manifest.json');
await fs.mkdir(path.join(publicRoot,'media'),{recursive:true});
const media={};
for(const [name,key] of [['paper','paper'],['wax','wax'],['pencil-strokes','pencil'],['iris','iris']]) {
 const asset=manifest.assets.find(x=>x.id===name);if(!asset)throw Error(`生成した画材がありません: ${name}`);
 const original=await fs.readFile(asset.originalFile);
 if(createHash('sha256').update(original).digest('hex')!==asset.sha256)throw Error(`画材原画のhash不一致: ${name}`);
 const {data,info}=await sharp(original).resize(512,512).greyscale().raw().toBuffer({resolveWithObject:true});
 const rgba=Buffer.alloc(512*512*4);
 for(let i=0;i<512*512;i++) {
  const light=data[i*info.channels]/255;
  // White paper showing through pigment. Keep the original physical distribution.
  const grain=Math.max(0,Math.min(1,(light-.12)/.78));
  const alpha=key==='paper'?(1-light)*0.22:key==='wax'?Math.pow(grain,1.35)*.96:.035+Math.pow(grain,1.45)*.83;
  rgba[i*4]=rgba[i*4+1]=rgba[i*4+2]=255;rgba[i*4+3]=Math.round(Math.min(0.9,alpha)*255);
 }
 const bytes=key==='iris'?await sharp(original).resize(512,512).greyscale().png().toBuffer():await sharp(rgba,{raw:{width:512,height:512,channels:4}}).png().toBuffer();
 const hash=createHash('sha256').update(bytes).digest('hex'),url=`/content/media/${key}.${hash}.png`;
 await fs.writeFile(path.join(publicRoot,url.slice('/content/'.length)),bytes);
 media[key]=url;
}
const adoption=await read('content/generated-lineart/user-adoption.json');
const oldCatalog=await read('apps/web/public/content/catalog.json');
const legacyCatalog=oldCatalog.filter(x=>!x.id.endsWith('-storybook-v1'));
if(legacyCatalog.length)await fs.writeFile(`${out}/legacy-catalog.json`,pretty(legacyCatalog));
const reports=[],catalog=[];
const bounds=p=>{const b=new Path2D(p).computeTightBounds();return {x:b[0],y:b[1],width:b[2]-b[0],height:b[3]-b[1]};};
const smooth=p=>new Path2D(p).round(2.2).simplify().toSVGString();
// Measure the adopted eye's own axes. No face/animal grouping is inferred here.
const eyeGeometry=p=>{
 const shape=new Path2D(p),b=bounds(p),ctx=createCanvas(1,1).getContext('2d'),points=[];
 for(let j=0;j<40;j++)for(let i=0;i<40;i++){const x=b.x+b.width*(i+.5)/40,y=b.y+b.height*(j+.5)/40;if(ctx.isPointInPath(shape,x,y))points.push([x,y]);}
 if(points.length<8)throw Error('瞳の向きを測定できません');
 const cx=points.reduce((v,p)=>v+p[0],0)/points.length,cy=points.reduce((v,p)=>v+p[1],0)/points.length;
 let xx=0,xy=0,yy=0;for(const [x,y]of points){xx+=(x-cx)**2;xy+=(x-cx)*(y-cy);yy+=(y-cy)**2;}
 let rotation=.5*Math.atan2(2*xy,xx-yy)-Math.PI/2;while(rotation<-Math.PI/2)rotation+=Math.PI;while(rotation>Math.PI/2)rotation-=Math.PI;
 if(Math.hypot(xx-yy,2*xy)/(xx+yy)<.08)rotation=0;
 const values=p.match(/[-+]?\d*\.?\d+/g).map(Number),c=Math.cos(rotation),s=Math.sin(rotation),u=[],v=[];
 for(let i=0;i<values.length;i+=2){u.push((values[i]-cx)*c+(values[i+1]-cy)*s);v.push(-(values[i]-cx)*s+(values[i+1]-cy)*c);}
 const loU=Math.min(...u),hiU=Math.max(...u),loV=Math.min(...v),hiV=Math.max(...v),midU=(loU+hiU)/2,midV=(loV+hiV)/2;
 return {cx:cx+midU*c-midV*s,cy:cy+midU*s+midV*c,width:hiU-loU,height:hiV-loV,rotation};
};
const lineartSvg=t=>{
 const guides=t.paintingProfile.eyes.map((eye,i)=>{
  const r=t.regions.find(r=>r.id===eye.regionId),g=eye.geometry,{cx,cy,width:w,height:h,rotation}=g,x=cx-w/2,y=cy-h/2;
  const ellipse=(a,b,rx,ry)=>`<ellipse cx="${x+w*a}" cy="${y+h*b}" rx="${w*rx}" ry="${h*ry}"/>`;
  const lx=.43+.23*Math.cos(-.85-rotation),ly=.43+.21*Math.sin(-.85-rotation);
  return `<defs><clipPath id="eye-guide-${i}"><path d="${r.path}"/></clipPath></defs><g clip-path="url(#eye-guide-${i})"><g transform="rotate(${rotation*180/Math.PI} ${cx} ${cy})" fill="none" stroke="#000" stroke-width="${Math.max(2.5,w*.028)}">${ellipse(.40,.42,.19,.225)}<g fill="white">${ellipse(lx,ly,.090,.073)}${ellipse(lx+.055,ly+.075,.035,.028)}</g></g></g>`;
 }).join('');
 return templateSvg(t).replace('</svg>',`${guides}</svg>`);
};
// Raster contours can start with a highlight hole. Choose the enclosing contour
// by its geometric extent, never by source serialization order.
const irisContour=(iris,highlight)=>{
 // All adopted iris masks are traced polygons. Their holes can either be
 // separate contours or open notches joining the highlight to the outer rim.
 // Rebuild a convex iris envelope from both, retaining the original oval tilt.
 const points=[iris,highlight].flatMap(p=>{
  if(/[^MLZ\s\d.,+-]/i.test(p))throw Error('瞳の元輪郭形式を確認してください');
  const values=p.match(/[-+]?\d*\.?\d+/g).map(Number);return Array.from({length:values.length/2},(_,i)=>[values[i*2],values[i*2+1]]);
 }).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lower=[],upper=[];for(const p of points){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of [...points].reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 const hull=[...lower.slice(0,-1),...upper.slice(0,-1)];if(hull.length<3)throw Error('瞳の形が閉じません');return `M${hull.map(p=>p.join(' ')).join('L')}Z`;
};
for(const item of adoption.templates) {
 const source=await read(`content/generated-lineart/compiled/${item.id}/template.json`);
 const old=await read(`apps/web/public/content/templates/${item.id}.json`);
 if(templateHash(old)!==item.contentHash)throw Error(`旧採用内容のhash不一致: ${item.id}`);
 if(createHash('sha256').update(await fs.readFile(item.originalFile)).digest('hex')!==item.originalSha256)throw Error(`旧採用原画のhash不一致: ${item.id}`);
 if(JSON.stringify(source.regions.map(({id,path})=>({id,path})))!==JSON.stringify(old.regions.map(({id,path})=>({id,path})))||JSON.stringify(source.details)!==JSON.stringify(old.details))throw Error(`旧採用領域の不一致: ${item.id}`);
 const id=`${item.id}-storybook-v1`,eyes=(eyesByTheme[source.themeId]??[]).map(([a,b,owner])=>({regionId:regionId(a),highlightId:regionId(b),owner}));
 const automatic=new Set(eyes.map(x=>x.highlightId)),eyeIds=new Set(eyes.map(x=>x.regionId));
 const irises=new Map(eyes.map(eye=>[eye.regionId,irisContour(old.regions.find(r=>r.id===eye.regionId).path,old.regions.find(r=>r.id===eye.highlightId).path)]));
 const sourceIrises=new Map(irises),eyeTransforms=new Map();
 // Authored revision: retain each opening's position/tilt and widen the four
 // princess-sheet eyes to the friendly proportions in the home illustration.
 for(const eye of eyes){
  const g=eyeGeometry(irises.get(eye.regionId));
  const minimumRatio=source.themeId==='princess'?(eye.owner==='princess'?.86:.82):0;
  const factor=Math.max(1,g.height*minimumRatio/g.width),c=Math.cos(g.rotation),s=Math.sin(g.rotation),a=1+(factor-1)*c*c,b=(factor-1)*c*s,d=1+(factor-1)*s*s;
  const transform={a,b,c:b,d,e:g.cx-a*g.cx-b*g.cy,f:g.cy-b*g.cx-d*g.cy};
  eyeTransforms.set(eye.regionId,transform);irises.set(eye.regionId,new Path2D(irises.get(eye.regionId)).transform(transform).toSVGString());
  eye.geometry={...g,width:g.width*factor};
 }
 const regions=old.regions.map(r=>{
  const path= smooth(eyeIds.has(r.id)?irises.get(r.id):r.path);
  // Extend coverage under the opaque ink, never create a visible extra stroke.
  const covered=automatic.has(r.id)?path:new Path2D(path).op(new Path2D(path).stroke({width:1.5}),PathOp.Union).toSVGString();
  return {...r,path:covered,bounds:bounds(covered)};
 });
 const ink=new Path2D(source.details.filter(x=>x.fill==='#000000').map(x=>x.path).join(' ')),scale=2,spec=[];
 const inkDir=path.join(out,'ink',id);await fs.mkdir(inkDir,{recursive:true});
 const general=createCanvas(1600*scale,2000*scale),gc=general.getContext('2d');gc.scale(scale,scale);gc.fillStyle='#000';gc.fill(ink);
 for(const eye of eyes){
  const original=sourceIrises.get(eye.regionId),area=new Path2D(original).op(new Path2D(original).stroke({width:15}),PathOp.Union),b=bounds(area.toSVGString()),x=Math.floor(b.x)-2,y=Math.floor(b.y)-2;
  const c=createCanvas(Math.ceil(b.width+4)*scale,Math.ceil(b.height+4)*scale),ctx=c.getContext('2d');ctx.scale(scale,scale);ctx.translate(-x,-y);ctx.clip(area);ctx.fillStyle='#000';ctx.fill(ink);ctx.globalCompositeOperation='destination-out';ctx.fill(new Path2D(original));
  const file=path.join(inkDir,`${eye.regionId}.png`);await fs.writeFile(file,c.toBuffer('image/png'));spec.push({file,x,y,scale});
  gc.globalCompositeOperation='destination-out';gc.fill(area);
 }
 const generalFile=path.join(inkDir,'general.png');await fs.writeFile(generalFile,general.toBuffer('image/png'));spec.unshift({file:generalFile,x:0,y:0,scale});
 const input=path.join(inkDir,'trace-input.json'),output=path.join(inkDir,'trace-output.json');await fs.writeFile(input,pretty(spec));
 const traced=spawnSync('C:/Users/yonaf/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',['tools/asset-pipeline/trace_storybook_ink.py',input,output],{encoding:'utf8',windowsHide:true});if(traced.status!==0)throw Error(`輪郭の分離に失敗: ${traced.stderr}`);
 const paths=await read(output),eyeDetails=eyes.map((eye,i)=>{const r=paths[i+1],p=new Path2D(r.path).transform({a:1,b:0,c:0,d:1,e:r.x,f:r.y}).transform(eyeTransforms.get(eye.regionId));const result=p.round(2.2).simplify().toSVGString(),b=bounds(result),g=eye.geometry;if(b.width>g.width+40||b.height>g.height+40)throw Error(`目の輪郭が範囲外: ${id}/${eye.regionId}`);return {path:result,fill:'#000000',strokeWidth:0,eyeRegionId:eye.regionId};});
 const details=[...source.details.filter(x=>x.fill!=='#000000').map(x=>({...x,path:smooth(x.path)})),{path:smooth(paths[0].path),fill:'#000000',strokeWidth:0},...eyeDetails];
 const groups=[],seen=new Set();
 const add=(name,ids,direction=100)=>{
  if(ids.some(key=>seen.has(key)||automatic.has(key)||!regions.some(r=>r.id===key)))throw Error(`重複/不正なグループ: ${id}/${name}`);
  ids.forEach(key=>seen.add(key));
  const rs=ids.map(key=>regions.find(r=>r.id===key));
  const x=Math.min(...rs.map(r=>r.bounds.x)),y=Math.min(...rs.map(r=>r.bounds.y));
  const right=Math.max(...rs.map(r=>r.bounds.x+r.bounds.width)),bottom=Math.max(...rs.map(r=>r.bounds.y+r.bounds.height));
  const shading=authoredShading[source.themeId]?.[name];
  groups.push({id:`g${groups.length+1}`,name,regionIds:ids,bounds:{x,y,width:right-x,height:bottom-y},direction,...(shading?{shading}:{})});
 };
 for(const [name,numbers,direction]of groupsByTheme[source.themeId]??[])add(name,numbers.map(regionId),direction);
 const ownerNames={princess:'おひめさま',bunny:'うさぎ',boy:'魔法使い',dog:'いぬ',cat:'ねこ',dolphin:'イルカ',turtle:'カメ',fish:'さかな',dinosaur:'きょうりゅう',excavator:'ショベルカー',robot:'ロボット',astronaut:'宇宙飛行士'};
 for(const owner of [...new Set(eyes.map(x=>x.owner))])add(`${ownerNames[owner]??owner}の目`,eyes.filter(x=>x.owner===owner).map(x=>x.regionId));
 for(const r of regions)if(!seen.has(r.id)&&!automatic.has(r.id))add(r.name,[r.id],r.direction);
 const paintingProfile={version:2,eyeStyle:'storybook-v2',groups,eyes,upgradeFrom:item.id,regionMap:Object.fromEntries(regions.map(r=>[r.id,r.id])),mediumAssets:media};
 const t={...old,id,approved:true,regions,details,paintingProfile};
 const svg=lineartSvg(t),contentHash=templateHash(t);
 const thumbnailUrl=await publishRevision(publicRoot,'templates',id,'svg',svg);
 const assetUrl=await publishRevision(publicRoot,'templates',id,'json',pretty(t));
 await fs.writeFile(path.join(publicRoot,'templates',`${id}.json`),pretty(t));
 await fs.writeFile(path.join(publicRoot,'templates',`${id}.svg`),svg);
 await fs.writeFile(`${out}/${id}.json`,pretty(t));
 const review={schemaVersion:1,templateId:id,regions:{},approval:{kind:'author-technical',reviewer:'Codex asset author',recordedAt:new Date().toISOString(),contentHash,basis:'User-directed storybook revision. Source-derived curved masks and authored grouping; human visual acceptance remains pending.'}};
 await fs.writeFile(`content/templates/reviews/${id}.json`,pretty(review));
 const qa={templateId:id,pass:false,contentHash,regionCount:regions.length,groupCount:groups.length,eyes:eyes.length,sourceTemplateId:item.id,sourceOriginalSha256:item.originalSha256,approval:review.approval,errors:[],status:'pending technical and human visual verification'};
 await fs.writeFile(`content/qa/${id}.json`,pretty(qa));
 reports.push(qa);
 catalog.push({id,themeId:t.themeId,title:t.title,defaultColorFamily:t.defaultColorFamily,regionCount:t.regions.length,assetUrl,thumbnailUrl,coloredThumbnailUrl:thumbnailUrl});
}
await fs.writeFile(path.join(publicRoot,'catalog.json'),pretty(catalog));
await fs.writeFile(`${out}/upgrade-index.json`,pretty(Object.fromEntries(reports.map(x=>[x.sourceTemplateId,x.templateId]))));
await fs.writeFile(path.join(publicRoot,'upgrade-index.json'),pretty(Object.fromEntries(reports.map(x=>[x.sourceTemplateId,x.templateId]))));
await fs.writeFile(`${out}/technical-report.json`,pretty({recordedAt:new Date().toISOString(),reports,status:'pending verification'}));
// Concrete white/black candidate sheet; no automatic human adoption.
const canvas=createCanvas(1600,1000),ctx=canvas.getContext('2d');ctx.fillStyle='#edf6f6';ctx.fillRect(0,0,1600,1000);
const {loadImage}=await import('@napi-rs/canvas');
for(let i=0;i<catalog.length;i++){const t=await read(`${out}/${catalog[i].id}.json`);ctx.fillStyle='#fff';ctx.fillRect(i%5*320+12,Math.floor(i/5)*500+12,296,440);ctx.drawImage(await loadImage(Buffer.from(lineartSvg(t))),i%5*320+12,Math.floor(i/5)*500+12,296,370);ctx.fillStyle='#345563';ctx.font='16px "Review Japanese"';ctx.fillText(t.title,i%5*320+20,Math.floor(i/5)*500+405,275);ctx.fillText(`${t.paintingProfile.groups.length} グループ`,i%5*320+20,Math.floor(i/5)*500+431);}
await fs.writeFile(`${out}/lineart-review.png`,canvas.toBuffer('image/png'));
console.log(JSON.stringify({templates:catalog.length,groups:reports.reduce((n,x)=>n+x.groupCount,0),eyes:reports.reduce((n,x)=>n+x.eyes,0),humanApproval:'pending'},null,2));

import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {createCanvas,Path2D,loadImage} from '@napi-rs/canvas';

const root=process.env.SMOOTH_EVIDENCE_OUTPUT??'test-results/smooth-home-i33/revision-1',out=`${root}/native-zoom`;await fs.mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false}});
const catalog=await read('apps/web/public/content/catalog.json'),palettes=await read(`${root}/before/evidence.json`),evidence=[];
const sheet=createCanvas(800,20*120),sheetCtx=sheet.getContext('2d');sheetCtx.fillStyle='#eff6f6';sheetCtx.fillRect(0,0,sheet.width,sheet.height);let eyeRow=0;
try{
 const {ColoringEngine}=await server.ssrLoadModule('/packages/coloring-engine/src/index.ts');
 for(const e of catalog){
  const t=await read('apps/web/public'+e.assetUrl),palette=palettes.find(p=>p.theme===t.themeId).palette;
  const media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile.mediumAssets).map(async([n,u])=>[n,await loadImage('apps/web/public'+u)])));
  const paints=Object.fromEntries(t.paintingProfile.groups.flatMap(g=>g.regionIds.map(r=>[r,{color:palette[g.id],paintType:'smooth'}])));
  const canvas=createCanvas(320,400),engine=new ColoringEngine(canvas,{createCanvas,createPath:p=>new Path2D(p)});engine.loadTemplate(t,paints);engine.setMediumImages(media);
  const target=t.paintingProfile.eyes[0]?.geometry??{cx:800,cy:1000};
  const shots=[];
  for(const dpr of [1,2,3])for(const zoom of [1,2,4]){
   const view={scale:zoom,x:zoom===1?0:160-target.cx*.2*zoom+.37,y:zoom===1?0:175-target.cy*.2*zoom+.23};
   engine.resize(320,400,dpr);engine.setViewport(view);
   assert.equal(canvas.width,320*dpr);assert.equal(canvas.height,400*dpr);assert(engine.getMetrics().cacheBytes<=32*1024*1024);
   const mask=createCanvas(canvas.width,canvas.height),mc=mask.getContext('2d');mc.setTransform(.2*dpr*zoom,0,0,.2*dpr*zoom,view.x*dpr,view.y*dpr);mc.fill(new Path2D(t.paintingProfile.opaquePath));for(const region of t.regions)mc.fill(new Path2D(region.path),region.fillRule??'nonzero');for(const detail of t.details.filter(d=>d.fill==='#000000'))mc.fill(new Path2D(detail.path));const repair=t.paintingProfile.smoothArtwork.surfaceFields?.repairSilhouettePath;if(repair)mc.fill(new Path2D(repair),'evenodd');
   const m=mc.getImageData(0,0,canvas.width,canvas.height).data,a=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let outside=0,interior=0,visibleInterior=0;const firstOutside=[];
   for(let p=0;p<m.length;p+=4)if(m[p+3]===255){interior++;if(Math.min(a[p],a[p+1],a[p+2])<250)visibleInterior++;}
   assert(interior>0&&visibleInterior>interior*.1,`${t.id}: painted drawing must remain visible`);
   for(let p=0;p<m.length;p+=4)if(!m[p+3]&&(a[p]!==255||a[p+1]!==255||a[p+2]!==255)){outside++;if(firstOutside.length<12)firstOutside.push({x:p/4%canvas.width,y:Math.floor(p/4/canvas.width),rgb:[...a.slice(p,p+3)]});}
   mask.width=mask.height=1;
   const file=`${t.themeId}-z${zoom}-dpr${dpr}.png`,bytes=canvas.toBuffer('image/png');await fs.writeFile(`${out}/${file}`,bytes);shots.push({file,dpr,zoom,sha256:sha(bytes),width:canvas.width,height:canvas.height,outsideContourPixels:outside,visibleInteriorRatio:visibleInterior/interior});
   if(outside){await fs.writeFile(`${out}/contour-failure-${t.themeId}-z${zoom}-dpr${dpr}.json`,JSON.stringify({outside,firstOutside},null,2));assert.equal(outside,0,`${t.id}: outside authored contour`);}
  }
  engine.resize(640,800,1);engine.setViewport({scale:1,x:0,y:0});const direct=engine.renderSnapshot(640),a=canvas.getContext('2d').getImageData(0,0,640,800).data,b=direct.getContext('2d').getImageData(0,0,640,800).data;
  let seam=0,seamSamples=0,adjacent=0,adjacentSamples=0,other=0,otherSamples=0;
  for(let y=0;y<800;y++)for(let x=0;x<640;x++){const i=(y*640+x)*4,d=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);if(Math.abs(x-512)<=1||Math.abs(y-512)<=1){seam+=d;seamSamples+=3;}else if(Math.abs(x-512)<=4||Math.abs(y-512)<=4){adjacent+=d;adjacentSamples+=3;}else{other+=d;otherSamples+=3;}}
  const equivalence={seamAverage:seam/seamSamples,adjacentAverage:adjacent/adjacentSamples,otherAverage:other/otherSamples};
  await fs.writeFile(`${out}/${t.themeId}-equivalence.json`,JSON.stringify(equivalence,null,2));
  if(equivalence.otherAverage>=.5){await fs.writeFile(`${out}/${t.themeId}-tiled.png`,canvas.toBuffer('image/png'));await fs.writeFile(`${out}/${t.themeId}-direct.png`,direct.toBuffer('image/png'));}
  assert(equivalence.seamAverage<Math.max(.4,equivalence.adjacentAverage*2),`${t.id}: tile seam`);assert(equivalence.otherAverage<.5,`${t.id}: snapshot equivalence`);direct.width=direct.height=1;
  const eyes=[];
  for(const [column,color]of ['#000000','#8F542E','#2598FF','#E74A91','#FFF4BF'].entries()){
   engine.setScene({regions:{...paints,...Object.fromEntries(t.paintingProfile.eyes.map(e=>[e.regionId,{color,paintType:'smooth'}]))}});const shot=engine.renderSnapshot(1600),ctx=shot.getContext('2d');
   for(const [index,eye]of t.paintingProfile.eyes.entries()){
    const finished=t.paintingProfile.smoothArtwork.eyes?.find(f=>f.regionId===eye.regionId),reflection=new Path2D(eye.artwork.reflections[0].path).computeTightBounds();
    const rx=Math.round(finished?.reflectionCenters[0].x??(reflection[0]+reflection[2])/2),ry=Math.round(finished?.reflectionCenters[0].y??(reflection[1]+reflection[3])/2),p=finished?.pupil??eye.artwork.pupil;
    const white=[...ctx.getImageData(rx,ry,1,1).data.slice(0,3)],pupil=[...ctx.getImageData(Math.round(p.cx),Math.round(p.cy),1,1).data.slice(0,3)];
    assert(Math.min(...white)>240,`${t.id}/${eye.regionId}/${color}: reflection`);assert(Math.max(...pupil)<48,`${t.id}/${eye.regionId}/${color}: pupil`);
    const b=t.regions.find(r=>r.id===eye.regionId).bounds;sheetCtx.drawImage(shot,b.x-12,b.y-12,b.width+24,b.height+24,column*160+35,(eyeRow+index)*120+8,100,100);sheetCtx.fillStyle='#345762';sheetCtx.font='10px sans-serif';sheetCtx.fillText(`${t.themeId}/${eye.regionId}`,column*160+2,(eyeRow+index)*120+118);eyes.push({region:eye.regionId,color,white,pupil});
   }
   if(t.themeId==='princess'){
    // Freely selected light/dark/cool pigments on the whole dress and hair.
    const chosen=column===0?'#000000':column===2?'#2598FF':column===4?'#FFFFFF':null;
    if(chosen){const groupIds=t.paintingProfile.groups.filter(g=>['g1','g3','g4'].includes(g.id)).flatMap(g=>g.regionIds);engine.paintMany(groupIds,{color:chosen,paintType:'smooth'});const sample=engine.renderSnapshot(640);await fs.writeFile(`${out}/princess-pigment-${chosen.slice(1)}.png`,sample.toBuffer('image/png'));sample.width=sample.height=1;}
   }
   shot.width=shot.height=1;
  }
  eyeRow+=t.paintingProfile.eyes.length;engine.dispose();evidence.push({templateId:t.id,shots,equivalence,eyes});console.log(JSON.stringify({theme:t.themeId,nativeStates:shots.length,equivalence,eyeColors:eyes.length}));
 }
 assert.equal(eyeRow,20);await fs.writeFile(`${out}/eyes-5-colors.png`,sheet.toBuffer('image/png'));await fs.writeFile(`${out}/evidence.json`,JSON.stringify(evidence,null,2)+'\n');
}finally{await server.close();}

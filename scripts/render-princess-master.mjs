import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {createCanvas,Path2D,loadImage,GlobalFonts} from '@napi-rs/canvas';

const out=process.env.PRINCESS_REVIEW_OUTPUT??'test-results/princess-master/native-r3';
await fs.mkdir(out,{recursive:true});
const bytes=await fs.readFile('apps/web/public/content/templates/gen-princess-bunny-v6-master-v3.json'),template=JSON.parse(bytes);
const sha=b=>createHash('sha256').update(b).digest('hex');
const media=Object.fromEntries(await Promise.all(Object.entries(template.paintingProfile.mediumAssets).map(async([name,url])=>[name,await loadImage(`apps/web/public${url}`)])));
const base={g1:'#A66134',g2:'#F2D7BD',g3:'#FF6AA3',g4:'#FF6AA3',g5:'#FFD42A',g6:'#F64C91',g7:'#FFF9EE',g8:'#FFB7D2',g9:'#7DE89A',g10:'#8F542E',g11:'#8F542E',g12:'#FFD42A',g13:'#FF847A',g14:'#FF8FBA',g15:'#FF847A'};
const palettes={reference:{...base,...Object.fromEntries(template.paintingProfile.formArtwork.groups.map(g=>[g.groupId,g.referenceColor]))},pink:base,blue:{...base,g1:'#133672',g3:'#7AC3FF',g4:'#7AC3FF',g5:'#B783FF',g10:'#2598FF'},white:{...base,g1:'#FFFFFF',g3:'#FFFFFF',g4:'#FFFFFF',g5:'#7AC3FF',g10:'#FFF4BF'},black:{...base,g1:'#000000',g3:'#211F24',g4:'#211F24',g5:'#FF6AA3',g10:'#000000'}};
const paintsFor=(palette,paintType='smooth')=>Object.fromEntries(template.paintingProfile.groups.flatMap(g=>g.regionIds.map(id=>[id,{color:palette[g.id],paintType}])));
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false}});
GlobalFonts.registerFromPath('C:/Windows/Fonts/meiryo.ttc','Review Japanese');
const evidence=[];
try{
  const {ColoringEngine}=await server.ssrLoadModule('/packages/coloring-engine/src/index.ts');
  const c=createCanvas(320,400),engine=new ColoringEngine(c,{createCanvas,createPath:p=>new Path2D(p)});
  engine.loadTemplate(template);engine.setMediumImages(media);
  const save=async(canvas,file,method)=>{const pixels=canvas.toBuffer('image/png');await fs.writeFile(`${out}/${file}`,pixels);evidence.push({file,sha256:sha(pixels),width:canvas.width,height:canvas.height,method});};
  const blank=engine.renderSnapshot(1600);await save(blank,'blank.png','shared engine unpainted snapshot 1600x2000');blank.width=blank.height=1;
  const paletteSheet=createCanvas(4*400,550),ps=paletteSheet.getContext('2d');ps.fillStyle='#edf5f6';ps.fillRect(0,0,1600,550);ps.font='18px "Review Japanese"';
  for(const [i,name]of ['pink','blue','white','black'].entries()){
    engine.setScene({regions:paintsFor(palettes[name])});
    const shot=engine.renderSnapshot(640);await save(shot,`${name}-640.png`,'shared engine snapshot; identical registered field, freely selected colors');ps.drawImage(shot,i*400+8,36,384,480);ps.fillStyle='#345762';ps.fillText({pink:'ピンクと茶色',blue:'青と水色',white:'白',black:'黒'}[name],i*400+20,25);shot.width=shot.height=1;
  }
  await save(paletteSheet,'color-comparison.png','four selected palettes; display-size comparison');
  const mediumSheet=createCanvas(1200,950),ms=mediumSheet.getContext('2d');ms.fillStyle='#edf5f6';ms.fillRect(0,0,1200,950);ms.font='18px "Review Japanese"';
  for(const [i,paintType]of ['smooth','crayon','pencil'].entries()){
    engine.setScene({regions:paintsFor(base,paintType)});
    const shot=engine.renderSnapshot(2048);await save(shot,`${paintType}-2048.png`,'actual shared 2048x2560 export raster');ms.drawImage(shot,i*400+8,36,384,480);ms.fillStyle='#345762';ms.fillText(['なめらか','クレヨン','いろえんぴつ'][i],i*400+20,25);
    // Exact export crop at 1:1 source pixels; not a browser zoom claim.
    ms.drawImage(shot,420,1250,360,380,i*400+20,550,360,380);shot.width=shot.height=1;
  }
  await save(mediumSheet,'three-media.png','fit-sized artwork plus 1:1 export crops');
  engine.setScene({regions:paintsFor(palettes.reference)});const reference=engine.renderSnapshot(1600);await save(reference,'reference-reconstruction.png','reference group pigment plus derived neutral lighting');reference.width=reference.height=1;
  engine.setScene({regions:paintsFor(base)});
  for(const dpr of [1,2,3])for(const zoom of [1,2,4]){
    engine.resize(320,400,dpr);engine.setViewport({scale:zoom,x:zoom===1?0:160-720*.2*zoom,y:zoom===1?0:155-565*.2*zoom});
    await save(c,`eyes-z${zoom}-dpr${dpr}.png`,'native viewport redraw, 320x400 CSS, eyes centered at zoom > 1');
  }
  const snapshot=engine.renderSnapshot(2048);await save(snapshot,'pink-2048.png','actual shared 2048x2560 export');snapshot.width=snapshot.height=1;
  await fs.writeFile(`${out}/evidence.json`,JSON.stringify({templateId:template.id,templateSha256:sha(bytes),media:Object.fromEntries(Object.entries(template.paintingProfile.mediumAssets).map(([key,url])=>[key,url])),palettes,evidence},null,2)+'\n');
  engine.dispose();console.log(JSON.stringify({images:evidence.length,output:out}));
}finally{await server.close();}

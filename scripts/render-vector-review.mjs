import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {createCanvas,Path2D,loadImage,GlobalFonts} from '@napi-rs/canvas';
const out=process.env.ISLAND_REVIEW_OUTPUT??'test-results/vector-improvement/native',sha=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(out,{recursive:true});
const catalog=JSON.parse(await fs.readFile('apps/web/public/content/catalog.json','utf8'));
const templates=await Promise.all(catalog.filter(t=>!process.env.ISLAND_REVIEW_THEME||t.themeId===process.env.ISLAND_REVIEW_THEME).map(t=>fs.readFile(`apps/web/public${t.assetUrl}`,'utf8').then(JSON.parse)));
const a=templates[0].paintingProfile.mediumAssets;
const [paper,wax,pencil,iris]=await Promise.all([a.paper,a.wax,a.pencil,a.iris].map(url=>loadImage(`apps/web/public${url}`)));
GlobalFonts.registerFromPath('C:/Windows/Fonts/meiryo.ttc','Review Japanese');
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false}}),evidence=[];
try{
 const {ColoringEngine}=await server.ssrLoadModule('/packages/coloring-engine/src/index.ts');
 for(const t of templates){
  const sheet=createCanvas(1200,1030),ctx=sheet.getContext('2d');ctx.fillStyle='#eef5f6';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='20px "Review Japanese"';
  for(const [index,paintType]of ['smooth','crayon','pencil'].entries()){
   const colors={skin:'#F2D7BD',hair:'#A66134',fur:'#FFC7DE',fabric:'#8445D8',metal:'#FFC400',glass:'#7AC3FF',plastic:'#7AC3FF',wood:'#BA7A4B',rubber:'#59616D',stone:'#B9BEC6'};
   const eyes=t.paintingProfile.eyes,paints=Object.fromEntries(t.regions.filter(r=>!eyes.some(e=>e.highlightId===r.id)).map(r=>[r.id,{color:eyes.some(e=>e.regionId===r.id)?'#8F542E':colors[r.material]??'#FFC400',paintType}]));
   const c=createCanvas(320,400),engine=new ColoringEngine(c,{createCanvas,createPath:p=>new Path2D(p)});engine.loadTemplate(t,paints);engine.setMediumImages({paper,wax,pencil,iris});
   const full=engine.renderSnapshot(640),bytes=full.toBuffer('image/png'),file=`${t.themeId}-${paintType}-640.png`;await fs.writeFile(`${out}/${file}`,bytes);
   ctx.fillStyle='#365865';ctx.fillText(['なめらか','クレヨン','いろえんぴつ'][index],index*400+40,28);ctx.drawImage(full,index*400+5,45,390,487.5);
   // The lower panel enlarges a source crop for texture inspection only.
   // Actual zoom/DPR quality is checked separately in rendered-browser evidence.
   const region=t.regions.find(r=>!eyes.some(e=>e.regionId===r.id||e.highlightId===r.id)&&r.bounds.width>160&&r.bounds.height>180);
   if(region){const b=region.bounds,x=Math.min(1200,b.x+30),y=Math.min(1500,b.y+30);ctx.drawImage(full,x*.4,y*.4,144,176,index*400+30,590,336,410.67);}
   evidence.push({templateId:t.id,templateContentHash:sha(await fs.readFile(`apps/web/public${catalog.find(c=>c.id===t.id).assetUrl}`)),paintType,file,sha256:sha(bytes),method:'shared engine renderSnapshot(640), fixed generated media and selected hue; lower panel is a crop enlarged for inspection'});
   engine.dispose();
  }
  await fs.writeFile(`${out}/${t.themeId}-three-media.png`,sheet.toBuffer('image/png'));
 }
 await fs.writeFile(`${out}/all-template-media-evidence.json`,JSON.stringify({evidence},null,2)+'\n');console.log(JSON.stringify({images:evidence.length,templates:templates.length}));
}finally{await server.close();}

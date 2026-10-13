import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {createCanvas,Path2D,loadImage} from '@napi-rs/canvas';

const root='test-results/princess-master/compatibility',output=process.env.PRINCESS_COMPATIBILITY_OUTPUT??root;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const record=process.argv.includes('--record');
await fs.mkdir(root,{recursive:true});
await fs.mkdir(output,{recursive:true});
let baseline;
if(record){
  try{await fs.access(`${root}/before.json`);throw Error('Existing compatibility baseline must be retained.');}catch(error){if(error.code!=='ENOENT')throw error;}
  const catalog=await read('apps/web/public/content/catalog.json');
  baseline={templates:catalog.map(entry=>({id:entry.id,url:entry.assetUrl})),pixels:[],sources:{}};
}else baseline=await read(`${root}/before.json`);
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false}});
try{
  const {ColoringEngine}=await server.ssrLoadModule('/packages/coloring-engine/src/index.ts');
  const pixels=[];
  for(const entry of baseline.templates){
    const bytes=await fs.readFile(`apps/web/public${entry.url}`),template=JSON.parse(bytes);
    const images=Object.fromEntries(await Promise.all(Object.entries(template.paintingProfile.mediumAssets).map(async([name,url])=>[name,await loadImage(`apps/web/public${url}`)])));
    for(const paintType of ['blank','smooth','crayon','pencil']){
      const c=createCanvas(320,400),engine=new ColoringEngine(c,{createCanvas,createPath:path=>new Path2D(path)});
      const automatic=new Set(template.paintingProfile.eyes.map(eye=>eye.highlightId));
      const paints=paintType==='blank'?{}:Object.fromEntries(template.regions.filter(region=>!automatic.has(region.id)).map(region=>[region.id,{color:region.material==='skin'?'#F2D7BD':region.material==='hair'?'#A66134':'#8445D8',paintType}]));
      engine.loadTemplate(template,paints);engine.setMediumImages(images);
      const shot=engine.renderSnapshot(320);
      pixels.push({id:entry.id,paintType,templateSha256:sha(bytes),rgbaSha256:sha(shot.getContext('2d').getImageData(0,0,320,400).data)});
      shot.width=shot.height=1;engine.dispose();
    }
  }
  const sources={};for(const file of ['renderer','storybook-engine','storybook-texture','authored-eye','storybook-v2-engine','storybook-v2-texture'])sources[file]=sha(await fs.readFile(`packages/coloring-engine/src/${file}.ts`));
  if(record){baseline.pixels=pixels;baseline.sources=sources;baseline.recordedAt=new Date().toISOString();await fs.writeFile(`${root}/before.json`,JSON.stringify(baseline,null,2)+'\n');}
  else{const unchanged=JSON.stringify(pixels)===JSON.stringify(baseline.pixels);await fs.writeFile(`${output}/after.json`,JSON.stringify({at:new Date().toISOString(),unchanged,pixels,sources},null,2)+'\n');if(!unchanged)throw Error('Saved v3 rendering changed.');}
  console.log(JSON.stringify({mode:record?'before':'after',templates:baseline.templates.length,comparisons:pixels.length,unchanged:record?null:true}));
}finally{await server.close();}

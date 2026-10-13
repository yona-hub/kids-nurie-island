import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {createCanvas,Path2D,loadImage} from '@napi-rs/canvas';

// The prior source is the exact file frozen before the bounded optimization.
const previous='test-results/princess-master/revision-2/frozen/storybook-texture.ts';
const output='test-results/princess-master/revision-3';
const sha=b=>createHash('sha256').update(b).digest('hex');
const results=[],sources={before:sha(await fs.readFile(previous)),after:sha(await fs.readFile('packages/coloring-engine/src/storybook-texture.ts'))};
for(const legacy of [true,false]){
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false},plugins:legacy?[{name:'frozen-form-oracle',enforce:'pre',async load(id){if(id.replaceAll('\\','/').endsWith('/packages/coloring-engine/src/storybook-texture.ts'))return await fs.readFile(previous,'utf8');}}]:[]});
  try{
    const {ColoringEngine}=await server.ssrLoadModule('/packages/coloring-engine/src/index.ts');
    for(const version of [1,2]){
      const id=`gen-princess-bunny-v6-master-v${version}`,bytes=await fs.readFile(`apps/web/public/content/templates/${id}.json`),t=JSON.parse(bytes),media=Object.fromEntries(await Promise.all(Object.entries(t.paintingProfile.mediumAssets).map(async([name,url])=>[name,await loadImage(`apps/web/public${url}`)])));
      for(const medium of ['blank','smooth','crayon','pencil']){
        const automatic=new Set(t.paintingProfile.eyes.map(e=>e.highlightId));
        const paints=medium==='blank'?{}:Object.fromEntries(t.regions.filter(r=>!automatic.has(r.id)).map(r=>[r.id,{color:r.material==='skin'?'#F2D7BD':r.material==='hair'?'#8F542E':'#FF6AA3',paintType:medium}]));
        const c=createCanvas(320,400),engine=new ColoringEngine(c,{createCanvas,createPath:p=>new Path2D(p)});engine.loadTemplate(t,paints);engine.setMediumImages(media);
        const shot=engine.renderSnapshot(320),rgba=shot.getContext('2d').getImageData(0,0,320,400).data;
        results.push({stage:legacy?'before':'after',id,medium,templateSha256:sha(bytes),rgbaSha256:sha(rgba)});shot.width=shot.height=1;engine.dispose();
      }
    }
  }finally{await server.close();}
}
const before=results.filter(r=>r.stage==='before'),after=results.filter(r=>r.stage==='after');
const unchanged=before.length===8&&before.every((r,i)=>r.rgbaSha256===after[i].rgbaSha256&&r.templateSha256===after[i].templateSha256);
await fs.mkdir(output,{recursive:true});await fs.writeFile(`${output}/legacy-master-equivalence.json`,JSON.stringify({sources,comparisons:before.length,unchanged,results},null,2)+'\n');
console.log(JSON.stringify({comparisons:before.length,unchanged}));if(!unchanged)process.exitCode=1;

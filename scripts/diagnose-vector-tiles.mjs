import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {createCanvas,Path2D,loadImage} from '@napi-rs/canvas';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false}});
try{
 const {ColoringEngine}=await server.ssrLoadModule('/packages/coloring-engine/src/index.ts');
 const t=JSON.parse(await fs.readFile('content/vector-generated/compiled/gen-excavator-cones-v2-storybook-v2.json','utf8')),a=t.paintingProfile.mediumAssets;
 const [paper,wax,pencil,iris]=await Promise.all([a.paper,a.wax,a.pencil,a.iris].map(url=>loadImage(`apps/web/public${url}`))),reports=[];
 for(const paintType of ['smooth','crayon','pencil']){
  const c=createCanvas(640,800),engine=new ColoringEngine(c,{createCanvas,createPath:p=>new Path2D(p)});engine.loadTemplate(t,Object.fromEntries(t.regions.map(r=>[r.id,{color:'#4B87D6',paintType}])));engine.setMediumImages({paper,wax,pencil,iris});engine.resize(640,800,1);engine.setViewport({scale:1,x:0,y:0});
  const direct=engine.renderSnapshot(640),one=c.getContext('2d').getImageData(0,0,640,800).data,two=direct.getContext('2d').getImageData(0,0,640,800).data,diff=createCanvas(640,800),image=diff.getContext('2d').createImageData(640,800),sums=new Map();let largest={error:0};
  for(let y=0;y<800;y++)for(let x=0;x<640;x++){
   const i=(y*640+x)*4,e=[0,1,2].reduce((n,k)=>n+Math.abs(one[i+k]-two[i+k]),0)/3;image.data.set([Math.min(255,e*10),Math.min(255,e*10),Math.min(255,e*10),255],i);
   if(e>largest.error)largest={error:e,x,y,tile:[...one.slice(i,i+4)],direct:[...two.slice(i,i+4)]};
   for(const offset of [-20,-12,-6,0,6,12,20])if(Math.abs(x-(512+offset))<2||Math.abs(y-(512+offset))<2){const s=sums.get(offset)??{sum:0,count:0,nonwhiteSum:0,nonwhiteCount:0};s.sum+=e;s.count++;if([0,1,2].some(k=>Math.min(one[i+k],two[i+k])<248)){s.nonwhiteSum+=e;s.nonwhiteCount++;}sums.set(offset,s);}
  }
  diff.getContext('2d').putImageData(image,0,0);const sheet=createCanvas(1920,800),ctx=sheet.getContext('2d');ctx.drawImage(c,0,0);ctx.drawImage(direct,640,0);ctx.drawImage(diff,1280,0);
  await fs.mkdir('test-results/vector-improvement/seam-diagnostic',{recursive:true});await fs.writeFile(`test-results/vector-improvement/seam-diagnostic/${paintType}.png`,sheet.toBuffer('image/png'));
  reports.push({paintType,largest,strips:[...sums].map(([offset,s])=>({offset,average:s.sum/s.count,nonwhiteAverage:s.nonwhiteSum/s.nonwhiteCount}))});engine.dispose();
 }
 await fs.writeFile('test-results/vector-improvement/seam-diagnostic/report.json',JSON.stringify({method:'Diagnostic only; left=tiles, center=snapshot, right=absolute pixel difference ×10; seam0 and nearby content-matched strips',reports},null,2));console.log(JSON.stringify(reports,null,2));
}finally{await server.close();}

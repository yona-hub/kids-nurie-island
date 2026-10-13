import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { build, root, loadMasters } from './build.mjs';
import { createReviewApi, json } from './review-api.mjs';

const directory=path.dirname(fileURLToPath(import.meta.url));
export async function startReviewServer({port=Number(process.env.ASSET_REVIEW_PORT??4318),store,masters:providedMasters}={}){
const token=randomBytes(24).toString('hex');
const masters=providedMasters??await loadMasters();
const vite=await createViteServer({root:directory,configFile:false,logLevel:'warn',server:{middlewareMode:true,hmr:false,ws:false,fs:{allow:[directory,path.join(root,'packages')]}},resolve:{alias:{'@review-engine':path.join(root,'packages/coloring-engine/src/index.ts')}}});
const read=file=>fs.readFile(file,'utf8').then(JSON.parse);
async function getData(id){const master=masters.find(t=>t.id===id);return {template:await read(path.join(root,'content/templates',`${id}.json`)),review:await read(path.join(root,'content/templates/reviews',`${id}.json`)).catch(e=>{if(e.code==='ENOENT')return {regions:{},approval:null};throw e;}),qa:await read(path.join(root,'content/qa',`${id}.json`)),sampleColors:master.regions.map(r=>r.sampleColor),...(master.sourceKind==='generated-raster'?{originalImageUrl:`/api/originals/${id}`,analysisImageUrl:`/api/analysis/${id}`}:{})};}
const api=createReviewApi({masters,port,token,store:store??{getData,rebuild:build,writeReview:async(id,review)=>{
 const target=path.join(root,'content/templates/reviews',`${id}.json`),temporary=target+'.tmp';
 await fs.writeFile(temporary,`${JSON.stringify(review,null,2)}\n`);await fs.rename(temporary,target);
}}});
const server=http.createServer(async(request,response)=>{
 try{
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(request.headers.host)){json(response,403,{error:'ローカルの制作ツールから操作してください'});return;}
  const url=new URL(request.url,`http://127.0.0.1:${port}`);
  if(await api(request,response,url))return;
  const rasterImage=url.pathname.match(/^\/api\/(originals|analysis)\/([a-z0-9-]+)$/);
  if(rasterImage&&request.method==='GET'&&masters.some(t=>t.id===rasterImage[2]&&t.sourceKind==='generated-raster')){
   const file=path.join(root,'content/generated-lineart/compiled',rasterImage[2],rasterImage[1]==='originals'?'normalized-lineart.png':'debug-regions.png');
   response.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(await fs.readFile(file));return;
  }
  if(url.pathname==='/'&&request.method==='GET'){
   // This tool reloads explicitly after imports. Serve its static HTML without
   // injecting Vite's HMR client; module requests still use Vite's TS transform.
   const html=(await fs.readFile(path.join(directory,'review.html'),'utf8')).replace('__REVIEW_TOKEN__',token);response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});response.end(html);return;
  }
  if(url.pathname.startsWith('/api/')){json(response,404,{error:'見つかりません'});return;}
  vite.middlewares(request,response,()=>{response.writeHead(404);response.end('見つかりません');});
 }catch(error){json(response,400,{error:error instanceof Error?error.message:'保存できませんでした'});}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
return {server,close:async()=>{await new Promise(resolve=>server.close(resolve));await vite.close();}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const review=await startReviewServer();console.log(`制作確認UI: http://127.0.0.1:${Number(process.env.ASSET_REVIEW_PORT??4318)} （この端末のみ）`);
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{void review.close();});
}

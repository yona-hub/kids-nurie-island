import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Template, TemplateSummary, SceneAsset } from '../packages/shared-types/src/index';
import type { Strategy } from 'workbox-strategies';
import { makeProject } from './sync.helpers';
import { constructionIsland } from '../apps/web/src/construction-island';

const registered = vi.hoisted(() => [] as Array<{ matcher: unknown; strategy?: unknown }>);
vi.mock('workbox-routing', () => ({
  NavigationRoute: class {},
  registerRoute: (matcher: unknown, strategy: unknown) => { registered.push({ matcher, strategy }); },
}));
vi.mock('workbox-precaching', () => ({ cleanupOutdatedCaches: () => undefined, precacheAndRoute: () => undefined, createHandlerBoundToURL: () => () => undefined }));
vi.mock('workbox-core', async original => ({ ...await original<object>(), clientsClaim: () => undefined }));

const origin='https://island.test';
const absolute=(input: RequestInfo | URL):string => new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,origin).href;
class MemoryCache {
  entries=new Map<string,Response>();
  async match(input:RequestInfo|URL){return this.entries.get(absolute(input))?.clone();}
  async put(input:RequestInfo|URL,response:Response){this.entries.set(absolute(input),response.clone());}
  async delete(input:RequestInfo|URL){return this.entries.delete(absolute(input));}
  async keys(){return [...this.entries.keys()].map(url=>new Request(url));}
}
class MemoryCaches {
  entries=new Map<string,MemoryCache>();
  async open(name:string){let cache=this.entries.get(name);if(!cache){cache=new MemoryCache();this.entries.set(name,cache);}return cache;}
  async match(input:RequestInfo|URL,options?:MultiCacheQueryOptions){if(options?.cacheName)return (await this.open(options.cacheName)).match(input);for(const cache of this.entries.values()){const result=await cache.match(input);if(result)return result;}return undefined;}
  async delete(name:string){return this.entries.delete(name);}
}
class TestExtendableEvent extends Event {
  pending:Promise<unknown>[]=[];
  waitUntil(promise:Promise<unknown>){this.pending.push(promise);}
}
class TestFetchEvent extends TestExtendableEvent {}

const fixture:Template=JSON.parse(readFileSync('apps/web/public/content/templates/princess-bunny.json','utf8'));
const digest=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex');
function packageRevision(texture:number){
  const template=structuredClone(fixture);template.regions[0].texture=texture;
  const data=JSON.stringify(template);
  const assetUrl=`/content/templates/${template.id}.${digest(data)}.json`;
  const summary:TemplateSummary={id:template.id,title:template.title,themeId:template.themeId,defaultColorFamily:template.defaultColorFamily,regionCount:template.regions.length,assetUrl,thumbnailUrl:assetUrl.replace('.json','.svg'),coloredThumbnailUrl:assetUrl.replace('.json','-colored.svg')};
  return {data,summary,template};
}
function sceneRevision(kind:'backgrounds'|'frames',color:string){const data=`<svg xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="M0 0H10V10Z"/></svg>`;const assetUrl=`/content/${kind}/scene.${digest(data)}.svg`;return{data,scene:{id:'scene',name:'確認用',assetUrl,thumbnailUrl:assetUrl} satisfies SceneAsset};}

let storage:MemoryCaches;
let files:Map<string,string|ArrayBuffer>;
let requests:string[];
let offline:boolean;
async function workerFetch(url:string){
  const request=new Request(new URL(url,origin));
  const route=registered.find(route=>typeof route.matcher==='function'&&(route.matcher as (input:{url:URL;request:Request})=>boolean)({url:new URL(request.url),request}));
  if(!route)throw Error(`No content route for ${url}`);
  const event=new TestFetchEvent('fetch');
  const [response,done]=(route.strategy as Strategy).handleAll({request,event:event as unknown as ExtendableEvent});
  const result=await response;await done;await Promise.all(event.pending);return result;
}
async function installWorker(){registered.length=0;await import('../apps/web/src/sw');}

beforeEach(async()=>{
  vi.resetModules();registered.length=0;storage=new MemoryCaches();files=new Map();requests=[];offline=false;
  vi.stubGlobal('caches',storage);vi.stubGlobal('location',new URL(origin));vi.stubGlobal('navigator',{onLine:true,userAgent:'node'});
  vi.stubGlobal('ExtendableEvent',TestExtendableEvent);vi.stubGlobal('FetchEvent',TestFetchEvent);
  vi.stubGlobal('self',{location:new URL(origin),registration:{scope:origin+'/'},caches:storage,__WB_MANIFEST:[],__WB_DISABLE_DEV_LOGS:true,addEventListener:()=>undefined});
  vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>{
    // Page fetches traverse the actual registered SW strategies. Workbox's
    // Request fetches reach the controlled network; strategies are not mocked.
    if(!(input instanceof Request))return workerFetch(new URL(absolute(input)).pathname);
    const pathname=new URL(input.url).pathname;requests.push(pathname);
    if(offline)throw new TypeError('offline');
    const contents=files.get(pathname);return new Response(contents??'missing',{status:contents===undefined?404:200,headers:{'Content-Type':pathname.endsWith('.json')?'application/json':pathname.endsWith('.png')?'image/png':'image/svg+xml'}});
  });
  await installWorker();
});
afterEach(()=>vi.unstubAllGlobals());

describe('A02-02 immutable content and actual Workbox cache integration',()=>{
  it('retains both delivered faceless home resolutions offline across a worker replacement',async()=>{
    const urls=constructionIsland.srcSet.split(', ').map(item=>item.split(' ')[0]);
    for(const url of urls){
      const bytes=readFileSync('apps/web/public'+url);files.set(url,new Uint8Array(bytes).buffer);
      expect(digest(new Uint8Array(await(await workerFetch(url)).arrayBuffer()))).toBe(digest(bytes));
    }
    vi.resetModules();await installWorker();offline=true;
    for(const url of urls){
      expect(digest(new Uint8Array(await(await workerFetch(url)).arrayBuffer()))).toBe(digest(readFileSync('apps/web/public'+url)));
      expect(requests.filter(request=>request===url)).toHaveLength(1);
    }
  });
  it('does not cache foreign or malformed home image URLs under the artwork route',async()=>{
    await expect(workerFetch('https://unrelated.invalid'+constructionIsland.src)).rejects.toThrow('No content route');
    await expect(workerFetch(constructionIsland.src.replace(/\.[a-f0-9]{64}\./,'.invalid.'))).rejects.toThrow('No content route');
  });
  it('updates a generated PNG by byte revision and retains both downloaded previews offline',async()=>{
    const catalog:TemplateSummary[]=JSON.parse(readFileSync('apps/web/public/content/catalog.json','utf8'));
    const first=readFileSync('apps/web/public'+catalog[0].thumbnailUrl),second=readFileSync('apps/web/public'+catalog[1].thumbnailUrl);
    const firstUrl=`/content/templates/preview.${digest(first)}.png`,secondUrl=`/content/templates/preview.${digest(second)}.png`;
    expect(firstUrl).not.toBe(secondUrl);
    files.set(firstUrl,new Uint8Array(first).buffer);files.set(secondUrl,new Uint8Array(second).buffer);
    const initial=await workerFetch(firstUrl);expect(initial.headers.get('Content-Type')).toBe('image/png');
    expect(digest(new Uint8Array(await initial.arrayBuffer()))).toBe(digest(first));
    expect(digest(new Uint8Array(await (await workerFetch(secondUrl)).arrayBuffer()))).toBe(digest(second));
    vi.resetModules();await installWorker();offline=true;
    expect(digest(new Uint8Array(await (await workerFetch(firstUrl)).arrayBuffer()))).toBe(digest(first));
    expect(digest(new Uint8Array(await (await workerFetch(secondUrl)).arrayBuffer()))).toBe(digest(second));
    expect(requests.filter(url=>url===firstUrl)).toHaveLength(1);expect(requests.filter(url=>url===secondUrl)).toHaveLength(1);
  });
  it('loads a same-ID material correction through the new catalog URL, retaining the old revision',async()=>{
    const first=packageRevision(.35),second=packageRevision(0);
    files.set('/content/catalog.json',JSON.stringify([first.summary]));files.set(first.summary.assetUrl,first.data);
    const {loadTemplate}=await import('../packages/content-schema/src/index');
    expect((await loadTemplate(fixture.id)).regions[0].texture).toBe(.35);
    files.set('/content/catalog.json',JSON.stringify([second.summary]));files.set(second.summary.assetUrl,second.data);
    expect((await loadTemplate(fixture.id)).regions[0].texture).toBe(0);
    expect(requests.filter(url=>url===first.summary.assetUrl)).toHaveLength(1);
    expect(requests.filter(url=>url===second.summary.assetUrl)).toHaveLength(1);
    expect(await (await storage.open('island-art-v1')).match(first.summary.assetUrl)).toBeDefined();
    expect(requests).not.toContain(`/content/templates/${fixture.id}.json`);
    // A service-worker replacement reuses the immutable cache without purging it.
    vi.resetModules();await installWorker();offline=true;
    expect((await (await workerFetch(first.summary.assetUrl)).json() as Template).regions[0].texture).toBe(.35);
    expect((await (await workerFetch(second.summary.assetUrl)).json() as Template).regions[0].texture).toBe(0);
  });

  it('opens the previously used revision offline if only the newer catalog has arrived',async()=>{
    const first=packageRevision(.35),second=packageRevision(0);
    files.set('/content/catalog.json',JSON.stringify([first.summary]));files.set(first.summary.assetUrl,first.data);
    const {loadTemplate,loadCatalog}=await import('../packages/content-schema/src/index');
    const {artworkRevision}=await import('../apps/web/src/artwork-source');
    const original=await loadTemplate(fixture.id),work=makeProject(undefined,{templateId:fixture.id});
    const originalKey=await artworkRevision(work,{template:original,backgrounds:[],frames:[]});
    files.set('/content/catalog.json',JSON.stringify([second.summary]));await loadCatalog();
    offline=true;
    const project={templateId:fixture.id,regions:{r01:{color:'#FF8FBA',paintType:'crayon'}}};
    const before=JSON.stringify(project);
    const fallback=await loadTemplate(project.templateId);
    expect(fallback.regions[0].texture).toBe(.35);
    expect(await artworkRevision(work,{template:fallback,backgrounds:[],frames:[]})).toBe(originalKey);
    expect(JSON.stringify(project)).toBe(before);
    offline=false;files.set(second.summary.assetUrl,second.data);
    const reconnected=await loadTemplate(project.templateId);
    expect(reconnected.regions[0].texture).toBe(0);
    expect(await artworkRevision(work,{template:reconnected,backgrounds:[],frames:[]})).not.toBe(originalKey);
  });

  it.each(['backgrounds','frames'] as const)('updates %s by revision and resolves downloaded decorations offline',async kind=>{
    const first=sceneRevision(kind,'#F3E6CE'),second=sceneRevision(kind,'#A7D2E7');
    files.set(`/content/${kind}.json`,JSON.stringify([first.scene]));files.set(first.scene.assetUrl,first.data);
    const loaders=await import('../packages/content-schema/src/index');const load=kind==='backgrounds'?loaders.loadBackgrounds:loaders.loadFrames;
    expect((await load())[0].assetUrl).toBe(first.scene.assetUrl);await workerFetch(first.scene.assetUrl);
    files.set(`/content/${kind}.json`,JSON.stringify([second.scene]));files.set(second.scene.assetUrl,second.data);
    expect((await load())[0].assetUrl).toBe(second.scene.assetUrl);
    // Simulate catalog arrival without downloading the newer decoration.
    offline=true;
    expect((await load())[0].assetUrl).toBe(first.scene.assetUrl);
    expect(await (await workerFetch(first.scene.assetUrl)).text()).toBe(first.data);
    offline=false;expect(await (await workerFetch(second.scene.assetUrl)).text()).toBe(second.data);
    expect((await load())[0].assetUrl).toBe(second.scene.assetUrl);
  });

  it('revalidates legacy aliases instead of trapping them in CacheFirst',async()=>{
    const alias=`/content/templates/${fixture.id}.json`,first=packageRevision(.35),second=packageRevision(0);
    files.set(alias,first.data);expect((await (await workerFetch(alias)).json() as Template).regions[0].texture).toBe(.35);
    files.set(alias,second.data);expect((await (await workerFetch(alias)).json() as Template).regions[0].texture).toBe(0);
    offline=true;expect((await (await workerFetch(alias)).json() as Template).regions[0].texture).toBe(0);
  });

  it('fetches only the selected drawing from a 420-item catalog and rejects a foreign URL',async()=>{
    const first=packageRevision(.35);
    const many=Array.from({length:420},(_,i)=>({...first.summary,id:i?`test-${i}`:fixture.id}));
    files.set('/content/catalog.json',JSON.stringify(many));files.set(first.summary.assetUrl,first.data);
    const {loadTemplate}=await import('../packages/content-schema/src/index');await loadTemplate(fixture.id);
    expect(requests.filter(url=>url.startsWith('/content/templates/'))).toEqual([first.summary.assetUrl]);
    files.set('/content/catalog.json',JSON.stringify([{...first.summary,assetUrl:'https://unrelated.invalid/art.json'}]));
    await expect(loadTemplate(fixture.id)).rejects.toThrow();
  });
});

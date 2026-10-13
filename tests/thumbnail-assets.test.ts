import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCanvas, Path2D as NativePath } from '@napi-rs/canvas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { artworkRevision, type ArtworkSource } from '../apps/web/src/artwork-source';
import { ColoringEngine, type EngineCanvas } from '../packages/coloring-engine/src/index';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import type { Template } from '../packages/shared-types/src/index';
import { MemoryCloud, TestAuth, makeProject, USER_B } from './sync.helpers';

const template: Template = JSON.parse(readFileSync('apps/web/public/content/templates/gen-round-sports-car-v2.json', 'utf8'));
const source: ArtworkSource = { template, backgrounds: [{ id: 'sky', name: '空', assetUrl: '/content/backgrounds/sky.' + 'a'.repeat(64) + '.svg', thumbnailUrl: '' }], frames: [{ id: 'stars', name: '星', assetUrl: '/content/frames/stars.' + 'b'.repeat(64) + '.svg', thumbnailUrl: '' }] };
const apps: IslandServices[] = [];
function device(cloud: MemoryCloud, dbName = crypto.randomUUID(), online = () => true) {
  const app = createServices({ cloud, dbName, online, authAdapter: new TestAuth(), debounceMs: 60_000 });
  apps.push(app); return app;
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(apps.splice(0).map(app => app.dispose())); });
function draw(art: Template) {
  const canvas = createCanvas(320, 400);
  const engine = new ColoringEngine(canvas as unknown as EngineCanvas, {
    createCanvas: (w, h) => createCanvas(w, h) as unknown as EngineCanvas,
    createPath: path => new NativePath(path) as unknown as Path2D,
    requestFrame: () => 1, cancelFrame: () => undefined,
  });
  try {
    engine.loadTemplate(art, Object.fromEntries(art.regions.map(region => [region.id, { color: '#2598FF', paintType: 'smooth' }])));
    return new Blob([new Uint8Array(canvas.toBuffer('image/png'))], { type: 'image/png' });
  } finally { engine.dispose(); }
}
describe('A02-05 thumbnail asset identity', () => {
  it('I34 invalidates current smooth thumbnails after runtime-only contour fixes and keeps dry and legacy keys', async () => {
    const catalog = JSON.parse(readFileSync('apps/web/public/content/catalog.json', 'utf8')) as {assetUrl:string}[];
    const priorKey = (art:Template, paints:ReturnType<typeof makeProject>['regions']) => createHash('sha256').update(JSON.stringify([
      `island-thumbnail-renderer-v${art.paintingProfile!.version}${Object.values(paints).some(p=>p.paintType==='crayon') ? '-flat-crayon-v1' : ''}`,
      art, null, null, null, null,
    ])).digest('hex');
    for (const entry of catalog) {
      const art:Template = JSON.parse(readFileSync('apps/web/public'+entry.assetUrl, 'utf8')), current:ArtworkSource={template:art,backgrounds:[],frames:[]};
      const original=makeProject(undefined,{templateId:art.id});
      for (const paintType of ['smooth','crayon','pencil'] as const) {
        const project={...original,regions:{[art.regions[0].id]:{color:'#F2D7BD',paintType}}}, previous=priorKey(art,project.regions), key=await artworkRevision(project,current);
        if(paintType==='smooth')expect(key).not.toBe(previous);else expect(key).toBe(previous);
      }
      expect(await artworkRevision(original,current)).toBe(priorKey(art,original.regions));
      const mixed={...original,regions:{[art.regions[0].id]:{color:'#F2D7BD',paintType:'smooth' as const},[art.regions[1].id]:{color:'#2598FF',paintType:'crayon' as const}}};
      expect(await artworkRevision(mixed,current)).not.toBe(priorKey(art,mixed.regions));
      const legacy:Template=JSON.parse(readFileSync(`apps/web/public/content/templates/${art.paintingProfile!.upgradeFrom}.json`,'utf8'));
      const oldProject={...original,templateId:legacy.id,regions:{[legacy.regions[0].id]:{color:'#F2D7BD',paintType:'smooth' as const}}};
      expect(await artworkRevision(oldProject,{...current,template:legacy})).toBe(priorKey(legacy,oldProject.regions));
    }
  });
  it('I34 rejects a persisted pre-fix smooth thumbnail offline and replaces it without changing the artwork', async () => {
    const catalog=JSON.parse(readFileSync('apps/web/public/content/catalog.json','utf8')) as {themeId:string;assetUrl:string}[],entry=catalog.find(e=>e.themeId==='princess')!;
    const art:Template=JSON.parse(readFileSync('apps/web/public'+entry.assetUrl,'utf8')), current:ArtworkSource={template:art,backgrounds:[],frames:[]},app=device(new MemoryCloud(),crypto.randomUUID(),()=>false);await app.ready;
    const original=await app.projects.create({templateId:art.id,title:'肌だけ塗った作品'}),project=await app.projects.save({...original,regions:{r07:{color:'#F2D7BD',paintType:'smooth'}}});
    const oldKey=createHash('sha256').update(JSON.stringify([`island-thumbnail-renderer-v${art.paintingProfile!.version}`,art,null,null,null,null])).digest('hex');
    await app.thumbnails.set(project.id,new Blob(['old white eye band'],{type:'image/png'}),project,oldKey);
    const key=await artworkRevision(project,current);expect(await app.thumbnails.get(project.id,key)).toBeUndefined();
    await app.thumbnails.set(project.id,new Blob(['corrected eye'],{type:'image/png'}),project,key);
    expect(await(await app.thumbnails.get(project.id,key))!.text()).toBe('corrected eye');expect(await app.projects.get(project.id)).toEqual(project);
  });
  it.each([1, 2, 3, 4])('I32 refreshes shaded crayon thumbnails only in current renderer v%s', async version => {
    const id = ['gen-princess-bunny-v6', 'gen-princess-bunny-v6-storybook-v1', 'gen-princess-bunny-v6-storybook-v2', 'gen-princess-bunny-v6-master-v3'][version - 1];
    const art: Template = JSON.parse(readFileSync(`apps/web/public/content/templates/${id}.json`, 'utf8'));
    const currentSource: ArtworkSource = { template: art, backgrounds: [], frames: [] };
    const app = device(new MemoryCloud(), crypto.randomUUID(), () => false); await app.ready;
    const original = await app.projects.create({ templateId: id, title: '以前のクレヨン' });
    const project = await app.projects.save({ ...original, regions: { r03: { color: '#2598FF', paintType: 'crayon' } } });
    const oldKey = createHash('sha256').update(JSON.stringify([`island-thumbnail-renderer-v${version}`, art, null, null, ...(art.paintingProfile ? [null, null] : [])])).digest('hex');
    await app.thumbnails.set(project.id, new Blob(['old shaded thumbnail'], { type: 'image/png' }), project, oldKey);
    const key = await artworkRevision(project, currentSource);
    if (version >= 3) {
      expect(key).not.toBe(oldKey); expect(await app.thumbnails.get(project.id, key)).toBeUndefined();
    } else {
      expect(key).toBe(oldKey); expect(await (await app.thumbnails.get(project.id, key))?.text()).toBe('old shaded thumbnail');
    }
    for (const paintType of ['smooth', 'pencil'] as const) expect(await artworkRevision({ ...project, regions: { r03: { color: '#2598FF', paintType } } }, currentSource)).toBe(oldKey);
    expect(await app.projects.get(project.id)).toEqual(project);
  });
  it('does not assign a captured image from a different owner or project', async () => {
    const app = device(new MemoryCloud(), crypto.randomUUID(), () => false); await app.ready;
    const project = await app.projects.create({ templateId: template.id, title: '画像の所有者' });
    const key = await artworkRevision(project, source), image = new Blob(['wrong owner'], { type: 'image/png' });
    await app.thumbnails.set(project.id, image, { ...project, userId: USER_B }, key);
    expect(await app.thumbnails.get(project.id, key)).toBeUndefined();
    await app.thumbnails.set(project.id, image, { ...project, id: crypto.randomUUID() }, key);
    expect(await app.thumbnails.get(project.id, key)).toBeUndefined();
  });
  it('keeps real asset renders separate across devices, retries, restart and delayed old uploads', async () => {
    const cloud = new MemoryCloud(), name = crypto.randomUUID();
    const oldDevice = device(cloud), newDevice = device(cloud), reader = device(cloud, name);
    await Promise.all([oldDevice.ready, newDevice.ready, reader.ready]);
    const original = await oldDevice.projects.create({ templateId: template.id, title: '同じ作品' });
    const corrected = structuredClone(source);
    for (const region of corrected.template.regions) { region.shade = false; region.highlight = false; region.texture = 0; }
    const beforeKey = await artworkRevision(original, source), afterKey = await artworkRevision(original, corrected);
    const before = draw(template), after = draw(corrected.template);
    expect(beforeKey).not.toBe(afterKey);
    expect(new Uint8Array(await before.arrayBuffer())).not.toEqual(new Uint8Array(await after.arrayBuffer()));
    await oldDevice.thumbnails.set(original.id, before, original, beforeKey);
    await oldDevice.sync.flush(); await reader.sync.flush(); await newDevice.sync.flush();
    expect(await (await reader.thumbnails.get(original.id, beforeKey))?.arrayBuffer()).toEqual(await before.arrayBuffer());
    expect(await reader.thumbnails.get(original.id, afterKey)).toBeUndefined();
    await newDevice.thumbnails.set(original.id, after, (await newDevice.projects.get(original.id))!, afterKey);
    vi.spyOn(cloud, 'uploadThumbnail').mockRejectedValueOnce(new Error('response lost'));
    await newDevice.sync.flush();
    expect(await reader.thumbnails.get(original.id, afterKey)).toBeUndefined();
    await reader.dispose(); apps.splice(apps.indexOf(reader), 1);
    const restarted = device(cloud, name); await restarted.ready;
    expect(await restarted.thumbnails.get(original.id, afterKey)).toBeUndefined();
    await newDevice.sync.flush();
    expect(await (await restarted.thumbnails.get(original.id, afterKey))?.arrayBuffer()).toEqual(await after.arrayBuffer());
    await oldDevice.thumbnails.set(original.id, before, (await oldDevice.projects.get(original.id))!, beforeKey);
    await oldDevice.sync.flush();
    expect(await (await restarted.thumbnails.get(original.id, afterKey))?.arrayBuffer()).toEqual(await after.arrayBuffer());
    expect((await restarted.projects.get(original.id))?.version).toBe(1); expect(cloud.records.size).toBe(1);
  });
  it.each(['backgrounds', 'frames'] as const)('invalidates %s independently, preserving the actual offline revision', async kind => {
    const project = makeProject(undefined, { templateId: template.id, backgroundId: 'sky', frameId: 'stars' });
    const newer = structuredClone(source); newer[kind][0].assetUrl = newer[kind][0].assetUrl.replace(/\.[a-f0-9]{64}\./, '.' + 'c'.repeat(64) + '.');
    const original = await artworkRevision(project, source);
    expect(await artworkRevision(project, newer)).not.toBe(original);
    expect(await artworkRevision(project, structuredClone(source))).toBe(original);
    expect(await artworkRevision({ ...project, title: '名前だけ変更', version: 3 }, source)).toBe(original);
  });
  it('refuses unknown legacy and mismatched local images offline and rejects invalid fingerprints', async () => {
    const app = device(new MemoryCloud(), crypto.randomUUID(), () => false); await app.ready;
    const project = await app.projects.create({ templateId: template.id, title: 'オフライン' });
    const key = await artworkRevision(project, source);
    await app.thumbnails.set(project.id, new Blob(['legacy'], { type: 'image/png' }), project);
    expect(await app.thumbnails.get(project.id, key)).toBeUndefined();
    await app.thumbnails.set(project.id, new Blob(['current'], { type: 'image/png' }), project, key);
    expect(await (await app.thumbnails.get(project.id, key))?.text()).toBe('current');
    expect(await app.thumbnails.get(project.id, 'd'.repeat(64))).toBeUndefined();
    await expect(app.thumbnails.get(project.id, '../wrong')).rejects.toMatchObject({ code: 'VALIDATION' });
    expect((await app.projects.get(project.id))?.title).toBe('オフライン');
  });
});

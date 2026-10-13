import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, validateProject, type IslandServices } from '../packages/persistence/src/index';
import { DEFAULT_SETTINGS } from '../packages/shared-types/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import { TestAuth, USER_A, USER_B, backup, makeProject } from './sync.helpers';

const services: IslandServices[] = [];
function local(dbName = crypto.randomUUID(), authAdapter = new TestAuth(USER_A, true)) {
  const result = createServices({ dbName, authAdapter, online: () => false }); services.push(result); return result;
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(services.splice(0).map(service => service.dispose())); });

describe('durable, user-scoped IndexedDB storage', () => {
  it('stores PNG fallbacks as bytes and reads both new and legacy thumbnail rows', async () => {
    const name = crypto.randomUUID(); const app = local(name); await app.ready;
    const project = await app.projects.create({ templateId: 'ocean', title: 'うみ' });
    await app.thumbnails.set(project.id, new Blob(['png fallback'], { type: 'image/png' }));
    const db = await openLocalDatabase(name);
    try {
      const key = projectKey(USER_A, project.id);
      const row = (await db.get('thumbnails', key))!;
      expect(row.blob).not.toBeInstanceOf(Blob);
      expect(row.blob).toMatchObject({ mimeType: 'image/png' });
      const image = (await app.thumbnails.get(project.id))!;
      expect(image.type).toBe('image/png'); expect(await image.text()).toBe('png fallback');
      await db.put('thumbnails', { ...row, blob: new Blob(['legacy'], { type: 'image/webp' }) });
      expect(await (await app.thumbnails.get(project.id))?.text()).toBe('legacy');
    } finally { db.close(); }
  });
  it('starts duplicates as drafts while preserving the completed original and its paints', async () => {
    const app = local(); await app.ready;
    const original = await app.projects.create({ templateId: 'ocean', title: 'うみ' });
    const completed = await app.projects.save({ ...original, status: 'completed', regions: { fish: { color: '#00AADD', paintType: 'crayon' } } });
    const copy = await app.projects.duplicate(completed.id);
    expect(copy.id).not.toBe(completed.id); expect(copy.status).toBe('draft');
    expect(copy.regions).toEqual(completed.regions);
    expect((await app.projects.get(completed.id))?.status).toBe('completed');
  });
  it('persists mixed paints, settings and a WebP independently of session UI state', async () => {
    const name = crypto.randomUUID();
    const a = local(name);
    await a.ready;
    const project = await a.projects.create({ templateId: 'princess-rabbit', title: 'おひめさま' });
    await a.projects.save({ ...project, regions: { dress: { color: '#F64C91', paintType: 'crayon' }, crown: { color: '#FFC400', paintType: 'smooth' } }, metadata: { favorite: true }, ...{ zoom: 3, undo: ['private'] } });
    await a.settings.set({ ...DEFAULT_SETTINGS, volume: 0.7, speakColors: true });
    await a.thumbnails.set(project.id, new Blob(['thumbnail'], { type: 'image/webp' }));
    await a.dispose(); services.splice(services.indexOf(a), 1);
    const b = local(name); await b.ready;
    const saved = await b.projects.get(project.id);
    expect(saved?.regions.dress.paintType).toBe('crayon');
    expect(saved).not.toHaveProperty('zoom');
    expect(saved).not.toHaveProperty('undo');
    expect((await b.settings.get()).volume).toBe(0.7);
    expect(await (await b.thumbnails.get(project.id))?.text()).toBe('thumbnail');
    expect(b.sync.status.unsyncedCount).toBe(0);
  });
  it('never returns another user’s rows, thumbnails or settings after switching accounts', async () => {
    const auth = new TestAuth(USER_A, true); const app = local(undefined, auth); await app.ready;
    const project = await app.projects.create({ templateId: 'ocean', title: 'うみ' });
    await app.thumbnails.set(project.id, new Blob(['private'], { type: 'image/webp' }));
    await app.settings.set({ ...DEFAULT_SETTINGS, volume: 0.9 });
    auth.setSession({ userId: USER_B, localOnly: true, provider: 'demo' });
    expect(await app.projects.list()).toEqual([]);
    expect(await app.projects.get(project.id)).toBeUndefined();
    expect(await app.thumbnails.get(project.id)).toBeUndefined();
    expect((await app.settings.get()).volume).toBe(DEFAULT_SETTINGS.volume);
    await expect(app.projects.save(project)).rejects.toMatchObject({ code: 'AUTH' });
  });
  it('atomically enforces 500 across simultaneous creations and imports', async () => {
    const name = crypto.randomUUID(); const a = local(name); const b = local(name); await Promise.all([a.ready, b.ready]);
    await a.backup.import(backup(Array.from({ length: 499 }, () => makeProject())));
    const results = await Promise.allSettled([a.projects.create({ templateId: 'ocean', title: 'a' }), b.projects.create({ templateId: 'ocean', title: 'b' })]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await a.projects.count()).toBe(500);
    await expect(a.backup.import(backup([makeProject()]))).rejects.toMatchObject({ code: 'LIMIT' });
    expect(await a.projects.count()).toBe(500);
    const first = (await a.projects.list())[0];
    await a.projects.delete(first);
    await a.projects.create({ templateId: 'ocean', title: '整理して追加' });
    expect(await a.projects.count()).toBe(500);
  });
  it('rejects corrupt backups atomically and restores valid data under fresh IDs and owner', async () => {
    const app = local(); await app.ready;
    const original = makeProject(USER_B, { regions: { a: { color: '#123456', paintType: 'pencil' } } });
    const invalid = { ...original, regions: { a: { color: 'url(evil)', paintType: 'pencil' as const } } };
    await expect(app.backup.import(backup([original, invalid]))).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(await app.projects.count()).toBe(0);
    expect(await app.backup.import(backup([original]))).toBe(1);
    const restored = (await app.projects.list())[0];
    expect(restored.userId).toBe(USER_A); expect(restored.id).not.toBe(original.id); expect(restored.version).toBe(0);
    expect(restored.regions).toEqual(original.regions);
    const exported = JSON.parse(await (await app.backup.export()).text());
    expect(exported.projects).toHaveLength(1);
    expect(exported.projects[0]).not.toHaveProperty('localRevision');
  });
  it('rejects unknown schema, unsafe IDs, paint types, oversized structures and prototype keys', () => {
    for (const patch of [{ schemaVersion: 2 }, { id: 'bad' }, { regions: { x: { color: '#FFFFFF', paintType: 'oil' } } }, { metadata: JSON.parse('{"__proto__":"bad"}') }, { title: 'a'.repeat(121) }]) {
      expect(() => validateProject({ ...makeProject(), ...patch })).toThrow();
    }
  });
  it('keeps rapid same-tab edits in order and preserves stale other-tab edits as a separate work', async () => {
    const name = crypto.randomUUID(); const a = local(name); const b = local(name); await Promise.all([a.ready, b.ready]);
    const first = await a.projects.create({ templateId: 'ocean', title: 'うみ' });
    const stale = await b.projects.get(first.id);
    const edits = await Promise.all(Array.from({ length: 15 }, (_, index) => a.projects.save({ ...first, title: `${index}` })));
    expect(new Set(edits.map(project => project.id)).size).toBe(1);
    expect((await a.projects.get(first.id))?.title).toBe('14');
    const other = await b.projects.save({ ...stale!, title: 'べつの色' });
    expect(other.id).not.toBe(first.id);
    expect(await a.projects.count()).toBe(2);
    expect((await a.projects.get(first.id))?.title).toBe('14');
  });
  it('deletion blocks stale local saves and local account deletion clears every store', async () => {
    const app = local(); await app.ready;
    const project = await app.projects.create({ templateId: 'ocean', title: 'うみ' });
    await app.projects.delete(project);
    await expect(app.projects.save(project)).rejects.toMatchObject({ code: 'DELETED' });
    await app.deleteAccountData(USER_A);
    expect(app.auth.session).toBeNull(); expect(await app.projects.list()).toEqual([]);
  });
  it('requires production credentials and only creates an explicitly enabled local account', async () => {
    const closed = createServices({ dbName: crypto.randomUUID() }); services.push(closed); await closed.ready;
    expect(closed.auth.session).toBeNull(); expect(closed.auth.configurationError).toBeTruthy();
    await expect(closed.auth.signIn('google')).rejects.toMatchObject({ code: 'CONFIGURATION' });
    const demo = createServices({ dbName: crypto.randomUUID(), demoMode: true }); services.push(demo); await demo.ready;
    expect(demo.auth.session?.localOnly).toBe(true);
    await demo.auth.signOut(); expect(demo.auth.session).toBeNull();
    await demo.auth.signIn('demo'); expect(demo.auth.session?.provider).toBe('demo');
    await expect(demo.auth.signIn('google')).rejects.toMatchObject({ code: 'CONFIGURATION' });
  });
  it('does not report success if IndexedDB quota is exceeded, retaining the last committed work', async () => {
    const app = local(); await app.ready;
    const project = await app.projects.create({ templateId: 'ocean', title: '保存された作品' });
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => { throw new DOMException('full', 'QuotaExceededError'); });
    await expect(app.projects.save({ ...project, title: 'まだ保存されていない変更' })).rejects.toMatchObject({ code: 'STORAGE' });
    expect(app.sync.status.state).toBe('error');
    expect(app.sync.status.localSaveFailed).toBe(true);
    expect(app.sync.status.error).toContain('この端末に保存できませんでした');
    expect((await app.projects.get(project.id))?.title).toBe('保存された作品');
    await app.thumbnails.set(project.id, new Blob(['old but committed'], { type: 'image/webp' }));
    expect(app.sync.status.localSaveFailed).toBe(true);
    await app.projects.save({ ...project, title: '再試行で保存された作品' });
    expect(app.sync.status.localSaveFailed).toBe(false);
  });
  it('routes rapid stale-tab edits to one preserved copy and rejects outdated asynchronous thumbnails', async () => {
    const name = crypto.randomUUID(); const a = local(name); const b = local(name); await Promise.all([a.ready,b.ready]);
    const first = await a.projects.create({ templateId: 'ocean', title: 'うみ' });
    const stale = (await b.projects.get(first.id))!;
    await a.projects.save({ ...first, title: 'あたらしい作品' });
    const edits = await Promise.all(Array.from({ length: 10 }, (_, i) => b.projects.save({ ...stale, title: `別画面の色${i}` })));
    expect(new Set(edits.map(project => project.id)).size).toBe(1); expect(await a.projects.count()).toBe(2);
    expect((await b.projects.get(edits[0].id))?.title).toBe('別画面の色9');
    await a.thumbnails.set(first.id, new Blob(['stale'], { type: 'image/webp' }), first);
    expect(await a.thumbnails.get(first.id)).toBeUndefined();
    const latest = (await a.projects.get(first.id))!;
    await a.thumbnails.set(first.id, new Blob(['latest'], { type: 'image/webp' }), latest);
    expect(await (await a.thumbnails.get(first.id))?.text()).toBe('latest');
  });
});

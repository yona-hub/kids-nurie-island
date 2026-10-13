import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import { MemoryCloud, TestAuth, USER_A, makeProject } from './sync.helpers';

const services: IslandServices[] = [];
function device(cloud: MemoryCloud, online = () => true, dbName = crypto.randomUUID()) {
  const app = createServices({ cloud, authAdapter: new TestAuth(), dbName, online, debounceMs: 60_000 });
  services.push(app); return app;
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(services.splice(0).map(app => app.dispose())); });

describe('architecture audit 02 regressions', () => {
  it('A02-01 refuses deletion of an unshown newer version already pulled into this device', async () => {
    const cloud = new MemoryCloud(); const a = device(cloud); const b = device(cloud); await Promise.all([a.ready,b.ready]);
    const original = await a.projects.create({ templateId: 'ocean', title: '赤の作品' }); await a.sync.flush(); await b.sync.flush();
    const displayed = (await b.projects.get(original.id))!;
    await a.projects.save({ ...(await a.projects.get(original.id))!, title: 'まだ見ていない青の作品' }); await a.sync.flush(); await b.sync.flush();
    expect(displayed.version).toBe(1); expect((await b.projects.get(original.id))?.version).toBe(2);
    await expect(b.projects.delete(displayed)).rejects.toMatchObject({ code: 'CHANGED' });
    await b.sync.flush();
    expect(cloud.records.get(original.id)?.deleted).toBe(false);
    expect((await b.projects.get(original.id))?.title).toBe('まだ見ていない青の作品');
  });
  it('A02-03 never associates a prior-version thumbnail with newly synced project state', async () => {
    const cloud = new MemoryCloud(); const a = device(cloud); const b = device(cloud); await Promise.all([a.ready,b.ready]);
    const red = await a.projects.create({ templateId: 'ocean', title: '赤', });
    await a.thumbnails.set(red.id, new Blob(['red'], { type: 'image/webp' }), red); await a.sync.flush(); await b.sync.flush();
    expect(await (await b.thumbnails.get(red.id))?.text()).toBe('red');
    const blue = await a.projects.save({ ...(await a.projects.get(red.id))!, title: '青', regions: { fish: { color: '#2598FF', paintType: 'smooth' } } });
    await a.sync.flush(); await b.sync.flush();
    expect((await b.projects.get(red.id))?.regions.fish.color).toBe('#2598FF');
    expect(await b.thumbnails.get(red.id)).toBeUndefined();
    await a.thumbnails.set(red.id, new Blob(['blue'], { type: 'image/webp' }), blue); await a.sync.flush(); await b.sync.flush();
    expect(await (await b.thumbnails.get(red.id))?.text()).toBe('blue');
  });
  it('A02-04 never bulk-loads thumbnail bytes while counting pending works on paint saves', async () => {
    const name = crypto.randomUUID(); const app = device(new MemoryCloud(), () => false, name); await app.ready;
    const db = await openLocalDatabase(name);
    const first = makeProject();
    const tx = db.transaction(['projects','thumbnails'], 'readwrite');
    for (let i = 0; i < 500; i++) {
      const project = i ? makeProject() : first; const key = projectKey(USER_A, project.id);
      await tx.objectStore('projects').put({ key, userId: USER_A, project, baseVersion: 0, revision: 1, writerId: 'seed', editGeneration: crypto.randomUUID(), operationId: crypto.randomUUID(), dirty: false, deleted: false });
      await tx.objectStore('thumbnails').put({ key, userId: USER_A, projectId: project.id, blob: { bytes: new ArrayBuffer(64 * 1024), mimeType: 'image/webp' }, revision: 1, projectRevision: 1, dirty: false, deleted: false });
    }
    await tx.done; db.close();
    const bulkReads = vi.spyOn(IDBIndex.prototype, 'getAll');
    let project = (await app.projects.get(first.id))!;
    for (let i = 0; i < 3; i++) project = await app.projects.save({ ...project, title: `paint ${i}` });
    expect(bulkReads.mock.contexts.filter(index => (index as IDBIndex).objectStore.name === 'thumbnails')).toHaveLength(0);
    expect(app.sync.status.unsyncedCount).toBe(1);
  });
  it('A02-01 protects another tab’s unsynced edit while a delete confirmation holds an older snapshot', async () => {
    const cloud = new MemoryCloud(); const name = crypto.randomUUID(); const a = device(cloud, () => false, name); const b = device(cloud, () => false, name);
    await Promise.all([a.ready,b.ready]);
    const created = await a.projects.create({ templateId: 'ocean', title: '確認中' });
    const displayed = (await b.projects.get(created.id))!;
    await a.projects.save({ ...created, title: '別の画面の編集' });
    await expect(b.projects.delete(displayed)).rejects.toMatchObject({ code: 'CHANGED' });
    // JSON snapshots have no Symbol revision. Content comparison still protects offline edits
    // whose baseVersion has not changed.
    await expect(b.projects.delete(JSON.parse(JSON.stringify(displayed)))).rejects.toMatchObject({ code: 'CHANGED' });
    const reviewed = (await b.projects.get(created.id))!;
    await b.projects.delete(reviewed);
    expect(await b.projects.get(created.id)).toBeUndefined();
    expect(b.sync.status.unsyncedCount).toBe(1);
  });
  it('A02-03 tolerates thumbnail upload failure and never pins the old image across restart', async () => {
    const cloud = new MemoryCloud(); const name = crypto.randomUUID(); const a = device(cloud); const b = device(cloud, () => true, name); await Promise.all([a.ready,b.ready]);
    const red = await a.projects.create({ templateId: 'ocean', title: '赤' }); await a.thumbnails.set(red.id, new Blob(['red'], { type: 'image/png' }), red);
    await a.sync.flush(); await b.sync.flush(); expect(await (await b.thumbnails.get(red.id))?.text()).toBe('red');
    const blue = await a.projects.save({ ...(await a.projects.get(red.id))!, title: '青', backgroundId: 'sky' }); await a.sync.flush();
    await a.thumbnails.set(blue.id, new Blob(['blue'], { type: 'image/png' }), blue);
    vi.spyOn(cloud, 'uploadThumbnail').mockRejectedValueOnce(new Error('upload failed'));
    await a.sync.flush(); expect(a.sync.status.unsyncedCount).toBe(1);
    await b.sync.flush(); expect(await b.thumbnails.get(red.id)).toBeUndefined();
    await b.dispose(); services.splice(services.indexOf(b), 1);
    const restarted = device(cloud, () => true, name); await restarted.ready;
    expect(await restarted.thumbnails.get(red.id)).toBeUndefined();
    await a.sync.flush(); await restarted.sync.flush();
    expect(await (await restarted.thumbnails.get(red.id))?.text()).toBe('blue');
  });
  it('A02-03/04 upgrades v1 outbox indexes and invalidates thumbnails with unknown source version', async () => {
    const name = crypto.randomUUID(); const project = makeProject(); const key = projectKey(USER_A, project.id);
    const legacy = await openDB(name, 1, { upgrade(db) {
      db.createObjectStore('projects', { keyPath: 'key' }).createIndex('by-user','userId');
      db.createObjectStore('thumbnails', { keyPath: 'key' }).createIndex('by-user','userId');
      db.createObjectStore('settings', { keyPath: 'userId' }); db.createObjectStore('leases', { keyPath: 'key' });
    } });
    await legacy.put('projects', { key, userId: USER_A, project, revision: 1, baseVersion: 0, writerId: 'old', operationId: crypto.randomUUID(), dirty: true, deleted: false });
    await legacy.put('thumbnails', { key, userId: USER_A, projectId: project.id, blob: { bytes: new ArrayBuffer(4096), mimeType: 'image/png' }, revision: 1, projectRevision: 1, dirty: false, deleted: false });
    legacy.close();
    const app = device(new MemoryCloud(), () => false, name); await app.ready;
    expect(app.sync.status.unsyncedCount).toBe(1);
    expect((await app.projects.get(project.id))?.title).toBe(project.title);
    expect(await app.thumbnails.get(project.id)).toBeUndefined();
    const db = await openLocalDatabase(name);
    expect(await db.getAllKeysFromIndex('projects', 'by-pending-user', USER_A)).toEqual([key]);
    db.close();
  });
});

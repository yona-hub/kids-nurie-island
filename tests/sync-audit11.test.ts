import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, validateBackup, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import { MemoryCloud, TestAuth, USER_A, USER_B, backup, makeProject } from './sync.helpers';

const services: IslandServices[] = [];
function device(cloud: MemoryCloud, online = () => true, dbName = crypto.randomUUID()) {
  const app = createServices({ cloud, authAdapter: new TestAuth(), online, dbName, debounceMs: 60_000 });
  services.push(app); return app;
}
function seed(cloud: MemoryCloud, count: number) {
  const projects = Array.from({ length: count }, () => makeProject(USER_A, { version: 1 }));
  for (const project of projects) cloud.records.set(project.id, { project, deleted: false });
  return projects;
}
async function stop(app: IslandServices) { await app.dispose(); services.splice(services.indexOf(app), 1); }
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(services.splice(0).map(app => app.dispose())); });

describe('sync consistency audit 11 regressions', () => {
  it('A11-01 pulls all 500 works despite a rejected first push, retaining and retrying that work after deletion', async () => {
    const cloud = new MemoryCloud(); seed(cloud, 500); let online = false;
    const pull = vi.spyOn(cloud, 'list'); const app = device(cloud, () => online); await app.ready;
    const pending = await app.projects.create({ templateId: 'ocean', title: 'まだ送れていない色' });
    online = true;
    for (let i = 0; i < 3; i++) await app.sync.flush();
    expect(pull).toHaveBeenCalledTimes(3);
    expect(await app.projects.count()).toBe(501); expect(app.sync.status.unsyncedCount).toBe(1);
    expect((await app.projects.get(pending.id))?.title).toBe(pending.title);
    expect(app.sync.status.state).toBe('error');
    await expect(app.backup.export()).rejects.toMatchObject({ code: 'LIMIT', message: expect.stringContaining('500件を超えています') });
    expect(await app.projects.count()).toBe(501);
    const removed = (await app.projects.list()).find(project => project.id !== pending.id)!;
    await app.projects.delete(removed); await app.sync.flush();
    expect(cloud.records.get(removed.id)?.deleted).toBe(true);
    expect(cloud.records.get(pending.id)?.project.title).toBe(pending.title);
    expect([...cloud.records.values()].filter(record => !record.deleted)).toHaveLength(500);
    expect(app.sync.status.unsyncedCount).toBe(0); expect(app.sync.status.state).toBe('idle');
    const exported = validateBackup(JSON.parse(await (await app.backup.export()).text()));
    expect(exported.projects).toHaveLength(500); expect(exported.projects.some(project => project.id === pending.id)).toBe(true);
    const restored = device(new MemoryCloud(), () => false); await restored.ready;
    expect(await restored.backup.import(JSON.stringify(exported))).toBe(500);
    expect((await restored.projects.list()).some(project => project.title === pending.title)).toBe(true);
  });

  it('A11-01 continues an existing update after a last-slot race rejects an earlier queued create', async () => {
    const cloud = new MemoryCloud(); seed(cloud, 498);
    const last = makeProject(USER_A, { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', version: 1 });
    cloud.records.set(last.id, { project: last, deleted: false });
    let online = true; const app = device(cloud, () => online); await app.ready; await app.sync.flush();
    online = false;
    const pending = await app.projects.create({ templateId: 'ocean', title: '最後の空き枠' });
    await app.projects.save({ ...(await app.projects.get(last.id))!, title: '500件でも編集を保存' });
    const otherDevice = seed(cloud, 1)[0]; const sends = vi.spyOn(cloud, 'save');
    online = true; await app.sync.flush();
    expect(sends.mock.calls.map(([project]) => project.id)).toEqual([pending.id, last.id]);
    expect(cloud.records.get(last.id)?.project.title).toBe('500件でも編集を保存');
    expect((await app.projects.get(otherDevice.id))?.id).toBe(otherDevice.id);
    expect(app.sync.status.unsyncedCount).toBe(1);
  });

  it('A11-02 keeps the editing tab on one durable copy after another tab preserves and its sync leader is replaced', async () => {
    const cloud = new MemoryCloud(); const original = seed(cloud, 1)[0]; const name = crypto.randomUUID();
    const editor = device(cloud, () => false, name); const leader = device(cloud, () => true, name);
    await Promise.all([editor.ready, leader.ready]); await leader.sync.flush();
    const edited = await editor.projects.save({ ...(await editor.projects.get(original.id))!, title: '編集中の赤' });
    cloud.records.set(original.id, { project: { ...original, version: 2, title: '別の端末の青' }, deleted: false });
    await leader.sync.flush();
    const preserved = (await editor.projects.list()).find(project => project.id !== original.id)!;
    expect(await editor.projects.count()).toBe(2);
    await stop(leader); const nextLeader = device(cloud, () => true, name); await nextLeader.ready;
    const writes = await Promise.all(Array.from({ length: 12 }, (_, i) => editor.projects.save({ ...edited, title: `続き${i}` })));
    expect(new Set(writes.map(project => project.id))).toEqual(new Set([preserved.id]));
    await nextLeader.sync.flush();
    expect(await editor.projects.count()).toBe(2); expect(cloud.records.get(preserved.id)?.project.title).toBe('続き11');
    expect(cloud.records.get(original.id)?.project.title).toBe('別の端末の青');
    const newlyOpened = (await editor.projects.get(original.id))!;
    const originalEdit = await editor.projects.save({ ...newlyOpened, title: '新しく開いた原本' });
    expect(originalEdit.id).toBe(original.id); await nextLeader.sync.flush();
    expect(cloud.records.get(original.id)?.project.title).toBe('新しく開いた原本');
    expect(cloud.records.get(preserved.id)?.project.title).toBe('続き11');
  });

  it.each([63, 64, 'user-preservedFrom'] as const)('A11-03 preserves every user metadata field (%s) through repeated conflicts, editing and backup restore', async size => {
    const metadata = Object.fromEntries(Array.from({ length: size === 'user-preservedFrom' ? 63 : size }, (_, i) => [`key${i}`, `value${i}`]));
    if (size === 'user-preservedFrom') metadata.preservedFrom = '利用者が付けた値';
    const cloud = new MemoryCloud(); const app = device(cloud); await app.ready;
    await app.backup.import(backup([makeProject(USER_A, { metadata })])); await app.sync.flush();
    const original = (await app.projects.list())[0]; let editing = original;
    for (let i = 0; i < 2; i++) {
      const remote = cloud.records.get(editing.id)!;
      cloud.records.set(editing.id, { project: { ...remote.project, version: remote.project.version + 1, title: `remote${i}` }, deleted: false });
      const local = await app.projects.save({ ...editing, title: `local${i}` }); await app.sync.flush();
      for (const project of await app.projects.list()) expect(project.metadata).toEqual(metadata);
      validateBackup(JSON.parse(await (await app.backup.export()).text()));
      editing = await app.projects.save({ ...local, title: `continued${i}` }); await app.sync.flush();
      expect(editing.metadata).toEqual(metadata);
      expect(app.sync.status.unsyncedCount).toBe(0);
    }
    const exported = validateBackup(JSON.parse(await (await app.backup.export()).text()));
    expect(exported.projects).toHaveLength(3);
    for (const project of exported.projects) expect(project.metadata).toEqual(metadata);
    const restored = device(new MemoryCloud(), () => false); await restored.ready;
    expect(await restored.backup.import(JSON.stringify(exported))).toBe(3);
    for (const project of await restored.projects.list()) expect(project.metadata).toEqual(metadata);
  });

  it('A11-02 isolates two stale editors sharing a generation and follows repeated cloud preservation routes', async () => {
    const cloud = new MemoryCloud(); const original = seed(cloud, 1)[0]; const name = crypto.randomUUID();
    const a = device(cloud, () => false, name), b = device(cloud, () => false, name), leader = device(cloud, () => true, name);
    await Promise.all([a.ready, b.ready, leader.ready]); await leader.sync.flush();
    const aView = (await a.projects.get(original.id))!, bView = (await b.projects.get(original.id))!;
    const aEdit = await a.projects.save({ ...aView, title: 'Aの編集' });
    const bEdit = await b.projects.save({ ...bView, title: 'Bの編集' });
    expect(bEdit.id).not.toBe(aEdit.id);
    cloud.records.set(original.id, { project: { ...original, version: 2, title: 'クラウド原本' }, deleted: false });
    await leader.sync.flush();
    const continuedA = await a.projects.save({ ...aEdit, title: 'Aの続き' });
    const continuedB = await b.projects.save({ ...bView, title: 'Bの続き' });
    expect(continuedA.id).not.toBe(continuedB.id); expect(continuedB.id).toBe(bEdit.id);
    await leader.sync.flush();
    const remoteA = cloud.records.get(continuedA.id)!;
    cloud.records.set(continuedA.id, { project: { ...remoteA.project, version: remoteA.project.version + 1, title: 'コピーのクラウド版' }, deleted: false });
    await a.projects.save({ ...aEdit, title: '古い原本IDからの連続操作' }); await leader.sync.flush();
    const twicePreserved = await a.projects.save({ ...aEdit, title: '二度の退避のあとも同じ編集' }); await leader.sync.flush();
    expect(twicePreserved.id).not.toBe(continuedA.id);
    expect(await a.projects.count()).toBe(4);
    expect(cloud.records.get(original.id)?.project.title).toBe('クラウド原本');
    expect(cloud.records.get(bEdit.id)?.project.title).toBe('Bの続き');
    expect(cloud.records.get(continuedA.id)?.project.title).toBe('コピーのクラウド版');
    expect(cloud.records.get(twicePreserved.id)?.project.title).toBe('二度の退避のあとも同じ編集');
    await leader.projects.delete((await leader.projects.get(twicePreserved.id))!); await leader.sync.flush();
    await expect(a.projects.save({ ...aEdit, title: '削除後の古い画面' })).rejects.toMatchObject({ code: 'DELETED' });
    expect(await a.projects.count()).toBe(3);
  });

  it('A11-02 upgrades v2 without losing queued edits, versioned thumbnails or user metadata', async () => {
    const name = crypto.randomUUID(), project = makeProject(USER_A, { metadata: { preservedFrom: 'user value' } });
    const key = projectKey(USER_A, project.id);
    const legacy = await openDB(name, 2, { upgrade(db) {
      for (const name of ['projects', 'thumbnails']) {
        const store = db.createObjectStore(name, { keyPath: 'key' });
        store.createIndex('by-user', 'userId'); store.createIndex('by-pending-user', 'pendingUserId');
      }
      db.createObjectStore('settings', { keyPath: 'userId' }); db.createObjectStore('leases', { keyPath: 'key' });
    } });
    const operationId = crypto.randomUUID();
    await legacy.put('projects', { key, userId: USER_A, project, revision: 7, baseVersion: 0, writerId: 'old', operationId, dirty: true, deleted: false, pendingUserId: USER_A });
    await legacy.put('thumbnails', { key, userId: USER_A, projectId: project.id, blob: { bytes: new TextEncoder().encode('paint').buffer, mimeType: 'image/png' }, revision: 1, projectRevision: 7, source: 'local', dirty: true, deleted: false, pendingUserId: USER_A });
    legacy.close();
    const app = device(new MemoryCloud(), () => false, name); await app.ready;
    expect((await app.projects.get(project.id))?.metadata).toEqual(project.metadata);
    expect(await (await app.thumbnails.get(project.id))?.text()).toBe('paint');
    expect(app.sync.status.unsyncedCount).toBe(1);
    const db = await openLocalDatabase(name);
    expect(db.version).toBe(3);
    expect(await db.get('projects', key)).toMatchObject({ revision: 7, operationId, editGeneration: expect.any(String) });
    expect(await db.getAll('editorRoutes')).toEqual([]); db.close();
  });

  it('A11-02 deletes only the confirmed owner’s durable editing routes with their account data', async () => {
    const cloud = new MemoryCloud(); const name = crypto.randomUUID();
    const original = seed(cloud, 1)[0]; const a = device(cloud, () => true, name); await a.ready; await a.sync.flush();
    cloud.records.set(original.id, { project: { ...original, version: 2 }, deleted: false });
    await a.projects.save({ ...(await a.projects.get(original.id))!, title: '退避される色' }); await a.sync.flush();
    const db = await openLocalDatabase(name);
    const aRoute = (await db.getAllFromIndex('editorRoutes', 'by-user', USER_A))[0]; expect(aRoute).toBeTruthy();
    const otherRoute = { ...aRoute, key: `other-${aRoute.key}`, userId: USER_B };
    await db.put('editorRoutes', otherRoute);
    await a.deleteAccountData(USER_A);
    expect(await db.getAllFromIndex('editorRoutes', 'by-user', USER_A)).toEqual([]);
    expect(await db.getAllFromIndex('editorRoutes', 'by-user', USER_B)).toEqual([otherRoute]); db.close();
  });
});

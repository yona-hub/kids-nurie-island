import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey, type LocalRow } from '../packages/persistence/src/local';
import { MemoryCloud, TestAuth, USER_A, USER_B, backup, deferred, makeProject } from './sync.helpers';

const apps: IslandServices[] = [];
function fixture(cloud?: MemoryCloud, name = crypto.randomUUID()) {
  const auth = new TestAuth(USER_A, !cloud);
  const app = createServices({ dbName: name, authAdapter: auth, cloud, online: () => true, debounceMs: 60000 });
  apps.push(app); return { app, auth, name };
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(apps.splice(0).map(app => app.dispose())); });

describe('A19-02 unreadable local records preserve healthy work and raw recovery data', () => {
  it.each(['null', 'date', 'schema', 'regions'])('isolates one %s payload without deleting it, including after restart', async variant => {
    const { app, name } = fixture(); await app.ready;
    const healthy = await app.projects.create({ templateId: 'ocean', title: '元気な作品' });
    const second = await app.projects.create({ templateId: 'ocean', title: 'もうひとつ' });
    const damaged = await app.projects.create({ templateId: 'ocean', title: '残す元データ' });
    const db = await openLocalDatabase(name), key = projectKey(USER_A, damaged.id), row = (await db.get('projects', key))!;
    const payload = variant === 'null' ? null : variant === 'date' ? { ...row.project, updatedAt: 'not-a-date' } : variant === 'schema' ? { ...row.project, schemaVersion: 999 } : { ...row.project, regions: { fish: { color: 'pink', paintType: 'unknown' } } };
    await db.put('projects', { ...row, project: payload } as unknown as LocalRow);
    expect((await app.projects.list()).map(value => value.id).sort()).toEqual([healthy.id, second.id].sort());
    expect(app.recovery.count).toBe(1);
    await expect(app.projects.get(damaged.id)).rejects.toMatchObject({ code: 'VALIDATION', message: expect.stringContaining('元データ') });
    const edited = await app.projects.save({ ...healthy, regions: { fish: { color: '#2598FF', paintType: 'pencil' } } });
    expect((await app.projects.get(healthy.id))?.regions).toEqual(edited.regions);
    const output = JSON.parse(await (await app.backup.export()).text());
    expect(output.projects).toHaveLength(2); expect(output.excludedUnreadableRecords).toHaveLength(1);
    const raw = JSON.parse(await (await app.recovery.export(key)).text());
    expect(raw.record.project).toEqual(payload); expect(raw.record.revision).toBe(row.revision); expect(raw.record.operationId).toBe(row.operationId);
    expect((await db.get('projects', key))?.project).toEqual(payload); expect(await db.count('projects')).toBe(3);
    await app.dispose(); apps.splice(apps.indexOf(app), 1);
    const restarted = fixture(undefined, name).app; await restarted.ready;
    expect(await restarted.projects.list()).toHaveLength(2); expect(await restarted.recovery.list()).toHaveLength(1);
    // Standard backup import adds healthy copies; it does not discard the unreadable source.
    expect(await restarted.backup.import(backup([damaged]))).toBe(1);
    expect(await restarted.projects.list()).toHaveLength(3); expect((await db.get('projects', key))?.project).toEqual(payload);
    db.close();
  });

  it('synchronizes healthy rows while preserving a damaged request, thumbnail and cloud copy', async () => {
    const cloud = new MemoryCloud(), { app, name } = fixture(cloud); await app.ready;
    const damaged = await app.projects.create({ templateId: 'ocean', title: 'クラウドにある作品' }); await app.sync.flush();
    const db = await openLocalDatabase(name), key = projectKey(USER_A, damaged.id), row = (await db.get('projects', key))!;
    const pending = { ...row, operationId: crypto.randomUUID(), dirty: true };
    await db.put('projects', { ...row, project: null, dirty: true, pendingUserId: USER_A, pendingCommit: pending } as unknown as LocalRow);
    await db.put('thumbnails', { key, userId: USER_A, projectId: damaged.id, dirty: true, pendingUserId: USER_A, revision: 3, deleted: false, blob: { bytes: new TextEncoder().encode('retained image').buffer, mimeType: 'image/png' } });
    const healthy = await app.projects.create({ templateId: 'ocean', title: '送信できる作品' });
    await app.sync.flush();
    expect(cloud.records.get(healthy.id)?.project.title).toBe('送信できる作品');
    expect(cloud.records.get(damaged.id)?.project.title).toBe('クラウドにある作品');
    const retained = (await db.get('projects', key))!;
    expect(retained.project).toBeNull(); expect(retained.pendingCommit).toEqual(pending); expect(retained.pendingUserId).toBeUndefined();
    expect((await db.get('thumbnails', key))?.blob).toBeTruthy(); expect((await db.get('thumbnails', key))?.pendingUserId).toBeUndefined();
    expect(app.sync.status.unsyncedCount).toBe(0); expect(await app.recovery.list()).toHaveLength(1);
    await app.recovery.removeLocal(key);
    expect(await db.get('projects', key)).toBeUndefined(); expect(await db.get('thumbnails', key)).toBeUndefined();
    expect(cloud.records.get(damaged.id)?.deleted).toBe(false);
    await app.sync.flush(); expect((await app.projects.get(damaged.id))?.title).toBe('クラウドにある作品');
    expect(await app.recovery.list()).toHaveLength(0); db.close();
  });

  it('does not overwrite quarantined evidence with a late cloud acknowledgement', async () => {
    const cloud = new MemoryCloud(), { app, name } = fixture(cloud); await app.ready;
    const work = await app.projects.create({ templateId: 'ocean', title: '送信中' });
    const entered = deferred(), release = deferred();
    cloud.beforeSave = async () => { cloud.beforeSave = undefined; entered.resolve(); await release.promise; };
    const syncing = app.sync.flush(); await entered.promise;
    const db = await openLocalDatabase(name), key = projectKey(USER_A, work.id), row = (await db.get('projects', key))!;
    await db.put('projects', { ...row, project: null } as unknown as LocalRow);
    expect(await app.projects.list()).toEqual([]);
    release.resolve(); await syncing;
    const retained = (await db.get('projects', key))!;
    expect(retained.project).toBeNull(); expect(retained.pendingCommit).toEqual(row.pendingCommit);
    expect(cloud.records.size).toBe(1); expect(cloud.records.get(work.id)?.project.title).toBe('送信中'); db.close();
  });

  it('binds raw export and cleanup to the originating account and rejects healthy cleanup', async () => {
    const { app, auth, name } = fixture(); await app.ready;
    const work = await app.projects.create({ templateId: 'ocean', title: 'A' });
    const healthy = await app.projects.create({ templateId: 'ocean', title: '正常' });
    const db = await openLocalDatabase(name), key = projectKey(USER_A, work.id), row = (await db.get('projects', key))!;
    await db.put('projects', { ...row, project: null } as unknown as LocalRow); await app.projects.list();
    await expect(app.recovery.removeLocal(projectKey(USER_A, healthy.id))).rejects.toMatchObject({ code: 'CHANGED' });
    const exporting = app.recovery.export(key), deleting = app.recovery.removeLocal(key);
    auth.setSession({ userId: USER_B, provider: 'demo', localOnly: true });
    await expect(exporting).rejects.toMatchObject({ code: 'AUTH' }); await expect(deleting).rejects.toMatchObject({ code: 'AUTH' });
    expect(app.recovery.count).toBe(0); expect(await app.recovery.list()).toEqual([]);
    await expect(app.recovery.export(key)).rejects.toMatchObject({ code: 'AUTH' }); await expect(app.recovery.removeLocal(key)).rejects.toMatchObject({ code: 'AUTH' });
    expect((await db.get('projects', key))?.project).toBeNull(); expect((await db.get('projects', projectKey(USER_A, healthy.id)))?.project.title).toBe('正常'); db.close();
  });

  it('keeps valid reads and backup available even if the quarantine marker hits the quota', async () => {
    const cloud = new MemoryCloud(), { app, name } = fixture(cloud); await app.ready;
    const healthy = await app.projects.create({ templateId: 'ocean', title: '保護する作品' });
    const work = await app.projects.create({ templateId: 'ocean', title: '壊れた作品' });
    const db = await openLocalDatabase(name), key = projectKey(USER_A, work.id), row = (await db.get('projects', key))!;
    await db.put('projects', { ...row, project: null } as unknown as LocalRow);
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value: LocalRow, key?: IDBValidKey) {
      if (this.name === 'projects' && value.quarantine) throw new DOMException('Full', 'QuotaExceededError');
      return Reflect.apply(put, this, key === undefined ? [value] : [value, key]);
    });
    expect((await app.projects.list()).map(value => value.id)).toEqual([healthy.id]);
    expect(JSON.parse(await (await app.backup.export()).text()).projects).toHaveLength(1);
    await app.sync.flush(); expect(cloud.records.get(healthy.id)?.project.title).toBe('保護する作品');
    expect(cloud.records.has(work.id)).toBe(false); expect(app.sync.status.unsyncedCount).toBe(0);
    expect((await db.get('projects', key))?.project).toBeNull(); db.close();
  });

  it('counts retained unreadable works toward the 500-work quota until explicit cleanup', async () => {
    const { app, name } = fixture(); await app.ready;
    await app.backup.import(backup(Array.from({ length: 500 }, () => makeProject())));
    const target = (await app.projects.list())[0], db = await openLocalDatabase(name), key = projectKey(USER_A, target.id), row = (await db.get('projects', key))!;
    await db.put('projects', { ...row, project: null } as unknown as LocalRow);
    expect(await app.projects.list()).toHaveLength(499); expect(app.recovery.count).toBe(1);
    await expect(app.projects.create({ templateId: 'ocean', title: '501件目' })).rejects.toMatchObject({ code: 'LIMIT' });
    await app.recovery.removeLocal(key);
    await app.projects.create({ templateId: 'ocean', title: '空いた枠' }); expect(await app.projects.count()).toBe(500); db.close();
  });
});

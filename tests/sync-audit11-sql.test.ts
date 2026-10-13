import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createServices, validateBackup, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase } from '../packages/persistence/src/local';
import { TestAuth, backup, makeProject } from './sync.helpers';
import { SqlCloud } from './sync-sql.helpers';

let cloud: SqlCloud;
const services: IslandServices[] = [];
function device(userId: string, online = () => true, dbName = crypto.randomUUID()) {
  const app = createServices({ cloud, authAdapter: new TestAuth(userId), online, dbName, debounceMs: 60_000 });
  services.push(app); return app;
}
beforeAll(async () => { cloud = await SqlCloud.create(); }, 60_000);
afterEach(async () => { await Promise.all(services.splice(0).map(app => app.dispose())); });
afterAll(async () => { await cloud?.db.close(); });

describe('audit 11 actual SQL quota, validation and RLS integration', () => {
  it('A11-01 exposes a full account after real PROJECT_LIMIT and retries a pending create after a real deletion', async () => {
    const userId = crypto.randomUUID(); await cloud.seed(userId, 500); let online = false;
    const app = device(userId, () => online); await app.ready;
    const pending = await app.projects.create({ templateId: 'ocean', title: '未送信の作品' });
    online = true; await app.sync.flush();
    expect(cloud.rejected.some(error => error.includes('PROJECT_LIMIT'))).toBe(true);
    expect(await app.projects.count()).toBe(501); expect(app.sync.status.unsyncedCount).toBe(1);
    expect(app.sync.status.error).toContain('500');
    const original = (await app.projects.list()).find(project => project.id !== pending.id)!;
    await app.projects.save({ ...original, title: 'いっぱいでも保存可能' }); await app.sync.flush();
    expect((await cloud.list(userId)).find(row => row.project.id === original.id)?.project.title).toBe('いっぱいでも保存可能');
    await app.projects.delete((await app.projects.get(original.id))!); await app.sync.flush();
    const remote = await cloud.list(userId);
    expect(remote.filter(row => !row.deleted)).toHaveLength(500);
    expect(remote.find(row => row.project.id === pending.id)?.project.title).toBe(pending.title);
    expect(app.sync.status.unsyncedCount).toBe(0); expect(app.sync.status.state).toBe('idle');
  });

  it('A11-02 continues a retained editor across another sync tab and 499→500 without allocating another slot', async () => {
    const userId = crypto.randomUUID(); await cloud.seed(userId, 499); const name = crypto.randomUUID();
    const editor = device(userId, () => false, name), leader = device(userId, () => true, name);
    await Promise.all([editor.ready, leader.ready]); await leader.sync.flush();
    const original = (await editor.projects.list())[0];
    const editing = await editor.projects.save({ ...original, title: '手元の絵' });
    await cloud.save({ ...original, title: '別の端末の絵' }, original.version, crypto.randomUUID());
    await leader.sync.flush(); expect(await editor.projects.count()).toBe(500);
    const preserved = (await editor.projects.list()).find(project => project.title.startsWith('手元の絵'))!;
    await leader.dispose(); services.splice(services.indexOf(leader), 1);
    const nextLeader = device(userId, () => true, name); await nextLeader.ready;
    const next = await editor.projects.save({ ...editing, title: '続きも500件のまま' });
    expect(next.id).toBe(preserved.id); await nextLeader.sync.flush();
    expect((await cloud.list(userId)).filter(row => !row.deleted)).toHaveLength(500);
    expect((await cloud.list(userId)).find(row => row.project.id === next.id)?.project.title).toBe('続きも500件のまま');
    expect(nextLeader.sync.status.unsyncedCount).toBe(0);
    const db = await openLocalDatabase(name);
    const routes = await db.getAllFromIndex('editorRoutes', 'by-user', userId); db.close();
    expect(routes).toHaveLength(1); expect(routes[0]).toMatchObject({ sourceId: original.id, targetId: preserved.id, userId });
    expect(routes[0].editGeneration).toBeTruthy();
  });

  it('A11-03 submits 64 user metadata keys to the real SQL validator after a conflict and restores the exported work', async () => {
    const userId = crypto.randomUUID(); await cloud.seed(userId, 0);
    const metadata = { ...Object.fromEntries(Array.from({ length: 63 }, (_, i) => [`meta${i}`, i])), preservedFrom: '利用者のデータ' };
    const app = device(userId); await app.ready;
    await app.backup.import(backup([makeProject(userId, { metadata })])); await app.sync.flush();
    const original = (await app.projects.list())[0];
    await cloud.save({ ...original, title: 'クラウド側' }, original.version, crypto.randomUUID());
    await app.projects.save({ ...original, title: 'ローカル側' }); await app.sync.flush();
    expect(app.sync.status.unsyncedCount).toBe(0);
    const remote = (await cloud.list(userId)).filter(row => !row.deleted); expect(remote).toHaveLength(2);
    for (const row of remote) expect(row.project.metadata).toEqual(metadata);
    const exported = validateBackup(JSON.parse(await (await app.backup.export()).text()));
    const otherId = crypto.randomUUID(); await cloud.seed(otherId, 0);
    const restored = device(otherId); await restored.ready; await restored.backup.import(JSON.stringify(exported)); await restored.sync.flush();
    expect(restored.sync.status.unsyncedCount).toBe(0);
    for (const row of await cloud.list(otherId)) expect(row.project.metadata).toEqual(metadata);
  });
});

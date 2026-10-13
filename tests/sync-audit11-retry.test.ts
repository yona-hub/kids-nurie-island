import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import { MemoryCloud, TestAuth, USER_A, USER_B, deferred, makeProject } from './sync.helpers';

const services: IslandServices[] = [];
function device(cloud: MemoryCloud, auth = new TestAuth(), dbName = crypto.randomUUID(), debounceMs = 60_000, online = () => true) {
  const app = createServices({ cloud, authAdapter: auth, dbName, debounceMs, online }); services.push(app); return app;
}
async function stop(app: IslandServices) { await app.dispose(); services.splice(services.indexOf(app), 1); }
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(services.splice(0).map(app => app.dispose())); });

describe('audit 11 follow-up: unconfirmed operations and account pull reservations', () => {
  it('replays the unconfirmed payload after another edit and restart before sending the newest state', async () => {
    const cloud = new MemoryCloud(), name = crypto.randomUUID(); const app = device(cloud, undefined, name); await app.ready;
    const original = await app.projects.create({ templateId: 'ocean', title: '原本' }); await app.sync.flush();
    const first = await app.projects.save({ ...(await app.projects.get(original.id))!, title: '応答を失う編集' });
    const sends = vi.spyOn(cloud, 'save'); cloud.loseResponse = true; await app.sync.flush();
    expect(app.sync.status.state).toBe('error');
    await app.projects.save({ ...first, title: '応答を失った後の続き' }); await stop(app);
    const reopened = device(cloud, undefined, name); await reopened.ready; await reopened.sync.flush();
    expect([...cloud.records.values()].filter(row => !row.deleted)).toHaveLength(1);
    expect(cloud.records.get(original.id)?.project).toMatchObject({ title: '応答を失った後の続き', version: 3 });
    expect(sends.mock.calls[1]).toEqual(sends.mock.calls[0]);
    expect(reopened.sync.status.unsyncedCount).toBe(0); expect(reopened.sync.status.notice).toBeUndefined();
  });

  it('automatically pulls B with zero pending work after A’s held list returns', async () => {
    const cloud = new MemoryCloud(), auth = new TestAuth();
    const savedB = makeProject(USER_B, { version: 1, title: 'Bのクラウド作品' }); cloud.records.set(savedB.id, { project: savedB, deleted: false });
    const entered = deferred(), release = deferred(); const realList = cloud.list.bind(cloud);
    const reads = vi.spyOn(cloud, 'list').mockImplementation(async userId => {
      if (userId === USER_A) { entered.resolve(); await release.promise; }
      return realList(userId);
    });
    const app = device(cloud, auth, undefined, 30); await app.ready;
    const old = app.sync.flush(); await entered.promise;
    auth.setSession({ userId: USER_B, provider: 'google', localOnly: false });
    await new Promise(resolve => setTimeout(resolve, 80));
    release.resolve(); await old;
    await vi.waitFor(async () => expect((await app.projects.list()).map(project => project.id)).toEqual([savedB.id]), { timeout: 1000 });
    expect(reads.mock.calls.map(([userId]) => userId)).toContain(USER_B);
    expect(app.sync.status.unsyncedCount).toBe(0);
  });

  it('holds an A save receipt across a switch, pulls B automatically, then replays only A’s request when A returns', async () => {
    const cloud = new MemoryCloud(), auth = new TestAuth(), name = crypto.randomUUID();
    const savedB = makeProject(USER_B, { version: 1 }); cloud.records.set(savedB.id, { project: savedB, deleted: false });
    const app = device(cloud, auth, name, 30); await app.ready;
    const aProject = await app.projects.create({ templateId: 'ocean', title: 'Aの保存中の作品' });
    const entered = deferred(), release = deferred();
    cloud.beforeSave = async () => { cloud.beforeSave = undefined; entered.resolve(); await release.promise; };
    const sends = vi.spyOn(cloud, 'save'); const syncing = app.sync.flush(); await entered.promise;
    auth.setSession({ userId: USER_B, provider: 'google', localOnly: false });
    await new Promise(resolve => setTimeout(resolve, 80)); release.resolve(); await syncing;
    expect((await app.projects.list()).map(project => project.id)).toEqual([savedB.id]);
    const db = await openLocalDatabase(name);
    expect((await db.get('projects', projectKey(USER_A, aProject.id)))?.pendingCommit?.project.userId).toBe(USER_A); db.close();
    auth.setSession({ userId: USER_A, provider: 'google', localOnly: false });
    await vi.waitFor(async () => { expect((await app.projects.get(aProject.id))?.version).toBe(1); expect(app.sync.status.unsyncedCount).toBe(0); });
    expect(sends.mock.calls).toHaveLength(2); expect(sends.mock.calls[1]).toEqual(sends.mock.calls[0]);
    expect(sends.mock.calls.every(([project]) => project.userId === USER_A)).toBe(true);
    expect(cloud.records.get(savedB.id)?.project.version).toBe(1);
    expect((await app.projects.list()).every(project => project.userId === USER_A)).toBe(true);
  });

  it('A→B→A discards the first A generation’s held list and retrieves the newest A snapshot', async () => {
    const cloud = new MemoryCloud(), auth = new TestAuth();
    const project = makeProject(USER_A, { version: 1, title: '旧世代の応答' }); cloud.records.set(project.id, { project, deleted: false });
    const entered = deferred(), release = deferred(); const rawList = cloud.list.bind(cloud); let hold = true;
    const reads = vi.spyOn(cloud, 'list').mockImplementation(async userId => {
      const snapshot = await rawList(userId);
      if (userId === USER_A && hold) { hold = false; entered.resolve(); await release.promise; }
      return snapshot;
    });
    const app = device(cloud, auth, undefined, 30); await app.ready;
    const shown: string[] = [];
    app.projects.subscribe(() => { void app.projects.list().then(projects => { shown.push(...projects.map(project => project.title)); }); });
    const syncing = app.sync.flush(); await entered.promise;
    auth.setSession({ userId: USER_B, provider: 'google', localOnly: false });
    await new Promise(resolve => setTimeout(resolve, 60));
    cloud.records.set(project.id, { project: { ...project, version: 2, title: '戻ってきたAの最新作' }, deleted: false });
    auth.setSession({ userId: USER_A, provider: 'google', localOnly: false });
    await new Promise(resolve => setTimeout(resolve, 60)); release.resolve(); await syncing;
    expect(reads.mock.calls.map(([userId]) => userId)).toEqual([USER_A, USER_A]);
    expect((await app.projects.get(project.id))?.title).toBe('戻ってきたAの最新作');
    expect(shown).not.toContain('旧世代の応答'); expect(app.sync.status.unsyncedCount).toBe(0);
  });

  it('coalesces same-user token notifications without duplicate commits while a request is in flight', async () => {
    const cloud = new MemoryCloud(), auth = new TestAuth(); const app = device(cloud, auth, undefined, 30); await app.ready;
    const project = await app.projects.create({ templateId: 'ocean', title: '色' });
    const entered = deferred(), release = deferred();
    cloud.beforeSave = async () => { cloud.beforeSave = undefined; entered.resolve(); await release.promise; };
    const syncing = app.sync.flush(); await entered.promise;
    auth.setSession({ ...auth.session! }); auth.setSession({ ...auth.session! });
    await new Promise(resolve => setTimeout(resolve, 80)); release.resolve(); await syncing;
    expect(cloud.saves).toBe(1); expect(cloud.records.get(project.id)?.project.version).toBe(1);
    expect(app.sync.status.unsyncedCount).toBe(0); expect(app.sync.status.notice).toBeUndefined();
  });

  it('automatically pulls on offline-owner revalidation even with no local pending work', async () => {
    const cloud = new MemoryCloud(), auth = new TestAuth(); let online = false;
    auth.setSession({ ...auth.session!, offline: true });
    const project = makeProject(USER_A, { version: 1 }); cloud.records.set(project.id, { project, deleted: false });
    const app = device(cloud, auth, undefined, 30, () => online); await app.ready;
    expect(await app.projects.count()).toBe(0); expect(app.sync.status.unsyncedCount).toBe(0);
    online = true; auth.setSession({ ...auth.session!, offline: false });
    await vi.waitFor(async () => expect((await app.projects.list()).map(project => project.id)).toEqual([project.id]));
    expect(app.sync.status.unsyncedCount).toBe(0);
  });
});

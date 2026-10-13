import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { MemoryCloud, TestAuth, USER_A, backup, deferred, makeProject } from './sync.helpers';

const services: IslandServices[] = [];
function device(cloud: MemoryCloud, online = () => true, dbName = crypto.randomUUID(), debounceMs = 60_000) {
  const result = createServices({ dbName, cloud, authAdapter: new TestAuth(), online, debounceMs }); services.push(result); return result;
}
afterEach(async () => { await Promise.all(services.splice(0).map(service => service.dispose())); vi.useRealTimers(); });

describe('offline outbox and versioned cloud synchronization', () => {
  it('durably saves offline, resumes after restart and uploads thumbnails separately', async () => {
    let connected = false; const cloud = new MemoryCloud(); const name = crypto.randomUUID();
    const a = device(cloud, () => connected, name); await a.ready;
    const project = await a.projects.create({ templateId: 'ocean', title: 'うみ' });
    await a.projects.save({ ...project, regions: { fish: { color: '#2598FF', paintType: 'crayon' } } });
    await a.thumbnails.set(project.id, new Blob(['webp'], { type: 'image/webp' }));
    await a.sync.flush(); expect(a.sync.status.state).toBe('offline'); expect(a.sync.status.unsyncedCount).toBe(1);
    await a.dispose(); services.splice(services.indexOf(a), 1);
    connected = true; const b = device(cloud, () => connected, name); await b.ready; await b.sync.flush();
    expect(cloud.records.get(project.id)?.project.regions.fish.color).toBe('#2598FF');
    expect(cloud.thumbnails.has(`${USER_A}/${project.id}.v1`)).toBe(true);
    expect(b.sync.status.state).toBe('idle'); expect(b.sync.status.unsyncedCount).toBe(0);
  });
  it('protects the newer cloud version and copies stale-device changes without merging them', async () => {
    const cloud = new MemoryCloud(); const a = device(cloud); const b = device(cloud); await Promise.all([a.ready,b.ready]);
    const original = await a.projects.create({ templateId: 'ocean', title: 'うみ' }); await a.sync.flush(); await b.sync.flush();
    const stale = (await b.projects.get(original.id))!;
    const newer = (await a.projects.get(original.id))!;
    await a.projects.save({ ...newer, regions: { fish: { color: '#2598FF', paintType: 'smooth' } } }); await a.sync.flush();
    await b.projects.save({ ...stale, regions: { fish: { color: '#F44336', paintType: 'pencil' } } }); await b.sync.flush();
    const live = [...cloud.records.values()].filter(row => !row.deleted);
    expect(live).toHaveLength(2);
    expect(cloud.records.get(original.id)?.project.regions.fish.color).toBe('#2598FF');
    expect(live.find(row => row.project.id !== original.id)?.project.regions.fish.color).toBe('#F44336');
    expect(b.sync.status.notice).toContain('別の作品'); expect(b.sync.status.unsyncedCount).toBe(0);
  });
  it('does not acknowledge away edits made while a cloud request is in flight', async () => {
    const cloud = new MemoryCloud(); const app = device(cloud); await app.ready;
    const project = await app.projects.create({ templateId: 'ocean', title: 'はじめ' });
    const entered = deferred(); const release = deferred();
    cloud.beforeSave = async () => { cloud.beforeSave = undefined; entered.resolve(); await release.promise; };
    const syncing = app.sync.flush(); await entered.promise;
    await app.projects.save({ ...project, title: 'いちばん新しい色', regions: { fish: { color: '#FF4FA3', paintType: 'pencil' } } });
    release.resolve(); await syncing;
    expect(cloud.records.get(project.id)?.project.title).toBe('いちばん新しい色');
    expect(cloud.records.size).toBe(1); expect(cloud.records.get(project.id)?.project.version).toBe(2);
    expect(app.sync.status.unsyncedCount).toBe(0);
  });
  it('retries an ambiguous committed response idempotently after a crash', async () => {
    const cloud = new MemoryCloud(); const name = crypto.randomUUID(); const a = device(cloud, () => true, name); await a.ready;
    const project = await a.projects.create({ templateId: 'ocean', title: 'うみ' });
    cloud.loseResponse = true; await a.sync.flush();
    expect(a.sync.status.state).toBe('error'); expect(a.sync.status.unsyncedCount).toBe(1); expect(cloud.records.size).toBe(1);
    await a.dispose(); services.splice(services.indexOf(a), 1);
    const b = device(cloud, () => true, name); await b.ready; await b.sync.flush();
    expect(cloud.records.size).toBe(1); expect(cloud.records.get(project.id)?.project.version).toBe(1);
    expect(b.sync.status.unsyncedCount).toBe(0);
  });
  it('persists deletion offline and prevents an older device from resurrecting the deleted ID', async () => {
    const cloud = new MemoryCloud(); let connected = true; const a = device(cloud, () => connected); const b = device(cloud); await Promise.all([a.ready,b.ready]);
    const project = await a.projects.create({ templateId: 'ocean', title: 'うみ' }); await a.sync.flush(); await b.sync.flush();
    const stale = (await b.projects.get(project.id))!;
    connected = false; await a.projects.delete(project); await a.sync.flush(); expect(await a.projects.get(project.id)).toBeUndefined();
    connected = true; await a.sync.flush(); expect(cloud.records.get(project.id)?.deleted).toBe(true);
    await b.projects.save({ ...stale, title: '残したい色' }); await b.sync.flush();
    expect(cloud.records.get(project.id)?.deleted).toBe(true);
    const copies = [...cloud.records.values()].filter(row => !row.deleted);
    expect(copies).toHaveLength(1); expect(copies[0].project.id).not.toBe(project.id); expect(copies[0].project.title).toContain('残したい色');
  });
  it('retains a failed save, supports explicit retry, and avoids duplicate parallel flushes', async () => {
    const cloud = new MemoryCloud(); const app = device(cloud); await app.ready;
    const project = await app.projects.create({ templateId: 'ocean', title: 'うみ' }); cloud.fail = true;
    await app.sync.flush(); expect(app.sync.status.state).toBe('error'); expect((await app.projects.get(project.id))?.id).toBe(project.id);
    cloud.fail = false; cloud.saves = 0;
    await Promise.all([app.sync.flush(), app.sync.flush(), app.sync.flush()]);
    expect(cloud.saves).toBe(1); expect(app.sync.status.unsyncedCount).toBe(0);
  });
  it.each([{ label: 'default 1500ms', delay: 1500 }, { label: 'configured 100ms', delay: 100, configured: 100 }])('debounce boundary: $label restarts at the last durable edit', async ({ delay, configured }) => {
    // Leave IDB's setImmediate work real; only the application's deadline clock is fake.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const cloud = new MemoryCloud();
    const app = createServices({ dbName: crypto.randomUUID(), cloud, authAdapter: new TestAuth(), online: () => true, ...(configured === undefined ? {} : { debounceMs: configured }) });
    services.push(app); await app.ready;
    const settleStorage = async () => { for (let turn = 0; turn < 40; turn++) await new Promise<void>(resolve => setImmediate(resolve)); };
    const advance = async (milliseconds: number) => { await vi.advanceTimersByTimeAsync(milliseconds); await settleStorage(); };
    const project = await app.projects.create({ templateId: 'ocean', title: 'first' });
    await advance(delay - 1);
    expect(cloud.saves).toBe(0);
    await app.projects.save({ ...project, title: 'second' });
    await advance(1); // The first edit's original deadline must no longer send anything.
    expect(cloud.saves).toBe(0);
    await advance(delay - 2);
    expect(cloud.saves).toBe(0);
    await app.projects.save({ ...project, title: 'latest', regions: { fish: { color: '#2598FF', paintType: 'pencil' } } });
    await advance(1); // The second edit's deadline is cancelled too.
    expect(cloud.saves).toBe(0);
    await advance(delay - 2);
    expect(cloud.saves).toBe(0);
    expect(app.sync.status.unsyncedCount).toBe(1);
    await advance(1); // Exactly the configured/default interval after the last edit.
    expect(cloud.saves).toBe(1);
    // Wait only for the already-started operation's IDB acknowledgement, without forcing a flush.
    await settleStorage();
    expect(cloud.records.get(project.id)?.project.title).toBe('latest');
    expect(cloud.records.get(project.id)?.project.regions.fish).toEqual({ color: '#2598FF', paintType: 'pencil' });
    expect(app.sync.status.unsyncedCount).toBe(0);
    await advance(delay * 2);
    expect(cloud.saves).toBe(1);
  });
  it('keeps full-account conflict edits locally until a slot is freed, then saves both versions', async () => {
    const cloud = new MemoryCloud(); let connected = false;
    const app = device(cloud, () => connected); await app.ready;
    await app.backup.import(backup(Array.from({ length: 500 }, () => makeProject())));
    connected = true; await app.sync.flush();
    const target = (await app.projects.list())[0];
    const remote = cloud.records.get(target.id)!;
    remote.project = { ...remote.project, version: remote.project.version + 1, title: 'クラウドで新しい作品' };
    await app.projects.save({ ...target, title: 'この端末の大切な色' }); await app.sync.flush();
    expect(app.sync.status.state).toBe('error'); expect(app.sync.status.unsyncedCount).toBe(1);
    expect((await app.projects.get(target.id))?.title).toBe('この端末の大切な色');
    expect(cloud.records.get(target.id)?.project.title).toBe('クラウドで新しい作品');
    const removed = (await app.projects.list()).find(project => project.id !== target.id)!;
    await app.projects.delete(removed); await app.sync.flush();
    expect([...cloud.records.values()].filter(row => !row.deleted)).toHaveLength(500);
    expect([...cloud.records.values()].find(row => row.project.id !== target.id && row.project.title.startsWith('この端末の大切な色'))).toBeTruthy();
    expect(app.sync.status.unsyncedCount).toBe(0);
  });
  it('keeps a newer cloud work when a stale device deletes and continues painting into its preserved copy', async () => {
    const cloud = new MemoryCloud(); const a = device(cloud); const b = device(cloud); await Promise.all([a.ready,b.ready]);
    const first = await a.projects.create({ templateId: 'ocean', title: 'うみ' }); await a.sync.flush(); await b.sync.flush();
    await a.projects.save({ ...(await a.projects.get(first.id))!, title: '新しい作品' }); await a.sync.flush();
    await b.projects.delete(first); await b.sync.flush();
    expect(cloud.records.get(first.id)?.deleted).toBe(false); expect((await b.projects.get(first.id))?.title).toBe('新しい作品');
    const stale = (await b.projects.get(first.id))!;
    await a.projects.save({ ...(await a.projects.get(first.id))!, title: 'さらに新しい作品' }); await a.sync.flush();
    const edited = await b.projects.save({ ...stale, title: 'この画面の作品' }); await b.sync.flush();
    const next = await b.projects.save({ ...edited, title: 'この画面の続き' }); await b.sync.flush();
    expect(next.id).not.toBe(first.id); expect([...cloud.records.values()].filter(row => !row.deleted)).toHaveLength(2);
    expect(cloud.records.get(first.id)?.project.title).toBe('さらに新しい作品');
    expect(cloud.records.get(next.id)?.project.title).toBe('この画面の続き');
  });
});

import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey, type LocalDatabase } from '../packages/persistence/src/local';
import type { Project } from '../packages/shared-types/src/index';
import { MemoryCloud, TestAuth, USER_A, USER_B, backup, makeProject } from './sync.helpers';

const services: IslandServices[] = [];
const databases: LocalDatabase[] = [];
const red = { r01: { color: '#E83A3A', paintType: 'smooth' as const } };
const blue = { r01: { color: '#2466CC', paintType: 'crayon' as const } };
function device(name: string, cloud: MemoryCloud, auth: TestAuth, online = () => false) {
  const app = createServices({ dbName: name, cloud, authAdapter: auth, online, debounceMs: 60_000 });
  services.push(app); return app;
}
async function stop(app: IslandServices) {
  await app.dispose(); services.splice(services.indexOf(app), 1);
}
async function pair(localOnly: boolean) {
  const name = crypto.randomUUID(), cloud = new MemoryCloud();
  const auth = new TestAuth(USER_A, localOnly);
  const writer = device(name, cloud, new TestAuth(USER_A, localOnly));
  const editor = device(name, cloud, auth);
  const otherOwner = device(name, cloud, new TestAuth(USER_B, localOnly));
  await Promise.all([writer.ready, editor.ready, otherOwner.ready]);
  const original = await writer.projects.create({ templateId: 'ocean', title: '原本' });
  const retained = (await editor.projects.get(original.id))!;
  await writer.projects.save({ ...original, regions: red });
  const other = await otherOwner.projects.create({ templateId: 'ocean', title: 'Bの作品' });
  await otherOwner.settings.set({ volume: 0.2 });
  const db = await openLocalDatabase(name); databases.push(db);
  const otherBefore = { row: await db.get('projects', projectKey(USER_B, other.id)), settings: await db.get('settings', USER_B) };
  return { name, cloud, auth, writer, editor, retained, original, other, otherBefore, db };
}
async function outcome(task: Promise<Project>) {
  return task.then(project => ({ code: 'saved', project }), (error: unknown) => ({ code: (error as { code?: string }).code, project: undefined }));
}

/** Keep the real IDB request/transaction scheduler. Only the auth notification (or
 * a synchronous storage exception) is injected at an observed request boundary. */
function observeCopy(name: string, at: 'route' | 'project', action: () => void, beforeProjectWrite?: () => void) {
  const events: string[] = [];
  let targetId: string | undefined, captured = false, notified = false;
  const notifyOnce = () => { if (!notified) { notified = true; action(); } };
  let finish!: (event: 'abort' | 'complete') => void;
  const finished = new Promise<'abort' | 'complete'>(resolve => { finish = resolve; });
  const put = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
    if (this.transaction.db.name === name && this.name === 'projects' && (args[0] as { project?: Project }).project?.id === targetId) beforeProjectWrite?.();
    const request = put.apply(this, args);
    if (this.transaction.db.name !== name) return request;
    if (this.name === 'editorRoutes' && !captured) {
      captured = true;
      targetId = (args[0] as { targetId: string }).targetId;
      this.transaction.addEventListener('abort', () => { events.push('abort'); finish('abort'); }, { once: true });
      this.transaction.addEventListener('complete', () => { events.push('complete'); finish('complete'); }, { once: true });
      request.addEventListener('success', () => { events.push('route-success'); if (at === 'route') notifyOnce(); }, { once: true });
    }
    if (this.name === 'projects' && (args[0] as { project?: Project }).project?.id === targetId) {
      request.addEventListener('success', () => { events.push('project-success'); if (at === 'project') notifyOnce(); }, { once: true });
    }
    return request;
  });
  return { events, finished };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(services.splice(0).map(app => app.dispose()));
  databases.splice(0).forEach(db => db.close());
});

describe.each([{ mode: 'demo', localOnly: true }, { mode: 'cloud', localOnly: false }])('A11-04 save transaction ($mode)', ({ localOnly }) => {
  it.each([
    { boundary: 'route' as const, roundTrip: false },
    { boundary: 'route' as const, roundTrip: true },
    { boundary: 'project' as const, roundTrip: false },
    { boundary: 'project' as const, roundTrip: true },
  ])('aborts $boundary success → account change (A→B→A inside callback: $roundTrip)', async ({ boundary, roundTrip }) => {
    const { name, auth, editor, retained, original, other, otherBefore, db } = await pair(localOnly);
    const a = { ...auth.session! };
    const observation = observeCopy(name, boundary, () => {
      auth.setSession({ userId: USER_B, provider: localOnly ? 'demo' : 'google', localOnly });
      if (roundTrip) auth.setSession(a);
    });
    const failed = await outcome(editor.projects.save({ ...retained, regions: blue }));
    const termination = await observation.finished;
    const rows = await db.getAllFromIndex('projects', 'by-user', USER_A);
    const routes = await db.getAllFromIndex('editorRoutes', 'by-user', USER_A);
    const dangling = routes.filter(route => !rows.some(row => row.project.id === route.targetId));
    const otherAfter = { row: await db.get('projects', projectKey(USER_B, other.id)), settings: await db.get('settings', USER_B) };
    if (!roundTrip) auth.setSession(a);
    const reloaded = (await editor.projects.get(original.id))!;
    const retry = await outcome(editor.projects.save({ ...reloaded, regions: blue }));
    // One aggregate retains the complete old failure: AUTH + complete + dangling route
    // + DELETED after reopening, rather than stopping before the recovery observation.
    expect({ code: failed.code, termination, rows: rows.length, routes: routes.length, dangling: dangling.length,
      paintBeforeRetry: rows.find(row => row.project.id === original.id)?.project.regions, retry: retry.code,
      retryId: retry.project?.id, otherAfter }).toEqual({
      code: 'AUTH', termination: 'abort', rows: 1, routes: 0, dangling: 0,
      paintBeforeRetry: red, retry: 'saved', retryId: original.id, otherAfter: otherBefore,
    });
    expect(observation.events).toEqual(boundary === 'route' ? ['route-success', 'abort'] : ['route-success', 'project-success', 'abort']);
    expect((await editor.projects.get(original.id))?.regions).toEqual(blue);
    expect(editor.sync.status.localSaveFailed).not.toBe(true);
  });

  it('rolls back the successful route when the following project write throws, then allows the retained editor to retry', async () => {
    const { name, editor, retained, db } = await pair(localOnly);
    let throwNextProjectWrite = false;
    const observation = observeCopy(name, 'route', () => { throwNextProjectWrite = true; }, () => {
      if (throwNextProjectWrite) {
        throwNextProjectWrite = false;
        throw new DOMException('capacity after route success', 'QuotaExceededError');
      }
    });
    const failed = await outcome(editor.projects.save({ ...retained, regions: blue }));
    const termination = await observation.finished;
    const routes = await db.getAllFromIndex('editorRoutes', 'by-user', USER_A);
    const retry = await outcome(editor.projects.save({ ...retained, regions: blue }));
    expect({ failed: failed.code, termination, routeCount: routes.length, retry: retry.code }).toEqual({
      failed: 'STORAGE', termination: 'abort', routeCount: 0, retry: 'saved',
    });
    expect(await editor.projects.count()).toBe(2);
    expect(editor.sync.status.localSaveFailed).toBe(false);
  });

  it('commits a normal conflict atomically before save resolves and routes queued edits to the same copy', async () => {
    const { name, editor, retained, original, db } = await pair(localOnly);
    const observation = observeCopy(name, 'route', () => {});
    const pending = Array.from({ length: 8 }, (_, index) => editor.projects.save({ ...retained, title: `続き${index}`, regions: blue }));
    const first = await pending[0]; observation.events.push('save-resolved');
    const saved = await Promise.all(pending);
    expect(await observation.finished).toBe('complete');
    expect(observation.events.slice(0, 3)).toEqual(['route-success', 'project-success', 'complete']);
    expect(observation.events.filter(event => event === 'project-success')).toHaveLength(8);
    expect(observation.events.indexOf('complete')).toBeLessThan(observation.events.indexOf('save-resolved'));
    expect(new Set(saved.map(project => project.id))).toEqual(new Set([first.id]));
    expect(first.id).not.toBe(original.id);
    expect(await editor.projects.count()).toBe(2);
    expect((await editor.projects.get(original.id))?.regions).toEqual(red);
    expect(await editor.projects.get(first.id)).toMatchObject({ title: '続き7', regions: blue });
    const routes = await db.getAllFromIndex('editorRoutes', 'by-user', USER_A);
    expect(routes.map(route => route.targetId)).toEqual([first.id]);
  });

  it('keeps the 499→500 conflict boundary and rejects a new stale editor without a route at 500', async () => {
    const { name, cloud, writer, editor, retained, original, db } = await pair(localOnly);
    const blocked = device(name, cloud, new TestAuth(USER_A, localOnly)); await blocked.ready;
    const old = (await blocked.projects.get(original.id))!;
    await writer.projects.save({ ...old, title: '別タブによる次の編集', regions: red });
    await writer.backup.import(backup(Array.from({ length: 498 }, () => makeProject())));
    await writer.sync.flush();
    const copy = await editor.projects.save({ ...retained, regions: blue });
    expect(await editor.projects.count()).toBe(500);
    const before = await db.getAllFromIndex('editorRoutes', 'by-user', USER_A);
    await expect(blocked.projects.save({ ...old, title: '501件目に退避が必要' })).rejects.toMatchObject({ code: 'LIMIT' });
    expect(await db.getAllFromIndex('editorRoutes', 'by-user', USER_A)).toEqual(before);
    const continued = await editor.projects.save({ ...retained, title: '500件でも同じコピーへ続く' });
    expect(continued.id).toBe(copy.id);
    expect(await editor.projects.count()).toBe(500);
    expect((await editor.projects.get(original.id))?.regions).toEqual(red);
  });
});

it('A11-04 retains a committed edit route across sync-leader handover without copying again', async () => {
  const { name, cloud, writer, editor, retained, original } = await pair(false);
  const copy = await editor.projects.save({ ...retained, regions: blue });
  await stop(writer);
  const leader = device(name, cloud, new TestAuth(), () => true); await leader.ready; await leader.sync.flush();
  await stop(leader);
  const nextLeader = device(name, cloud, new TestAuth(), () => true); await nextLeader.ready;
  const continued = await Promise.all(Array.from({ length: 8 }, (_, index) => editor.projects.save({ ...retained, title: `引継後${index}`, regions: blue })));
  expect(new Set(continued.map(project => project.id))).toEqual(new Set([copy.id]));
  await nextLeader.sync.flush();
  expect([...cloud.records.values()].filter(row => !row.deleted)).toHaveLength(2);
  expect(cloud.records.get(original.id)?.project.regions).toEqual(red);
  expect(cloud.records.get(copy.id)?.project).toMatchObject({ title: '引継後7', regions: blue, version: 2 });
  expect(nextLeader.sync.status.unsyncedCount).toBe(0);
});

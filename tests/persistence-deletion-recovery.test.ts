// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session as SdkSession } from '@supabase/supabase-js';
import { createAuth } from '../packages/persistence/src/auth';
import { SupabaseCloud } from '../packages/persistence/src/cloud';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import { DEFAULT_SETTINGS } from '../packages/shared-types/src/index';
import { MemoryCloud, TestAuth, USER_A, USER_B, makeProject, deferred } from './sync.helpers';

const storageKey = 'sb-deletion-fixture-auth-token';
const removed = new Set<string>();
const requests: Array<{ path: string; userId?: string }> = [];
const apps: IslandServices[] = [];
let loseDeleteResponse = true;
function session(userId = USER_A): SdkSession {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const part = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
  return { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: userId, exp: expires, iat: expires - 3600, role: 'authenticated' })}.${part('fixture')}`, refresh_token: `refresh-${userId}`, token_type: 'bearer', expires_in: 3600, expires_at: expires,
    user: { id: userId, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: '2026-10-06T00:00:00Z' } };
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
async function fixture(dbName = crypto.randomUUID()) {
  const connection = createAuth({ supabaseUrl: 'https://deletion-fixture.supabase.co', publishableKey: 'sb_publishable_fixture', online: () => true });
  const app = createServices({ dbName, authAdapter: connection.adapter, cloud: new SupabaseCloud(connection.client!), online: () => true, debounceMs: 60_000 });
  apps.push(app); await app.ready; return { app, dbName };
}
async function stop(app: IslandServices) { await app.dispose(); apps.splice(apps.indexOf(app), 1); }
async function seed(dbName: string, userId: string) {
  const db = await openLocalDatabase(dbName), project = makeProject(userId), key = projectKey(userId, project.id);
  const tx = db.transaction(['projects', 'thumbnails', 'settings', 'editorRoutes'], 'readwrite');
  await tx.objectStore('projects').put({ key, userId, project, baseVersion: 0, revision: 1, writerId: 'fixture', editGeneration: crypto.randomUUID(), operationId: crypto.randomUUID(), dirty: false, deleted: false });
  await tx.objectStore('thumbnails').put({ key, userId, projectId: project.id, revision: 1, projectRevision: 1, dirty: false, deleted: false, blob: { bytes: new Uint8Array([1, 2, 3]).buffer, mimeType: 'image/png' } });
  await tx.objectStore('settings').put({ userId, value: { ...DEFAULT_SETTINGS, volume: 0.7 } });
  await tx.objectStore('editorRoutes').put({ key, userId, sourceId: project.id, targetId: project.id, writerId: 'fixture', editGeneration: 'fixture' });
  await tx.done; db.close(); return project;
}
async function localData(dbName: string, userId: string) {
  const db = await openLocalDatabase(dbName);
  const result = { projects: await db.getAllFromIndex('projects', 'by-user', userId), thumbnails: await db.getAllFromIndex('thumbnails', 'by-user', userId), settings: await db.get('settings', userId), routes: await db.getAllFromIndex('editorRoutes', 'by-user', userId), journal: await db.get('leases', `deleted:${userId}`) };
  db.close(); return result;
}
beforeEach(() => {
  localStorage.clear(); removed.clear(); requests.length = 0; loseDeleteResponse = true; history.replaceState(null, '', '/');
  localStorage.setItem(storageKey, JSON.stringify(session()));
  vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    const path = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url).pathname;
    const token = new Headers(init?.headers).get('authorization')?.replace(/^Bearer /, '');
    const userId = token?.split('.').length === 3 ? JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))).sub as string : undefined;
    const body = typeof init?.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) as Record<string, unknown> : {};
    requests.push({ path, userId });
    if (path.endsWith('/token')) {
      const owner = String(body.refresh_token).slice('refresh-'.length);
      return removed.has(owner) ? json({ code: 'refresh_token_not_found', msg: 'revoked' }, 400) : json(session(owner));
    }
    if (path.endsWith('/user')) return removed.has(userId!) ? json({ code: 'user_not_found', msg: 'revoked' }, 401) : json(session(userId).user);
    if (path.endsWith('/delete-account-data')) { removed.add(userId!); if (loseDeleteResponse) throw new TypeError('Success response lost after server deletion'); return json({ deleted: true }); }
    if (path.endsWith('/projects')) return json([]);
    if (path.endsWith('/logout')) return json({});
    throw new Error(`Unexpected request ${path}`);
  }));
});
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.dispose())); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('A14-01 real SDK deletion recovery after token revocation', () => {
  it('finishes only the previously consented local cleanup after success-response loss, expiry and restart', async () => {
    const first = await fixture(); await seed(first.dbName, USER_A);
    await expect(first.app.deleteAccountData(USER_A)).rejects.toMatchObject({ code: 'CLOUD' });
    expect(removed.has(USER_A)).toBe(true); expect((await localData(first.dbName, USER_A)).projects).toHaveLength(1);
    await stop(first.app); vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2 * 60 * 60 * 1000);
    const restarted = await fixture(first.dbName);
    expect(restarted.app.auth.session).toBeNull(); expect(localStorage.getItem(storageKey)).toBeNull();
    expect(requests.some(request => request.path.endsWith('/token'))).toBe(true);
    const data = await localData(first.dbName, USER_A);
    expect(data.projects).toEqual([]); expect(data.thumbnails).toEqual([]); expect(data.settings).toBeUndefined(); expect(data.routes).toEqual([]);
    expect(data.journal).toMatchObject({ phase: 'requested', deletion: { userId: USER_A, cloud: 'unknown', local: 'complete' } });
    expect(requests.filter(request => request.path.endsWith('/delete-account-data'))).toHaveLength(1);
    expect(restarted.app.deletionRecovery.state).toMatchObject([{ userId: USER_A, cloud: 'unknown', local: 'complete' }]);
    await restarted.app.deletionRecovery.dismiss(USER_A);
    expect(restarted.app.deletionRecovery.state).toEqual([]);
  });

  it('recovers A in two reopening tabs without changing B data, B token or issuing an account deletion for B', async () => {
    const first = await fixture(); await seed(first.dbName, USER_A); await seed(first.dbName, USER_B);
    await expect(first.app.deleteAccountData(USER_A)).rejects.toMatchObject({ code: 'CLOUD' });
    await stop(first.app);
    localStorage.setItem(storageKey, JSON.stringify(session(USER_B)));
    const savedB = await localData(first.dbName, USER_B), tokenB = localStorage.getItem(storageKey);
    const [tab1, tab2] = await Promise.all([fixture(first.dbName), fixture(first.dbName)]);
    expect((await localData(first.dbName, USER_A)).projects).toEqual([]);
    expect(await localData(first.dbName, USER_B)).toEqual(savedB);
    expect(localStorage.getItem(storageKey)).toBe(tokenB);
    expect(tab1.app.auth.session?.userId).toBe(USER_B); expect(tab2.app.auth.session?.userId).toBe(USER_B);
    expect(requests.filter(request => request.path.endsWith('/delete-account-data'))).toEqual([{ path: '/functions/v1/delete-account-data', userId: USER_A }]);
    expect(requests.filter(request => request.path.endsWith('/logout'))).toEqual([]);
    await Promise.all([tab1.app.deletionRecovery.retryLocal(USER_A), tab2.app.deletionRecovery.retryLocal(USER_A)]);
    expect(await localData(first.dbName, USER_B)).toEqual(savedB); expect(localStorage.getItem(storageKey)).toBe(tokenB);
  });

  it('rolls back a partial local cleanup failure and resumes it after another restart with no session', async () => {
    const first = await fixture(); await seed(first.dbName, USER_A);
    await expect(first.app.deleteAccountData(USER_A)).rejects.toMatchObject({ code: 'CLOUD' });
    await stop(first.app); localStorage.removeItem(storageKey);
    const originalDelete = IDBObjectStore.prototype.delete;
    const fail = vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementation(function (this: IDBObjectStore, query) {
      if (this.name === 'thumbnails') throw new DOMException('Injected disk failure', 'UnknownError');
      return originalDelete.call(this, query);
    });
    const failed = await fixture(first.dbName);
    const remaining = await localData(first.dbName, USER_A);
    expect(remaining.projects).toHaveLength(1); expect(remaining.thumbnails).toHaveLength(1); expect(remaining.routes).toHaveLength(1); expect(remaining.settings).toBeDefined();
    expect(failed.app.deletionRecovery.state).toMatchObject([{ userId: USER_A, local: 'pending', cloud: 'unknown', error: expect.any(String) }]);
    await expect(failed.app.deletionRecovery.dismiss(USER_A)).rejects.toMatchObject({ code: 'STORAGE' });
    await stop(failed.app); fail.mockRestore();
    const restarted = await fixture(first.dbName);
    expect(restarted.app.auth.session).toBeNull();
    expect(await localData(first.dbName, USER_A)).toMatchObject({ projects: [], thumbnails: [], routes: [], settings: undefined, journal: { deletion: { local: 'complete', cloud: 'unknown' } } });
  });

  it('keeps a confirmed cloud result across local failure and completes without another HTTP deletion', async () => {
    const first = await fixture(); await seed(first.dbName, USER_A); loseDeleteResponse = false;
    const originalDelete = IDBObjectStore.prototype.delete;
    const fail = vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementation(function (this: IDBObjectStore, query) {
      if (this.name === 'settings') throw new DOMException('Injected disk failure', 'UnknownError');
      return originalDelete.call(this, query);
    });
    await expect(first.app.deleteAccountData(USER_A)).rejects.toMatchObject({ code: 'STORAGE' });
    expect((await localData(first.dbName, USER_A)).journal).toMatchObject({ deletion: { local: 'pending', cloud: 'confirmed' } });
    await stop(first.app); fail.mockRestore(); localStorage.removeItem(storageKey);
    const restarted = await fixture(first.dbName);
    expect(restarted.app.deletionRecovery.state).toMatchObject([{ local: 'complete', cloud: 'confirmed' }]);
    expect((await localData(first.dbName, USER_A)).journal?.phase).toBe('complete');
    expect(requests.filter(request => request.path.endsWith('/delete-account-data'))).toHaveLength(1);
  });

  it('uses a legacy requested consent even when auth initialization rejects', async () => {
    const dbName = crypto.randomUUID(); await seed(dbName, USER_A); await seed(dbName, USER_B);
    const db = await openLocalDatabase(dbName);
    await db.put('leases', { key: `deleted:${USER_A}`, owner: 'old-tab', expiresAt: Number.MAX_SAFE_INTEGER, phase: 'requested' }); db.close();
    const auth = new TestAuth(USER_B, true); vi.spyOn(auth, 'initialize').mockRejectedValue(new Error('Auth initialization unavailable'));
    const app = createServices({ dbName, authAdapter: auth, online: () => false }); apps.push(app);
    await expect(app.ready).rejects.toThrow('Auth initialization unavailable');
    await vi.waitFor(() => expect(app.deletionRecovery.state).toMatchObject([{ userId: USER_A, local: 'complete', cloud: 'unknown' }]));
    expect((await localData(dbName, USER_A)).projects).toEqual([]); expect((await localData(dbName, USER_B)).projects).toHaveLength(1);
    expect(requests.filter(request => request.path.endsWith('/delete-account-data'))).toEqual([]);
  });

  it('does not resurrect A from an in-flight pull in a tab that missed the cleanup broadcast', async () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const dbName = crypto.randomUUID(), cloud = new MemoryCloud(), gate = deferred(), entered = deferred();
    const auth = new TestAuth(USER_A);
    const first = createServices({ dbName, cloud, authAdapter: auth, online: () => true, debounceMs: 60_000 }); apps.push(first); await first.ready;
    const project = await seed(dbName, USER_A);
    vi.spyOn(cloud, 'list').mockImplementationOnce(async () => { entered.resolve(); await gate.promise; return [{ project, deleted: false }]; });
    const flush = first.sync.flush(); await entered.promise;
    const db = await openLocalDatabase(dbName);
    await db.put('leases', { key: `deleted:${USER_A}`, owner: 'request-tab', expiresAt: Number.MAX_SAFE_INTEGER, phase: 'requested' }); db.close();
    const second = createServices({ dbName, authAdapter: new TestAuth(USER_B, true), online: () => false }); apps.push(second); await second.ready;
    expect((await localData(dbName, USER_A)).projects).toEqual([]);
    gate.resolve(); await flush;
    expect((await localData(dbName, USER_A)).projects).toEqual([]);
    expect(auth.session?.userId).toBe(USER_A);
    expect(second.auth.session?.userId).toBe(USER_B);
  });

  it.each(['absent', 'preparing', 'wrong-owner'] as const)('does not erase an account without its own requested consent (%s)', async (kind) => {
    const dbName = crypto.randomUUID(); await seed(dbName, USER_A); const before = await localData(dbName, USER_A);
    const db = await openLocalDatabase(dbName);
    if (kind !== 'absent') await db.put('leases', { key: `deleted:${USER_A}`, owner: 'fixture', expiresAt: Number.MAX_SAFE_INTEGER, phase: kind === 'preparing' ? 'preparing' : 'requested', ...(kind === 'wrong-owner' ? { deletion: { userId: USER_B, consent: 'delete-account-data' as const, consentedAt: null, cloud: 'unknown' as const, local: 'pending' as const, recovery: true } } : {}) });
    db.close(); localStorage.removeItem(storageKey);
    const restarted = await fixture(dbName);
    await expect(restarted.app.deletionRecovery.retryLocal(USER_A)).rejects.toMatchObject({ code: 'AUTH' });
    const after = await localData(dbName, USER_A);
    expect(after.projects).toEqual(before.projects); expect(after.thumbnails).toEqual(before.thumbnails); expect(after.settings).toEqual(before.settings); expect(after.routes).toEqual(before.routes);
    expect(restarted.app.deletionRecovery.state).toEqual([]);
  });
});

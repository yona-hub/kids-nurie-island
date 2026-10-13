// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session as SdkSession } from '@supabase/supabase-js';
import { createAuth } from '../packages/persistence/src/auth';
import { SupabaseCloud } from '../packages/persistence/src/cloud';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase } from '../packages/persistence/src/local';
import { USER_A, USER_B } from './sync.helpers';

const key = 'sb-fixture-auth-token';
function jwt(userId: string, expires = Math.floor(Date.now() / 1000) + 3600) {
  const part = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: userId, exp: expires, iat: expires - 3600, role: 'authenticated', iss: 'https://fixture.supabase.co/auth/v1', session_id: crypto.randomUUID() })}.${part('fixture-signature')}`;
}
function sdkSession(userId = USER_A, expired = false): SdkSession {
  const expires = Math.floor(Date.now() / 1000) + (expired ? -3600 : 3600);
  return { access_token: jwt(userId, expires), refresh_token: `refresh-${userId}`, token_type: 'bearer', expires_in: 3600, expires_at: expires,
    user: { id: userId, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: '2026-10-06T00:00:00Z' } };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const subject = (headers: Headers) => {
  const token = headers.get('authorization')?.replace(/^Bearer /, '');
  return token?.split('.').length === 3 ? JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))).sub as string : undefined;
};
let reachable = true, online = true, revoked = false, failDelete = false;
let saveWait: ReturnType<typeof deferred<Response>> | undefined;
let deleteWait: ReturnType<typeof deferred<Response>> | undefined;
const requests: Array<{ path: string; userId?: string; body: Record<string, unknown> }> = [];
const apps: IslandServices[] = [];
const auths: Array<ReturnType<typeof createAuth>> = [];
async function fixture(dbName = crypto.randomUUID()) {
  const connection = createAuth({ supabaseUrl: 'https://fixture.supabase.co', publishableKey: 'sb_publishable_fixture', online: () => online });
  auths.push(connection);
  const service = createServices({ dbName, authAdapter: connection.adapter, cloud: new SupabaseCloud(connection.client!), online: () => online, debounceMs: 60000 });
  apps.push(service);
  await service.ready;
  return { service, client: connection.client!, connection, dbName };
}
async function changeAccount(client: NonNullable<ReturnType<typeof createAuth>['client']>, userId: string) {
  const next = sdkSession(userId);
  const { error } = await client.auth.setSession({ access_token: next.access_token, refresh_token: next.refresh_token });
  expect(error).toBeNull();
  await vi.waitFor(() => expect(localStorage.getItem(key)).toContain(userId));
}
beforeEach(() => {
  localStorage.clear(); history.replaceState(null, '', '/');
  reachable = true; online = true; revoked = false; failDelete = false;
  saveWait = undefined; deleteWait = undefined; requests.length = 0;
  localStorage.setItem(key, JSON.stringify(sdkSession()));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!reachable) throw new TypeError('Network unavailable');
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const body = JSON.parse(typeof init?.body === 'string' && init.body.startsWith('{') ? init.body : '{}') as Record<string, unknown>;
    const userId = subject(new Headers(init?.headers));
    requests.push({ path: url.pathname, userId, body });
    if (url.pathname.endsWith('/token')) {
      if (revoked) return json({ code: 'refresh_token_not_found', msg: 'revoked' }, 400);
      return json(sdkSession(String(body.refresh_token).slice('refresh-'.length)));
    }
    if (url.pathname.endsWith('/user')) return revoked ? json({ code: 'user_not_found', msg: 'revoked' }, 401) : json(sdkSession(userId).user);
    if (url.pathname.endsWith('/logout')) return json({});
    if (url.pathname.endsWith('/save_project')) {
      if (saveWait) return saveWait.promise;
      return json({ kind: 'saved', project: { ...(body.p_project as object), version: Number(body.p_expected_version) + 1 } });
    }
    if (url.pathname.endsWith('/projects')) return json([]);
    if (url.pathname.endsWith('/delete-account-data')) {
      if (deleteWait) return deleteWait.promise;
      return failDelete ? json({ error: 'DELETION_PENDING' }, 503) : json({ deleted: true });
    }
    throw new Error(`Unexpected fixture request ${url.pathname}`);
  }));
});
afterEach(async () => {
  await Promise.all(apps.splice(0).map(app => app.dispose()));
  for (const connection of auths.splice(0)) { connection.adapter.dispose?.(); await connection.client?.auth.stopAutoRefresh(); }
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('A10-01/02: real SDK account deletion races', () => {
  it.each(['B', 'signed-out', 'A again'])('cancels deletion after sync wait when authentication becomes %s', async (destination) => {
    const { service, client, dbName } = await fixture();
    const a = await service.projects.create({ templateId: 'ocean', title: 'A' });
    saveWait = deferred<Response>();
    const syncing = service.sync.flush();
    await vi.waitFor(() => expect(requests.some(r => r.path.endsWith('/save_project'))).toBe(true));
    const deletion = service.deleteAccountData(USER_A).catch(error => error);
    const db = await openLocalDatabase(dbName);
    await vi.waitFor(async () => expect(await db.get('leases', `deleted:${USER_A}`)).toBeTruthy());
    if (destination === 'signed-out') await client.auth.signOut({ scope: 'local' });
    else {
      await changeAccount(client, USER_B);
      await vi.waitFor(() => expect(service.auth.session?.userId).toBe(USER_B));
      if (destination === 'A again') await changeAccount(client, USER_A);
    }
    await vi.waitFor(() => expect(service.auth.session?.userId).toBe(destination === 'B' ? USER_B : destination === 'A again' ? USER_A : undefined));
    const logoutRequests = requests.filter(r => r.path.endsWith('/logout')).length;
    saveWait.resolve(json({ kind: 'saved', project: { ...a, version: 1 } }));
    await syncing;
    expect(await deletion).toMatchObject({ code: 'AUTH' });
    expect(requests.filter(r => r.path.endsWith('/delete-account-data'))).toEqual([]);
    expect(requests.filter(r => r.path.endsWith('/logout'))).toHaveLength(logoutRequests);
    expect(await db.get('projects', `${USER_A}:${a.id}`)).toBeTruthy();
    expect(await db.get('leases', `deleted:${USER_A}`)).toBeUndefined();
    db.close();
  });

  it('keeps B signed in and its local projects intact after an A deletion response arrives', async () => {
    const { service, client, dbName } = await fixture();
    await changeAccount(client, USER_B); await vi.waitFor(() => expect(service.auth.session?.userId).toBe(USER_B));
    const b = await service.projects.create({ templateId: 'ocean', title: 'B' });
    await changeAccount(client, USER_A); await vi.waitFor(() => expect(service.auth.session?.userId).toBe(USER_A));
    const a = await service.projects.create({ templateId: 'ocean', title: 'A' });
    deleteWait = deferred<Response>();
    const deleting = service.deleteAccountData(USER_A).catch(error => error);
    await vi.waitFor(() => expect(requests.some(r => r.path.endsWith('/delete-account-data'))).toBe(true));
    await changeAccount(client, USER_B); await vi.waitFor(() => expect(service.auth.session?.userId).toBe(USER_B));
    deleteWait.resolve(json({ deleted: true }));
    expect(await deleting).toMatchObject({ code: 'AUTH' });
    expect(service.auth.session?.userId).toBe(USER_B);
    expect(requests.filter(r => r.path.endsWith('/delete-account-data'))).toMatchObject([{ userId: USER_A, body: { expectedUserId: USER_A } }]);
    expect(requests.filter(r => r.path.endsWith('/logout'))).toEqual([]);
    const db = await openLocalDatabase(dbName);
    expect(await db.get('projects', `${USER_A}:${a.id}`)).toBeTruthy();
    expect(await db.get('projects', `${USER_B}:${b.id}`)).toBeTruthy(); db.close();
  });

  it('stops another tab from editing, retains shared authentication until the delete API, and permits retry', async () => {
    const first = await fixture();
    const second = await fixture(first.dbName);
    saveWait = deferred<Response>();
    const a = await first.service.projects.create({ templateId: 'ocean', title: 'A' });
    const syncing = first.service.sync.flush();
    await vi.waitFor(() => expect(requests.some(r => r.path.endsWith('/save_project'))).toBe(true));
    failDelete = true;
    const deleting = first.service.deleteAccountData(USER_A).catch(error => error);
    await vi.waitFor(() => expect(second.service.sync.status.notice).toContain('削除'));
    expect(first.service.auth.session?.userId).toBe(USER_A);
    expect(second.service.auth.session?.userId).toBe(USER_A);
    expect(localStorage.getItem(key)).toContain(USER_A);
    await expect(second.service.projects.save(a)).rejects.toMatchObject({ code: 'AUTH' });
    saveWait.resolve(json({ kind: 'saved', project: { ...a, version: 1 } }));
    await syncing; expect(await deleting).toMatchObject({ code: 'CLOUD' });
    expect(first.service.auth.session?.userId).toBe(USER_A);
    failDelete = false;
    await first.service.deleteAccountData(USER_A);
    await vi.waitFor(() => expect(second.service.auth.session).toBeNull());
    expect(first.service.auth.session).toBeNull(); expect(localStorage.getItem(key)).toBeNull();
    expect(requests.filter(r => r.path.endsWith('/delete-account-data'))).toMatchObject([{ userId: USER_A }, { userId: USER_A }]);
    expect(requests.filter(r => r.path.endsWith('/logout'))).toEqual([]);
  });

  it('rejects stale user confirmation even before starting the local deletion fence', async () => {
    const { service } = await fixture();
    await expect(service.deleteAccountData(USER_B)).rejects.toMatchObject({ code: 'AUTH' });
    expect(requests.filter(r => r.path.endsWith('/delete-account-data'))).toEqual([]);
    await expect(service.projects.create({ templateId: 'ocean', title: 'A remains editable' })).resolves.toBeTruthy();
  });

  it('aborts before the HTTP send if SDK token acquisition overlaps an account change', async () => {
    const { service, client } = await fixture();
    const snapshot = await client.auth.getSession();
    const gate = deferred<typeof snapshot>();
    vi.spyOn(client.auth, 'getSession').mockReturnValueOnce(gate.promise);
    const deletion = service.deleteAccountData(USER_A).catch(error => error);
    await vi.waitFor(() => expect(client.auth.getSession).toHaveBeenCalled());
    await changeAccount(client, USER_B);
    await vi.waitFor(() => expect(service.auth.session?.userId).toBe(USER_B));
    gate.resolve(snapshot);
    expect(await deletion).toMatchObject({ code: 'AUTH' });
    expect(requests.some(r => r.path.endsWith('/delete-account-data'))).toBe(false);
    expect(service.auth.session?.userId).toBe(USER_B);
  });
});

describe('A09-01: cached local owner without expired-token network startup', () => {
  it.each([false, true])('opens and edits cached projects offline (expired=%s), then verifies and syncs on reconnection', async (expired) => {
    const first = await fixture();
    const project = await first.service.projects.create({ templateId: 'ocean', title: 'offline artwork' });
    await first.service.dispose(); apps.splice(apps.indexOf(first.service), 1);
    localStorage.setItem(key, JSON.stringify(sdkSession(USER_A, expired)));
    online = false; reachable = false; requests.length = 0;
    const restarted = await Promise.race([fixture(first.dbName), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('offline startup exceeded 500ms')), 500))]);
    expect(restarted.service.auth.session).toMatchObject({ userId: USER_A, localOnly: false, offline: true });
    expect(restarted.service.sync.status.state).toBe('offline');
    const cached = await restarted.service.projects.get(project.id);
    await restarted.service.projects.save({ ...cached!, regions: { r01: { color: '#F64C91', paintType: 'smooth' } } });
    expect(restarted.service.sync.status.unsyncedCount).toBe(1);
    expect(requests).toEqual([]);
    online = true; reachable = true;
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(restarted.service.auth.session?.offline).toBe(false));
    await restarted.service.sync.flush();
    expect(requests.some(r => r.path.endsWith('/user') && r.userId === USER_A)).toBe(true);
    expect(requests.some(r => r.path.endsWith('/save_project') && r.userId === USER_A)).toBe(true);
    expect(requests.findIndex(r => r.path.endsWith('/user'))).toBeLessThan(requests.findIndex(r => r.path.endsWith('/save_project')));
    expect(restarted.service.sync.status.unsyncedCount).toBe(0);
  });

  it('clears offline ownership on explicit logout and does not restore it after restarting', async () => {
    online = false; reachable = false; localStorage.setItem(key, JSON.stringify(sdkSession(USER_A, true)));
    const first = await fixture();
    await first.service.auth.signOut();
    expect(first.service.auth.session).toBeNull(); expect(localStorage.getItem(key)).toBeNull();
    const next = await fixture(first.dbName); expect(next.service.auth.session).toBeNull(); expect(requests).toEqual([]);
  });

  it('does not treat a revoked refresh token as a temporary offline identity', async () => {
    revoked = true; localStorage.setItem(key, JSON.stringify(sdkSession(USER_A, true)));
    const { service } = await fixture();
    expect(service.auth.session).toBeNull(); expect(localStorage.getItem(key)).toBeNull();
    await expect(service.projects.create({ templateId: 'ocean', title: 'rejected' })).rejects.toMatchObject({ code: 'AUTH' });
  });

  it('opens locally on the first transport failure and automatically recovers without a connectivity event', async () => {
    localStorage.setItem(key, JSON.stringify(sdkSession(USER_A, true)));
    reachable = false;
    const { service } = await Promise.race([fixture(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('transport fallback exceeded 500ms')), 500))]);
    expect(service.auth.session).toMatchObject({ userId: USER_A, offline: true });
    expect(service.sync.status.state).toBe('offline');
    reachable = true;
    await vi.waitFor(() => expect(service.auth.session?.offline).toBe(false), { timeout: 5000 });
    expect(requests.some(r => r.path.endsWith('/user'))).toBe(true);
  });

  it('revokes local-only access when reconnection verifies that the cached user is no longer valid', async () => {
    online = false;
    const { service } = await fixture();
    expect(service.auth.session?.offline).toBe(true);
    revoked = true; online = true; window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(service.auth.session).toBeNull());
    expect(localStorage.getItem(key)).toBeNull();
  });
});

describe('A10-03/04: callback configuration and provider errors', () => {
  it('allows exact development and preview callbacks on the ports used by Vite', () => {
    const vite = readFileSync('vite.config.ts', 'utf8');
    const config = readFileSync('supabase/config.toml', 'utf8');
    const ports = [...vite.matchAll(/(?:server|preview):\s*\{\s*port:\s*(\d+)/g)].map(match => match[1]);
    expect(ports).toHaveLength(2);
    for (const port of ports) {
      for (const hostname of ['127.0.0.1', 'localhost']) expect(config).toContain(`"http://${hostname}:${port}/auth/callback"`);
    }
    expect(config).toContain('site_url = "http://127.0.0.1:5174"');
  });
  it.each(['#error=access_denied&error_code=provider_error', '#error_description=%3Cscript%3Ealert(1)%3C/script%3E', '?error=access_denied'])('rejects and scrubs callback errors without displaying provider text: %s', async (suffix) => {
    history.replaceState(null, '', `/auth/callback${suffix}`);
    const connection = createAuth({ supabaseUrl: 'https://fixture.supabase.co', publishableKey: 'sb_publishable_fixture' }); auths.push(connection);
    await expect(connection.adapter.initialize()).rejects.toMatchObject({ code: 'AUTH', message: 'ログインを完了できませんでした。もう一度お試しください。' });
    expect(location.pathname).toBe('/'); expect(location.search).toBe(''); expect(location.hash).toBe('');
  });
});

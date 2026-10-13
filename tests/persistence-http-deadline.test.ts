// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuth } from '../packages/persistence/src/auth';
import { SupabaseCloud } from '../packages/persistence/src/cloud';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import { MemoryCloud, USER_A } from './sync.helpers';
import { fetchCompleteResponse } from '../packages/persistence/src/http-deadline';
import type { Project } from '../packages/shared-types/src/index';

const key = 'sb-deadline-fixture-auth-token';
const connections: Array<ReturnType<typeof createAuth>> = [], apps: IslandServices[] = [];
let mode = 'normal', signal: AbortSignal | null | undefined, stream: ReadableStreamDefaultController<Uint8Array> | undefined;
let server: MemoryCloud, requests: Array<{ path: string; body: Record<string, unknown> }>;
const encoder = new TextEncoder();
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
function sdkSession() {
  const part = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  return { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: USER_A, exp: expires, role: 'authenticated' })}.${part('test')}`, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expires,
    user: { id: USER_A, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: '2026-10-07T00:00:00Z' } };
}
async function fixture(dbName = crypto.randomUUID()) {
  const connection = createAuth({ supabaseUrl: 'https://deadline-fixture.supabase.co', publishableKey: 'sb_publishable_fixture', online: () => true }); connections.push(connection);
  const service = createServices({ dbName, authAdapter: connection.adapter, cloud: new SupabaseCloud(connection.client!), online: () => true, debounceMs: 60_000 }); apps.push(service); await service.ready;
  return { service, connection, dbName };
}
async function stop(service: IslandServices) { await service.dispose(); apps.splice(apps.indexOf(service), 1); }
async function entered(path: string) { await vi.waitFor(() => expect(requests.some(request => request.path.endsWith(path))).toBe(true)); }
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  localStorage.clear(); history.replaceState(null, '', '/'); localStorage.setItem(key, JSON.stringify(sdkSession()));
  mode = 'normal'; signal = undefined; stream = undefined; server = new MemoryCloud(); requests = [];
  vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    const path = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url).pathname;
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) as Record<string, unknown> : {};
    requests.push({ path, body });
    if (mode === 'fetch-failure') throw new TypeError('network unavailable');
    if (path.endsWith('/user')) return mode === 'auth-500' ? json({ message: 'temporary' }, 500) : json(sdkSession().user);
    if (path.endsWith('/token')) return json(sdkSession());
    if (path.endsWith('/logout')) return json({});
    if (path.endsWith('/delete-account-data')) return json({ deleted: true });
    if (path.endsWith('/save_project')) {
      const result = await server.save(body.p_project as Project, Number(body.p_expected_version), String(body.p_operation_id));
      if (mode === 'disconnect-save') { mode = 'normal'; return new Response(new ReadableStream({ start(controller) { controller.enqueue(encoder.encode('{')); controller.error(new TypeError('connection reset')); } }), { headers: { 'content-type': 'application/json' } }); }
      if (mode === 'malformed-save') { mode = 'normal'; return new Response('{broken', { headers: { 'content-type': 'application/json' } }); }
      if (mode !== 'stall-save') return json(result);
    }
    if (mode === 'stall-list' || mode === 'stall-save') {
      signal = init?.signal;
      return new Response(new ReadableStream({ start(controller) { stream = controller; controller.enqueue(encoder.encode('[')); } }), { headers: { 'content-type': 'application/json' } });
    }
    if (path.endsWith('/projects')) return json((await server.list(USER_A)).map(record => ({ id: record.project.id, payload: record.project, deleted_at: null })));
    throw new Error(`Unexpected fixture ${path}`);
  }));
});
afterEach(async () => {
  mode = 'normal'; try { stream?.enqueue(encoder.encode(']')); stream?.close(); } catch { /* Deadline already cancelled it. */ }
  await Promise.all(apps.splice(0).map(service => service.dispose()));
  for (const connection of connections.splice(0)) connection.adapter.dispose?.();
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('A19-03 real SDK response-body deadline', () => {
  it('keeps the existing 15-second deadline after headers until a stalled list body finishes', async () => {
    const { service } = await fixture(); mode = 'stall-list';
    let settled = false; const syncing = service.sync.flush().then(() => { settled = true; });
    await entered('/projects');
    await vi.advanceTimersByTimeAsync(14_000); expect(settled).toBe(false); expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1_001);
    expect(signal?.aborted).toBe(true); await vi.waitFor(() => expect(settled).toBe(true), { timeout: 500 }); await syncing;
    expect(service.sync.status.state).not.toBe('syncing'); expect(service.auth.session?.userId).toBe(USER_A);
  });

  it('keeps the committed operation and payload across timeout, later edits and restart', async () => {
    const first = await fixture();
    const project = await first.service.projects.create({ templateId: 'ocean', title: '応答が止まる作品' });
    mode = 'stall-save'; const syncing = first.service.sync.flush();
    await vi.waitFor(() => expect(signal).toBeDefined());
    const originalRequest = requests.find(request => request.path.endsWith('/save_project'))!.body;
    await first.service.projects.save({ ...project, regions: { r01: { color: '#FF0000', paintType: 'crayon' } } });
    mode = 'normal'; await vi.advanceTimersByTimeAsync(15_001); await syncing;
    expect(first.service.sync.status.state).toBe('offline');
    expect(requests.filter(request => request.path.endsWith('/projects'))).toHaveLength(0);
    const db = await openLocalDatabase(first.dbName), retained = await db.get('projects', projectKey(USER_A, project.id)); db.close();
    expect(retained?.pendingCommit?.operationId).toBe(originalRequest.p_operation_id);
    expect(retained?.pendingCommit?.project.regions).toEqual({});
    expect(retained?.project.regions.r01).toEqual({ color: '#FF0000', paintType: 'crayon' });
    expect(server.records.size).toBe(1); await stop(first.service);
    const restarted = await fixture(first.dbName); await restarted.service.sync.flush();
    const saves = requests.filter(request => request.path.endsWith('/save_project'));
    expect(saves).toHaveLength(3); expect(saves[1].body).toEqual(originalRequest);
    expect(saves[2].body.p_operation_id).not.toBe(originalRequest.p_operation_id);
    expect(saves[2].body.p_expected_version).toBe(1);
    expect(server.records.size).toBe(1); expect(server.records.get(project.id)?.project).toMatchObject({ version: 2, regions: { r01: { color: '#FF0000', paintType: 'crayon' } } });
    expect(restarted.service.sync.status.unsyncedCount).toBe(0);
  });

  it.each(['disconnect-save', 'malformed-save'])('retains the receipt identity after %s and retries without duplicating', async fault => {
    const { service, connection, dbName } = await fixture();
    const project = await service.projects.create({ templateId: 'ocean', title: '再送する作品' }); mode = fault;
    await service.sync.flush();
    const db = await openLocalDatabase(dbName), pending = await db.get('projects', projectKey(USER_A, project.id)); db.close();
    expect(pending?.dirty).toBe(true); expect(pending?.pendingCommit).toBeDefined();
    expect(service.auth.session?.userId).toBe(USER_A); expect(service.sync.status.state).not.toBe('syncing');
    await connection.adapter.revalidate?.(); await service.sync.flush();
    const attempts = requests.filter(request => request.path.endsWith('/save_project'));
    expect(attempts).toHaveLength(2); expect(attempts[1].body).toEqual(attempts[0].body);
    expect(server.records.size).toBe(1); expect(server.records.get(project.id)?.project.version).toBe(1);
    expect(service.sync.status.unsyncedCount).toBe(0);
  });

  it.each(['logout', 'delete'])('releases a stalled sync so %s settles and can continue after reconnect', async action => {
    const { service, connection } = await fixture(); mode = 'stall-list';
    const syncing = service.sync.flush(); await entered('/projects');
    let finished = false;
    const operation = (action === 'logout' ? service.auth.signOut() : service.deleteAccountData(USER_A)).catch(error => error).finally(() => { finished = true; });
    await vi.advanceTimersByTimeAsync(14_000); expect(finished).toBe(false);
    mode = 'normal'; await vi.advanceTimersByTimeAsync(1_001); await syncing;
    await vi.waitFor(() => expect(finished).toBe(true), { timeout: 500 }); await operation;
    if (action === 'delete' && service.auth.session) { await connection.adapter.revalidate?.(); await service.deleteAccountData(USER_A); }
    expect(service.auth.session).toBeNull();
    if (action === 'delete') expect(requests.filter(request => request.path.endsWith('/delete-account-data'))).toHaveLength(1);
  });

  it('honors caller cancellation during the body without marking the authenticated owner offline', async () => {
    const { service, connection } = await fixture(), caller = new AbortController(); mode = 'stall-list';
    const remove = vi.spyOn(caller.signal, 'removeEventListener');
    const query = Promise.resolve(connection.client!.from('projects').select('*').abortSignal(caller.signal)); await entered('/projects');
    caller.abort(); const result = await query;
    expect(result.error).toBeTruthy(); expect(signal?.aborted).toBe(true);
    expect(service.auth.session?.userId).toBe(USER_A); expect(service.auth.session?.offline).not.toBe(true);
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it.each(['auth-500', 'fetch-failure'])('keeps the offline owner and recovers after %s', async fault => {
    const { service, connection } = await fixture(); mode = fault;
    await connection.adapter.revalidate?.(); expect(service.auth.session).toMatchObject({ userId: USER_A, offline: true });
    mode = 'normal'; await connection.adapter.revalidate?.(); expect(service.auth.session).toMatchObject({ userId: USER_A, offline: false });
  });

  it('returns the original complete response and removes the timer and caller listener', async () => {
    const caller = new AbortController(), response = json({ complete: true });
    Object.defineProperty(response, 'url', { value: 'https://deadline-fixture.supabase.co/real-url' });
    let transportSignal: AbortSignal | null | undefined;
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (_input, init) => { transportSignal = init?.signal; return response; }));
    const before = vi.getTimerCount();
    const received = await fetchCompleteResponse('https://deadline-fixture.supabase.co/example', { signal: caller.signal });
    expect(received).toBe(response); expect(received.url).toContain('/real-url'); expect(await received.json()).toEqual({ complete: true });
    expect(vi.getTimerCount()).toBe(before);
    caller.abort(); await vi.advanceTimersByTimeAsync(15_001); expect(transportSignal?.aborted).toBe(false);
  });
});

import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { makeProject } from '../sync.helpers';
import { API_ORIGIN, APP_ORIGIN, CONTROL_KEY, PUBLISHABLE_KEY, USER_ID } from './fixture-config.mjs';

let server: ChildProcess;
beforeAll(async () => {
  server = spawn(process.execPath, ['tests/cloud-e2e/fixture-server.mjs'], { cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local fixture startup timeout')), 15_000);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Local fixture exited ${code}`)); });
    server.stdout!.on('data', data => { if (String(data).includes('Cloud E2E fixture ready:')) { clearTimeout(timer); resolve(); } });
  });
});
afterAll(async () => { if (server && server.exitCode === null) { server.kill(); await new Promise<void>(resolve => server.once('exit', () => resolve())); } });

it('requires correct PKCE, a signed token, and actual SQL compare-and-swap before the browser suite uses it', async () => {
  const control = { 'x-fixture-control': CONTROL_KEY, 'content-type': 'application/json' };
  expect((await fetch(`${API_ORIGIN}/__control/reset`, { method: 'POST', headers: control, body: JSON.stringify({ caseName: 'fixture-boundary' }) })).status).toBe(200);
  const headers = { apikey: PUBLISHABLE_KEY, 'content-type': 'application/json' };
  const verifier = 'fixture-verifier-that-is-long-enough-for-the-pkce-boundary';
  const authorize = new URL(`${API_ORIGIN}/auth/v1/authorize`);
  authorize.search = new URLSearchParams({ provider: 'google', redirect_to: `${APP_ORIGIN}/auth/callback`, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 's256' }).toString();
  const callback = await fetch(authorize, { redirect: 'manual' }); expect(callback.status).toBe(302);
  const authCode = new URL(callback.headers.get('location')!).searchParams.get('code');
  expect((await fetch(`${API_ORIGIN}/auth/v1/token?grant_type=pkce`, { method: 'POST', headers, body: JSON.stringify({ auth_code: authCode, code_verifier: 'wrong' }) })).status).toBe(400);
  const token = await fetch(`${API_ORIGIN}/auth/v1/token?grant_type=pkce`, { method: 'POST', headers, body: JSON.stringify({ auth_code: authCode, code_verifier: verifier }) });
  expect(token.status).toBe(200);
  const session = await token.json() as { access_token: string; refresh_token: string };
  expect((await fetch(`${API_ORIGIN}/auth/v1/token?grant_type=pkce`, { method: 'POST', headers, body: JSON.stringify({ auth_code: authCode, code_verifier: verifier }) })).status).toBe(400);
  expect((await fetch(`${API_ORIGIN}/rest/v1/projects?user_id=eq.${USER_ID}`, { headers: { ...headers, authorization: 'Bearer tampered' } })).status).toBe(401);
  const client = createClient(API_ORIGIN, PUBLISHABLE_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  expect((await client.auth.setSession(session)).error).toBeNull();
  const project = makeProject(USER_ID), operationId = crypto.randomUUID();
  const initial = await client.rpc('save_project', { p_project: project, p_expected_version: 0, p_operation_id: operationId });
  expect(initial.error).toBeNull(); expect(initial.data).toMatchObject({ kind: 'saved', project: { id: project.id, version: 1 } });
  const duplicate = await client.rpc('save_project', { p_project: project, p_expected_version: 0, p_operation_id: operationId });
  expect(duplicate.data).toEqual(initial.data);
  const stale = await client.rpc('save_project', { p_project: { ...project, title: 'stale' }, p_expected_version: 0, p_operation_id: crypto.randomUUID() });
  expect(stale.error).toBeNull(); expect(stale.data).toMatchObject({ kind: 'conflict', project: { title: project.title, version: 1 } });
  const listed = await client.from('projects').select('payload').eq('user_id', USER_ID);
  expect(listed.error).toBeNull(); expect(listed.data).toEqual([{ payload: initial.data.project }]);
});

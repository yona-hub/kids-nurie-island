import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { USER_A } from './sync.helpers';

const sdk = vi.hoisted(() => ({ createClient: vi.fn(), getSession: vi.fn(), exchange: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: sdk.createClient }));
const services: IslandServices[] = [];
function configured() { const app = createServices({ dbName: crypto.randomUUID(), supabaseUrl: 'https://test.supabase.co', publishableKey: 'sb_publishable_test', online: () => true }); services.push(app); return app; }
beforeEach(() => {
  vi.clearAllMocks();
  sdk.getSession.mockResolvedValue({ data: { session: { user: { id: USER_A, app_metadata: { provider: 'google' }, user_metadata: { full_name: 'テスト' } } } }, error: null });
  sdk.exchange.mockResolvedValue({ error: null }); sdk.signIn.mockResolvedValue({ error: null }); sdk.signOut.mockResolvedValue({ error: null });
  sdk.createClient.mockReturnValue({ auth: { getSession: sdk.getSession, exchangeCodeForSession: sdk.exchange, signInWithOAuth: sdk.signIn, signOut: sdk.signOut, onAuthStateChange: () => ({ data: { subscription: { unsubscribe: sdk.unsubscribe } } }) } });
  vi.stubGlobal('location', { origin: 'https://island.example', pathname: '/', href: 'https://island.example/' });
  vi.stubGlobal('history', { replaceState: vi.fn() });
});
afterEach(async () => { await Promise.all(services.splice(0).map(service => service.dispose())); vi.unstubAllGlobals(); });

describe('provider-independent auth and PKCE callback boundary', () => {
  it('uses local mode only for explicit demo or completely unconfigured development', async () => {
    for (const options of [
      { development: true, local: true },
      { development: true, supabaseUrl: 'https://test.supabase.co', publishableKey: 'sb_publishable_test', local: false },
      { development: false, supabaseUrl: 'https://test.supabase.co', publishableKey: 'sb_publishable_test', local: false },
      { demoMode: true, supabaseUrl: 'https://test.supabase.co', publishableKey: 'sb_publishable_test', local: true },
    ]) {
      const app = createServices({ ...options, dbName: crypto.randomUUID(), online: () => true }); services.push(app); await app.ready;
      expect(app.auth.localOnlyMode).toBe(options.local);
      expect(app.auth.session?.localOnly).toBe(options.local);
    }
    for (const options of [{ supabaseUrl: 'https://test.supabase.co' }, { publishableKey: 'sb_publishable_test' }]) {
      const app = createServices({ ...options, development: true, dbName: crypto.randomUUID() }); services.push(app); await app.ready;
      expect(app.auth.localOnlyMode).toBe(false); expect(app.auth.configurationError).toBeTruthy();
    }
  });
  it('uses PKCE, the canonical same-origin callback and no caller-supplied return URL', async () => {
    const app = configured(); await app.ready; await app.auth.signIn('google');
    expect(sdk.createClient.mock.calls[0][2].auth).toMatchObject({ flowType: 'pkce', detectSessionInUrl: false });
    expect(sdk.signIn).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'https://island.example/auth/callback' } });
    expect(app.auth.session).toMatchObject({ userId: USER_A, provider: 'google', localOnly: false });
  });
  it('exchanges a callback code once and removes code and attacker return URL from history', async () => {
    vi.stubGlobal('location', { origin: 'https://island.example', pathname: '/auth/callback', href: 'https://island.example/auth/callback?code=one-use-code&returnTo=https://evil.example' });
    const app = configured(); await app.ready;
    expect(sdk.exchange).toHaveBeenCalledExactlyOnceWith('one-use-code');
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/');
    expect(app.auth.session?.userId).toBe(USER_A);
  });
  it('does not exchange a code on arbitrary routes and allows sign-in retry after callback failure', async () => {
    vi.stubGlobal('location', { origin: 'https://island.example', pathname: '/auth/callback', href: 'https://island.example/auth/callback?code=expired' });
    sdk.exchange.mockResolvedValue({ error: new Error('expired') });
    const app = configured(); await expect(app.ready).rejects.toMatchObject({ code: 'AUTH' });
    await expect(app.auth.signIn('google')).resolves.toBeUndefined();
    expect(sdk.signIn).toHaveBeenCalledTimes(1);
  });
  it('fails closed for secret or service-role client keys and unknown auth providers', async () => {
    for (const key of ['sb_secret_never-public', `e30.${btoa(JSON.stringify({ role: 'service_role' }))}.x`]) {
      const app = createServices({ dbName: crypto.randomUUID(), supabaseUrl: 'https://test.supabase.co', publishableKey: key }); services.push(app); await app.ready;
      expect(app.auth.configurationError).toBeTruthy(); expect(app.auth.session).toBeNull();
    }
    const app = configured(); await app.ready; await expect(app.auth.signIn('untrusted')).rejects.toMatchObject({ code: 'AUTH' });
  });
});


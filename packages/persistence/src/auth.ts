import { createClient, isAuthRetryableFetchError, type Provider, type Session as SupabaseSession, type SupabaseClient } from '@supabase/supabase-js';
import { PersistenceError, type AuthAdapter, type ServiceConfig, type Session } from './types';
import { AuthStorage } from './auth-storage';
import { fetchCompleteResponse } from './http-deadline';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
export function createAuth(config: ServiceConfig): { adapter: AuthAdapter; client?: SupabaseClient; configurationError?: string; demoMode?: boolean } {
  if (config.authAdapter) return { adapter: config.authAdapter };
  const explicitDemo = config.demoMode === true || (config.development === true && !config.supabaseUrl && !config.publishableKey);
  if (explicitDemo) return { adapter: new DemoAuth(config.dbName ?? 'kids-nurie-island'), demoMode: true };
  try {
    if (!config.supabaseUrl || !config.publishableKey) throw new Error('ログインとクラウド保存の設定がまだありません。');
    const url = new URL(config.supabaseUrl);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('接続先の設定を確認してください。');
    if (config.publishableKey.startsWith('sb_secret_')) throw new Error('ブラウザーには公開用キーだけを設定してください。');
    if (config.publishableKey.split('.').length === 3) {
      const part = config.publishableKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      let role: unknown;
      try { role = (JSON.parse(atob(part)) as { role?: unknown }).role; } catch { throw new Error('公開用キーの形式を確認してください。'); }
      if (role !== 'anon') throw new Error('ブラウザーには公開用キーだけを設定してください。');
    } else if (!config.publishableKey.startsWith('sb_publishable_')) throw new Error('公開用キーの形式を確認してください。');
    const storage = new AuthStorage(`sb-${url.hostname.split('.')[0]}-auth-token`, config.online ?? (() => typeof navigator === 'undefined' || navigator.onLine));
    const client = createClient(config.supabaseUrl, config.publishableKey, {
      auth: { storage, storageKey: storage.key, flowType: 'pkce', detectSessionInUrl: false, autoRefreshToken: true, persistSession: true },
      global: { fetch: async (input, init) => {
        const caller = init?.signal ?? (typeof Request !== 'undefined' && input instanceof Request ? input.signal : undefined);
        if (caller?.aborted) throw new DOMException('Aborted', 'AbortError');
        if (storage.offline) throw new TypeError('Network unavailable');
        try {
          const response = await fetchCompleteResponse(input, init);
          const address = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          if (response.status >= 500 && new URL(address).pathname.startsWith('/auth/v1/')) storage.failed();
          return response;
        } catch (error) { if (!caller?.aborted) storage.failed(); throw error; }
      } },
    });
    return { adapter: new SupabaseAuth(client, storage), client };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ログインの設定を確認してください。';
    return { adapter: new UnconfiguredAuth(message), configurationError: message };
  }
}
class UnconfiguredAuth implements AuthAdapter {
  constructor(private message: string) {}
  async initialize() { return null; }
  subscribe() { return () => {}; }
  async signIn(): Promise<void> { throw new PersistenceError('CONFIGURATION', this.message); }
  async signOut() {}
}
class DemoAuth implements AuthAdapter {
  private listeners = new Set<(session: Session | null) => void>();
  private key: string;
  private signedOut = false;
  private onStorage = (event: StorageEvent) => { if (event.key === this.key) this.publish(event.newValue === 'signed-out'); };
  constructor(name: string) {
    this.key = `${name}:demo-auth`;
    globalThis.addEventListener?.('storage', this.onStorage);
  }
  private session(): Session | null { return this.signedOut ? null : { userId: DEMO_USER_ID, provider: 'demo', displayName: 'この端末のおためし', localOnly: true }; }
  private publish(signedOut: boolean) { this.signedOut = signedOut; this.listeners.forEach(fn => fn(this.session())); }
  async initialize() {
    try { this.signedOut = globalThis.localStorage?.getItem(this.key) === 'signed-out'; } catch { /* IndexedDB remains the persistence authority. */ }
    return this.session();
  }
  subscribe(fn: (session: Session | null) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  async signIn(provider = 'demo') {
    if (provider !== 'demo') throw new PersistenceError('CONFIGURATION', 'おためしモードでは「この端末でためす」を選んでください。');
    try { globalThis.localStorage?.setItem(this.key, 'signed-in'); } catch { /* Session works until this tab closes. */ }
    this.publish(false);
  }
  async signOut() {
    try { globalThis.localStorage?.setItem(this.key, 'signed-out'); } catch { /* This tab is still signed out. */ }
    this.publish(true);
  }
  dispose() { globalThis.removeEventListener?.('storage', this.onStorage); }
}
function appSession(value: SupabaseSession | null): Session | null {
  if (!value) return null;
  const name = value.user.user_metadata?.full_name;
  return { userId: value.user.id, provider: String(value.user.app_metadata?.provider ?? 'google'), displayName: typeof name === 'string' ? name.slice(0, 120) : undefined, localOnly: false };
}
class SupabaseAuth implements AuthAdapter {
  private listeners = new Set<(session: Session | null) => void>();
  private unsubscribe: () => void;
  private current: Session | null = null;
  private generation = 0;
  private disposed = false;
  private validating?: Promise<Session | null>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryAttempt = 0;
  private channel?: BroadcastChannel;
  private reconnect = () => { void this.revalidate(); };
  private offline = () => { this.publish(this.localSession()); };
  private storageChanged = (event: StorageEvent) => {
    if (event.key !== this.storage.key) return;
    if (!this.storage.stored()) this.publish(null);
    else { this.publish(this.localSession()); if (!this.storage.offline) this.reconnect(); }
  };
  constructor(private client: SupabaseClient, private storage: AuthStorage) {
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      // Do not await SDK methods inside an auth callback. A queued stale event
      // must not replace credentials that another tab has already changed.
      queueMicrotask(() => {
        const stored = storage.stored();
        if (session && stored?.user.id !== session.user.id) return;
        if (!session && stored && !storage.offline) return;
        this.publish(storage.offline || this.validating ? this.localSession() : appSession(session));
      });
    });
    const stopNetwork = storage.subscribe(this.offline);
    this.unsubscribe = () => { data.subscription.unsubscribe(); stopNetwork(); };
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`${storage.key}:island-owner`);
      this.channel.onmessage = event => {
        if (event.data?.kind === 'signed-out' && event.data.userId === this.current?.userId) void this.forgetUser(event.data.userId);
      };
    }
    globalThis.addEventListener?.('online', this.reconnect);
    globalThis.addEventListener?.('offline', this.offline);
    globalThis.addEventListener?.('storage', this.storageChanged);
  }
  private localSession(): Session | null {
    const owner = appSession(this.storage.stored());
    return owner ? { ...owner, offline: true } : null;
  }
  private publish(value: Session | null) {
    if (this.disposed) return;
    if (this.current?.userId !== value?.userId) this.generation++;
    this.current = value;
    if (value?.offline) this.scheduleRetry();
    else { clearTimeout(this.retryTimer); this.retryTimer = undefined; this.retryAttempt = 0; }
    this.listeners.forEach(fn => fn(value));
  }
  private scheduleRetry() {
    if (this.disposed || this.retryTimer || !this.storage.canRetry) return;
    this.retryTimer = setTimeout(() => { this.retryTimer = undefined; void this.revalidate(); }, Math.min(60_000, 2000 * 2 ** this.retryAttempt++));
  }
  async initialize(): Promise<Session | null> {
    const generation = this.generation;
    if (typeof location !== 'undefined' && location.pathname === '/auth/callback') {
      const callback = new URL(location.href);
      const code = callback.searchParams.get('code');
      const fragment = new URLSearchParams(callback.hash.slice(1));
      const error = ['error', 'error_code', 'error_description'].some(key => callback.searchParams.has(key) || fragment.has(key));
      // No arbitrary return URL is accepted. Remove one-use codes and provider errors from browser history.
      history.replaceState(null, '', '/');
      if (error) throw new PersistenceError('AUTH', 'ログインを完了できませんでした。もう一度お試しください。');
      if (code) {
        const { error: exchangeError } = await this.client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw new PersistenceError('AUTH', 'ログインの有効時間が過ぎました。もう一度ログインしてください。');
      }
    }
    if (this.storage.offline) { const value = this.localSession(); this.publish(value); return value; }
    // A browser can report online while its network is unusable. Resolve as
    // soon as the first retryable transport failure occurs, not after SDK backoff.
    let stop = () => {};
    const unavailable = new Promise<Session | null>(resolve => { stop = this.storage.subscribe(() => resolve(this.localSession())); });
    try {
      const value = await Promise.race([
        this.client.auth.getSession().then(({ data, error }) => {
          if (error && isAuthRetryableFetchError(error)) return this.localSession();
          if (error) return null;
          return this.storage.offline ? this.localSession() : appSession(data.session);
        }),
        unavailable,
      ]);
      if (generation !== this.generation) return this.current;
      this.publish(value); return value;
    } finally { stop(); }
  }
  subscribe(fn: (session: Session | null) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  async signIn(provider = 'google') {
    const supported: Provider[] = ['google', 'azure'];
    if (!supported.includes(provider as Provider)) throw new PersistenceError('AUTH', 'このログイン方法にはまだ対応していません。');
    const { error } = await this.client.auth.signInWithOAuth({ provider: provider as Provider, options: { redirectTo: `${location.origin}/auth/callback` } });
    if (error) throw new PersistenceError('AUTH', 'ログインを開始できませんでした。もう一度お試しください。');
  }
  async signOut(expectedUserId = this.current?.userId, signal?: AbortSignal) {
    const stored = this.storage.stored();
    if (!expectedUserId || signal?.aborted || this.current?.userId !== expectedUserId || (stored && stored.user.id !== expectedUserId)) throw new PersistenceError('AUTH', 'アカウントが変わりました。もう一度確認してください。');
    if (stored && !this.storage.offline) {
      // The logout endpoint uses this fixed user's token. No service key is used.
      const { error } = await this.client.auth.admin.signOut(stored.access_token, 'local');
      if (error && !isAuthRetryableFetchError(error) && ![401, 403, 404].includes(error.status ?? 0)) throw new PersistenceError('AUTH', 'ログアウトできませんでした。もう一度お試しください。');
    }
    await this.forgetUser(expectedUserId, signal);
  }
  async forgetUser(expectedUserId: string, signal?: AbortSignal) {
    if (signal?.aborted || this.current?.userId !== expectedUserId || !this.storage.forget(expectedUserId)) return;
    this.publish(null);
    this.channel?.postMessage({ kind: 'signed-out', userId: expectedUserId });
  }
  revalidate(): Promise<Session | null> {
    if (this.validating) return this.validating;
    const expectedUserId = this.storage.stored()?.user.id;
    const generation = this.generation;
    this.storage.retry();
    if (!expectedUserId || this.storage.offline) return Promise.resolve(this.current);
    this.validating = (async () => {
      const { data, error } = await this.client.auth.getSession();
      if (this.disposed || generation !== this.generation) return this.current;
      if (error || !data.session) {
        const value = error && isAuthRetryableFetchError(error) ? this.localSession() : null;
        this.publish(value); return value;
      }
      const verified = await this.client.auth.getUser(data.session.access_token);
      if (this.disposed || generation !== this.generation || this.storage.stored()?.user.id !== expectedUserId) return this.current;
      if (verified.error) {
        if (isAuthRetryableFetchError(verified.error)) { this.storage.failed(); return this.current; }
        await this.forgetUser(expectedUserId); return this.current;
      }
      if (verified.data.user.id !== expectedUserId || data.session.user.id !== expectedUserId) return this.current;
      const value = { ...appSession(data.session)!, offline: false };
      this.publish(value); return value;
    })().catch(() => { this.storage.failed(); return this.current; }).finally(() => { this.validating = undefined; if (this.current?.offline) this.scheduleRetry(); });
    return this.validating;
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.retryTimer);
    this.unsubscribe(); this.channel?.close();
    void this.client.auth.stopAutoRefresh?.();
    globalThis.removeEventListener?.('online', this.reconnect);
    globalThis.removeEventListener?.('offline', this.offline);
    globalThis.removeEventListener?.('storage', this.storageChanged);
  }
}

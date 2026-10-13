import type { Session as SupabaseSession } from '@supabase/supabase-js';

/** SDK credentials remain in its normal storage slot. Offline reads never turn
 * these client-controlled values into cloud authorization. */
export class AuthStorage {
  private memory = new Map<string, string>();
  private unreachable = false;
  private listeners = new Set<() => void>();
  constructor(readonly key: string, private online: () => boolean) {}
  get offline() { return !this.online() || this.unreachable; }
  get canRetry() { return this.online(); }
  private read(key: string): string | null {
    try { return globalThis.localStorage?.getItem(key) ?? this.memory.get(key) ?? null; }
    catch { return this.memory.get(key) ?? null; }
  }
  getItem = (key: string): string | null => key === this.key && this.offline ? null : this.read(key);
  setItem = (key: string, value: string) => {
    try { if (globalThis.localStorage) { globalThis.localStorage.setItem(key, value); return; } } catch { /* Session-only fallback. */ }
    this.memory.set(key, value);
  };
  removeItem = (key: string) => {
    this.memory.delete(key);
    try { globalThis.localStorage?.removeItem(key); } catch { /* Session-only fallback. */ }
  };
  stored(): SupabaseSession | null {
    try {
      const value = JSON.parse(this.read(this.key) ?? 'null');
      if (value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.user?.id ?? '') && typeof value.access_token === 'string' && typeof value.refresh_token === 'string' && typeof value.expires_at === 'number') return value as SupabaseSession;
    } catch { /* Invalid local credentials never select an owner. */ }
    return null;
  }
  failed() { this.unreachable = true; this.listeners.forEach(listener => listener()); }
  retry() { this.unreachable = false; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  forget(expectedUserId: string) {
    const stored = this.stored();
    if (stored && stored.user.id !== expectedUserId) return false;
    this.removeItem(this.key);
    this.removeItem(`${this.key}-user`);
    return true;
  }
}

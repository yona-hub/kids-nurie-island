import { describe, expect, it } from 'vitest';
import { deleteAccountRequest, type DeletionBackend } from '../supabase/functions/delete-account-data/handler';
import { USER_A, USER_B } from './sync.helpers';

class Backend implements DeletionBackend {
  authenticated: string | null = USER_A;
  verified: string | null = USER_A;
  deletionState: 'none' | 'pending' | 'done' = 'none';
  files = ['a.webp', 'b.webp', 'c.webp'];
  events: string[] = [];
  failRemoval = false;
  async userForToken(token: string) { return token === 'valid' ? this.authenticated : null; }
  async verifiedSubject(token: string) { return token === 'valid' ? this.verified : null; }
  async state() { return this.deletionState; }
  async begin() { this.events.push('fence'); this.deletionState = 'pending'; }
  async listThumbnails(userId: string) { this.events.push(`list:${userId}`); return this.files.slice(0,2); }
  async removeThumbnails(paths: string[]) { if (this.failRemoval) throw new Error('network'); this.events.push(`remove:${paths.join(',')}`); this.files.splice(0,paths.length); }
  async finish(userId: string) { this.events.push(`projects:${userId}`); }
  async revokeSessions() { this.events.push('revoke'); }
  async deleteUser(userId: string) { this.events.push(`auth:${userId}`); this.deletionState = 'done'; this.authenticated = null; }
}
function request(options: { origin?: string; token?: string; body?: unknown } = {}) {
  return new Request('https://test.supabase.co/functions/v1/delete-account-data', { method: 'POST', headers: { origin: options.origin ?? 'https://island.example', authorization: `Bearer ${options.token ?? 'valid'}`, 'content-type': 'application/json' }, body: JSON.stringify(options.body ?? { confirmation: 'DELETE_MY_DATA', expectedUserId: USER_A }) });
}
describe('account deletion HTTP handler', () => {
  it('authenticates the subject, ignores forged user IDs, fences first, drains all thumbnail pages, then revokes and deletes', async () => {
    const backend = new Backend();
    const response = await deleteAccountRequest(request({ body: { confirmation: 'DELETE_MY_DATA', expectedUserId: USER_A, userId: USER_B } }), ['https://island.example'], backend);
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ deleted: true });
    expect(backend.events[0]).toBe('fence'); expect(backend.files).toHaveLength(0);
    expect(backend.events).not.toContain(`projects:${USER_B}`);
    expect(backend.events.slice(-3)).toEqual([`projects:${USER_A}`, 'revoke', `auth:${USER_A}`]);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('rejects a changed JWT subject before fencing, including pending and completed retries', async () => {
    for (const state of ['none', 'pending', 'done'] as const) {
      const backend = new Backend(); backend.authenticated = state === 'none' ? USER_B : null; backend.verified = USER_B; backend.deletionState = state;
      expect((await deleteAccountRequest(request(), ['https://island.example'], backend)).status).toBe(403);
      expect(backend.events).toEqual([]); expect(backend.files).toHaveLength(3);
    }
  });
  it('rejects a wrong origin, forged token and missing explicit deletion confirmation without side effects', async () => {
    for (const [options,status] of [[{ origin: 'https://evil.example' },403], [{ token: 'forged' },401], [{ body: { userId: USER_A } },400]] as const) {
      const backend = new Backend(); const response = await deleteAccountRequest(request(options), ['https://island.example'], backend);
      expect(response.status).toBe(status); expect(backend.events).toHaveLength(0);
    }
  });
  it('leaves the durable fence after a storage failure and resumes safely on retry', async () => {
    const backend = new Backend(); backend.failRemoval = true;
    expect((await deleteAccountRequest(request(), ['https://island.example'], backend)).status).toBe(503);
    expect(backend.deletionState).toBe('pending'); expect(backend.events).not.toContain('revoke');
    backend.failRemoval = false; backend.authenticated = null;
    expect((await deleteAccountRequest(request(), ['https://island.example'], backend)).status).toBe(200);
    expect(backend.files).toHaveLength(0); expect(backend.deletionState).toBe('done');
  });
  it('acknowledges an already completed deletion after response loss, but a revoked token cannot initiate a new deletion', async () => {
    const backend = new Backend(); backend.authenticated = null;
    expect((await deleteAccountRequest(request(), ['https://island.example'], backend)).status).toBe(401);
    backend.deletionState = 'done';
    expect((await deleteAccountRequest(request(), ['https://island.example'], backend)).status).toBe(200);
    expect(backend.events).toHaveLength(0);
  });
});

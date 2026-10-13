import type { LocalDatabase } from './local';
import { PersistenceError } from './types';

export interface AccountDeletionJournal {
  userId: string;
  consent: 'delete-account-data';
  consentedAt: string | null;
  cloud: 'unknown' | 'confirmed' | 'not-required';
  local: 'pending' | 'complete';
  recovery: boolean;
  dismissed?: boolean;
}
export interface DeletionLease {
  key: string; owner: string; expiresAt: number;
  phase?: 'preparing' | 'requested' | 'complete';
  deletion?: AccountDeletionJournal;
}
export interface DeletionRecoveryState extends AccountDeletionJournal { error?: string }
const ownerId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function deletionJournal(lease: DeletionLease | undefined): AccountDeletionJournal | undefined {
  if (!lease || !['requested', 'complete'].includes(lease.phase ?? '') || !lease.key.startsWith('deleted:')) return;
  const userId = lease.key.slice('deleted:'.length);
  if (!ownerId.test(userId)) return;
  // Older requested records were written only after the existing delete confirmation.
  if (!lease.deletion) return { userId, consent: 'delete-account-data', consentedAt: null, cloud: 'unknown', local: 'pending', recovery: true };
  const value = lease.deletion;
  if (value.userId !== userId || value.consent !== 'delete-account-data'
    || !['unknown', 'confirmed', 'not-required'].includes(value.cloud) || !['pending', 'complete'].includes(value.local)
    || typeof value.recovery !== 'boolean') return;
  return value;
}
export async function deletionJournals(db: LocalDatabase): Promise<AccountDeletionJournal[]> {
  return (await db.getAll('leases')).map(deletionJournal).filter((value): value is AccountDeletionJournal => value !== undefined);
}
export async function updateDeletionJournal(db: LocalDatabase, userId: string, patch: Partial<Pick<AccountDeletionJournal, 'cloud' | 'recovery' | 'dismissed'>>) {
  const tx = db.transaction('leases', 'readwrite');
  const lease = await tx.store.get(`deleted:${userId}`), journal = deletionJournal(lease);
  if (!lease || !journal) { await tx.done; throw new PersistenceError('AUTH', 'このアカウントの削除同意を確認できませんでした。'); }
  const next = { ...journal, ...patch };
  await tx.store.put({ ...lease, deletion: next, phase: next.local === 'complete' && next.cloud !== 'unknown' ? 'complete' : 'requested' });
  await tx.done; return next;
}
/** No auth/network operations: the durable, owner-bound prior consent authorizes only local erasure. */
export async function eraseConsentedLocalData(db: LocalDatabase, userId: string, recovery: boolean, check = () => {}) {
  const tx = db.transaction(['projects', 'thumbnails', 'settings', 'editorRoutes', 'leases'], 'readwrite');
  try {
    const lease = await tx.objectStore('leases').get(`deleted:${userId}`), journal = deletionJournal(lease);
    if (!lease || !journal) throw new PersistenceError('AUTH', 'このアカウントの削除同意を確認できませんでした。');
    check();
    for (const name of ['projects', 'thumbnails', 'editorRoutes'] as const) {
      const store = tx.objectStore(name);
      for (const key of await store.index('by-user').getAllKeys(userId)) { check(); await store.delete(key); }
    }
    check(); await tx.objectStore('settings').delete(userId);
    check(); await tx.objectStore('leases').delete(`sync:${userId}`);
    const next: AccountDeletionJournal = { ...journal, local: 'complete', recovery: journal.recovery || recovery };
    check(); await tx.objectStore('leases').put({ ...lease, deletion: next, phase: next.cloud === 'unknown' ? 'requested' : 'complete' });
    check(); await tx.done; return next;
  } catch (error) {
    try { tx.abort(); } catch { /* Transaction already aborted. */ }
    await tx.done.catch(() => {});
    if (error instanceof PersistenceError) throw error;
    throw new PersistenceError('STORAGE', 'この端末に残るデータを削除できませんでした。もう一度お試しください。');
  }
}

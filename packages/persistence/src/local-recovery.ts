import { projectKey, type LocalDatabase, type LocalRow } from './local';
import { PersistenceError } from './types';
import { validateProject } from './validation';

export interface UnreadableProject { key: string; id: string; title: string; detectedAt: string }
export function unreadableProjectError() {
  return new PersistenceError('VALIDATION', 'この作品を読み取れません。元データはこの端末に残しています。設定の「読み取れない作品」から保存・整理できます。');
}
export function validLocalRow(row: LocalRow): boolean {
  try {
    const project = validateProject(row.project);
    if (row.quarantine || row.userId !== project.userId || row.key !== projectKey(project.userId, project.id)
      || !Number.isSafeInteger(row.baseVersion) || row.baseVersion < 0
      || !Number.isSafeInteger(row.revision) || row.revision < 0
      || typeof row.dirty !== 'boolean' || typeof row.deleted !== 'boolean') return false;
    if (row.pendingCommit && (!validLocalRow({ ...row.pendingCommit, pendingCommit: undefined }) || row.pendingCommit.key !== row.key)) return false;
    return true;
  } catch { return false; }
}
export function unreadableDescription(row: LocalRow): UnreadableProject {
  const value: unknown = row.project;
  const title = value && typeof value === 'object' && 'title' in value && typeof value.title === 'string' ? value.title.slice(0, 120) : '読み取れない作品';
  return { key: row.key, id: row.key.slice(row.userId.length + 1), title, detectedAt: row.quarantine?.detectedAt ?? '' };
}
/** Preserve every payload and pending operation; only disable unsafe normal use/sync. */
export async function inspectLocalRows(db: LocalDatabase, userId: string, check: () => void): Promise<LocalRow[]> {
  const tx = db.transaction(['projects', 'thumbnails', 'leases'], 'readwrite');
  let rows: LocalRow[] | undefined;
  try {
    check();
    rows = await tx.objectStore('projects').index('by-user').getAll(userId);
    check();
    const deleting = await tx.objectStore('leases').get(`deleted:${userId}`);
    if (!deleting) for (const row of rows) {
      if (validLocalRow(row)) continue;
      check();
      // Already isolated rows need no rewrite, including when storage is full.
      if (!row.quarantine || row.pendingUserId !== undefined) {
        row.quarantine ??= { detectedAt: new Date().toISOString(), reason: 'invalid-record' };
        row.pendingUserId = undefined;
        await tx.objectStore('projects').put(row);
      }
      const thumbnail = await tx.objectStore('thumbnails').get(row.key);
      if (thumbnail?.pendingUserId !== undefined) await tx.objectStore('thumbnails').put({ ...thumbnail, pendingUserId: undefined });
    }
    check(); await tx.done; return rows;
  } catch (error) {
    try { tx.abort(); } catch { /* Already settled. */ }
    await tx.done.catch(() => {});
    check();
    // If even the small marker cannot be stored, keep all bytes as they were and
    // still allow valid work to be read/exported. Sync also validates each row.
    if (rows && error instanceof DOMException && ['QuotaExceededError', 'UnknownError'].includes(error.name)) return rows;
    throw error;
  }
}

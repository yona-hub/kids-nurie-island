import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppSettings, Project } from '../../shared-types/src/index';
import type { DeletionLease } from './account-deletion';

export interface LocalRow {
  key: string;
  userId: string;
  project: Project;
  baseVersion: number;
  revision: number;
  writerId: string;
  editGeneration: string;
  operationId: string;
  dirty: boolean;
  deleted: boolean;
  pendingUserId?: string;
  // Keep unreadable source data in place, outside normal editing and the outbox.
  quarantine?: { detectedAt: string; reason: 'invalid-record' };
  // Durable request snapshot. Later local edits must never replace its operationId/payload.
  pendingCommit?: Omit<LocalRow, 'pendingCommit'>;
}
export type ThumbnailData = Blob | { bytes: ArrayBuffer; mimeType: string };
export const thumbnailBlob = (data: ThumbnailData): Blob => data instanceof Blob ? data : new Blob([data.bytes], { type: data.mimeType });
export const thumbnailData = async (blob: Blob): Promise<ThumbnailData> => ({ bytes: await blob.arrayBuffer(), mimeType: blob.type });
export interface ThumbnailRow { key: string; userId: string; projectId: string; blob?: ThumbnailData; dirty: boolean; revision: number; projectRevision?: number; deleted: boolean; pendingUserId?: string; source?: 'local' | 'cloud'; cloudVersion?: number; renderKey?: string }
export function withSyncIndex<T extends { userId: string; dirty: boolean; quarantine?: unknown }>(row: T): T & { pendingUserId?: string } {
  return { ...row, pendingUserId: row.dirty && !row.quarantine ? row.userId : undefined };
}
interface IslandDatabase extends DBSchema {
  projects: { key: string; value: LocalRow; indexes: { 'by-user': string; 'by-pending-user': string } };
  thumbnails: { key: string; value: ThumbnailRow; indexes: { 'by-user': string; 'by-pending-user': string } };
  settings: { key: string; value: { userId: string; value: AppSettings } };
  editorRoutes: { key: string; value: { key: string; userId: string; sourceId: string; editGeneration: string; writerId: string; targetId: string }; indexes: { 'by-user': string } };
  leases: { key: string; value: DeletionLease };
}
export type LocalDatabase = IDBPDatabase<IslandDatabase>;
export const projectKey = (userId: string, id: string) => `${userId}:${id}`;
export const editorRouteKey = (userId: string, id: string, editGeneration: string, writerId: string) => `${projectKey(userId, id)}:${editGeneration}:${writerId}`;
export function openLocalDatabase(name: string): Promise<LocalDatabase> {
  return openDB<IslandDatabase>(name, 3, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        db.createObjectStore('projects', { keyPath: 'key' }).createIndex('by-user', 'userId');
        db.createObjectStore('thumbnails', { keyPath: 'key' }).createIndex('by-user', 'userId');
        db.createObjectStore('settings', { keyPath: 'userId' });
        db.createObjectStore('leases', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        transaction.objectStore('projects').createIndex('by-pending-user', 'pendingUserId');
        transaction.objectStore('thumbnails').createIndex('by-pending-user', 'pendingUserId');
      }
      if (oldVersion < 3) {
        db.createObjectStore('editorRoutes', { keyPath: 'key' }).createIndex('by-user', 'userId');
        const migrate = async () => {
          let project = await transaction.objectStore('projects').openCursor();
          while (project) {
            await project.update(withSyncIndex({ ...project.value, editGeneration: crypto.randomUUID() }));
            project = await project.continue();
          }
          if (oldVersion >= 2) return;
          let thumbnail = await transaction.objectStore('thumbnails').openCursor();
          while (thumbnail) {
            // Pre-v2 cloud images have no provable source version. Invalidate the derived cache,
            // retaining deletion intents and the canonical project state for safe redraw.
            await thumbnail.update(withSyncIndex({ ...thumbnail.value, projectRevision: undefined }));
            thumbnail = await thumbnail.continue();
          }
        };
        void migrate().catch(() => transaction.abort());
      }
    },
  });
}

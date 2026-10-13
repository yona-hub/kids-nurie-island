import type { AppSettings, Project } from '../../shared-types/src/index';

export interface Session {
  userId: string;
  provider: string;
  displayName?: string;
  localOnly: boolean;
  /** Cached local owner only; cloud requests require successful revalidation. */
  offline?: boolean;
}
export interface AuthAdapter {
  initialize(): Promise<Session | null>;
  subscribe(listener: (session: Session | null) => void): () => void;
  signIn(provider?: string): Promise<void>;
  signOut(expectedUserId?: string, signal?: AbortSignal): Promise<void>;
  forgetUser?(expectedUserId: string, signal?: AbortSignal): Promise<void>;
  revalidate?(): Promise<Session | null>;
  dispose?(): void;
}
export type CommitResult = { kind: 'saved'; project: Project } | { kind: 'conflict'; project: Project | null };
export interface CloudRecord { project: Project; deleted: boolean }
export interface CloudAdapter {
  list(userId: string): Promise<CloudRecord[]>;
  save(project: Project, expectedVersion: number, operationId: string): Promise<CommitResult>;
  delete(userId: string, id: string, expectedVersion: number, operationId: string): Promise<CommitResult>;
  uploadThumbnail(userId: string, id: string, version: number, blob: Blob, renderKey?: string): Promise<void>;
  downloadThumbnail(userId: string, id: string, version: number, renderKey?: string): Promise<Blob | undefined>;
  deleteThumbnail(userId: string, id: string): Promise<void>;
  deleteAccountData(expectedUserId: string, signal: AbortSignal): Promise<void>;
}
export interface SyncStatus {
  state: 'idle' | 'syncing' | 'offline' | 'error';
  unsyncedCount: number;
  error?: string;
  lastSyncedAt?: string;
  notice?: string;
  localSaveFailed?: boolean;
}
export interface ServiceConfig {
  supabaseUrl?: string;
  publishableKey?: string;
  demoMode?: boolean;
  development?: boolean;
  dbName?: string;
  cloud?: CloudAdapter;
  authAdapter?: AuthAdapter;
  online?: () => boolean;
  debounceMs?: number;
}
export interface CreateProjectInput {
  templateId: string;
  title: string;
  backgroundId?: string;
  frameId?: string;
  metadata?: Project['metadata'];
}
export interface BackupDocument {
  format: 'kids-nurie-island';
  schemaVersion: 1;
  exportedAt: string;
  projects: Project[];
  settings: AppSettings;
}
export class PersistenceError extends Error {
  constructor(public readonly code: 'CONFIGURATION' | 'AUTH' | 'LIMIT' | 'VALIDATION' | 'STORAGE' | 'DELETED' | 'CHANGED' | 'CLOUD', message: string) {
    super(message);
    this.name = 'PersistenceError';
  }
}

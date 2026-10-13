import type { AppSettings, Project } from '../packages/shared-types/src/index';
import { DEFAULT_SETTINGS } from '../packages/shared-types/src/index';
import type { AuthAdapter, CloudAdapter, CloudRecord, CommitResult, Session } from '../packages/persistence/src/types';

export const USER_A = '11111111-1111-4111-8111-111111111111';
export const USER_B = '22222222-2222-4222-8222-222222222222';
export const makeProject = (userId = USER_A, overrides: Partial<Project> = {}): Project => ({
  schemaVersion: 1, id: crypto.randomUUID(), userId, templateId: 'princess-rabbit', title: 'おひめさま', status: 'draft', regions: {}, backgroundId: 'white', frameId: 'none', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 0, metadata: {}, ...overrides,
});
export function backup(projects: Project[], settings: AppSettings = { ...DEFAULT_SETTINGS }) {
  return JSON.stringify({ format: 'kids-nurie-island', schemaVersion: 1, exportedAt: new Date().toISOString(), projects, settings });
}
export class TestAuth implements AuthAdapter {
  session: Session | null;
  listeners = new Set<(session: Session | null) => void>();
  constructor(userId = USER_A, localOnly = false) { this.session = { userId, provider: localOnly ? 'demo' : 'google', localOnly }; }
  async initialize() { return this.session; }
  subscribe(fn: (session: Session | null) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  setSession(session: Session | null) { this.session = session; this.listeners.forEach(fn => fn(session)); }
  async signIn() { this.setSession({ userId: USER_A, provider: 'google', localOnly: false }); }
  async signOut() { this.setSession(null); }
}
export class MemoryCloud implements CloudAdapter {
  records = new Map<string, CloudRecord>();
  receipts = new Map<string, CommitResult>();
  thumbnails = new Map<string, Blob>();
  saves = 0;
  fail = false;
  loseResponse = false;
  beforeSave?: () => Promise<void>;
  async list(userId: string) {
    if (this.fail) throw new Error('network');
    return structuredClone([...this.records.values()].filter(row => row.project.userId === userId));
  }
  async save(project: Project, expectedVersion: number, operationId: string): Promise<CommitResult> {
    this.saves++;
    await this.beforeSave?.();
    if (this.fail) throw new Error('network');
    const receipt = this.receipts.get(operationId);
    if (receipt) return structuredClone(receipt);
    const current = this.records.get(project.id);
    if (current && current.project.userId !== project.userId) throw new Error('forbidden');
    if (current?.deleted || (current?.project.version ?? 0) !== expectedVersion) return { kind: 'conflict', project: current && !current.deleted ? structuredClone(current.project) : null };
    if (!current && [...this.records.values()].filter(row => row.project.userId === project.userId && !row.deleted).length >= 500) throw new Error('PROJECT_LIMIT');
    const result: CommitResult = { kind: 'saved', project: { ...structuredClone(project), version: expectedVersion + 1 } };
    this.records.set(project.id, { project: result.project, deleted: false });
    this.receipts.set(operationId, result);
    if (this.loseResponse) { this.loseResponse = false; throw new Error('response lost after database commit'); }
    return structuredClone(result);
  }
  async delete(userId: string, id: string, expectedVersion: number, operationId: string): Promise<CommitResult> {
    if (this.fail) throw new Error('network');
    const receipt = this.receipts.get(operationId);
    if (receipt) return structuredClone(receipt);
    const current = this.records.get(id);
    if (current && current.project.userId !== userId) throw new Error('forbidden');
    if (current && !current.deleted && current.project.version !== expectedVersion) return { kind: 'conflict', project: structuredClone(current.project) };
    const project = current?.project ?? makeProject(userId, { id });
    const result: CommitResult = { kind: 'saved', project: { ...project, version: project.version + 1 } };
    this.records.set(id, { project: result.project, deleted: true });
    this.receipts.set(operationId, result);
    return structuredClone(result);
  }
  async uploadThumbnail(userId: string, id: string, version: number, blob: Blob, renderKey?: string) {
    const current = this.records.get(id);
    if (!current || current.deleted || current.project.userId !== userId || current.project.version !== version) throw new Error('stale thumbnail');
    this.thumbnails.set(`${userId}/${id}.v${version}${renderKey === undefined ? '' : `.r${renderKey}`}`, blob);
  }
  async downloadThumbnail(userId: string, id: string, version: number, renderKey?: string) { return this.thumbnails.get(`${userId}/${id}.v${version}${renderKey === undefined ? '' : `.r${renderKey}`}`); }
  async deleteThumbnail(userId: string, id: string) { for (const key of this.thumbnails.keys()) if (key.startsWith(`${userId}/${id}.v`)) this.thumbnails.delete(key); }
  async deleteAccountData(expectedUserId: string, signal: AbortSignal) {
    if (signal.aborted) throw new Error('aborted');
    for (const [key, record] of this.records) if (record.project.userId === expectedUserId) this.records.delete(key);
    for (const key of this.thumbnails.keys()) if (key.startsWith(`${expectedUserId}/`)) this.thumbnails.delete(key);
  }
}
export function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

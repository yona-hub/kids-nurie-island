import { DEFAULT_SETTINGS, MAX_PROJECTS, type AppSettings, type Project } from '../../shared-types/src/index';
import { createAuth } from './auth';
import { SupabaseCloud } from './cloud';
import { editorRouteKey, openLocalDatabase, projectKey, thumbnailBlob, thumbnailData, withSyncIndex, type LocalDatabase, type LocalRow } from './local';
import { PersistenceError, type CreateProjectInput, type ServiceConfig, type Session, type SyncStatus } from './types';
import { MAX_BACKUP_BYTES, validateBackup, validateProject, validateSettings } from './validation';
import { deletionJournal, deletionJournals, eraseConsentedLocalData, updateDeletionJournal, type AccountDeletionJournal, type DeletionRecoveryState } from './account-deletion';
import { inspectLocalRows, unreadableDescription, unreadableProjectError, validLocalRow, type UnreadableProject } from './local-recovery';
export * from './types';
export { validateProject, validateBackup, MAX_BACKUP_BYTES } from './validation';
export type { DeletionRecoveryState } from './account-deletion';
export type { UnreadableProject } from './local-recovery';

const localRevision = Symbol('local-project-revision');
const editGeneration = Symbol('local-edit-generation');
type TrackedProject = Project & { [localRevision]?: number; [editGeneration]?: string };
type SaveOwner = { userId: string; generation: number; pendingKey: string };
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
function asProject(row: LocalRow): Project {
  if (!validLocalRow(row)) throw unreadableProjectError();
  const project: TrackedProject = structuredClone(row.project);
  project[localRevision] = row.revision;
  project[editGeneration] = row.editGeneration;
  return project;
}
function limitError() { return new PersistenceError('LIMIT', '作品が500件になりました。作品を整理してから、新しい作品を作ってください。'); }
function checkAccountFence(fence: unknown) {
  if (fence) throw new PersistenceError('AUTH', 'データの削除が始まっています。削除を完了してから、もう一度ログインしてください。');
}
function rowFor(input: Project, writerId: string, generation: string = uuid()): LocalRow {
  const project = validateProject(input);
  return withSyncIndex({ key: projectKey(project.userId, project.id), userId: project.userId, project, baseVersion: 0, revision: 1, writerId, editGeneration: generation, operationId: uuid(), dirty: true, deleted: false });
}
function editableState(project: Project): string {
  return JSON.stringify([project.id, project.userId, project.templateId, project.title, project.status, project.backgroundId, project.frameId,
    Object.entries(project.regions).sort(([a], [b]) => a.localeCompare(b)), Object.entries(project.metadata).sort(([a], [b]) => a.localeCompare(b))]);
}

/** Local writes resolve only after IndexedDB transaction commit. No UI state enters cloud payloads. */
export function createServices(config: ServiceConfig = {}) {
  const dbName = config.dbName ?? 'kids-nurie-island-v1';
  const instanceId = uuid();
  const connection = createAuth(config);
  const cloud = config.cloud ?? (connection.client ? new SupabaseCloud(connection.client) : undefined);
  const database = openLocalDatabase(dbName);
  let session: Session | null = null;
  let authGeneration = 0;
  let receivedAuthNotification = false;
  const accountOperations = new Set<AbortController>();
  let disposed = false;
  let deletingAccount = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let retryAttempt = 0;
  let running: Promise<void> | undefined;
  let requestedSync: { userId: string; generation: number } | undefined;
  let syncStatus: SyncStatus = { state: 'idle', unsyncedCount: 0 };
  const authListeners = new Set<(session: Session | null) => void>();
  const projectListeners = new Set<() => void>();
  const settingsListeners = new Set<(value: AppSettings, userId: string) => void>();
  const syncListeners = new Set<(status: SyncStatus) => void>();
  let deletionRecoveryState: DeletionRecoveryState[] = [];
  let unreadable = { userId: '', records: [] as UnreadableProject[], keys: new Set<string>() };
  const deletionRecoveryListeners = new Set<(state: DeletionRecoveryState[]) => void>();
  const deletionRecoveryErrors = new Map<string, string>();
  const failedLocalWrites = new Map<string, PersistenceError>();
  const discardableSaves = new WeakMap<PersistenceError, SaveOwner & { scope: string }>();
  const pendingProjectSaves = new Map<string, number>();
  const isOnline = config.online ?? (() => typeof navigator === 'undefined' || navigator.onLine);
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`${dbName}:changes`) : undefined;
  const publishStatus = (patch: Partial<SyncStatus>) => {
    syncStatus = { ...syncStatus, ...patch };
    if (failedLocalWrites.size > 0) syncStatus = { ...syncStatus, state: 'error', localSaveFailed: true, error: 'この端末に保存できませんでした。空き容量を確認し、画面を閉じずに再試行してください。' };
    syncListeners.forEach(fn => fn(syncStatus));
  };
  const publishProjects = (broadcast = true) => {
    projectListeners.forEach(fn => fn());
    if (broadcast && session) channel?.postMessage({ userId: session.userId, kind: 'projects' });
  };
  function publishSettings(userId: string, value: AppSettings, broadcast = true) {
    if (!disposed && session?.userId === userId) settingsListeners.forEach(listener => listener(value, userId));
    if (broadcast) channel?.postMessage({ userId, kind: 'settings' });
  }
  const requireSession = () => {
    if (!session || deletingAccount) throw new PersistenceError('AUTH', '作品を保存するため、ログインしてください。');
    return session;
  };
  function ownerCheck(userId: string, generation: number) {
    return () => { if (disposed || generation !== authGeneration || session?.userId !== userId) throw new PersistenceError('AUTH', 'アカウントが変わりました。もう一度確認してください。'); };
  }
  async function inspectRows(user: Session, generation = authGeneration) {
    const check = ownerCheck(user.userId, generation);
    const db = await database;
    const rows = await inspectLocalRows(db, user.userId, check);
    check();
    const records = rows.filter(row => !validLocalRow(row)).map(unreadableDescription);
    unreadable = { userId: user.userId, records, keys: new Set(records.map(record => record.key)) };
    return rows;
  }
  async function refreshCount(db: LocalDatabase, user: Session, generation = authGeneration) {
    if (disposed) return;
    // Index keys contain no Project payloads or thumbnail ArrayBuffers. A paint save therefore
    // never copies all account images merely to count its pending work.
    const [projectKeys, thumbnailKeys] = user.localOnly ? [[], []] : await Promise.all([db.getAllKeysFromIndex('projects', 'by-pending-user', user.userId), db.getAllKeysFromIndex('thumbnails', 'by-pending-user', user.userId)]);
    if (generation !== authGeneration || session?.userId !== user.userId) return;
    const count = new Set([...projectKeys, ...thumbnailKeys].filter(key => unreadable.userId !== user.userId || !unreadable.keys.has(key))).size;
    publishStatus({ unsyncedCount: count, ...(!isOnline() && count > 0 ? { state: 'offline' as const } : {}) });
  }
  function schedule() {
    clearTimeout(timer);
    if (!disposed && session && !session.localOnly && !session.offline && !deletingAccount) timer = setTimeout(() => { void flush(); }, config.debounceMs ?? 1500);
  }
  function reserveSync() {
    requestedSync = session && !session.localOnly && !disposed ? { userId: session.userId, generation: authGeneration } : undefined;
  }
  async function changed(immediate = false) {
    publishProjects();
    if (session) await refreshCount(await database, session);
    if (immediate) void flush(); else schedule();
  }
  const localWriteSucceeded = (scope: string) => {
    failedLocalWrites.delete(scope);
    if (syncStatus.localSaveFailed && failedLocalWrites.size === 0) publishStatus({ localSaveFailed: false, state: !session?.localOnly && !isOnline() ? 'offline' : 'idle', error: undefined });
  };
  async function storageFailure(error: unknown, scope: string, saveOwner?: SaveOwner): Promise<never> {
    if (saveOwner) ownerCheck(saveOwner.userId, saveOwner.generation)();
    if (error instanceof PersistenceError) throw error;
    const failure = new PersistenceError('STORAGE', 'この端末に保存できませんでした。空き容量を確認し、画面を閉じずに再試行してください。');
    failedLocalWrites.set(scope, failure);
    if (saveOwner) discardableSaves.set(failure, { ...saveOwner, scope });
    publishStatus({ state: 'error', localSaveFailed: true, error: 'この端末に保存できませんでした。空き容量を確認し、画面を閉じずに再試行してください。' });
    throw failure;
  }
  async function refreshDeletionRecovery(db: LocalDatabase) {
    deletionRecoveryState = (await deletionJournals(db)).filter(journal => journal.recovery && !journal.dismissed)
      .map(journal => ({ ...journal, error: deletionRecoveryErrors.get(journal.userId) }));
    if (!disposed) deletionRecoveryListeners.forEach(listener => listener(deletionRecoveryState));
  }
  async function recoverLocalDeletion(userId: string) {
    const db = await database;
    try {
      await updateDeletionJournal(db, userId, { recovery: true });
      await eraseConsentedLocalData(db, userId, true, () => { if (disposed) throw new PersistenceError('STORAGE', '画面を開きなおして削除を再試行してください。'); });
      deletionRecoveryErrors.delete(userId);
      if (session?.userId === userId) { publishProjects(false); publishSettings(userId, { ...DEFAULT_SETTINGS }, false); }
      channel?.postMessage({ userId, kind: 'account-local-deleted' });
    } catch (error) {
      deletionRecoveryErrors.set(userId, error instanceof Error ? error.message : '端末データの削除を再試行してください。');
      throw error;
    } finally { await refreshDeletionRecovery(db); }
  }
  async function resumeLocalDeletions(db: LocalDatabase) {
    for (const journal of await deletionJournals(db)) {
      if (journal.local === 'complete') continue;
      // The saved request is the consent. Neither a surviving token nor the active
      // account can grant/revoke this narrowly scoped local cleanup on restart.
      await recoverLocalDeletion(journal.userId).catch(() => {});
    }
    await refreshDeletionRecovery(db);
  }
  const unsubscribeAuth = connection.adapter.subscribe(value => {
    receivedAuthNotification = true;
    const priorUser = session?.userId;
    const wasOffline = session?.offline;
    session = value;
    if (priorUser !== session?.userId) {
      authGeneration++;
      accountOperations.forEach(controller => controller.abort());
      deletingAccount = false;
    }
    if (priorUser !== session?.userId || (wasOffline && !session?.offline)) reserveSync();
    clearTimeout(timer);
    clearTimeout(retryTimer);
    if (priorUser !== session?.userId) {
      failedLocalWrites.clear();
      publishStatus({ state: 'idle', unsyncedCount: 0, error: undefined, notice: undefined, lastSyncedAt: undefined, localSaveFailed: false });
    }
    authListeners.forEach(fn => fn(session));
    publishProjects(false);
    if (session) {
      const user = session, generation = authGeneration;
      void database.then(async db => {
        if (disposed) return;
        const fence = await db.get('leases', `deleted:${user.userId}`);
        if (disposed || generation !== authGeneration || session?.userId !== user.userId) return;
        if (fence) { deletingAccount = true; clearTimeout(timer); clearTimeout(retryTimer); publishStatus({ state: 'error', notice: 'データの削除が始まっています。設定から削除を完了できます。' }); }
        await refreshCount(db, user); schedule();
      }).catch(() => { if (!disposed) publishStatus({ state: 'error', error: 'この端末の保存状態を確認できませんでした。もう一度開いてください。' }); });
    }
    if (session?.offline) publishStatus({ state: 'offline' });
  });
  const deletionRecoveryReady = database.then(resumeLocalDeletions);
  const ready = Promise.all([database, connection.adapter.initialize(), deletionRecoveryReady]).then(async ([db, initial]) => {
    if (!receivedAuthNotification) {
      if (session?.userId !== initial?.userId) authGeneration++;
      session = initial;
    }
    const user = session;
    authListeners.forEach(fn => fn(session));
    if (user) {
      const fence = await db.get('leases', `deleted:${user.userId}`);
      if (session?.userId === user.userId && fence) { deletingAccount = true; publishStatus({ state: 'error', notice: 'データの削除が始まっています。設定から削除を完了できます。' }); }
      await refreshCount(db, user);
    }
    if (session?.offline) publishStatus({ state: 'offline' });
    schedule();
  });
  if (channel) channel.onmessage = event => {
    if (!disposed && ['account-local-deleted', 'account-deletion-state'].includes(event.data?.kind)) {
      void database.then(refreshDeletionRecovery).catch(() => {});
      if (session?.userId === event.data.userId) publishProjects(false);
      return;
    }
    if (disposed || !session || event.data?.userId !== session.userId) return;
    if (event.data.kind === 'settings') {
      const userId = session.userId, generation = authGeneration;
      void database.then(async db => {
        const record = await db.get('settings', userId);
        if (generation === authGeneration && session?.userId === userId) publishSettings(userId, record?.value ?? { ...DEFAULT_SETTINGS }, false);
      }).catch(() => {});
      return;
    }
    if (event.data.kind === 'account-deleting') {
      deletingAccount = true;
      clearTimeout(timer); clearTimeout(retryTimer);
      publishStatus({ state: 'error', notice: 'データの削除が始まっています。設定から削除を完了できます。' });
      return;
    }
    if (event.data.kind === 'account-deleted') {
      const userId = session.userId;
      void (connection.adapter.forgetUser?.(userId) ?? connection.adapter.signOut(userId));
      return;
    }
    if (event.data.kind === 'account-deletion-cancelled') {
      const userId = session.userId;
      void database.then(async db => {
        if (!(await db.get('leases', `deleted:${userId}`)) && session?.userId === userId) {
          deletingAccount = false; publishStatus({ state: session.offline ? 'offline' : 'idle', notice: undefined }); schedule();
        }
      });
      return;
    }
    publishProjects(false);
    const user = session;
    void database.then(async db => { await refreshCount(db, user); if (syncStatus.unsyncedCount > 0) schedule(); });
  };

  async function acquireLease(db: LocalDatabase, userId: string): Promise<boolean> {
    const key = `sync:${userId}`;
    const tx = db.transaction('leases', 'readwrite');
    if (await tx.store.get(`deleted:${userId}`)) { await tx.done; return false; }
    const current = await tx.store.get(key);
    if (current && current.owner !== instanceId && current.expiresAt > Date.now()) { await tx.done; return false; }
    await tx.store.put({ key, owner: instanceId, expiresAt: Date.now() + 30_000 });
    await tx.done;
    return true;
  }
  async function releaseLease(db: LocalDatabase, userId: string) {
    const tx = db.transaction('leases', 'readwrite');
    const key = `sync:${userId}`;
    if ((await tx.store.get(key))?.owner === instanceId) await tx.store.delete(key);
    await tx.done;
  }
  async function prepareCommit(db: LocalDatabase, key: string, isCurrent: () => boolean): Promise<LocalRow | undefined> {
    const tx = db.transaction(['projects', 'leases'], 'readwrite');
    const store = tx.objectStore('projects');
    const row = await store.get(key);
    const lease = row ? await tx.objectStore('leases').get(`sync:${row.userId}`) : undefined;
    const fence = row ? await tx.objectStore('leases').get(`deleted:${row.userId}`) : undefined;
    if (!row?.dirty || !validLocalRow(row) || !isCurrent() || lease?.owner !== instanceId || fence) { await tx.done; return; }
    if (row.pendingCommit) { await tx.done; return row.pendingCommit; }
    const snapshot = { ...row }; delete snapshot.pendingCommit;
    await store.put({ ...row, pendingCommit: snapshot });
    await tx.done;
    return snapshot;
  }
  async function clearRejectedCommit(db: LocalDatabase, snapshot: LocalRow, isCurrent: () => boolean) {
    const tx = db.transaction(['projects', 'leases'], 'readwrite');
    const store = tx.objectStore('projects');
    const row = await store.get(snapshot.key);
    const lease = await tx.objectStore('leases').get(`sync:${snapshot.userId}`);
    if (isCurrent() && lease?.owner === instanceId && row && validLocalRow(row) && row.pendingCommit?.operationId === snapshot.operationId) await store.put({ ...row, pendingCommit: undefined });
    await tx.done;
  }
  async function acknowledge(db: LocalDatabase, snapshot: LocalRow, remote: Project, isCurrent: () => boolean) {
    const tx = db.transaction(['projects', 'leases'], 'readwrite');
    const store = tx.objectStore('projects');
    const current = await store.get(snapshot.key);
    const lease = await tx.objectStore('leases').get(`sync:${snapshot.userId}`);
    if (isCurrent() && lease?.owner === instanceId && current && validLocalRow(current) && current.pendingCommit?.operationId === snapshot.operationId && current.baseVersion <= remote.version) {
      if (current.operationId === snapshot.operationId) {
        current.project = remote;
        current.dirty = false;
      } else {
        // An edit/delete arrived while the request was in flight. Only advance its accepted base.
        current.project.version = remote.version;
      }
      current.baseVersion = remote.version;
      current.pendingCommit = undefined;
      await store.put(withSyncIndex(current));
    }
    await tx.done;
  }
  async function preserveBoth(db: LocalDatabase, snapshot: LocalRow, remote: Project | null, isCurrent: () => boolean) {
    const tx = db.transaction(['projects', 'thumbnails', 'editorRoutes', 'leases'], 'readwrite');
    const store = tx.objectStore('projects');
    const current = await store.get(snapshot.key);
    const lease = await tx.objectStore('leases').get(`sync:${snapshot.userId}`);
    if (!isCurrent() || lease?.owner !== instanceId || !current?.dirty || !validLocalRow(current) || current.pendingCommit?.operationId !== snapshot.operationId || current.baseVersion > snapshot.baseVersion) { await tx.done; return; }
    if (current.deleted) {
      if (remote) {
        await store.put(withSyncIndex({ ...current, project: validateProject(remote), baseVersion: remote.version, pendingCommit: undefined, dirty: false, deleted: false, writerId: 'cloud', editGeneration: uuid(), revision: current.revision + 1 }));
        await tx.objectStore('thumbnails').delete(current.key);
      }
      else await store.put(withSyncIndex({ ...current, pendingCommit: undefined, dirty: false }));
      await tx.done;
      if (isCurrent()) publishStatus({ notice: remote ? '別の端末で新しく保存された作品を残しました。削除するときは、もう一度作品を確認してください。' : undefined });
      return;
    }
    const liveCount = (await store.index('by-user').getAll(snapshot.userId)).filter(row => !row.deleted).length;
    if (remote && liveCount >= MAX_PROJECTS) { tx.abort(); await tx.done.catch(() => {}); throw limitError(); }
    // Provenance belongs to the local routing store, never to the user's metadata. Preserve
    // the actual editor's writer/generation even when another tab owns the sync lease.
    const copyRow = rowFor({ ...current.project, id: uuid(), title: `${current.project.title.slice(0, 105)}（別の作品）`, version: 0, createdAt: now(), updatedAt: now() }, current.writerId, current.editGeneration);
    const copy = copyRow.project;
    const remoteProject = remote ? validateProject(remote) : current.project;
    await store.add(copyRow);
    await tx.objectStore('editorRoutes').put({ key: editorRouteKey(current.userId, current.project.id, current.editGeneration, current.writerId), userId: current.userId, sourceId: current.project.id, editGeneration: current.editGeneration, writerId: current.writerId, targetId: copy.id });
    const thumbnail = await tx.objectStore('thumbnails').get(current.key);
    if (thumbnail?.blob && thumbnail.projectRevision === current.revision) await tx.objectStore('thumbnails').put(withSyncIndex({ ...thumbnail, key: projectKey(copy.userId, copy.id), projectId: copy.id, dirty: true, deleted: false, projectRevision: 1, source: 'local', cloudVersion: undefined }));
    await tx.objectStore('thumbnails').delete(current.key);
    await store.put(withSyncIndex({ ...current, project: remoteProject, baseVersion: remote?.version ?? current.baseVersion, pendingCommit: undefined, dirty: false, deleted: !remote, writerId: 'cloud', editGeneration: uuid(), revision: current.revision + 1 }));
    await tx.done;
    if (isCurrent()) publishStatus({ notice: '別の端末の作品を残し、この端末でぬった作品を「別の作品」として保存しました。' });
  }
  async function synchronize(db: LocalDatabase, user: Session, generation: number) {
    const isCurrent = () => !disposed && !deletingAccount && generation === authGeneration && session?.userId === user.userId;
    if (!cloud || user.localOnly || !isCurrent()) return;
    if (!isOnline() || user.offline) { await refreshCount(db, user); if (isCurrent()) publishStatus({ state: 'offline', error: undefined }); return; }
    if (!(await acquireLease(db, user.userId))) { if (isCurrent()) schedule(); return; }
    if (!isCurrent()) { await releaseLease(db, user.userId); return; }
    const heartbeat = setInterval(() => {
      if (isCurrent()) void acquireLease(db, user.userId).catch(() => {});
    }, 10_000);
    publishStatus({ state: 'syncing', error: undefined });
    try {
      await inspectRows(user, generation);
      const failures = new Map<string, { error: unknown; capacityRevision: number }>();
      let capacityRevision = 0;
      // A bounded loop includes edits made during a request, without starving an active painter.
      for (let pass = 0; pass < 8; pass++) {
        const pending = (await db.getAllFromIndex('projects', 'by-pending-user', user.userId))
          .filter(row => { const id = row.pendingCommit?.operationId ?? row.operationId; return !failures.has(id) || failures.get(id)!.capacityRevision < capacityRevision; })
          .sort((a, b) => Number(b.deleted) - Number(a.deleted));
        if (!pending.length) break;
        for (const queued of pending) {
          if (!isCurrent() || session?.offline || !isOnline()) return;
          let snapshot: LocalRow | undefined;
          try {
            snapshot = await prepareCommit(db, queued.key, isCurrent);
            if (!snapshot) continue;
            if (!isCurrent() || session?.offline || !isOnline()) return;
            const result = snapshot.deleted
              ? await cloud.delete(user.userId, snapshot.project.id, snapshot.baseVersion, snapshot.operationId)
              : await cloud.save(snapshot.project, snapshot.baseVersion, snapshot.operationId);
            if (!isCurrent()) return;
            if (result.kind === 'saved') {
              await acknowledge(db, snapshot, result.project, isCurrent);
              if (snapshot.deleted) capacityRevision++;
            } else await preserveBoth(db, snapshot, result.project, isCurrent);
            failures.delete(snapshot.operationId);
          } catch (error) {
            if (!isCurrent()) return;
            // A rejected create (including a full cloud account) must not starve an update,
            // deletion or the pull needed to show the user works they can organize.
            if (snapshot && error instanceof PersistenceError && error.code === 'LIMIT') await clearRejectedCommit(db, snapshot, isCurrent);
            failures.set((snapshot ?? queued.pendingCommit ?? queued).operationId, { error, capacityRevision });
          }
        }
      }
      try {
        if (!isCurrent()) return;
        if (session?.offline || !isOnline()) { publishStatus({ state: 'offline', error: undefined }); return; }
        const remote = await cloud.list(user.userId);
        if (!isCurrent()) return;
        const tx = db.transaction(['projects', 'leases'], 'readwrite');
        const store = tx.objectStore('projects');
        if (await tx.objectStore('leases').get(`deleted:${user.userId}`)) {
          await tx.done;
          if (isCurrent()) { deletingAccount = true; publishStatus({ state: 'error', notice: 'データの削除が始まっています。設定から削除を完了できます。' }); }
          return;
        }
        for (const record of remote) {
          const key = projectKey(user.userId, record.project.id);
          const local = await store.get(key);
          if (local && !validLocalRow(local)) continue; // Retain damaged local evidence until explicit recovery/cleanup.
          if (local?.dirty || (local && local.baseVersion > record.project.version)) continue;
          if (local && local.baseVersion === record.project.version && local.deleted === record.deleted) continue;
          await store.put({ key, userId: user.userId, project: validateProject(record.project), baseVersion: record.project.version, revision: (local?.revision ?? 0) + 1, writerId: 'cloud', editGeneration: uuid(), operationId: uuid(), dirty: false, deleted: record.deleted });
        }
        // Only explicit tombstones delete cached works: absence in a changing paginated list
        // cannot prove deletion. Extra local pending works survive a full-account pull.
        await tx.done;
      } catch (error) {
        failures.set('pull', { error, capacityRevision });
      }
      for (const key of await db.getAllKeysFromIndex('thumbnails', 'by-pending-user', user.userId)) {
        try {
          const thumbnail = await db.get('thumbnails', key);
          if (!thumbnail?.dirty) continue;
          if (!isCurrent() || !isOnline()) return;
          const project = await db.get('projects', thumbnail.key);
          if (!isCurrent() || session?.offline || !isOnline()) return;
          if (project && !validLocalRow(project)) continue;
          if (thumbnail.deleted || !project || project.deleted) await cloud.deleteThumbnail(user.userId, thumbnail.projectId);
          else if (!project.dirty && thumbnail.blob && thumbnail.projectRevision === project.revision) await cloud.uploadThumbnail(user.userId, thumbnail.projectId, project.baseVersion, thumbnailBlob(thumbnail.blob), thumbnail.renderKey);
          else if (thumbnail.projectRevision !== project.revision) {
            const outdated = db.transaction('thumbnails', 'readwrite');
            const current = await outdated.store.get(thumbnail.key);
            if (current?.revision === thumbnail.revision) await outdated.store.delete(thumbnail.key);
            await outdated.done;
            continue;
          }
          else continue;
          const thumbnailTx = db.transaction('thumbnails', 'readwrite');
          const current = await thumbnailTx.store.get(thumbnail.key);
          if (current?.revision === thumbnail.revision) await thumbnailTx.store.put(withSyncIndex({ ...current, dirty: false, cloudVersion: project?.baseVersion }));
          await thumbnailTx.done;
        } catch (error) {
          failures.set(`thumbnail:${key}`, { error, capacityRevision });
        }
      }
      if (!isCurrent()) return;
      publishProjects();
      // A later edit/delete can supersede a failed operation within this pass.
      const pendingOperations = new Set((await db.getAllFromIndex('projects', 'by-pending-user', user.userId)).map(row => row.pendingCommit?.operationId ?? row.operationId));
      if (!isCurrent()) return;
      for (const key of failures.keys()) if (key !== 'pull' && !key.startsWith('thumbnail:') && !pendingOperations.has(key)) failures.delete(key);
      if (failures.size) throw failures.values().next().value!.error;
      retryAttempt = 0;
      publishStatus({ state: 'idle', error: undefined, lastSyncedAt: now() });
    } catch (error) {
      if (!isCurrent()) return;
      publishStatus({ state: isOnline() ? 'error' : 'offline', error: error instanceof PersistenceError ? error.message : 'この端末に保存済みです。クラウドへ同期できていません。' });
      if (!disposed) {
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => { void flush(); }, Math.min(60_000, 2000 * 2 ** retryAttempt++));
      }
    } finally {
      clearInterval(heartbeat);
      await releaseLease(db, user.userId);
      if (isCurrent()) {
        await refreshCount(db, user);
        if (isCurrent() && syncStatus.state === 'idle' && syncStatus.unsyncedCount) schedule();
      }
    }
  }
  async function flush(): Promise<void> {
    clearTimeout(timer);
    clearTimeout(retryTimer);
    await ready;
    reserveSync();
    if (running) return running;
    if (!requestedSync) return;
    running = (async () => {
      try {
        const db = await database;
        while (requestedSync && !disposed) {
          const request = requestedSync; requestedSync = undefined;
          clearTimeout(timer);
          if (!session || session.localOnly || deletingAccount || request.generation !== authGeneration || request.userId !== session.userId) continue;
          if (session.offline && isOnline()) await connection.adapter.revalidate?.();
          if (!session || deletingAccount || request.generation !== authGeneration || request.userId !== session.userId) continue;
          await synchronize(db, session, request.generation);
        }
      } finally {
        // Clear in the same continuation that drains the reservation; a separate Promise
        // .finally would leave a microtask gap where a new request can join a finished run.
        running = undefined;
      }
    })();
    return running;
  }
  const online = () => { void flush(); };
  const offline = () => { if (!session?.localOnly) publishStatus({ state: 'offline' }); };
  const visibility = () => { if (typeof document !== 'undefined' && document.visibilityState === 'hidden') void flush(); };
  globalThis.addEventListener?.('online', online);
  globalThis.addEventListener?.('offline', offline);
  globalThis.addEventListener?.('pagehide', online);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visibility);

  const projects = {
    subscribe(fn: () => void) { projectListeners.add(fn); return () => { projectListeners.delete(fn); }; },
    async list(): Promise<Project[]> {
      await ready;
      if (!session) return [];
      const user = session;
      const rows = await inspectRows(user);
      return session?.userId === user.userId ? rows.filter(row => !row.deleted && validLocalRow(row)).map(asProject).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
    },
    async get(id: string): Promise<Project | undefined> {
      await ready;
      const user = requireSession();
      const row = await (await database).get('projects', projectKey(user.userId, id));
      return row && !row.deleted && session?.userId === user.userId ? asProject(row) : undefined;
    },
    async count(): Promise<number> { return (await projects.list()).length; },
    async create(input: CreateProjectInput): Promise<Project> {
      await ready;
      const user = requireSession();
      const project = validateProject({ schemaVersion: 1, id: uuid(), userId: user.userId, templateId: input.templateId, title: input.title, status: 'draft', regions: {}, backgroundId: input.backgroundId ?? 'white', frameId: input.frameId ?? 'none', createdAt: now(), updatedAt: now(), version: 0, metadata: input.metadata ?? {} });
      try {
        const db = await database;
        const tx = db.transaction(['projects', 'leases'], 'readwrite');
        checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`));
        const store = tx.objectStore('projects');
        if ((await store.index('by-user').getAll(user.userId)).filter(row => !row.deleted).length >= MAX_PROJECTS) { await tx.done; throw limitError(); }
        const row = rowFor(project, instanceId);
        row.dirty = !user.localOnly;
        await store.add(withSyncIndex(row));
        await tx.done;
        localWriteSucceeded('create');
        await changed();
        return asProject(row);
      } catch (error) { return storageFailure(error, 'create'); }
    },
    async save(input: Project, options: { immediate?: boolean } = {}): Promise<Project> {
      // Register before the first await: a retry invoked in this turn already blocks discard.
      const requestUserId = session?.userId, requestGeneration = authGeneration;
      const pendingKey = `${requestGeneration}:${input.userId}:${input.id}`;
      pendingProjectSaves.set(pendingKey, (pendingProjectSaves.get(pendingKey) ?? 0) + 1);
      try {
        await ready;
        if (requestUserId) ownerCheck(requestUserId, requestGeneration)();
        const user = requireSession();
        if (input.userId !== user.userId) throw new PersistenceError('AUTH', '別のアカウントの作品は保存できません。');
        const project = validateProject(input);
        const saveOwner = { userId: user.userId, generation: authGeneration, pendingKey };
        const checkOwner = ownerCheck(user.userId, saveOwner.generation);
        let transaction: Pick<ReturnType<LocalDatabase['transaction']>, 'abort' | 'done'> | undefined;
        try {
          const db = await database;
          checkOwner();
          const tx = db.transaction(['projects', 'leases', 'editorRoutes'], 'readwrite');
          transaction = tx;
          checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`));
          const store = tx.objectStore('projects');
          const key = projectKey(user.userId, project.id);
          let current = await store.get(key);
          const sourceRevision = (input as TrackedProject)[localRevision];
          const sourceGeneration = (input as TrackedProject)[editGeneration];
          const generation = sourceGeneration ?? `untracked-version-${project.version}`;
          const visited = new Set<string>();
          // A retained editor can still send its original ID while local saves are in flight.
          // Follow durable generation-specific routes, including a copy that later conflicted.
          for (;;) {
            const route = await tx.objectStore('editorRoutes').get(editorRouteKey(user.userId, project.id, generation, instanceId));
            if (!route) break;
            if (visited.has(route.targetId)) { await tx.done; throw new PersistenceError('STORAGE', '編集先を確認できませんでした。作品一覧からもう一度開いてください。'); }
            visited.add(project.id);
            project.id = route.targetId;
            current = await store.get(projectKey(user.userId, project.id));
          }
          if (!current || current.deleted) { await tx.done; throw new PersistenceError('DELETED', 'この作品は削除されています。作品一覧に戻ってください。'); }
          if (!validLocalRow(current)) { await tx.done; throw unreadableProjectError(); }
          const staleOtherWriter = (sourceGeneration !== undefined && sourceGeneration !== current.editGeneration)
            || (current.writerId !== instanceId && ((sourceRevision !== undefined && sourceRevision !== current.revision) || (sourceRevision === undefined && (current.dirty || project.version !== current.baseVersion))));
          let next: LocalRow;
          if (staleOtherWriter) {
            if ((await store.index('by-user').getAll(user.userId)).filter(row => !row.deleted).length >= MAX_PROJECTS) { await tx.done; throw limitError(); }
            next = rowFor({ ...project, id: uuid(), version: 0, title: `${project.title.slice(0, 105)}（別の作品）`, createdAt: now(), updatedAt: now() }, instanceId, generation);
            await tx.objectStore('editorRoutes').put({ key: editorRouteKey(user.userId, project.id, generation, instanceId), userId: user.userId, sourceId: project.id, editGeneration: generation, writerId: instanceId, targetId: next.project.id });
          } else {
            next = { ...current, project: validateProject({ ...project, version: current.baseVersion, createdAt: current.project.createdAt, updatedAt: now() }), revision: current.revision + 1, writerId: instanceId, operationId: uuid(), dirty: !user.localOnly };
          }
          next.dirty = !user.localOnly;
          checkOwner();
          await store.put(withSyncIndex(next));
          checkOwner();
          await tx.done;
          checkOwner();
          localWriteSucceeded(`project:${input.id}`);
          if (staleOtherWriter) publishStatus({ notice: '別の画面の作品を残し、この画面でぬった作品を「別の作品」として保存しました。' });
          await changed(options.immediate);
          return asProject(next);
        } catch (error) {
          // A successful route request is still provisional. Roll it back with the
          // project if ownership changes or a later write fails before commit.
          if (transaction) {
            try { transaction.abort(); } catch { /* Already committed or aborted. */ }
            await transaction.done.catch(() => {});
          }
          return await storageFailure(error, `project:${input.id}`, saveOwner);
        }
      } finally {
        const remaining = (pendingProjectSaves.get(pendingKey) ?? 1) - 1;
        if (remaining > 0) pendingProjectSaves.set(pendingKey, remaining);
        else pendingProjectSaves.delete(pendingKey);
      }
    },
    /** Acknowledge only the settled save failure whose volatile edits the user discarded.
     * The error is an opaque capability; project IDs alone cannot clear other editors' failures. */
    discardFailedSave(error: unknown): boolean {
      if (!(error instanceof PersistenceError)) return false;
      const owner = discardableSaves.get(error);
      if (!owner || disposed || deletingAccount || session?.userId !== owner.userId || authGeneration !== owner.generation
        || pendingProjectSaves.has(owner.pendingKey) || failedLocalWrites.get(owner.scope) !== error) return false;
      discardableSaves.delete(error);
      localWriteSucceeded(owner.scope);
      return true;
    },
    async delete(expected: Project): Promise<void> {
      await ready;
      const user = requireSession();
      if (!expected || typeof expected !== 'object' || expected.userId !== user.userId) throw new PersistenceError('AUTH', '削除する作品をもう一度確認してください。');
      const id = expected.id;
      try {
        const db = await database;
        const tx = db.transaction(['projects', 'thumbnails', 'leases'], 'readwrite');
        checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`));
        const key = projectKey(user.userId, id);
        const row = await tx.objectStore('projects').get(key);
        if (row && !row.deleted) {
          if (!validLocalRow(row)) { await tx.done; throw unreadableProjectError(); }
          const expectedRevision = (expected as TrackedProject)[localRevision];
          if ((expectedRevision !== undefined && expectedRevision !== row.revision)
            || (expectedRevision === undefined && expected.version !== row.baseVersion)
            || editableState(validateProject(expected)) !== editableState(row.project)) {
            await tx.done;
            publishStatus({ notice: '新しく保存された作品を残しました。いまの作品を確認してから、もう一度削除してください。' });
            throw new PersistenceError('CHANGED', '作品が新しくなっています。いまの作品を確認してから、もう一度削除してください。');
          }
          await tx.objectStore('projects').put(withSyncIndex({ ...row, deleted: true, dirty: !user.localOnly, revision: row.revision + 1, operationId: uuid(), writerId: instanceId }));
          const thumbnail = await tx.objectStore('thumbnails').get(key);
          await tx.objectStore('thumbnails').put(withSyncIndex({ key, userId: user.userId, projectId: id, dirty: !user.localOnly, deleted: true, revision: (thumbnail?.revision ?? 0) + 1 }));
        }
        await tx.done;
        localWriteSucceeded(`project:${id}`);
        await changed(true);
      } catch (error) { return storageFailure(error, `project:${id}`); }
    },
    async duplicate(id: string, improved?: { sourceTemplateId: string; templateId: string; regionMap: Record<string, string>; backgroundMap: Record<string, string>; frameMap: Record<string, string>; renderer?: 'storybook-v2'|'storybook-v3'|'storybook-v4' }): Promise<Project> {
      await ready;
      const user = requireSession();
      const check = ownerCheck(user.userId, authGeneration);
      const db = await database;
      const tx = db.transaction(['projects', 'thumbnails', 'leases'], 'readwrite');
      try {
      checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`));
      const source = await tx.objectStore('projects').get(projectKey(user.userId, id));
      check();
      if (!source || source.deleted) { await tx.done; throw new PersistenceError('DELETED', 'この作品は見つかりませんでした。'); }
      if (!validLocalRow(source)) { await tx.done; throw unreadableProjectError(); }
      if ((await tx.objectStore('projects').index('by-user').getAll(user.userId)).filter(row => !row.deleted).length >= MAX_PROJECTS) { await tx.done; throw limitError(); }
      if (improved && source.project.templateId !== improved.sourceTemplateId) { await tx.done; throw new PersistenceError('CHANGED', '作品が変わりました。もう一度開いてください。'); }
      const regions = improved ? Object.fromEntries(Object.entries(source.project.regions).filter(([regionId]) => Object.hasOwn(improved.regionMap, regionId)).map(([regionId, paint]) => [improved.regionMap[regionId], paint])) : source.project.regions;
      const row = rowFor({ ...source.project, ...(improved ? { templateId: improved.templateId, regions, backgroundId: improved.backgroundMap[source.project.backgroundId] ?? source.project.backgroundId, frameId: improved.frameMap[source.project.frameId] ?? source.project.frameId, metadata: { ...source.project.metadata, renderer: improved.renderer??'storybook-v2', paintMode: 'group', upgradedFrom: source.project.id } } : {}), id: uuid(), status: 'draft', title: `${source.project.title.slice(0, 108)}${improved ? '（改善版）' : '（コピー）'}`, version: 0, createdAt: now(), updatedAt: now() }, instanceId);
      row.dirty = !user.localOnly;
      check();
      await tx.objectStore('projects').add(withSyncIndex(row));
      const thumb = await tx.objectStore('thumbnails').get(source.key);
      if (!improved && thumb?.blob && thumb.projectRevision === source.revision) await tx.objectStore('thumbnails').put(withSyncIndex({ ...thumb, key: row.key, projectId: row.project.id, dirty: !user.localOnly, revision: 1, projectRevision: 1, source: 'local', cloudVersion: undefined }));
      check();
      await tx.done;
      await changed();
      return asProject(row);
      } catch (error) { try { tx.abort(); } catch { /* Already settled. */ } await tx.done.catch(() => {}); throw error; }
    },
  };
  const recovery = {
    get count() { return session?.userId === unreadable.userId ? unreadable.records.length : 0; },
    async list(): Promise<UnreadableProject[]> {
      await ready;
      if (!session) return [];
      const user = session;
      await inspectRows(user);
      return session?.userId === user.userId ? structuredClone(unreadable.records) : [];
    },
    async export(key: string): Promise<Blob> {
      const user = requireSession(), check = ownerCheck(user.userId, authGeneration);
      await ready; check();
      const row = await (await database).get('projects', key);
      check();
      if (!row || row.userId !== user.userId || !key.startsWith(`${user.userId}:`)) throw new PersistenceError('AUTH', 'このアカウントの作品を選んでください。');
      if (validLocalRow(row)) throw new PersistenceError('CHANGED', 'この作品は読み取れます。作品一覧で確認してください。');
      return new Blob([JSON.stringify({ format: 'kids-nurie-island-unreadable-record', schemaVersion: 1, exportedAt: now(), record: row })], { type: 'application/json' });
    },
    async removeLocal(key: string): Promise<void> {
      const user = requireSession(), check = ownerCheck(user.userId, authGeneration);
      await ready; check();
      const db = await database, tx = db.transaction(['projects', 'thumbnails', 'editorRoutes', 'leases'], 'readwrite');
      try {
        checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`)); check();
        const row = await tx.objectStore('projects').get(key); check();
        if (!row || row.userId !== user.userId || !key.startsWith(`${user.userId}:`)) throw new PersistenceError('AUTH', 'このアカウントの作品を選んでください。');
        if (validLocalRow(row)) throw new PersistenceError('CHANGED', '作品が変わりました。もう一度確認してください。');
        const id = unreadableDescription(row).id;
        await tx.objectStore('projects').delete(key); check();
        await tx.objectStore('thumbnails').delete(key); check();
        for (const route of await tx.objectStore('editorRoutes').index('by-user').getAll(user.userId)) {
          if (route.sourceId === id || route.targetId === id) { check(); await tx.objectStore('editorRoutes').delete(route.key); }
        }
        check(); await tx.done;
      } catch (error) { try { tx.abort(); } catch { /* Already settled. */ } await tx.done.catch(() => {}); throw error; }
      await inspectRows(user); check(); await changed();
    },
  };
  const settings = {
    subscribe(listener: (value: AppSettings, userId: string) => void) { settingsListeners.add(listener); return () => { settingsListeners.delete(listener); }; },
    async get(): Promise<AppSettings> {
      await ready;
      if (!session) return { ...DEFAULT_SETTINGS };
      const user = session;
      const record = await (await database).get('settings', user.userId);
      return session?.userId === user.userId ? record?.value ?? { ...DEFAULT_SETTINGS } : { ...DEFAULT_SETTINGS };
    },
    async set(input: Partial<AppSettings>): Promise<AppSettings> {
      const expectedUserId = session?.userId, expectedGeneration = authGeneration;
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PersistenceError('VALIDATION', '設定の内容を確認できませんでした。');
      await ready;
      const user = requireSession();
      if (expectedUserId && (expectedUserId !== user.userId || expectedGeneration !== authGeneration)) throw new PersistenceError('AUTH', 'アカウントが変わりました。設定をもう一度確認してください。');
      const generation = authGeneration;
      const check = () => { if (generation !== authGeneration || session?.userId !== user.userId) throw new PersistenceError('AUTH', 'アカウントが変わりました。設定をもう一度確認してください。'); };
      try {
        const tx = (await database).transaction(['settings', 'leases'], 'readwrite');
        try {
          check(); checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`));
          const previous = await tx.objectStore('settings').get(user.userId);
          // Merge in the same transaction as the write. Unread settings and concurrent
          // changes in another tab are never replaced by a component's defaults.
          const value = validateSettings({ ...(previous?.value ?? DEFAULT_SETTINGS), ...input });
          check(); await tx.objectStore('settings').put({ userId: user.userId, value });
          check(); await tx.done;
          localWriteSucceeded('settings'); publishSettings(user.userId, value);
          return value;
        } catch (error) { try { tx.abort(); } catch { /* Transaction already complete. */ } await tx.done.catch(() => {}); throw error; }
      } catch (error) { return storageFailure(error, 'settings'); }
    },
  };
  return {
    ready,
    recovery,
    auth: {
      get session() { return session; },
      configurationError: connection.configurationError,
      localOnlyMode: connection.demoMode === true,
      subscribe(fn: (value: Session | null) => void) { authListeners.add(fn); fn(session); return () => { authListeners.delete(fn); }; },
      async signIn(provider?: string) {
        await ready.catch(() => {}); await database; await connection.adapter.signIn(provider);
        if (session?.localOnly) await (await database).delete('leases', `deleted:${session.userId}`);
      },
      async signOut() {
        const userId = session?.userId, generation = authGeneration;
        const controller = new AbortController(); accountOperations.add(controller);
        try {
          await ready; await flush();
          if (!userId || controller.signal.aborted || authGeneration !== generation || session?.userId !== userId) throw new PersistenceError('AUTH', 'アカウントが変わりました。もう一度確認してください。');
          await connection.adapter.signOut(userId, controller.signal);
        } finally { accountOperations.delete(controller); }
      },
    },
    projects,
    sync: {
      get status() { return syncStatus; },
      subscribe(fn: (value: SyncStatus) => void) { syncListeners.add(fn); fn(syncStatus); return () => { syncListeners.delete(fn); }; },
      flush,
      dismissNotice() { publishStatus({ notice: undefined }); },
    },
    settings,
    thumbnails: {
      async get(id: string, renderKey?: string): Promise<Blob | undefined> {
        if (renderKey !== undefined && !/^[a-f0-9]{64}$/.test(renderKey)) throw new PersistenceError('VALIDATION', '画像の素材情報を確認できませんでした。');
        await ready;
        const user = requireSession();
        const db = await database;
        const key = projectKey(user.userId, id);
        const local = await db.get('thumbnails', key);
        const project = await db.get('projects', key);
        if (session?.userId !== user.userId) return undefined;
        if (local?.deleted || (project && !validLocalRow(project))) return undefined;
        if (local?.blob && local.renderKey === renderKey && project && local.projectRevision === project.revision && (local.source === 'local' || (local.source === 'cloud' && local.cloudVersion === project.baseVersion && !project.dirty))) return thumbnailBlob(local.blob);
        if (!project || project.deleted || project.dirty || !cloud || user.localOnly || user.offline || !isOnline()) return undefined;
        const blob = await cloud.downloadThumbnail(user.userId, id, project.baseVersion, renderKey);
        if (blob && session?.userId === user.userId) {
          const encoded = await thumbnailData(blob);
          if (session?.userId !== user.userId) return undefined;
          const tx = db.transaction(['projects', 'thumbnails'], 'readwrite');
          void tx.done.catch(() => undefined);
          const current = await tx.objectStore('projects').get(key);
          const stillCurrent = current && validLocalRow(current) && !current.deleted && !current.dirty && current.baseVersion === project.baseVersion && current.revision === project.revision;
          if (stillCurrent && !(await tx.objectStore('thumbnails').get(key))?.dirty) await tx.objectStore('thumbnails').put(withSyncIndex({ key, userId: user.userId, projectId: id, blob: encoded, dirty: false, revision: 1, projectRevision: current.revision, deleted: false, source: 'cloud', cloudVersion: project.baseVersion, renderKey }));
          await tx.done;
          if (!stillCurrent) return undefined;
        }
        return session?.userId === user.userId ? blob : undefined;
      },
      async set(id: string, blob: Blob, sourceProject?: Project, renderKey?: string): Promise<void> {
        if (renderKey !== undefined && !/^[a-f0-9]{64}$/.test(renderKey)) throw new PersistenceError('VALIDATION', '画像の素材情報を確認できませんでした。');
        await ready;
        const user = requireSession();
        if (sourceProject && (sourceProject.userId !== user.userId || sourceProject.id !== id)) return;
        if (!['image/webp', 'image/png'].includes(blob.type) || blob.size > 512 * 1024) throw new PersistenceError('VALIDATION', 'サムネイルは512KB以下のWebPまたはPNG画像にしてください。');
        const encoded = await thumbnailData(blob);
        if (session?.userId !== user.userId) return;
        const db = await database;
        const tx = db.transaction(['projects', 'thumbnails', 'leases'], 'readwrite');
        void tx.done.catch(() => undefined);
        checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`));
        const key = projectKey(user.userId, id);
        const project = await tx.objectStore('projects').get(key);
        if (!project || project.deleted || !validLocalRow(project)) { await tx.done; return; }
        const sourceRevision = (sourceProject as TrackedProject | undefined)?.[localRevision];
        if (sourceRevision !== undefined && sourceRevision !== project.revision) { await tx.done; return; }
        const current = await tx.objectStore('thumbnails').get(key);
        await tx.objectStore('thumbnails').put(withSyncIndex({ key, userId: user.userId, projectId: id, blob: encoded, dirty: !user.localOnly, revision: (current?.revision ?? 0) + 1, projectRevision: project.revision, deleted: false, source: 'local', renderKey }));
        await tx.done;
        await changed();
      },
    },
    backup: {
      async export(): Promise<Blob> {
        await ready;
        const user = requireSession();
        await inspectRows(user);
        const tx = (await database).transaction(['projects', 'settings'], 'readonly');
        const [rows, preferences] = await Promise.all([tx.objectStore('projects').index('by-user').getAll(user.userId), tx.objectStore('settings').get(user.userId)]);
        await tx.done;
        if (session?.userId !== user.userId) throw new PersistenceError('AUTH', 'アカウントが切り替わりました。もう一度バックアップしてください。');
        const projects = rows.filter(row => !row.deleted && validLocalRow(row)).map(row => row.project);
        if (projects.length > MAX_PROJECTS) throw new PersistenceError('LIMIT', '未同期の作品を含めて500件を超えています。作品はこの端末に残っています。作品一覧で確認・整理して500件以下にしてから、バックアップしてください。');
        const document = validateBackup({ format: 'kids-nurie-island', schemaVersion: 1, exportedAt: now(), projects, settings: preferences?.value ?? DEFAULT_SETTINGS });
        return new Blob([JSON.stringify({ ...document, ...(recovery.count ? { excludedUnreadableRecords: structuredClone(unreadable.records) } : {}) })], { type: 'application/json' });
      },
      async import(file: Blob | string): Promise<number> {
        const expectedUserId = session?.userId, expectedGeneration = authGeneration;
        await ready;
        const user = requireSession();
        if (expectedUserId && (expectedUserId !== user.userId || expectedGeneration !== authGeneration)) throw new PersistenceError('AUTH', 'アカウントが変わりました。復元先をもう一度確認してください。');
        const generation = authGeneration;
        const check = () => { if (generation !== authGeneration || session?.userId !== user.userId) throw new PersistenceError('AUTH', 'アカウントが変わりました。復元先をもう一度確認してください。'); };
        if ((typeof file === 'string' ? new Blob([file]).size : file.size) > MAX_BACKUP_BYTES) throw new PersistenceError('VALIDATION', 'バックアップが大きすぎます。128MB以下のファイルを選んでください。');
        let parsed: unknown;
        try { parsed = JSON.parse(typeof file === 'string' ? file : await file.text()); } catch { throw new PersistenceError('VALIDATION', 'バックアップを読み取れませんでした。JSONファイルを選んでください。'); }
        check();
        const backup = validateBackup(parsed);
        const db = await database;
        const tx = db.transaction(['projects', 'settings', 'leases'], 'readwrite');
        try {
          check(); checkAccountFence(await tx.objectStore('leases').get(`deleted:${user.userId}`));
          const count = (await tx.objectStore('projects').index('by-user').getAll(user.userId)).filter(row => !row.deleted).length;
          if (count + backup.projects.length > MAX_PROJECTS) throw limitError();
          for (const project of backup.projects) {
            check();
            const row = rowFor({ ...project, id: uuid(), userId: user.userId, version: 0, updatedAt: now() }, instanceId);
            row.dirty = !user.localOnly;
            await tx.objectStore('projects').add(withSyncIndex(row));
          }
          check(); await tx.objectStore('settings').put({ userId: user.userId, value: backup.settings });
          check(); await tx.done;
        } catch (error) { try { tx.abort(); } catch { /* Transaction already complete. */ } await tx.done.catch(() => {}); throw error; }
        publishSettings(user.userId, backup.settings);
        await changed(true);
        return backup.projects.length;
      },
    },
    deletionRecovery: {
      get state(): DeletionRecoveryState[] { return deletionRecoveryState; },
      subscribe(listener: (state: DeletionRecoveryState[]) => void) { deletionRecoveryListeners.add(listener); listener(deletionRecoveryState); return () => { deletionRecoveryListeners.delete(listener); }; },
      retryLocal(userId: string): Promise<void> { return recoverLocalDeletion(userId); },
      async dismiss(userId: string): Promise<void> {
        const db = await database;
        const journal = deletionJournal(await db.get('leases', `deleted:${userId}`));
        if (journal?.local !== 'complete') throw new PersistenceError('STORAGE', '端末のデータを削除してから、確認してください。');
        await updateDeletionJournal(db, userId, { dismissed: true });
        await refreshDeletionRecovery(db);
        channel?.postMessage({ userId, kind: 'account-deletion-state' });
      },
    },
    async deleteAccountData(expectedUserId: string): Promise<void> {
      const generation = authGeneration;
      const controller = new AbortController(); accountOperations.add(controller);
      const check = () => {
        if (!expectedUserId || controller.signal.aborted || generation !== authGeneration || session?.userId !== expectedUserId) throw new PersistenceError('AUTH', 'アカウントが変わりました。削除するアカウントをもう一度確認してください。');
      };
      let requestStarted = false, canCancelFence = false;
      try {
        await ready; check();
        if (session?.offline && isOnline()) { await connection.adapter.revalidate?.(); check(); }
        const user = session!;
        if (!user.localOnly && (!cloud || !isOnline() || user.offline)) throw new PersistenceError('CLOUD', 'すべてのデータを削除するには、ネットにつなぎ、ログインを確認してください。');
        deletingAccount = true;
        clearTimeout(timer); clearTimeout(retryTimer);
        const db = await database; check();
        const fenceTx = db.transaction('leases', 'readwrite');
        const key = `deleted:${user.userId}`;
        const previous = await fenceTx.store.get(key);
        canCancelFence = !previous || previous.phase === 'preparing';
        const deletion: AccountDeletionJournal = deletionJournal(previous) ?? { userId: user.userId, consent: 'delete-account-data', consentedAt: now(), cloud: user.localOnly ? 'not-required' : 'unknown', local: 'pending', recovery: false };
        check();
        await fenceTx.store.put({ key, owner: instanceId, expiresAt: Number.MAX_SAFE_INTEGER, phase: canCancelFence ? 'preparing' : 'requested', deletion });
        await fenceTx.done; check();
        channel?.postMessage({ userId: user.userId, kind: 'account-deleting' });
        if (running) await running;
        check();
        await db.put('leases', { key, owner: instanceId, expiresAt: Number.MAX_SAFE_INTEGER, phase: 'requested', deletion });
        requestStarted = true; check();
        if (!user.localOnly && deletion.cloud !== 'confirmed') {
          await cloud!.deleteAccountData(user.userId, controller.signal);
          // Persist the known server result for its original owner even if auth changed
          // while HTTP completed. Local cleanup still obeys the caller's account fence.
          await updateDeletionJournal(db, user.userId, { cloud: 'confirmed' });
          check();
        }
        check();
        await eraseConsentedLocalData(db, user.userId, false, check);
        check();
        await refreshDeletionRecovery(db);
        channel?.postMessage({ userId: user.userId, kind: 'account-deleted' });
        if (connection.adapter.forgetUser) await connection.adapter.forgetUser(user.userId, controller.signal);
        else await connection.adapter.signOut(user.userId, controller.signal);
      } catch (error) {
        if (canCancelFence && !requestStarted) {
          const tx = (await database).transaction('leases', 'readwrite');
          const key = `deleted:${expectedUserId}`;
          const current = await tx.store.get(key);
          if (current?.owner === instanceId && current.phase === 'preparing') await tx.store.delete(key);
          await tx.done;
          channel?.postMessage({ userId: expectedUserId, kind: 'account-deletion-cancelled' });
          if (session?.userId === expectedUserId) deletingAccount = false;
        } else {
          const db = await database;
          if (deletionJournal(await db.get('leases', `deleted:${expectedUserId}`))) {
            await updateDeletionJournal(db, expectedUserId, { recovery: true });
            await refreshDeletionRecovery(db);
            channel?.postMessage({ userId: expectedUserId, kind: 'account-deletion-state' });
          }
          if (session?.userId === expectedUserId) publishStatus({ state: 'error', notice: '削除を完了できませんでした。設定からもう一度削除してください。' });
        }
        throw error;
      } finally { accountOperations.delete(controller); }
    },
    async dispose(): Promise<void> {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(retryTimer);
      unsubscribeAuth();
      connection.adapter.dispose?.();
      globalThis.removeEventListener?.('online', online);
      globalThis.removeEventListener?.('offline', offline);
      globalThis.removeEventListener?.('pagehide', online);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibility);
      channel?.close();
      if (running) await running;
      (await database).close();
    },
  };
}
export type IslandServices = ReturnType<typeof createServices>;

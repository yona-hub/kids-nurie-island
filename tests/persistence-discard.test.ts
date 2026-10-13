import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, PersistenceError, type IslandServices } from '../packages/persistence/src/index';
import { DEFAULT_SETTINGS } from '../packages/shared-types/src/index';
import { TestAuth, USER_A, USER_B } from './sync.helpers';

const services: IslandServices[] = [];
async function setup() {
  const auth = new TestAuth(USER_A, true);
  const app = createServices({ dbName: crypto.randomUUID(), authAdapter: auth, online: () => false });
  services.push(app);
  await app.ready;
  const project = await app.projects.create({ templateId: 'ocean', title: '破棄を確認する作品' });
  return { app, auth, project };
}
function failWrites(stores = ['projects']) {
  const failing = new Set(stores);
  const put = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
    if (failing.has(this.name)) throw new DOMException('capacity', 'QuotaExceededError');
    return put.apply(this, args);
  });
  return failing;
}
async function failure(task: Promise<unknown>): Promise<unknown> {
  const result = await task.then(() => undefined, error => error as unknown);
  expect(result).toMatchObject({ code: 'STORAGE' });
  return result;
}
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(services.splice(0).map(app => app.dispose()));
});

describe('A19-04: explicit discard acknowledges only its settled project save', () => {
  it('clears the failed erase without changing the previously committed paint', async () => {
    const { app, project } = await setup();
    const saved = await app.projects.save({ ...project, regions: { r01: { color: '#F64C91', paintType: 'smooth' } } });
    failWrites();
    const error = await failure(app.projects.save({ ...saved, regions: {} }));
    expect(app.sync.status.localSaveFailed).toBe(true);
    expect(app.projects.discardFailedSave(error)).toBe(true);
    expect(app.projects.discardFailedSave(error)).toBe(false);
    expect(app.sync.status).toMatchObject({ localSaveFailed: false, state: 'idle' });
    expect((await app.projects.get(project.id))?.regions).toEqual(saved.regions);
  });

  it('preserves other project and settings failures, including through successful sync', async () => {
    const { app, project } = await setup();
    const other = await app.projects.create({ templateId: 'ocean', title: '別の未保存作品' });
    const failing = failWrites(['projects', 'settings']);
    const first = await failure(app.projects.save(project));
    const second = await failure(app.projects.save(other));
    const settings = await failure(app.settings.set({ ...DEFAULT_SETTINGS, volume: 0.9 }));
    expect(app.projects.discardFailedSave(first)).toBe(true);
    await app.sync.flush();
    expect(app.sync.status.localSaveFailed).toBe(true);
    expect(app.projects.discardFailedSave(settings)).toBe(false);
    expect(app.projects.discardFailedSave(second)).toBe(true);
    expect(app.sync.status.localSaveFailed).toBe(true);
    failing.clear();
    await app.settings.set({ ...DEFAULT_SETTINGS, volume: 0.9 });
    expect(app.sync.status.localSaveFailed).toBe(false);
  });

  it('rejects obsolete, fabricated, foreign-service, and deletion errors', async () => {
    const { app, project } = await setup();
    const { app: foreign } = await setup();
    failWrites();
    const old = await failure(app.projects.save(project));
    const recent = await failure(app.projects.save(project));
    expect(app.projects.discardFailedSave(old)).toBe(false);
    expect(app.projects.discardFailedSave(new PersistenceError('STORAGE', 'capacity'))).toBe(false);
    expect(foreign.projects.discardFailedSave(recent)).toBe(false);
    const deletion = await failure(app.projects.delete(project));
    expect(app.projects.discardFailedSave(recent)).toBe(false);
    expect(app.projects.discardFailedSave(deletion)).toBe(false);
    expect(app.sync.status.localSaveFailed).toBe(true);
  });

  it('refuses discard from the instant a retry starts until that retry settles', async () => {
    const { app, project } = await setup();
    failWrites();
    const old = await failure(app.projects.save(project));
    const retry = app.projects.save(project);
    expect(app.projects.discardFailedSave(old)).toBe(false);
    expect(app.sync.status.localSaveFailed).toBe(true);
    const current = await failure(retry);
    expect(app.projects.discardFailedSave(old)).toBe(false);
    expect(app.projects.discardFailedSave(current)).toBe(true);
  });

  it('lets a successful retry resolve its error without using an obsolete discard token', async () => {
    const { app, project } = await setup();
    const failing = failWrites();
    const old = await failure(app.projects.save(project));
    failing.clear();
    const retry = app.projects.save({ ...project, regions: { r01: { color: '#001122', paintType: 'pencil' } } });
    expect(app.projects.discardFailedSave(old)).toBe(false);
    await retry;
    expect(app.sync.status.localSaveFailed).toBe(false);
    expect(app.projects.discardFailedSave(old)).toBe(false);
    expect((await app.projects.get(project.id))?.regions.r01.color).toBe('#001122');
  });

  it('rejects a previous A epoch after A to B to A without clearing the new failure', async () => {
    const { app, auth, project } = await setup();
    failWrites();
    const old = await failure(app.projects.save(project));
    auth.setSession({ userId: USER_B, provider: 'demo', localOnly: true });
    expect(app.projects.discardFailedSave(old)).toBe(false);
    auth.setSession({ userId: USER_A, provider: 'demo', localOnly: true });
    const current = await failure(app.projects.save(project));
    expect(app.projects.discardFailedSave(old)).toBe(false);
    expect(app.sync.status.localSaveFailed).toBe(true);
    expect(app.projects.discardFailedSave(current)).toBe(true);
  });

  it('does not let an old in-flight save publish an error into a new ownership epoch', async () => {
    const { app, auth, project } = await setup();
    failWrites();
    const old = app.projects.save(project);
    const rejected = expect(old).rejects.toMatchObject({ code: 'AUTH' });
    auth.setSession({ userId: USER_B, provider: 'demo', localOnly: true });
    auth.setSession({ userId: USER_A, provider: 'demo', localOnly: true });
    await rejected;
    expect(app.sync.status.localSaveFailed).toBe(false);
    const current = await failure(app.projects.save(project));
    expect(app.projects.discardFailedSave(current)).toBe(true);
  });

  it('does not acknowledge a failure after its service has been disposed', async () => {
    const { app, project } = await setup();
    failWrites();
    const error = await failure(app.projects.save(project));
    await app.dispose();
    expect(app.projects.discardFailedSave(error)).toBe(false);
  });
});

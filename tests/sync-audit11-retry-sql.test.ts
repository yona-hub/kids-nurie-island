import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import type { Project } from '../packages/shared-types/src/index';
import { TestAuth } from './sync.helpers';
import { SqlCloud } from './sync-sql.helpers';

let cloud: SqlCloud;
const services: IslandServices[] = [];
function device(userId: string, dbName = crypto.randomUUID()) {
  const app = createServices({ cloud, authAdapter: new TestAuth(userId), online: () => true, dbName, debounceMs: 60_000 });
  services.push(app); return app;
}
async function stop(app: IslandServices) { await app.dispose(); services.splice(services.indexOf(app), 1); }
beforeAll(async () => { cloud = await SqlCloud.create(); }, 60_000);
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(services.splice(0).map(app => app.dispose())); });
afterAll(async () => { await cloud?.db.close(); });

describe('audit 11 follow-up: SQL receipts survive editing, response loss and restart', () => {
  it.each([1, 499, 500])('keeps one original with %i saved works after repeated lost responses, further input and restart', async count => {
    const userId = crypto.randomUUID(), name = crypto.randomUUID(); await cloud.seed(userId, count);
    const app = device(userId, name); await app.ready; await app.sync.flush();
    const original = (await app.projects.list())[0];
    const edited = await app.projects.save({ ...original, regions: { fish: { color: '#FF0000', paintType: 'smooth' } } });
    const sends: Array<{ payload: Project; expected: number; operationId: string }> = [];
    const rawSave = cloud.save.bind(cloud); let losses = 2, lostOperation: string | undefined;
    vi.spyOn(cloud, 'save').mockImplementation(async (project, expected, operationId) => {
      sends.push({ payload: structuredClone(project), expected, operationId });
      const result = await rawSave(project, expected, operationId);
      if (project.id === original.id && losses && (!lostOperation || lostOperation === operationId)) {
        lostOperation = operationId; losses--; throw new Error('response lost after SQL commit');
      }
      return result;
    });
    await app.sync.flush(); expect(app.sync.status.state).toBe('error');
    await app.projects.save({ ...edited, regions: { ...edited.regions, moon: { color: '#2598FF', paintType: 'pencil' } } });
    const db = await openLocalDatabase(name);
    const durable = await db.get('projects', projectKey(userId, original.id)); db.close();
    expect(durable?.pendingCommit).toMatchObject({ operationId: lostOperation, baseVersion: 1, project: { regions: { fish: { color: '#FF0000' } } } });
    expect(durable?.pendingCommit?.project.regions).not.toHaveProperty('moon');
    expect(durable?.project.regions).toHaveProperty('moon');
    await stop(app);
    const reopened = device(userId, name); await reopened.ready; await reopened.sync.flush();
    expect(reopened.sync.status.state).toBe('error'); expect(reopened.sync.status.unsyncedCount).toBe(1);
    const fresh = (await reopened.projects.get(original.id))!;
    const latest = await reopened.projects.save({ ...fresh, regions: { ...fresh.regions, star: { color: '#FFE64B', paintType: 'crayon' } } });
    await reopened.sync.flush();
    const remote = (await cloud.list(userId)).filter(row => !row.deleted);
    expect(remote).toHaveLength(count);
    expect(remote.find(row => row.project.id === original.id)?.project).toMatchObject({ version: 3, regions: latest.regions });
    expect(sends.slice(0, 3)).toEqual([sends[0], sends[0], sends[0]]);
    expect(sends).toHaveLength(4); expect(sends[3].expected).toBe(2);
    expect(reopened.sync.status.unsyncedCount).toBe(0); expect(reopened.sync.status.notice).toBeUndefined();
  });

  it('recovers a save receipt before a queued deletion, and a lost deletion receipt after restart', async () => {
    const userId = crypto.randomUUID(), name = crypto.randomUUID(); await cloud.seed(userId, 1);
    const app = device(userId, name); await app.ready; await app.sync.flush();
    const original = (await app.projects.list())[0];
    const edited = await app.projects.save({ ...original, title: '削除前の最後の色' });
    const rawSave = cloud.save.bind(cloud), rawDelete = cloud.delete.bind(cloud); let loseSave = true, loseDelete = true;
    const saves = vi.spyOn(cloud, 'save').mockImplementation(async (...args) => {
      const result = await rawSave(...args); if (loseSave) { loseSave = false; throw new Error('lost save receipt'); } return result;
    });
    const deletes = vi.spyOn(cloud, 'delete').mockImplementation(async (...args) => {
      const result = await rawDelete(...args); if (loseDelete) { loseDelete = false; throw new Error('lost deletion receipt'); } return result;
    });
    await app.sync.flush();
    await app.projects.delete(edited);
    await vi.waitFor(() => expect(deletes).toHaveBeenCalledTimes(1));
    await stop(app);
    const reopened = device(userId, name); await reopened.ready; await reopened.sync.flush();
    expect(saves.mock.calls[1]).toEqual(saves.mock.calls[0]);
    expect(deletes.mock.calls[0][2]).toBe(2); expect(deletes.mock.calls[1]).toEqual(deletes.mock.calls[0]);
    const remote = await cloud.list(userId);
    expect(remote).toHaveLength(1); expect(remote[0]).toMatchObject({ deleted: true, project: { version: 3 } });
    expect(await reopened.projects.count()).toBe(0); expect(reopened.sync.status.unsyncedCount).toBe(0);
  });

  it('still preserves a genuine other-device update made after the unconfirmed commit', async () => {
    const userId = crypto.randomUUID(); await cloud.seed(userId, 1);
    const app = device(userId); await app.ready; await app.sync.flush(); const original = (await app.projects.list())[0];
    const first = await app.projects.save({ ...original, title: 'この端末の最初の色' });
    const rawSave = cloud.save.bind(cloud); let lose = true;
    vi.spyOn(cloud, 'save').mockImplementation(async (...args) => {
      const result = await rawSave(...args); if (lose) { lose = false; throw new Error('lost response'); } return result;
    });
    await app.sync.flush();
    const committed = (await cloud.list(userId))[0].project;
    await rawSave({ ...committed, title: '本当に別の端末の変更' }, committed.version, crypto.randomUUID());
    await app.projects.save({ ...first, title: 'この端末の続きの色' }); await app.sync.flush();
    const remote = (await cloud.list(userId)).filter(row => !row.deleted); expect(remote).toHaveLength(2);
    expect(remote.find(row => row.project.id === original.id)?.project.title).toBe('本当に別の端末の変更');
    expect(remote.find(row => row.project.id !== original.id)?.project.title).toContain('この端末の続きの色');
    expect(app.sync.status.unsyncedCount).toBe(0);
  });

  it('allows cancelling a create definitively rejected by PROJECT_LIMIT instead of endlessly replaying it', async () => {
    const userId = crypto.randomUUID(); await cloud.seed(userId, 500);
    const app = device(userId); await app.ready;
    const pending = await app.projects.create({ templateId: 'ocean', title: '満杯で送れない新規作品' });
    await app.sync.flush(); expect(app.sync.status.unsyncedCount).toBe(1);
    await app.projects.delete((await app.projects.get(pending.id))!); await app.sync.flush();
    expect((await cloud.list(userId)).filter(row => !row.deleted)).toHaveLength(500);
    expect(await app.projects.count()).toBe(500); expect(app.sync.status.unsyncedCount).toBe(0);
  });
});

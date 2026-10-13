import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase } from '../packages/persistence/src/local';
import { DEFAULT_SETTINGS } from '../packages/shared-types/src/index';
import { backup, makeProject, TestAuth, USER_A, USER_B } from './sync.helpers';
const apps: IslandServices[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.dispose())); });
async function fixture(dbName = crypto.randomUUID(), userId = USER_A) {
  const auth = new TestAuth(userId, true), app = createServices({ dbName, authAdapter: auth, online: () => false }); apps.push(app); await app.ready;
  return { app, auth, dbName };
}
describe('settings commit notification and owner-scoped partial updates', () => {
  it('serializes independent patches from two tabs against their stored settings', async () => {
    const first = await fixture(), second = await fixture(first.dbName);
    await first.app.settings.set({ volume: 0.8, soundEffects: false });
    await Promise.all([first.app.settings.set({ bgm: true }), second.app.settings.set({ tapAssist: false })]);
    const expected = { ...DEFAULT_SETTINGS, volume: 0.8, soundEffects: false, bgm: true, tapAssist: false };
    expect(await first.app.settings.get()).toEqual(expected); expect(await second.app.settings.get()).toEqual(expected);
  });

  it.each(['B', 'A again'])('rejects a settings/restore request if auth changes synchronously to %s before its first await', async destination => {
    const { app, auth, dbName } = await fixture();
    const patch = app.settings.set({ bgm: true }), restore = app.backup.import(backup([makeProject()], { ...DEFAULT_SETTINGS, volume: 0.9 }));
    auth.setSession({ userId: USER_B, provider: 'demo', localOnly: true });
    if (destination === 'A again') auth.setSession({ userId: USER_A, provider: 'demo', localOnly: true });
    await expect(patch).rejects.toMatchObject({ code: 'AUTH' }); await expect(restore).rejects.toMatchObject({ code: 'AUTH' });
    const db = await openLocalDatabase(dbName); expect(await db.getAll('settings')).toEqual([]); expect(await db.getAll('projects')).toEqual([]); db.close();
  });

  it('notifies the current owner after restore commit and does not notify it about a different owner', async () => {
    const first = await fixture(), second = await fixture(first.dbName, USER_B), seen: unknown[] = [];
    first.app.settings.subscribe((settings, userId) => seen.push({ settings, userId }));
    await second.app.backup.import(backup([], { ...DEFAULT_SETTINGS, volume: 0.8 }));
    await first.app.backup.import(backup([], { ...DEFAULT_SETTINGS, bgm: true }));
    expect(seen).toEqual([{ userId: USER_A, settings: { ...DEFAULT_SETTINGS, bgm: true } }]);
    expect(await second.app.settings.get()).toEqual({ ...DEFAULT_SETTINGS, volume: 0.8 });
  });
});

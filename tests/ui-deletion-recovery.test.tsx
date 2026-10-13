// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServices, type IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey } from '../packages/persistence/src/local';
import { DeletionRecoveryNotice } from '../apps/web/src/components/DeletionRecoveryNotice';
import { TestAuth, USER_A, USER_B, makeProject } from './sync.helpers';
let app: IslandServices | undefined;
afterEach(async () => { cleanup(); await app?.dispose(); app = undefined; vi.restoreAllMocks(); });

describe('deletion recovery notice is independent of login', () => {
  it.each([null, USER_B])('offers only local retry with session %s and does not claim unknown cloud success', async (owner) => {
    const dbName = crypto.randomUUID(), db = await openLocalDatabase(dbName), project = makeProject(USER_A);
    await db.put('projects', { key: projectKey(USER_A, project.id), userId: USER_A, project, revision: 1, baseVersion: 0, editGeneration: 'fixture', writerId: 'fixture', operationId: 'fixture', dirty: false, deleted: false });
    await db.put('leases', { key: `deleted:${USER_A}`, owner: 'fixture', expiresAt: Number.MAX_SAFE_INTEGER, phase: 'requested' });
    const original = IDBObjectStore.prototype.delete;
    const fail = vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementation(function (this: IDBObjectStore, query) {
      if (this.name === 'projects') throw new DOMException('Injected cleanup failure');
      return original.call(this, query);
    });
    const auth = new TestAuth(USER_B, true); if (!owner) auth.setSession(null);
    const signOut = vi.spyOn(auth, 'signOut');
    app = createServices({ dbName, authAdapter: auth, online: () => false }); await app.ready;
    const view = render(<DeletionRecoveryNotice recovery={app.deletionRecovery} />);
    expect(await screen.findByText('クラウド側の削除完了は確認できていません。')).toBeTruthy();
    expect(screen.getByText(/この端末に残っています/)).toBeTruthy();
    fail.mockRestore(); fireEvent.click(screen.getByRole('button', { name: '端末データの削除を再試行' }));
    await screen.findByText(/この端末から削除しました/);
    expect(screen.getByText('クラウド側の削除完了は確認できていません。')).toBeTruthy();
    expect(await db.getAllFromIndex('projects', 'by-user', USER_A)).toEqual([]);
    expect(app.auth.session?.userId ?? null).toBe(owner); expect(signOut).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '確認した' }));
    await waitFor(() => expect(view.container.textContent).toBe('')); db.close();
  });
  it('does not change the normal page when no deletion was requested', async () => {
    app = createServices({ dbName: crypto.randomUUID(), authAdapter: new TestAuth(USER_B, true), online: () => false });
    const view = render(<DeletionRecoveryNotice recovery={app.deletionRecovery} />);
    await act(async () => { await app!.ready; }); expect(view.container.textContent).toBe('');
  });
});

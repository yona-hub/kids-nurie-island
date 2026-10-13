// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IslandServices } from '../packages/persistence/src/index';
import { openLocalDatabase, projectKey, type LocalRow } from '../packages/persistence/src/local';
import { TestAuth, USER_A, USER_B } from './sync.helpers';

const harness = vi.hoisted(() => ({ service: undefined as IslandServices | undefined, download: vi.fn() }));
vi.mock('@island/persistence', () => ({ createServices: () => new Proxy({}, { get: (_target, name) => Reflect.get(harness.service!, name) }) }));
vi.mock('../apps/web/src/audio', () => ({ updateAudio: vi.fn(), stopAudio: vi.fn(), unlockAudio: vi.fn() }));
vi.mock('../apps/web/src/components/UI', async original => ({ ...await original<object>(), downloadBlob: harness.download }));
import App from '../apps/web/src/App';

let app: IslandServices, auth: TestAuth, dbName: string, damagedKey: string;
beforeEach(async () => {
  vi.clearAllMocks(); vi.stubGlobal('Blob', NodeBlob); vi.stubGlobal('scrollTo', vi.fn());
  history.replaceState(null, '', '/#/settings');
  const actual = await vi.importActual<typeof import('../packages/persistence/src/index')>('@island/persistence');
  dbName = crypto.randomUUID(); auth = new TestAuth(USER_A, true);
  app = actual.createServices({ dbName, authAdapter: auth, online: () => false }); harness.service = app; await app.ready;
  await app.projects.create({ templateId: 'ocean', title: '正常な作品' });
  const damaged = await app.projects.create({ templateId: 'ocean', title: '読み取れない作品' });
  const db = await openLocalDatabase(dbName); damagedKey = projectKey(USER_A, damaged.id);
  await db.put('projects', { ...(await db.get('projects', damagedKey))!, project: null } as unknown as LocalRow); db.close();
});
afterEach(async () => { cleanup(); await app.dispose(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('A19-02 recovery controls', () => {
  it('exports the retained raw record, requires explicit cleanup, and leaves healthy data', async () => {
    render(<App />);
    const recovery = within(await screen.findByRole('region', { name: '読み取れない作品' }));
    fireEvent.click(recovery.getByRole('button', { name: '元データを保存' }));
    await waitFor(() => expect(harness.download).toHaveBeenCalledTimes(1));
    expect(JSON.parse(await harness.download.mock.calls[0][0].text()).record.project).toBeNull();
    fireEvent.click(recovery.getByRole('button', { name: 'この端末から整理' }));
    fireEvent.click(screen.getByRole('button', { name: 'やめる' }));
    expect(await app.recovery.list()).toHaveLength(1);
    fireEvent.click(recovery.getByRole('button', { name: 'この端末から整理' }));
    fireEvent.click(screen.getByRole('button', { name: 'このデータを削除' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: '読み取れない作品' })).toBeNull());
    expect((await app.projects.list()).map(project => project.title)).toEqual(['正常な作品']);
  });
  it('cancels a delayed export across A to B to A without leaving recovery controls busy', async () => {
    const blob = await app.recovery.export(damagedKey);
    let release!: (value: Blob) => void;
    const delayed = new Promise<Blob>(resolve => { release = resolve; });
    vi.spyOn(app.recovery, 'export').mockReturnValueOnce(delayed);
    render(<App />);
    const oldRecovery = await screen.findByRole('region', { name: '読み取れない作品' });
    fireEvent.click(screen.getByRole('button', { name: '元データを保存' }));
    await act(async () => {
      auth.setSession({ userId: USER_B, provider: 'demo', localOnly: true });
      auth.setSession({ userId: USER_A, provider: 'demo', localOnly: true });
      release(blob);
    });
    await waitFor(() => expect((screen.getByRole('button', { name: '元データを保存' }) as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByRole('region', { name: '読み取れない作品' })).not.toBe(oldRecovery);
    expect(harness.download).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '元データを保存' }));
    await waitFor(() => expect(harness.download).toHaveBeenCalledTimes(1));
    expect(await app.recovery.list()).toHaveLength(1);
  });
});

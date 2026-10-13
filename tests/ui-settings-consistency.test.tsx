// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { File as NodeFile } from 'node:buffer';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IslandServices } from '../packages/persistence/src/index';
import { DEFAULT_SETTINGS, type AppSettings } from '../packages/shared-types/src/index';
import { backup, TestAuth, USER_A, USER_B } from './sync.helpers';

const harness = vi.hoisted(() => ({ service: undefined as IslandServices | undefined, audio: vi.fn() }));
vi.mock('@island/persistence', () => ({ createServices: () => new Proxy({}, { get: (_target, name) => Reflect.get(harness.service!, name) }) }));
vi.mock('../apps/web/src/audio', () => ({ updateAudio: harness.audio, stopAudio: vi.fn(), unlockAudio: vi.fn() }));
import { AppProvider, useApp } from '../apps/web/src/app-context';
import SettingsPage from '../apps/web/src/pages/Settings';

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
const restored: AppSettings = { ...DEFAULT_SETTINGS, bgm: true, reducedMotion: true, soundEffects: false, volume: 0.8 };
let app: IslandServices, auth: TestAuth;
const switchUser = (userId: string) => auth.setSession({ userId, provider: 'demo', localOnly: true });
function Probe() {
  const { settings, updateSettings } = useApp();
  return <><output data-testid="preferences">{JSON.stringify(settings)}</output><button onClick={() => { void updateSettings({ tapAssist: false }); }}>補助を無効</button><button onClick={() => { void updateSettings({ speakColors: true }); }}>読み上げを有効</button></>;
}
function RouteHarness() {
  const [shown, setShown] = useState(true);
  return <AppProvider><button onClick={() => setShown(value => !value)}>設定の入退場</button>{shown && <SettingsPage />}<Probe /></AppProvider>;
}
const rendered = (): AppSettings => JSON.parse(screen.getByTestId('preferences').textContent!);
beforeEach(async () => {
  vi.clearAllMocks(); vi.stubGlobal('File', NodeFile); vi.stubGlobal('scrollTo', vi.fn());
  const actual = await vi.importActual<typeof import('../packages/persistence/src/index')>('@island/persistence');
  auth = new TestAuth(USER_A, true); app = actual.createServices({ dbName: crypto.randomUUID(), authAdapter: auth, online: () => false }); harness.service = app; await app.ready;
});
afterEach(async () => { cleanup(); await app.dispose(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('A03 persistent settings consistency', () => {
  it('keeps a backup restoration after leaving and re-entering Settings and changing a different field', async () => {
    render(<RouteHarness />); await waitFor(() => expect(rendered()).toEqual(DEFAULT_SETTINGS));
    const read = deferred<string>(), file = new File(['delayed'], 'backup.json', { type: 'application/json' });
    vi.spyOn(file, 'text').mockReturnValue(read.promise);
    fireEvent.change(screen.getByLabelText('バックアップファイル'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: '復元する' }));
    fireEvent.click(screen.getByRole('button', { name: 'やめる' }));
    fireEvent.click(screen.getByRole('button', { name: '設定の入退場' }));
    await act(async () => read.resolve(backup([], restored)));
    await waitFor(async () => expect(await app.settings.get()).toEqual(restored));
    expect(rendered()).toEqual(restored); await waitFor(() => expect(harness.audio).toHaveBeenLastCalledWith(restored));
    fireEvent.click(screen.getByRole('button', { name: '設定の入退場' }));
    expect((screen.getByRole('switch', { name: /BGM/ }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '補助を無効' }));
    await waitFor(async () => expect(await app.settings.get()).toEqual({ ...restored, tapAssist: false }));
    expect(rendered()).toEqual({ ...restored, tapAssist: false });
  });

  it.each([1, 2])('preserves unedited stored settings during %s edits before the first read completes', async (count) => {
    await app.settings.set(restored);
    const read = deferred<AppSettings>(); vi.spyOn(app.settings, 'get').mockReturnValueOnce(read.promise);
    render(<AppProvider><Probe /></AppProvider>);
    await act(async () => { await Promise.resolve(); });
    fireEvent.click(screen.getByRole('button', { name: '補助を無効' }));
    if (count === 2) fireEvent.click(screen.getByRole('button', { name: '読み上げを有効' }));
    const expected = { ...restored, tapAssist: false, ...(count === 2 ? { speakColors: true } : {}) };
    await waitFor(async () => expect(await app.settings.get()).toEqual(expected));
    await act(async () => read.resolve(restored));
    expect(rendered()).toEqual(expected); expect(harness.audio).toHaveBeenLastCalledWith(expected);
  });

  it.each(['B', 'A again'])('does not apply an old restore to %s after an account generation change', async (destination) => {
    render(<RouteHarness />);
    const read = deferred<string>(), file = new File(['delayed'], 'backup.json', { type: 'application/json' });
    vi.spyOn(file, 'text').mockReturnValue(read.promise);
    fireEvent.change(screen.getByLabelText('バックアップファイル'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: '復元する' }));
    await act(async () => { switchUser(USER_B); if (destination === 'A again') switchUser(USER_A); read.resolve(backup([], restored)); });
    await waitFor(() => expect(rendered()).toEqual(DEFAULT_SETTINGS));
    expect(await app.settings.get()).toEqual(DEFAULT_SETTINGS);
    await act(async () => switchUser(USER_A)); expect(await app.settings.get()).toEqual(DEFAULT_SETTINGS);
  });

  it('restores the stored base if an optimistic edit fails before the first read returns', async () => {
    await app.settings.set(restored);
    const read = deferred<AppSettings>(); vi.spyOn(app.settings, 'get').mockReturnValueOnce(read.promise);
    vi.spyOn(app.settings, 'set').mockRejectedValueOnce(new Error('disk full'));
    render(<AppProvider><Probe /></AppProvider>);
    await act(async () => { await Promise.resolve(); });
    fireEvent.click(screen.getByRole('button', { name: '補助を無効' }));
    await screen.findByText('disk full');
    await act(async () => read.resolve(restored));
    expect(rendered()).toEqual(restored); expect(await app.settings.get()).toEqual(restored);
  });

  it('keeps A and B initial-read edits separate across A -> B -> A and a late A response', async () => {
    await app.settings.set(restored); switchUser(USER_B); await app.settings.set({ volume: 0.1 }); switchUser(USER_A);
    const read = deferred<AppSettings>(); vi.spyOn(app.settings, 'get').mockReturnValueOnce(read.promise);
    render(<AppProvider><Probe /></AppProvider>); await act(async () => { await Promise.resolve(); });
    fireEvent.click(screen.getByRole('button', { name: '補助を無効' }));
    await waitFor(async () => expect(await app.settings.get()).toEqual({ ...restored, tapAssist: false }));
    await act(async () => switchUser(USER_B));
    fireEvent.click(screen.getByRole('button', { name: '読み上げを有効' }));
    await waitFor(async () => expect(await app.settings.get()).toEqual({ ...DEFAULT_SETTINGS, volume: 0.1, speakColors: true }));
    await act(async () => { switchUser(USER_A); read.resolve(restored); });
    await waitFor(() => expect(rendered()).toEqual({ ...restored, tapAssist: false }));
    expect(await app.settings.get()).toEqual({ ...restored, tapAssist: false });
  });
});

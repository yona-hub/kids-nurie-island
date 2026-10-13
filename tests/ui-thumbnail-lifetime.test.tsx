// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Project } from '../packages/shared-types/src/index';

const state = vi.hoisted(() => ({ projects: [] as Project[], get: vi.fn(), set: vi.fn() }));
vi.mock('../apps/web/src/app-context', () => ({
  services: { auth: { session: { userId: 'owner' }, subscribe: () => () => undefined }, thumbnails: { get: state.get, set: state.set } },
  useProjects: () => ({ projects: state.projects, loading: false, error: '', unreadableCount: 0 }),
  useApp: () => ({ toast: vi.fn() }),
}));
vi.mock('../apps/web/src/artwork-source', () => ({ resolveArtworkSource: async () => ({}), artworkRevision: async () => 'same-artwork-revision' }));
vi.mock('../apps/web/src/artwork-render', () => ({ renderProject: async () => new Blob(['new-image']) }));
import Gallery from '../apps/web/src/pages/Gallery';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.projects = [{ id: 'work', userId: 'owner', title: 'おひめさま', status: 'completed', templateId: 'princess', createdAt: '2026-10-07T00:00:00Z', updatedAt: '2026-10-07T00:00:00Z', version: 1, regions: {}, backgroundId: 'white', frameId: 'none', schemaVersion: 1, metadata: {} }];
  state.get.mockResolvedValue(new Blob(['image']));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
    observe() { this.callback([{ isIntersecting: true }]); }
    disconnect() {}
  });
  let next = 0;
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => `blob:thumbnail-${++next}`);
    static revokeObjectURL = vi.fn((url: string) => {
      expect([...document.querySelectorAll('img')].some(image => image.getAttribute('src') === url), 'Do not revoke a URL still used by a mounted image').toBe(false);
    });
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('keeps the displayed thumbnail alive while refreshed project data resolves, then releases it after src changes', async () => {
  const view = render(<Gallery />);
  const image = () => view.container.querySelector('.gallery-thumb img')!;
  await waitFor(() => expect(image()?.getAttribute('src')).toBe('blob:thumbnail-1'));
  const next = deferred<Blob>();
  state.get.mockReturnValueOnce(next.promise);
  state.projects = state.projects.map(project => ({ ...project }));
  view.rerender(<Gallery />);
  await waitFor(() => expect(state.get).toHaveBeenCalledTimes(2));
  expect(image().getAttribute('src')).toBe('blob:thumbnail-1');
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  await act(async () => next.resolve(new Blob(['replacement'])));
  await waitFor(() => expect(image().getAttribute('src')).toBe('blob:thumbnail-2'));
  expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:thumbnail-1');
  view.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  expect(URL.revokeObjectURL).toHaveBeenLastCalledWith('blob:thumbnail-2');
});

it('does not allocate a late thumbnail after its card is removed', async () => {
  const pending = deferred<Blob>();
  state.get.mockReturnValueOnce(pending.promise);
  const view = render(<Gallery />);
  await waitFor(() => expect(state.get).toHaveBeenCalledTimes(1));
  view.unmount();
  await act(async () => pending.resolve(new Blob(['late'])));
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
});

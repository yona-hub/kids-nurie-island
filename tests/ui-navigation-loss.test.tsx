// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { IslandServices } from "../packages/persistence/src/index";
import { TestAuth, USER_A, USER_B } from "./sync.helpers";

const harness = vi.hoisted(() => ({
  service: undefined as IslandServices | undefined,
}));
vi.mock("@island/persistence", () => ({
  createServices: () =>
    new Proxy(
      {},
      { get: (_target, name) => Reflect.get(harness.service!, name) },
    ),
}));
vi.mock("@island/content", async (original) => ({
  ...(await original<typeof import("../packages/content-schema/src/index")>()),
  loadTemplate: async () => ({
    schemaVersion: 1,
    id: "princess-rabbit",
    title: "うさぎ",
    themeId: "princess",
    width: 1600,
    height: 2000,
    defaultColorFamily: "pink",
    approved: true,
    regions: [{ id: 'r01', name: '検証する絵', path: 'M0 0H100V100H0Z', bounds: { x: 0, y: 0, width: 100, height: 100 }, material: 'standard', confidence: 1, shade: false, highlight: false, texture: 0, direction: 0, seed: 1 }],
    details: [],
    lineWidth: 8,
  }),
  loadBackgrounds: async () => [
    { id: "white", name: "しろ", assetUrl: "", thumbnailUrl: "" },
  ],
  loadFrames: async () => [
    { id: "none", name: "なし", assetUrl: "", thumbnailUrl: "" },
  ],
}));
vi.mock("../apps/web/src/audio", () => ({
  updateAudio: vi.fn(),
  stopAudio: vi.fn(),
  unlockAudio: vi.fn(),
  completionSound: vi.fn(),
  paintSound: vi.fn(),
  speakColor: vi.fn(),
}));
vi.mock("../apps/web/src/pages/Home", () => ({
  HomePage: () => (
    <main>
      <h1>ホーム確認</h1>
    </main>
  ),
  ThemePage: () => (
    <main>
      <h1>テーマ確認</h1>
    </main>
  ),
}));
vi.mock("../apps/web/src/components/ArtworkCanvas", async () => {
  const { forwardRef, useEffect, useImperativeHandle } = await import("react");
  type Props = ComponentProps<
    typeof import("../apps/web/src/components/ArtworkCanvas").ArtworkCanvas
  >;
  return {
    ArtworkCanvas: forwardRef(function TestArtwork(
      { project, onPaint, onReady, interactive }: Props,
      ref,
    ) {
      useImperativeHandle(
        ref,
        () => ({
          engine: () => ({
            paint: vi.fn(),
            paintMany: vi.fn(),
            exportThumbnail: async () =>
              new Blob(["thumbnail"], { type: "image/png" }),
          }),
          reset: vi.fn(),
          zoom: vi.fn(),
        }),
        [],
      );
      useEffect(() => {
        onReady?.();
      }, []);
      return (
        <div
          data-testid="artwork"
          data-owner={project.userId}
          data-project={project.id}
        >
          <output data-testid="paints">
            {JSON.stringify(project.regions)}
          </output>
          {interactive && (
            <button onClick={() => onPaint?.("r01", { x: 100, y: 100 })}>
              テストでぬる
            </button>
          )}
        </div>
      );
    }),
  };
});

import App from "../apps/web/src/App";
import { navigate } from "../apps/web/src/components/UI";
import { registerPwaUpdates } from '../apps/web/src/pwa-updates';
import { navigationAllowsUpdate } from '../apps/web/src/navigation';

// Diagnostic mutation: reproduce the audit's pre-fix, unconditional hash router.
// Normal regressions always exercise the real GuardedRouteProvider.
vi.mock("../apps/web/src/guarded-route", async (original) => {
  if (process.env.A19_NAVIGATION_BASELINE !== "1") return original();
  const { useEffect, useState } = await import("react");
  return {
    GuardedRouteProvider: ({
      children,
    }: {
      children: import("react").ReactNode;
    }) => children,
    useNavigationBlocker: () => ({ enabled: false, refresh: () => undefined }),
    useGuardedRoute: function useOriginalRoute() {
      const [route, setRoute] = useState(
        () => location.hash.slice(1) || "/home",
      );
      useEffect(() => {
        const change = () => setRoute(location.hash.slice(1) || "/home");
        window.addEventListener("hashchange", change);
        return () => window.removeEventListener("hashchange", change);
      }, []);
      return { route, blocked: false };
    },
  };
});

let app: IslandServices, auth: TestAuth;
let stopUpdates: (() => void) | undefined;
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function changeHash(path: string) {
  await act(async () => {
    navigate(path);
  });
  await waitFor(() => expect(location.hash).toBe(`#${path}`));
}
async function openEditor() {
  const project = await app.projects.create({
    templateId: "princess-rabbit",
    title: "保護する作品",
  });
  history.replaceState(null, "", "/#/home");
  render(<App />);
  await screen.findByRole("heading", { name: "ホーム確認" });
  await changeHash(`/paint/${project.id}`);
  await screen.findByRole("button", { name: "テストでぬる" });
  return project;
}
function quotaFailure() {
  let failing = true;
  const original = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
    this: IDBObjectStore,
    ...args
  ) {
    if (failing && this.name === "projects")
      throw new DOMException("容量不足です", "QuotaExceededError");
    return original.apply(this, args);
  });
  return () => {
    failing = false;
  };
}
async function failPaint() {
  fireEvent.click(screen.getByRole("button", { name: "テストでぬる" }));
  await screen.findByRole("button", { name: "保存をやりなおす" });
  expect(JSON.parse(screen.getByTestId("paints").textContent!)).toEqual({
    r01: { color: "#F64C91", paintType: "smooth" },
  });
}
function beforeUnloadPrevented() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
async function waitingUpdate(reload = () => undefined) {
  const activation = vi.fn();
  const registration = Object.assign(new EventTarget(), { waiting: { postMessage: activation }, installing: null });
  const container = Object.assign(new EventTarget(), { controller: {}, register: async () => registration });
  vi.stubGlobal('navigator', new Proxy(navigator, { get: (target, key) => key === 'serviceWorker' ? container : Reflect.get(target, key, target), has: (target, key) => key === 'serviceWorker' || key in target }));
  stopUpdates = await registerPwaUpdates(() => !app.sync.status.localSaveFailed, reload);
  return activation;
}

beforeEach(async () => {
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const actual = await vi.importActual<
    typeof import("../packages/persistence/src/index")
  >("@island/persistence");
  auth = new TestAuth(USER_A, true);
  app = actual.createServices({
    dbName: crypto.randomUUID(),
    authAdapter: auth,
    online: () => false,
  });
  harness.service = app;
  await app.ready;
});
afterEach(async () => {
  stopUpdates?.();
  stopUpdates = undefined;
  cleanup();
  await app.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('A03-06: PWA requests follow the current account lifetime', () => {
  it('releases an old syncing update button and accepts a fresh request after batched A to B to A', async () => {
    const activation = await waitingUpdate();
    const old = deferred<void>();
    vi.spyOn(app.sync, 'flush').mockReturnValueOnce(old.promise);
    history.replaceState(null, '', '/#/home');
    render(<App />);
    const update = await screen.findByRole('button', { name: '更新する' }) as HTMLButtonElement;
    fireEvent.click(update);
    expect(update.disabled).toBe(true);
    await act(async () => {
      auth.setSession({ userId: USER_B, provider: 'demo', localOnly: true });
      auth.setSession({ userId: USER_A, provider: 'demo', localOnly: true });
    });
    await waitFor(() => expect(update.disabled).toBe(false));
    await act(async () => old.resolve());
    expect(activation).not.toHaveBeenCalled();
    fireEvent.click(update);
    await waitFor(() => expect(activation).toHaveBeenCalledTimes(1));
  });

  it.each(['round trip', 'same user'] as const)('rechecks a requested worker replacement after %s', async (kind) => {
    const reload = vi.fn(), activation = await waitingUpdate(reload);
    history.replaceState(null, '', '/#/home');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '更新する' }));
    await waitFor(() => expect(activation).toHaveBeenCalledTimes(1));
    await act(async () => {
      if (kind === 'round trip') auth.setSession({ userId: USER_B, provider: 'demo', localOnly: true });
      auth.setSession({ userId: USER_A, provider: 'demo', localOnly: true });
      navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));
    });
    expect(reload).toHaveBeenCalledTimes(kind === 'same user' ? 1 : 0);
    if (kind === 'round trip') {
      fireEvent.click(await screen.findByRole('button', { name: '更新する' }));
      await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    }
  });
});

describe('A09-04: the real update button and retained editor share navigation ownership', () => {
  it('does not send an old update after sync resolves while URL home still displays a saving editor', async () => {
    const activation = vi.fn();
    const registration = Object.assign(new EventTarget(), { waiting: { postMessage: activation }, installing: null });
    const container = Object.assign(new EventTarget(), { controller: {}, register: async () => registration });
    vi.stubGlobal('navigator', new Proxy(navigator, { get: (target, key) => key === 'serviceWorker' ? container : Reflect.get(target, key, target), has: (target, key) => key === 'serviceWorker' || key in target }));
    const stop: unknown = await registerPwaUpdates(() => !app.sync.status.localSaveFailed);
    if (typeof stop === 'function') stopUpdates = stop as () => void;
    const work = await app.projects.create({ templateId: 'princess-rabbit', title: '更新中の作品' });
    const syncGate = deferred<void>(), saveGate = deferred<void>();
    const save = app.projects.save.bind(app.projects);
    vi.spyOn(app.sync, 'flush').mockImplementation(() => syncGate.promise);
    vi.spyOn(app.projects, 'save').mockImplementation(async (...args) => { await saveGate.promise; return save(...args); });
    history.replaceState(null, '', '/#/home');
    render(<App />);
    try {
      fireEvent.click(await screen.findByRole('button', { name: '更新する' }));
      await changeHash(`/paint/${work.id}`);
      fireEvent.click(await screen.findByRole('button', { name: 'テストでぬる' }));
      await changeHash('/home');
      await screen.findByRole('dialog');
      expect(location.hash).toBe('#/home');
      expect(screen.getByTestId('artwork')).toBeTruthy();
      expect(Boolean(app.sync.status.localSaveFailed)).toBe(false);
      expect(beforeUnloadPrevented()).toBe(true);
      await act(async () => { syncGate.resolve(); });
      expect(activation).not.toHaveBeenCalled();
    } finally {
      await act(async () => { syncGate.resolve(); saveGate.resolve(); });
    }
  });
  it.each(['home-return', 'defer'] as const)('invalidates the real delayed update button after %s even when home is safe again', async (action) => {
    const activation = vi.fn();
    const registration = Object.assign(new EventTarget(), { waiting: { postMessage: activation }, installing: null });
    const container = Object.assign(new EventTarget(), { controller: {}, register: async () => registration });
    vi.stubGlobal('navigator', new Proxy(navigator, { get: (target, key) => key === 'serviceWorker' ? container : Reflect.get(target, key, target), has: (target, key) => key === 'serviceWorker' || key in target }));
    stopUpdates = await registerPwaUpdates(() => !app.sync.status.localSaveFailed);
    const gate = deferred<void>();
    vi.spyOn(app.sync, 'flush').mockImplementation(() => gate.promise);
    history.replaceState(null, '', '/#/home');
    render(<App />);
    const requests = vi.fn();
    window.addEventListener('island-apply-update', requests);
    try {
      fireEvent.click(await screen.findByRole('button', { name: '更新する' }));
      if (action === 'home-return') {
        await changeHash('/theme/ocean');
        await screen.findByRole('heading', { name: 'テーマ確認' });
        await changeHash('/home');
        await screen.findByRole('heading', { name: 'ホーム確認' });
      } else fireEvent.click(screen.getByRole('button', { name: 'あとで' }));
      await act(async () => { gate.resolve(); });
      expect(requests).not.toHaveBeenCalled();
      expect(activation).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('island-apply-update', requests);
      await act(async () => { gate.resolve(); });
    }
  });
});

describe("A19-01: retain the real Editor until its edits are committed or explicitly discarded", () => {
  it("retains failed edits through history back/forward and retries the same colour after capacity recovers", async () => {
    const project = await openEditor();
    const recover = quotaFailure();
    await failPaint();
    expect(beforeUnloadPrevented()).toBe(true);
    await act(async () => {
      history.back();
    });
    const dialog = await screen.findByRole("dialog", {
      name: "まだ保存できていない変更があります",
    });
    expect(
      JSON.parse(screen.getByTestId("paints").textContent!),
    ).toHaveProperty("r01.color", "#F64C91");
    expect((await app.projects.get(project.id))!.regions).toEqual({});
    await act(async () => {
      history.forward();
    });
    await waitFor(() => expect(location.hash).toBe(`#/paint/${project.id}`));
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    recover();
    fireEvent.click(screen.getByRole("button", { name: "保存をやりなおす" }));
    await waitFor(async () =>
      expect((await app.projects.get(project.id))!.regions).toHaveProperty(
        "r01.color",
        "#F64C91",
      ),
    );
    await waitFor(() => expect(beforeUnloadPrevented()).toBe(false));
    await act(async () => {
      history.back();
    });
    await screen.findByRole("heading", { name: "ホーム確認" });
    await act(async () => {
      history.forward();
    });
    await screen.findByRole("button", { name: "テストでぬる" });
    expect(
      JSON.parse(screen.getByTestId("paints").textContent!),
    ).toHaveProperty("r01.color", "#F64C91");
  });

  it("blocks the first save in flight before any error state or second render, then commits before moving", async () => {
    const project = await openEditor();
    const gate = deferred<void>();
    const save = app.projects.save.bind(app.projects);
    vi.spyOn(app.projects, "save").mockImplementation(async (...args) => {
      await gate.promise;
      return save(...args);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "テストでぬる" }));
      navigate("/home");
    });
    const dialog = await screen.findByRole("dialog", {
      name: "まだ保存できていない変更があります",
    });
    expect(beforeUnloadPrevented()).toBe(true);
    expect((await app.projects.get(project.id))!.regions).toEqual({});
    fireEvent.click(
      within(dialog).getByRole("button", { name: "保存して移動" }),
    );
    expect(screen.getByTestId("artwork")).toBeTruthy();
    await act(async () => {
      gate.resolve();
    });
    await screen.findByRole("heading", { name: "ホーム確認" });
    expect((await app.projects.get(project.id))!.regions).toHaveProperty(
      "r01.color",
      "#F64C91",
    );
  });

  it("uses the same guard for the app back button and keeps the drawing after another failed save", async () => {
    const project = await openEditor();
    const recover = quotaFailure();
    await failPaint();
    const canvas = screen.getByTestId("artwork");
    fireEvent.click(
      screen.getByRole("button", { name: "もどる" }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "保存して移動" }),
    );
    await within(dialog).findByRole("alert");
    expect(screen.getByTestId("artwork")).toBe(canvas);
    expect(beforeUnloadPrevented()).toBe(true);
    recover();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "保存して移動" }),
    );
    await screen.findByRole("heading", { name: "ホーム確認" });
    expect((await app.projects.get(project.id))!.regions).toHaveProperty(
      "r01.color",
      "#F64C91",
    );
  });

  it("returns to the same managed history position on cancel without adding or replacing its neighbours", async () => {
    const project = await openEditor();
    quotaFailure();
    await failPaint();
    const length = history.length,
      originalState: unknown = history.state;
    await act(async () => {
      history.back();
    });
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "ぬりえにもどる" }),
    );
    await waitFor(() => expect(location.hash).toBe(`#/paint/${project.id}`));
    expect(history.length).toBe(length);
    expect(history.state).toEqual(originalState);
    await act(async () => {
      history.back();
    });
    await screen.findByRole("dialog");
    expect(location.hash).toBe("#/home");
    expect(
      JSON.parse(screen.getByTestId("paints").textContent!),
    ).toHaveProperty("r01.color", "#F64C91");
  });

  it("guards a raw hash change and safely restores the drawing URL on Escape", async () => {
    const project = await openEditor();
    quotaFailure();
    await failPaint();
    await act(async () => {
      location.hash = "/theme/ocean";
    });
    await screen.findByRole("dialog");
    const length = history.length;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(location.hash).toBe(`#/paint/${project.id}`);
    expect(history.length).toBe(length);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(beforeUnloadPrevented()).toBe(true);
    expect(
      JSON.parse(screen.getByTestId("paints").textContent!),
    ).toHaveProperty("r01.color", "#F64C91");
  });

  it("blocks a forward traversal after reopening a saved editor", async () => {
    const project = await openEditor();
    await changeHash("/theme/ocean");
    await screen.findByRole("heading", { name: "テーマ確認" });
    await act(async () => {
      history.back();
    });
    await screen.findByRole("button", { name: "テストでぬる" });
    quotaFailure();
    await failPaint();
    await act(async () => {
      history.forward();
    });
    const dialog = await screen.findByRole("dialog");
    expect(location.hash).toBe("#/theme/ocean");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "ぬりえにもどる" }),
    );
    await waitFor(() => expect(location.hash).toBe(`#/paint/${project.id}`));
    expect(beforeUnloadPrevented()).toBe(true);
    expect(
      JSON.parse(screen.getByTestId("paints").textContent!),
    ).toHaveProperty("r01.color", "#F64C91");
  });

  it("does not move after the user cancels while the first save is still pending", async () => {
    const project = await openEditor();
    const gate = deferred<void>(),
      save = app.projects.save.bind(app.projects);
    vi.spyOn(app.projects, "save").mockImplementation(async (...args) => {
      await gate.promise;
      return save(...args);
    });
    fireEvent.click(screen.getByRole("button", { name: "テストでぬる" }));
    await changeHash("/home");
    const dialog = await screen.findByRole("dialog");
    expect(
      (
        within(dialog).getByRole("button", {
          name: "未保存の変更を破棄して移動",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "保存して移動" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "ぬりえにもどる" }),
    );
    await waitFor(() => expect(location.hash).toBe(`#/paint/${project.id}`));
    await act(async () => {
      gate.resolve();
    });
    await waitFor(() => expect(beforeUnloadPrevented()).toBe(false));
    expect(location.hash).toBe(`#/paint/${project.id}`);
    expect(screen.getByTestId("artwork")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("retains an in-flight first save that later fails and enables an explicit discard only after settlement", async () => {
    const project = await openEditor();
    const gate = deferred<void>();
    vi.spyOn(app.projects, "save").mockImplementationOnce(async () => {
      await gate.promise;
      throw new Error("保存失敗");
    });
    fireEvent.click(screen.getByRole("button", { name: "テストでぬる" }));
    await changeHash("/home");
    const dialog = await screen.findByRole("dialog");
    const discard = within(dialog).getByRole("button", {
      name: "未保存の変更を破棄して移動",
    }) as HTMLButtonElement;
    expect(discard.disabled).toBe(true);
    await act(async () => {
      gate.resolve();
    });
    await waitFor(() => expect(discard.disabled).toBe(false));
    expect(beforeUnloadPrevented()).toBe(true);
    expect(
      JSON.parse(screen.getByTestId("paints").textContent!),
    ).toHaveProperty("r01.color", "#F64C91");
    fireEvent.click(discard);
    await screen.findByRole("heading", { name: "ホーム確認" });
    expect(beforeUnloadPrevented()).toBe(false);
    expect((await app.projects.get(project.id))!.regions).toEqual({});
    await changeHash(`/paint/${project.id}`);
    await screen.findByRole("button", { name: "テストでぬる" });
    expect(JSON.parse(screen.getByTestId("paints").textContent!)).toEqual({});
  });

  it("discards only volatile edits and keeps the previously saved project", async () => {
    const activation = await waitingUpdate();
    const project = await openEditor();
    fireEvent.click(screen.getByRole("button", { name: "テストでぬる" }));
    await waitFor(async () =>
      expect((await app.projects.get(project.id))!.regions).toHaveProperty(
        "r01.color",
        "#F64C91",
      ),
    );
    const recover = quotaFailure();
    fireEvent.click(screen.getByRole("button", { name: "けす" }));
    fireEvent.click(screen.getByRole("button", { name: "テストでぬる" }));
    await screen.findByRole("button", { name: "保存をやりなおす" });
    expect(JSON.parse(screen.getByTestId("paints").textContent!)).toEqual({});
    await changeHash("/home");
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "未保存の変更を破棄して移動",
      }),
    );
    await screen.findByRole("heading", { name: "ホーム確認" });
    expect(app.sync.status.localSaveFailed).toBe(false);
    expect(screen.queryByText('この端末に保存できていません。画面を閉じずに、保存をやりなおしてください。')).toBeNull();
    expect(beforeUnloadPrevented()).toBe(false);
    fireEvent.click(await screen.findByRole('button', { name: '更新する' }));
    await waitFor(() => expect(activation).toHaveBeenCalledTimes(1));
    expect((await app.projects.get(project.id))!.regions).toHaveProperty('r01.color', '#F64C91');
    stopUpdates?.();
    stopUpdates = undefined;
    recover();
    await changeHash(`/paint/${project.id}`);
    await screen.findByRole("button", { name: "テストでぬる" });
    expect(
      JSON.parse(screen.getByTestId("paints").textContent!),
    ).toHaveProperty("r01.color", "#F64C91");
    expect(await app.projects.list()).toHaveLength(1);
  });

  it('keeps the home warning and update block when another project still has a failed save', async () => {
    const activation = await waitingUpdate();
    await openEditor();
    const other = await app.projects.create({ templateId: 'princess-rabbit', title: '別の未保存作品' });
    quotaFailure();
    await failPaint();
    await act(async () => { await expect(app.projects.save(other)).rejects.toMatchObject({ code: 'STORAGE' }); });
    await changeHash('/home');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '未保存の変更を破棄して移動' }));
    await screen.findByRole('heading', { name: 'ホーム確認' });
    expect(app.sync.status.localSaveFailed).toBe(true);
    expect(screen.getByText('この端末に保存できていません。画面を閉じずに、保存をやりなおしてください。')).toBeTruthy();
    expect(beforeUnloadPrevented()).toBe(false);
    await act(async () => { fireEvent.click(await screen.findByRole('button', { name: '更新する' })); });
    expect(activation).not.toHaveBeenCalled();
  });

  it("restores the saved editor after A to B to A and rejects an old navigation completion", async () => {
    const project = await openEditor();
    const oldCanvas = screen.getByTestId('artwork');
    const gate = deferred<void>(), committed = deferred<void>(),
      save = app.projects.save.bind(app.projects);
    vi.spyOn(app.projects, "save").mockImplementationOnce(async (...args) => {
      const saved = await save(...args);
      committed.resolve();
      await gate.promise;
      return saved;
    });
    fireEvent.click(screen.getByRole("button", { name: "テストでぬる" }));
    await committed.promise;
    await changeHash("/home");
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "保存して移動" }),
    );
    const historyLength = history.length;
    await act(async () => {
      auth.setSession({ userId: USER_B, provider: "demo", localOnly: true });
      auth.setSession({ userId: USER_A, provider: "demo", localOnly: true });
    });
    await screen.findByRole('button', { name: 'テストでぬる' });
    expect(screen.getByTestId('artwork')).not.toBe(oldCanvas);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(location.hash).toBe(`#/paint/${project.id}`);
    expect(history.length).toBe(historyLength);
    expect(navigationAllowsUpdate()).toBe(false);
    expect(JSON.parse(screen.getByTestId('paints').textContent!)).toHaveProperty('r01.color', '#F64C91');
    fireEvent.click(screen.getByRole('button', { name: 'クレヨン' }));
    fireEvent.click(screen.getByRole('button', { name: 'テストでぬる' }));
    await waitFor(async () => expect((await app.projects.get(project.id))?.regions.r01.paintType).toBe('crayon'));
    await act(async () => gate.resolve());
    expect(screen.getByTestId("artwork").getAttribute("data-project")).toBe(
      project.id,
    );
    expect(screen.queryByRole("heading", { name: "ホーム確認" })).toBeNull();
    expect(JSON.parse(screen.getByTestId('paints').textContent!)).toHaveProperty('r01.paintType', 'crayon');
    expect(beforeUnloadPrevented()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'もどる' }));
    await screen.findByRole('heading', { name: 'ホーム確認' });
  });
});

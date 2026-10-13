// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { IslandServices } from "../packages/persistence/src/index";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type Template,
} from "../packages/shared-types/src/index";
import { backup, TestAuth, USER_A, USER_B } from "./sync.helpers";

// Keep React, page components and IndexedDB persistence real. Only the image,
// canvas, audio and download boundaries are controlled to choose completion order.
const harness = vi.hoisted(() => ({
  service: undefined as IslandServices | undefined,
}));
const boundary = vi.hoisted(() => ({
  loadScene: vi.fn(),
  exportPng: vi.fn(),
  exportThumbnail: vi.fn(),
  download: vi.fn(),
  navigate: vi.fn(),
  updateAudio: vi.fn(),
}));
vi.mock("@island/persistence", () => ({
  createServices: () =>
    new Proxy(
      {},
      { get: (_target, name) => Reflect.get(harness.service!, name) },
    ),
}));
vi.mock("@island/engine", async (original) => ({
  ...(await original<typeof import("../packages/coloring-engine/src/index")>()),
  loadSceneImage: boundary.loadScene,
}));
vi.mock("@island/content", async (original) => ({
  ...(await original<typeof import("../packages/content-schema/src/index")>()),
  loadTemplate: async () =>
    ({
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
    }) satisfies Template,
  loadBackgrounds: async () => [
    { id: "white", name: "しろ", assetUrl: "", thumbnailUrl: "" },
    {
      id: "garden",
      name: "おにわ",
      assetUrl: "/garden.png",
      thumbnailUrl: "/garden.png",
    },
  ],
  loadFrames: async () => [
    { id: "none", name: "なし", assetUrl: "", thumbnailUrl: "" },
    {
      id: "flowers",
      name: "おはな",
      assetUrl: "/flowers.png",
      thumbnailUrl: "/flowers.png",
    },
  ],
}));
vi.mock("../apps/web/src/audio", () => ({
  updateAudio: boundary.updateAudio,
  stopAudio: vi.fn(),
  unlockAudio: vi.fn(),
  completionSound: vi.fn(),
  paintSound: vi.fn(),
  speakColor: vi.fn(),
}));
vi.mock("../apps/web/src/components/UI", async (original) => ({
  ...(await original<typeof import("../apps/web/src/components/UI")>()),
  downloadBlob: boundary.download,
  navigate: boundary.navigate,
}));
vi.mock("../apps/web/src/artwork-render", () => ({
  renderProject: () => boundary.exportThumbnail(),
}));
vi.mock("../apps/web/src/pages/Home", () => ({
  HomePage: () => <main>ホーム</main>,
  ThemePage: () => <main>テーマ</main>,
}));
vi.mock("../apps/web/src/components/ArtworkCanvas", async () => {
  const { forwardRef, useEffect, useImperativeHandle } = await import("react");
  type Props = ComponentProps<
    typeof import("../apps/web/src/components/ArtworkCanvas").ArtworkCanvas
  >;
  const engine = {
    exportPng: boundary.exportPng,
    exportThumbnail: boundary.exportThumbnail,
    paint: vi.fn(),
    paintMany: vi.fn(),
  };
  return {
    ArtworkCanvas: forwardRef(function TestArtwork(
      { project, onPaint, onReady, interactive }: Props,
      ref,
    ) {
      useImperativeHandle(
        ref,
        () => ({ engine: () => engine, reset: vi.fn(), zoom: vi.fn() }),
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
import { AppProvider, useApp } from "../apps/web/src/app-context";
import Editor from "../apps/web/src/pages/Editor";
import SettingsPage from "../apps/web/src/pages/Settings";

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
let app: IslandServices, auth: TestAuth;
const switchUser = (userId: string) =>
  auth.setSession({ userId, provider: "demo", localOnly: true });
function SettingsProbe() {
  const { settings, updateSettings, reloadSettings } = useApp();
  return (
    <>
      <output data-testid="settings">{JSON.stringify(settings)}</output>
      <button
        onClick={() => {
          void updateSettings({ bgm: true });
        }}
      >
        BGMを有効
      </button>
      <button
        onClick={() => {
          void updateSettings({ tapAssist: false });
        }}
      >
        補助を無効
      </button>
      <button
        onClick={() => {
          void reloadSettings();
        }}
      >
        設定を再取得
      </button>
    </>
  );
}
function renderedSettings(): AppSettings {
  return JSON.parse(screen.getByTestId("settings").textContent!) as AppSettings;
}
async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}
async function finishBeforeScene() {
  const finish = await screen.findByRole('button', { name: '完成' });
  await waitFor(() => expect((finish as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(finish);
  await screen.findByRole('button', { name: 'はいけい' });
}
async function openApp(route: string) {
  history.replaceState(null, "", `/#${route}`);
  const view = render(<App />);
  await settle();
  return view;
}
beforeEach(async () => {
  // Also discard unconsumed mockReturnValueOnce gates after an expected baseline failure.
  vi.resetAllMocks();
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("File", NodeFile);
  // jsdom has no layout observer; these tests control only async ownership.
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal("scrollTo", vi.fn());
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
  boundary.exportThumbnail.mockResolvedValue(
    new Blob(["thumbnail"], { type: "image/png" }),
  );
  boundary.exportPng.mockResolvedValue(
    new Blob(["png"], { type: "image/png" }),
  );
  boundary.loadScene.mockResolvedValue({});
  boundary.download.mockResolvedValue(undefined);
  boundary.navigate.mockImplementation((path: string) => {
    history.replaceState(null, "", `/#${path}`);
    window.dispatchEvent(new Event("hashchange"));
  });
});
afterEach(async () => {
  cleanup();
  await app.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("A03-01: async editor work is owned by the mounted screen", () => {
  it.each([
    ["はいけい", "おにわ"],
    ["かざりわく", "おはな"],
  ])(
    "does not overwrite a re-opened and painted project after delayed %s",
    async (picker, choice) => {
      await app.settings.set({ ...DEFAULT_SETTINGS, reducedMotion: true });
      const project = await app.projects.create({
        templateId: "princess-rabbit",
        title: "作品A",
      });
      const image = deferred<HTMLImageElement>();
      boundary.loadScene.mockReturnValueOnce(image.promise); // Deliberately ignores AbortSignal.
      const save = vi.spyOn(app.projects, "save");
      const old = render(
        <AppProvider>
          <Editor projectId={project.id} />
        </AppProvider>,
      );
      await finishBeforeScene();
      save.mockClear();
      await screen.findByRole("button", { name: picker });
      fireEvent.click(screen.getByRole("button", { name: picker }));
      fireEvent.click(screen.getByRole("button", { name: choice }));
      const signal = boundary.loadScene.mock.calls[0][1] as AbortSignal;
      old.unmount();
      expect(signal.aborted).toBe(true);
      render(
        <AppProvider>
          <Editor projectId={project.id} />
        </AppProvider>,
      );
      fireEvent.click(
        await screen.findByRole("button", { name: "テストでぬる" }),
      );
      await waitFor(async () =>
        expect((await app.projects.get(project.id))?.regions.r01).toBeTruthy(),
      );
      const painted = await app.projects.get(project.id);
      const count = save.mock.calls.length;
      await act(async () => image.resolve(document.createElement("img")));
      expect(save).toHaveBeenCalledTimes(count);
      expect((await app.projects.get(project.id))?.regions).toEqual(
        painted!.regions,
      );
      expect(screen.getByTestId("paints").textContent).toBe(
        JSON.stringify(painted!.regions),
      );
    },
  );

  it("does not export a thumbnail or flush after completion acknowledgement arrives on another account", async () => {
    const project = await app.projects.create({
      templateId: "princess-rabbit",
      title: "作品A",
    });
    const acknowledgement = deferred<void>(),
      committed = deferred<void>();
    const save = app.projects.save;
    vi.spyOn(app.projects, "save").mockImplementation(async (...args) => {
      const result = await save(...args);
      committed.resolve();
      await acknowledgement.promise;
      return result;
    });
    const flush = vi.spyOn(app.sync, "flush");
    render(
      <AppProvider>
        <Editor projectId={project.id} />
      </AppProvider>,
    );
    const finish = await screen.findByRole("button", { name: "完成" });
    await waitFor(() =>
      expect((finish as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(finish);
    await committed.promise;
    await act(async () => {
      switchUser(USER_B);
      acknowledgement.resolve();
    });
    expect(boundary.exportThumbnail).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });

  it("does not navigate after leaving while the back action is exporting a thumbnail", async () => {
    const project = await app.projects.create({
      templateId: "princess-rabbit",
      title: "作品A",
    });
    const thumbnail = deferred<Blob>();
    boundary.exportThumbnail.mockReturnValueOnce(thumbnail.promise);
    const view = render(
      <AppProvider>
        <Editor projectId={project.id} />
      </AppProvider>,
    );
    await screen.findByRole("button", { name: "テストでぬる" });
    await waitFor(() => expect((screen.getByRole("button", { name: "完成" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "もどる" }));
    await waitFor(() => expect(boundary.exportThumbnail).toHaveBeenCalled());
    view.unmount();
    await act(async () =>
      thumbnail.resolve(new Blob(["old"], { type: "image/png" })),
    );
    expect(boundary.navigate).not.toHaveBeenCalled();
    expect(await app.thumbnails.get(project.id)).toBeUndefined();
  });

  it("does not open the finished artwork after its thumbnail completes on a replaced account", async () => {
    await app.settings.set({ ...DEFAULT_SETTINGS, reducedMotion: true });
    const project = await app.projects.create({
      templateId: "princess-rabbit",
      title: "作品A",
    });
    await openApp(`/paint/${project.id}`);
    const finish = await screen.findByRole("button", { name: "完成" });
    await waitFor(() =>
      expect((finish as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(finish);
    const next = await screen.findByRole("button", { name: "さくひんへ" });
    const output = deferred<Blob>();
    boundary.exportThumbnail.mockReturnValueOnce(output.promise);
    fireEvent.click(next);
    await waitFor(() =>
      expect(boundary.exportThumbnail).toHaveBeenCalledTimes(2),
    );
    await act(async () => {
      switchUser(USER_B);
      output.resolve(new Blob(["old thumbnail"], { type: "image/png" }));
    });
    expect(boundary.navigate).not.toHaveBeenCalled();
  });
});

describe("A03-02: account changes remove private views and cancel their outputs", () => {
  it("replaces the detail screen on A -> B but preserves it for a same-user token refresh", async () => {
    const project = await app.projects.create({
      templateId: "princess-rabbit",
      title: "Aだけの作品",
    });
    await openApp(`/art/${project.id}`);
    await screen.findByRole("heading", { name: project.title });
    const canvas = screen.getByTestId("artwork");
    await act(async () => switchUser(USER_A));
    expect(screen.getByTestId("artwork")).toBe(canvas);
    await act(async () => switchUser(USER_B));
    expect(screen.queryByText(project.title)).toBeNull();
    expect(screen.queryByRole("button", { name: "PNG保存" })).toBeNull();
    await screen.findByRole("alert");
    expect(boundary.exportPng).not.toHaveBeenCalled();
  });

  it.each(["art", "paint"])(
    "discards an A %s lookup that completes after the B screen was opened",
    async (route) => {
      const project = await app.projects.create({
        templateId: "princess-rabbit",
        title: "Aだけの作品",
      });
      const lookup = deferred<typeof project>();
      const get = vi
        .spyOn(app.projects, "get")
        .mockReturnValueOnce(lookup.promise);
      // list also drives detail reloads; hold it so this test has one initial read.
      vi.spyOn(app.projects, "list").mockReturnValue(new Promise(() => {}));
      await openApp(`/${route}/${project.id}`);
      await waitFor(() => expect(get).toHaveBeenCalled());
      await act(async () => switchUser(USER_B));
      await act(async () => lookup.resolve(project));
      expect(screen.queryByText(project.title)).toBeNull();
      expect(screen.queryByRole("button", { name: "PNG保存" })).toBeNull();
      expect(screen.queryByTestId("artwork")).toBeNull();
    },
  );

  it("preserves editor tools on token refresh and removes the private editor on account replacement", async () => {
    const project = await app.projects.create({
      templateId: "princess-rabbit",
      title: "作品A",
    });
    await openApp(`/paint/${project.id}`);
    fireEvent.click(
      await screen.findByRole("button", { name: "テストでぬる" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "クレヨン" }));
    await waitFor(async () =>
      expect((await app.projects.get(project.id))?.regions.r01).toBeTruthy(),
    );
    const canvas = screen.getByTestId("artwork");
    await act(async () => switchUser(USER_A));
    expect(screen.getByTestId("artwork")).toBe(canvas);
    expect(
      screen
        .getByRole("button", { name: "クレヨン" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await act(async () => switchUser(USER_B));
    await screen.findByRole("alert");
    expect(screen.queryByTestId("artwork")).toBeNull();
    expect(await app.projects.list()).toEqual([]);
  });

  it.each(["B", "A again"])(
    "does not download A PNG after switching to %s during canvas export",
    async (destination) => {
      const project = await app.projects.create({
        templateId: "princess-rabbit",
        title: "Aだけの作品",
      });
      const output = deferred<Blob>();
      boundary.exportPng.mockReturnValueOnce(output.promise);
      await openApp(`/art/${project.id}`);
      const button = await screen.findByRole("button", { name: "PNG保存" });
      await waitFor(() =>
        expect((button as HTMLButtonElement).disabled).toBe(false),
      );
      fireEvent.click(button);
      await act(async () => {
        switchUser(USER_B);
        if (destination === "A again") switchUser(USER_A);
        output.resolve(new Blob(["private A png"], { type: "image/png" }));
      });
      expect(boundary.download).not.toHaveBeenCalled();
    },
  );

  it.each(["account change", "unmount"])(
    "does not download a delayed private backup after %s",
    async (reason) => {
      const output = deferred<Blob>();
      vi.spyOn(app.backup, "export").mockReturnValueOnce(output.promise);
      const view = await openApp("/settings");
      fireEvent.click(
        await screen.findByRole("button", { name: "バックアップ" }),
      );
      if (reason === "unmount") view.unmount();
      await act(async () => {
        if (reason === "account change") switchUser(USER_B);
        output.resolve(
          new Blob(["private A backup"], { type: "application/json" }),
        );
      });
      expect(boundary.download).not.toHaveBeenCalled();
    },
  );
});

describe.each(['batched', 'committed'] as const)('A03-06: %s A -> B -> A starts a new screen lifetime', (mode) => {
  async function roundTrip() {
    if (mode === 'batched') {
      await act(async () => { switchUser(USER_B); switchUser(USER_A); });
    } else {
      await act(async () => switchUser(USER_B));
      await act(async () => switchUser(USER_A));
    }
  }

  it('restarts the first editor lookup and ignores its old result after a new paint', async () => {
    const project = await app.projects.create({ templateId: 'princess-rabbit', title: '読み込み中のA' });
    const originalGet = app.projects.get.bind(app.projects);
    const old = deferred<typeof project>();
    const get = vi.spyOn(app.projects, 'get').mockReturnValueOnce(old.promise);
    await openApp(`/paint/${project.id}`);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(screen.getByText('ぬりえを ひらいています…')).toBeTruthy();
    await roundTrip();
    const paint = await screen.findByRole('button', { name: 'テストでぬる' });
    const canvas = screen.getByTestId('artwork');
    expect(get.mock.calls.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(paint);
    await waitFor(async () => expect((await originalGet(project.id))?.regions.r01.color).toBe('#F64C91'));
    await act(async () => old.resolve({ ...project, regions: { r02: { color: '#123456', paintType: 'crayon' } } }));
    expect(screen.getByTestId('artwork')).toBe(canvas);
    expect(JSON.parse(screen.getByTestId('paints').textContent!)).toEqual({ r01: { color: '#F64C91', paintType: 'smooth' } });
  });

  it('re-enables PNG and keeps a new export busy when the old export completes', async () => {
    const project = await app.projects.create({ templateId: 'princess-rabbit', title: '出力中のA' });
    const old = deferred<Blob>(), fresh = deferred<Blob>();
    boundary.exportPng.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    await openApp(`/art/${project.id}`);
    const button = await screen.findByRole('button', { name: 'PNG保存' }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    const oldCanvas = screen.getByTestId('artwork');
    fireEvent.click(button);
    await roundTrip();
    const next = await screen.findByRole('button', { name: 'PNG保存' }) as HTMLButtonElement;
    await waitFor(() => expect(next.disabled).toBe(false));
    expect(screen.getByTestId('artwork')).not.toBe(oldCanvas);
    fireEvent.click(next);
    expect(next.disabled).toBe(true);
    await act(async () => old.resolve(new Blob(['old private output'], { type: 'image/png' })));
    expect(boundary.download).not.toHaveBeenCalled();
    expect(next.disabled).toBe(true);
    const png = new Blob(['new output'], { type: 'image/png' });
    await act(async () => fresh.resolve(png));
    await waitFor(() => expect(next.disabled).toBe(false));
    expect(boundary.download).toHaveBeenCalledTimes(1);
    expect(boundary.download.mock.calls[0][0]).toBe(png);
    expect((screen.getByRole('button', { name: 'もういちどぬる' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('cancels the old background and permits a fresh scene request', async () => {
    await app.settings.set({ ...DEFAULT_SETTINGS, reducedMotion: true });
    const project = await app.projects.create({ templateId: 'princess-rabbit', title: '背景待ちのA' });
    const old = deferred<HTMLImageElement>(), fresh = deferred<HTMLImageElement>();
    boundary.loadScene.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    const save = vi.spyOn(app.projects, 'save');
    await openApp(`/paint/${project.id}`);
    await finishBeforeScene();
    save.mockClear();
    fireEvent.click(await screen.findByRole('button', { name: 'はいけい' }));
    fireEvent.click(screen.getByRole('button', { name: 'おにわ' }));
    const oldCanvas = screen.getByTestId('artwork');
    const signal = boundary.loadScene.mock.calls[0][1] as AbortSignal;
    await roundTrip();
    await finishBeforeScene();
    save.mockClear();
    const next = await screen.findByRole('button', { name: 'はいけい' });
    expect(screen.getByTestId('artwork')).not.toBe(oldCanvas);
    expect(signal.aborted).toBe(true);
    fireEvent.click(next);
    fireEvent.click(screen.getByRole('button', { name: 'おにわ' }));
    await act(async () => old.resolve(document.createElement('img')));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
    await act(async () => fresh.resolve(document.createElement('img')));
    await waitFor(async () => expect((await app.projects.get(project.id))?.backgroundId).toBe('garden'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('restarts editing after a pending completion and can finish again', async () => {
    await app.settings.set({ ...DEFAULT_SETTINGS, reducedMotion: true });
    const project = await app.projects.create({ templateId: 'princess-rabbit', title: '完成待ちのA' });
    const old = deferred<Blob>();
    boundary.exportThumbnail.mockReturnValueOnce(old.promise);
    const thumbnail = vi.spyOn(app.thumbnails, 'set');
    const flush = vi.spyOn(app.sync, 'flush');
    await openApp(`/paint/${project.id}`);
    const finish = await screen.findByRole('button', { name: '完成' }) as HTMLButtonElement;
    await waitFor(() => expect(finish.disabled).toBe(false));
    fireEvent.click(finish);
    await waitFor(() => expect(boundary.exportThumbnail).toHaveBeenCalledTimes(1));
    const oldCanvas = screen.getByTestId('artwork');
    await roundTrip();
    const next = await screen.findByRole('button', { name: '完成' }) as HTMLButtonElement;
    await waitFor(() => expect(next.disabled).toBe(false));
    const canvas = screen.getByTestId('artwork');
    expect(canvas).not.toBe(oldCanvas);
    await act(async () => old.resolve(new Blob(['old thumbnail'], { type: 'image/png' })));
    expect(thumbnail).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
    expect(screen.getByTestId('artwork')).toBe(canvas);
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    await screen.findByRole('button', { name: 'さくひんへ' });
    expect(thumbnail).toHaveBeenCalledTimes(1);
    expect((await app.projects.get(project.id))?.status).toBe('completed');
  });
});

describe('A03-06: a same-user token refresh preserves live operations', () => {
  it('finishes the original initial lookup without restarting it', async () => {
    const project = await app.projects.create({ templateId: 'princess-rabbit', title: 'Aの読込' });
    const read = deferred<typeof project>();
    const get = vi.spyOn(app.projects, 'get').mockReturnValueOnce(read.promise);
    await openApp(`/paint/${project.id}`);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    await act(async () => switchUser(USER_A));
    await act(async () => read.resolve(project));
    await screen.findByRole('button', { name: 'テストでぬる' });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps the same canvas and accepts its original PNG output', async () => {
    const project = await app.projects.create({ templateId: 'princess-rabbit', title: 'Aの出力' });
    const output = deferred<Blob>();
    boundary.exportPng.mockReturnValueOnce(output.promise);
    await openApp(`/art/${project.id}`);
    const button = await screen.findByRole('button', { name: 'PNG保存' }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    const canvas = screen.getByTestId('artwork');
    fireEvent.click(button);
    await act(async () => switchUser(USER_A));
    const png = new Blob(['same owner output'], { type: 'image/png' });
    await act(async () => output.resolve(png));
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.getByTestId('artwork')).toBe(canvas);
    expect(boundary.download).toHaveBeenCalledTimes(1);
    expect(boundary.download.mock.calls[0][0]).toBe(png);
  });
});

describe("A13 restore picker keeps the account generation that opened it", () => {
  it.each(["change", "cancel"])(
    "ignores a delayed picker %s after A -> B -> A",
    async (eventType) => {
      render(<AppProvider><SettingsPage /></AppProvider>);
      const restore = await screen.findByRole("button", { name: "復元" });
      const input = screen.getByLabelText("バックアップファイル");
      const focus = vi.spyOn(restore, "focus");
      fireEvent.click(restore);
      await act(async () => { switchUser(USER_B); switchUser(USER_A); });
      focus.mockClear();
      if (eventType === "change") {
        fireEvent.change(input, { target: { files: [new File([backup([])], "old-owner.json", { type: "application/json" })] } });
      } else {
        fireEvent(input, new Event("cancel"));
      }
      expect(screen.queryByRole("dialog", { name: "バックアップを復元しますか？" })).toBeNull();
      expect(focus).not.toHaveBeenCalled();
    },
  );
});

describe("A03-03/04: settings display, audio and durable state share the current generation", () => {
  it("reloads restored settings and preserves them when an unrelated control changes", async () => {
    const restored = {
      ...DEFAULT_SETTINGS,
      bgm: true,
      reducedMotion: true,
      soundEffects: false,
    };
    render(
      <AppProvider>
        <SettingsPage />
        <SettingsProbe />
      </AppProvider>,
    );
    await settle();
    const file = new File([backup([], restored)], "backup.json", {
      type: "application/json",
    });
    fireEvent.change(screen.getByLabelText("バックアップファイル"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "復元する" }));
    await waitFor(() => expect(renderedSettings()).toEqual(restored));
    expect(
      (screen.getByRole("switch", { name: /BGM/ }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(boundary.updateAudio).toHaveBeenLastCalledWith(restored);
    fireEvent.click(screen.getByRole("switch", { name: /タップ操作の補助/ }));
    await waitFor(async () =>
      expect(await app.settings.get()).toEqual({
        ...restored,
        tapAssist: false,
      }),
    );
    expect(renderedSettings()).toEqual({ ...restored, tapAssist: false });
  });

  it.each(["initial", "reload"])(
    "ignores a stale %s settings read after a newer successful user change",
    async (kind) => {
      const read = deferred<AppSettings>();
      if (kind === "initial")
        vi.spyOn(app.settings, "get").mockReturnValueOnce(read.promise);
      render(
        <AppProvider>
          <SettingsProbe />
        </AppProvider>,
      );
      await settle();
      if (kind === "reload") {
        vi.spyOn(app.settings, "get").mockReturnValueOnce(read.promise);
        fireEvent.click(screen.getByRole("button", { name: "設定を再取得" }));
      }
      fireEvent.click(screen.getByRole("button", { name: "BGMを有効" }));
      await waitFor(async () =>
        expect((await app.settings.get()).bgm).toBe(true),
      );
      await act(async () => read.resolve({ ...DEFAULT_SETTINGS }));
      expect(renderedSettings().bgm).toBe(true);
      expect(boundary.updateAudio).toHaveBeenLastCalledWith(
        expect.objectContaining({ bgm: true }),
      );
      expect((await app.settings.get()).bgm).toBe(true);
    },
  );

  it("resets A settings immediately and rejects a late A save failure after B has loaded", async () => {
    await app.settings.set({ ...DEFAULT_SETTINGS, bgm: true });
    const failed = deferred<AppSettings>();
    const view = render(
      <AppProvider>
        <SettingsProbe />
      </AppProvider>,
    );
    await waitFor(() => expect(renderedSettings().bgm).toBe(true));
    vi.spyOn(app.settings, "set").mockReturnValueOnce(failed.promise);
    fireEvent.click(screen.getByRole("button", { name: "補助を無効" }));
    const bRead = deferred<AppSettings>();
    vi.spyOn(app.settings, "get").mockReturnValueOnce(bRead.promise);
    await act(async () => switchUser(USER_B));
    expect(renderedSettings()).toEqual(DEFAULT_SETTINGS);
    await act(async () => bRead.resolve({ ...DEFAULT_SETTINGS, volume: 0.8 }));
    await act(async () =>
      failed.reject(new Error("A account storage failure")),
    );
    expect(renderedSettings()).toEqual({ ...DEFAULT_SETTINGS, volume: 0.8 });
    expect(view.container.textContent).not.toContain(
      "A account storage failure",
    );
    expect(boundary.updateAudio).toHaveBeenLastCalledWith({
      ...DEFAULT_SETTINGS,
      volume: 0.8,
    });
  });

  it("does not let a token refresh re-read old storage during an optimistic settings write", async () => {
    const write = deferred<AppSettings>();
    render(
      <AppProvider>
        <SettingsProbe />
      </AppProvider>,
    );
    await settle();
    const reads = vi.spyOn(app.settings, "get");
    vi.spyOn(app.settings, "set").mockReturnValueOnce(write.promise);
    fireEvent.click(screen.getByRole("button", { name: "BGMを有効" }));
    await act(async () => switchUser(USER_A));
    expect(renderedSettings().bgm).toBe(true);
    expect(reads).not.toHaveBeenCalled();
    await act(async () => write.resolve({ ...DEFAULT_SETTINGS, bgm: true }));
  });
});

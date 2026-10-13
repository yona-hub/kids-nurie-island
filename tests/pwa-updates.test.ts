// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  registerPwaUpdates,
  getUpdateNotice,
} from "../apps/web/src/pwa-updates";
import { activateRequestedUpdate } from "../apps/web/src/pwa-activation";
import {
  bindNavigationSafety,
  invalidateNavigation,
  readNavigationSafety,
  type NavigationSafety,
} from "../apps/web/src/navigation";

// The application and SW activation algorithms are real. Only the browser's
// MessageChannel, clients list, registration and reload boundaries vary.
class Port extends EventTarget {
  peer!: Port;
  closed = false;
  onmessage: ((event: MessageEvent) => void) | null = null;
  start() {}
  close() {
    this.closed = true;
  }
  postMessage(data: unknown) {
    queueMicrotask(() => {
      if (this.peer.closed) return;
      const event = new MessageEvent("message", { data });
      this.peer.onmessage?.(event);
      this.peer.dispatchEvent(event);
    });
  }
}
class Channel {
  port1 = new Port();
  port2 = new Port();
  constructor() {
    this.port1.peer = this.port2;
    this.port2.peer = this.port1;
  }
}
const homeClient = { id: "home", url: "https://island.test/#/home" };
let state: NavigationSafety;
let unbind: () => void, stop: (() => void) | undefined;
let container: EventTarget & { controller: object | null };
let localFailure: boolean;
const reload = vi.fn();
const activate = vi.fn(async () => undefined);
const clients = vi.fn(async () => [homeClient]);
const post = vi.fn();
let tasks: Promise<void>[];
async function setup(automaticControllerChange = true) {
  if (automaticControllerChange)
    activate.mockImplementation(async () => {
      container.dispatchEvent(new Event("controllerchange"));
    });
  const waiting = {
    postMessage: (data: { requestId?: unknown }, ports: MessagePort[]) => {
      post(data);
      tasks.push(
        activateRequestedUpdate(
          { scope: "https://island.test/", clients, activate },
          "home",
          data.requestId,
          ports[0],
        ),
      );
    },
  };
  const registration = Object.assign(new EventTarget(), {
    waiting,
    installing: null,
  });
  Object.assign(container, { register: async () => registration });
  vi.stubGlobal(
    "navigator",
    new Proxy(navigator, {
      get: (target, key) =>
        key === "serviceWorker" ? container : Reflect.get(target, key, target),
      has: (target, key) => key === "serviceWorker" || key in target,
    }),
  );
  stop = await registerPwaUpdates(() => !localFailure, reload);
}
function apply(generation = readNavigationSafety().generation) {
  window.dispatchEvent(
    new CustomEvent("island-apply-update", { detail: { generation } }),
  );
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("MessageChannel", Channel);
  state = {
    route: "/home",
    transitioning: false,
    unsaved: false,
    saving: false,
  };
  unbind = bindNavigationSafety(() => state);
  localFailure = false;
  container = Object.assign(new EventTarget(), { controller: {} });
  tasks = [];
  clients.mockResolvedValue([homeClient]);
  activate.mockImplementation(async () => undefined);
  history.replaceState(null, "", "/#/home");
});
afterEach(() => {
  stop?.();
  stop = undefined;
  unbind();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("A09-04 page and service-worker activation gates", () => {
  it("confirms a current home twice and reloads only after its requested activation", async () => {
    await setup();
    apply();
    await Promise.all(tasks);
    expect(clients).toHaveBeenCalledTimes(2);
    expect(activate).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
  it.each([
    { route: "/paint/work" },
    { transitioning: true },
    { unsaved: true },
    { saving: true },
    { route: null },
  ])("refuses URL home when actual state is %j", async (patch) => {
    await setup();
    state = { ...state, ...patch };
    apply();
    await Promise.all(tasks);
    expect(post).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
  it("refuses a local save failure even on the actual home", async () => {
    await setup();
    localFailure = true;
    apply();
    expect(post).not.toHaveBeenCalled();
  });
  it("refuses an old home generation after an editor visit and return", async () => {
    await setup();
    const generation = readNavigationSafety().generation;
    state.route = "/paint/work";
    invalidateNavigation();
    state.route = "/home";
    invalidateNavigation();
    apply(generation);
    expect(post).not.toHaveBeenCalled();
  });
  it("preserves the other-tab refusal, including hidden or old tabs", async () => {
    await setup();
    clients.mockResolvedValue([
      homeClient,
      { id: "hidden-editor", url: "https://island.test/#/paint/work" },
    ]);
    apply();
    await Promise.all(tasks);
    expect(activate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(getUpdateNotice()).toContain("ほかのタブ");
  });
  it("refuses a second tab that appears during the first page confirmation", async () => {
    await setup();
    clients
      .mockResolvedValueOnce([homeClient])
      .mockResolvedValueOnce([
        homeClient,
        { id: "new-tab", url: "https://island.test/#/home" },
      ]);
    apply();
    await Promise.all(tasks);
    expect(activate).not.toHaveBeenCalled();
  });
  it("rejects activation when navigation changes while the SW is listing clients", async () => {
    vi.useFakeTimers();
    await setup();
    const gate = deferred<(typeof homeClient)[]>();
    clients.mockImplementationOnce(() => gate.promise);
    apply();
    state = {
      route: "/paint/work",
      transitioning: true,
      unsaved: true,
      saving: true,
    };
    invalidateNavigation();
    gate.resolve([homeClient]);
    await vi.advanceTimersByTimeAsync(1501);
    await Promise.all(tasks);
    expect(activate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
  it("rechecks the page after the second client lookup instead of using the first acknowledgement", async () => {
    vi.useFakeTimers();
    await setup();
    const gate = deferred<(typeof homeClient)[]>();
    clients
      .mockResolvedValueOnce([homeClient])
      .mockImplementationOnce(() => gate.promise);
    apply();
    await vi.advanceTimersByTimeAsync(0);
    expect(clients).toHaveBeenCalledTimes(2);
    state.route = "/paint/work";
    invalidateNavigation();
    gate.resolve([homeClient]);
    await vi.advanceTimersByTimeAsync(1501);
    await Promise.all(tasks);
    expect(activate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
  it("rechecks synchronous dirty state at controllerchange even before a render notification", async () => {
    await setup(false);
    apply();
    await Promise.all(tasks);
    expect(activate).toHaveBeenCalledOnce();
    state = {
      route: "/paint/work",
      transitioning: true,
      unsaved: true,
      saving: true,
    };
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    state = {
      route: "/home",
      transitioning: false,
      unsaved: false,
      saving: false,
    };
    invalidateNavigation();
    apply();
    expect(reload).toHaveBeenCalledOnce();
  });
  it("does not reuse accepted consent after navigating away and back before controllerchange", async () => {
    await setup(false);
    apply();
    await Promise.all(tasks);
    state.route = "/paint/work";
    invalidateNavigation();
    state.route = "/home";
    invalidateNavigation();
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
  });
  it("ignores initial control and external controller changes until a fresh explicit home request", async () => {
    container.controller = null;
    await setup();
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    apply();
    expect(reload).toHaveBeenCalledOnce();
    expect(post).not.toHaveBeenCalled();
  });
  it("times out a worker with no response and never authorizes its late controllerchange", async () => {
    vi.useFakeTimers();
    await setup(false);
    const gate = deferred<(typeof homeClient)[]>();
    clients.mockImplementationOnce(() => gate.promise);
    apply();
    await vi.advanceTimersByTimeAsync(5001);
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    gate.resolve([homeClient]);
    await vi.advanceTimersByTimeAsync(1501);
    await Promise.all(tasks);
  });
  it("fails closed for a legacy message without a fresh page confirmation protocol", async () => {
    const channel = new Channel();
    await activateRequestedUpdate(
      { scope: "https://island.test/", clients, activate },
      "home",
      undefined,
      channel.port2 as unknown as MessagePort,
    );
    expect(activate).not.toHaveBeenCalled();
  });
});

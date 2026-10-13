import { navigationAllowsUpdate, readNavigationSafety } from "./navigation";

let notice: string | null = null;
export function getUpdateNotice(): string | null {
  return notice;
}
function announce(message = "新しいバージョンがあります") {
  notice = message;
  window.dispatchEvent(new Event("island-update-ready"));
}
interface Attempt {
  id: string;
  generation: number;
  channel: MessageChannel;
  timer?: ReturnType<typeof setTimeout>;
}

// A request belongs to one unchanged, actually displayed home screen. The hash
// can already name a destination while GuardedRouteProvider retains an editor.
export async function registerPwaUpdates(
  canApply: () => boolean,
  reload: () => void = () => location.reload(),
): Promise<() => void> {
  if (!("serviceWorker" in navigator)) return () => undefined;
  const container = navigator.serviceWorker;
  let attempt: Attempt | null = null;
  let changedExternally = false;
  let hadController = Boolean(container.controller);
  let disposed = false;
  let registration: ServiceWorkerRegistration | undefined;
  const safe = () => !disposed && navigationAllowsUpdate() && canApply();
  const valid = (value: Attempt) =>
    attempt === value &&
    value.generation === readNavigationSafety().generation &&
    safe();
  const finish = (message?: string) => {
    if (attempt) {
      clearTimeout(attempt.timer);
      attempt.channel.port1.close();
      attempt = null;
    }
    if (message && !disposed) announce(message);
  };
  const navigationChanged = () => {
    if (attempt && !valid(attempt))
      finish("保存が終わってから、ホームで更新してください");
  };
  const controllerChanged = () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (attempt && valid(attempt)) {
      finish();
      reload();
    } else {
      finish();
      changedExternally = true;
      announce();
    }
  };
  const checkWaiting = () => {
    if (!disposed && registration?.waiting && container.controller) announce();
  };
  const found = () =>
    registration?.installing?.addEventListener("statechange", checkWaiting);
  const apply = (event: Event) => {
    if (attempt) return;
    const generation = readNavigationSafety().generation;
    const requestedGeneration = (event as CustomEvent<{ generation?: number }>)
      .detail?.generation;
    if (
      !safe() ||
      (requestedGeneration !== undefined && requestedGeneration !== generation)
    ) {
      announce("保存が終わってから、ホームで更新してください");
      return;
    }
    if (changedExternally) {
      reload();
      return;
    }
    const waiting = registration?.waiting;
    if (!waiting) return;
    const current: Attempt = {
      id: crypto.randomUUID(),
      generation,
      channel: new MessageChannel(),
    };
    attempt = current;
    current.timer = setTimeout(() => {
      if (attempt === current)
        finish("更新の準備ができませんでした。もういちどお試しください");
    }, 5000);
    current.channel.port1.onmessage = (
      reply: MessageEvent<{
        status?: string;
        reason?: string;
        requestId?: string;
        challenge?: number;
      }>,
    ) => {
      if (attempt !== current) return;
      if (reply.data?.status === "confirm") {
        const ready = reply.data.requestId === current.id && valid(current);
        current.channel.port1.postMessage({
          type: "ISLAND_CONFIRM_UPDATE",
          requestId: current.id,
          challenge: reply.data.challenge,
          ready,
        });
        if (!ready) finish("保存が終わってから、ホームで更新してください");
        return;
      }
      if (reply.data?.status === "accepted") {
        // Keep consent and its generation until controllerchange. A route
        // change or timeout in between invalidates the eventual reload too.
        if (!valid(current))
          finish("保存が終わってから、ホームで更新してください");
        return;
      }
      finish(
        reply.data?.reason === "other-tabs"
          ? "ほかのタブを閉じてから、もういちど更新してください"
          : "保存が終わってから、ホームで更新してください",
      );
    };
    waiting.postMessage(
      { type: "ISLAND_ACTIVATE_UPDATE", requestId: current.id },
      [current.channel.port2],
    );
  };
  const dispose = () => {
    disposed = true;
    finish();
    container.removeEventListener("controllerchange", controllerChanged);
    window.removeEventListener("island-navigation-changed", navigationChanged);
    window.removeEventListener("island-apply-update", apply);
    registration?.removeEventListener("updatefound", found);
    registration?.installing?.removeEventListener("statechange", checkWaiting);
  };
  container.addEventListener("controllerchange", controllerChanged);
  window.addEventListener("island-navigation-changed", navigationChanged);
  try {
    registration = await container.register(`${import.meta.env.BASE_URL}sw.js`);
    checkWaiting();
    registration.addEventListener("updatefound", found);
    window.addEventListener("island-apply-update", apply);
  } catch (error) {
    console.warn("Offline preparation unavailable", error);
    dispose();
  }
  return dispose;
}

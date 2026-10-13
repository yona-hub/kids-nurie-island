interface ActivationClient {
  id: string;
  url: string;
}
interface ActivationHost {
  scope: string;
  clients(): Promise<readonly ActivationClient[]>;
  activate(): Promise<void>;
}

/** Shared with the SW test harness; only the native client/port boundaries vary. */
export async function activateRequestedUpdate(
  host: ActivationHost,
  sourceId: string | undefined,
  requestId: unknown,
  port: MessagePort | undefined,
): Promise<void> {
  const block = (reason: "other-tabs" | "busy") =>
    port?.postMessage({ status: "blocked", reason });
  if (!port || typeof requestId !== "string" || !requestId) {
    block("busy");
    return;
  }
  const onlySource = async () => {
    const scope = new URL(host.scope);
    const windows = (await host.clients()).filter((client) => {
      const url = new URL(client.url);
      return (
        url.origin === scope.origin && url.pathname.startsWith(scope.pathname)
      );
    });
    return windows.length === 1 && windows[0].id === sourceId;
  };
  const confirm = (challenge: number) =>
    new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ready: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        port.removeEventListener("message", receive);
        resolve(ready);
      };
      const receive = (event: MessageEvent) => {
        const value = event.data;
        if (
          value?.type === "ISLAND_CONFIRM_UPDATE" &&
          value.requestId === requestId &&
          value.challenge === challenge
        )
          finish(value.ready === true);
      };
      const timer = setTimeout(() => finish(false), 1500);
      port.addEventListener("message", receive);
      port.start();
      port.postMessage({ status: "confirm", requestId, challenge });
    });
  // Recheck both live clients and the page after asynchronous work. A hash of
  // #/home is insufficient: it can describe a blocked destination, not the UI.
  if (!(await onlySource())) {
    block("other-tabs");
    return;
  }
  if (!(await confirm(1))) {
    block("busy");
    return;
  }
  if (!(await onlySource())) {
    block("other-tabs");
    return;
  }
  if (!(await confirm(2))) {
    block("busy");
    return;
  }
  port.postMessage({ status: "accepted" });
  await host.activate();
}

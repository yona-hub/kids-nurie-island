export const HTTP_DEADLINE_MS = 15_000;

/** Keep one deadline through headers, body completion and JSON validation. SDK consumers
 * receive the original Response (including URL/status/headers) with its body still readable. */
export async function fetchCompleteResponse(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const caller = init?.signal ?? (typeof Request !== 'undefined' && input instanceof Request ? input.signal : undefined);
  if (caller?.aborted) throw caller.reason ?? new DOMException('Aborted', 'AbortError');
  const controller = new AbortController(), deadline = Date.now() + HTTP_DEADLINE_MS;
  let response: Response | undefined, reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let rejectAbort!: (reason: unknown) => void;
  const interrupted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  const cancelBodies = (reason: unknown) => {
    // A tee cancellation can wait for the other branch: start both without waiting.
    void reader?.cancel(reason).catch(() => {});
    void response?.body?.cancel(reason).catch(() => {});
  };
  const abort = () => {
    const reason = caller?.aborted ? caller.reason ?? new DOMException('Aborted', 'AbortError') : new DOMException('Network response deadline exceeded', 'AbortError');
    controller.abort(reason); rejectAbort(reason); cancelBodies(reason);
  };
  const timer = setTimeout(abort, HTTP_DEADLINE_MS);
  caller?.addEventListener('abort', abort, { once: true });
  try {
    const fetching = fetch(input, { ...init, signal: controller.signal });
    // A custom transport can ignore cancellation; a late response must be discarded.
    void fetching.then(value => { if (controller.signal.aborted) void value.body?.cancel(controller.signal.reason).catch(() => {}); }).catch(() => {});
    response = await Promise.race([fetching, interrupted]);
    reader = response.clone().body?.getReader();
    let length = 0;
    while (reader) {
      const chunk = await Promise.race([reader.read(), interrupted]);
      if (chunk.done) break;
      length += chunk.value.byteLength;
    }
    if (length > 0 && response.headers.get('content-type')?.toLowerCase().includes('json')) await Promise.race([response.clone().json(), interrupted]);
    // JSON parsing is synchronous once buffered; reject an over-budget parse when it yields.
    if (Date.now() >= deadline) { abort(); throw controller.signal.reason; }
    return response;
  } catch (error) { controller.abort(error); cancelBodies(error); throw error; }
  finally {
    clearTimeout(timer); caller?.removeEventListener('abort', abort);
    try { reader?.releaseLock(); } catch { /* A cancelled reader may already be released. */ }
  }
}

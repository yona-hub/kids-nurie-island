import { useCallback, useEffect, useRef } from "react";
import { services } from "./app-context";

export interface AccountScope {
  signal: AbortSignal;
  isActive: () => boolean;
}

/** Async work belongs to the mounted screen and the account that started it. */
export function useAccountScope(ownerId: string) {
  const lifetime = useRef(new AbortController());
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    // A mounted lifetime never revives after an account change. Shell keys the
    // replacement by account generation, including batched A -> B -> A changes.
    // A same-user token refresh leaves this controller and its work intact.
    const unsubscribe = services.auth.subscribe(() => {
      if (services.auth.session?.userId !== ownerId) lifetime.current.abort();
    });
    return () => {
      lifetime.current.abort();
      unsubscribe();
    };
  }, [ownerId]);
  return useCallback((): AccountScope => {
    const signal = lifetime.current.signal;
    return {
      signal,
      isActive: () =>
        !signal.aborted && services.auth.session?.userId === ownerId,
    };
  }, [ownerId]);
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Modal, errorMessage } from "./components/UI";
import {
  currentRoute,
  newRouteEntry,
  replaceRouteEntry,
  routeEntry,
  type RouteEntry,
  bindNavigationSafety,
  invalidateNavigation,
} from "./navigation";

interface NavigationBlocker {
  hasChanges(): boolean;
  isSaving(): boolean;
  save(): Promise<void>;
  discard(): void;
}
interface PendingRoute {
  route: string;
  entry: RouteEntry | null;
  blocker: NavigationBlocker;
}
interface RouteContextValue {
  route: string;
  blocked: boolean;
  register(blocker: NavigationBlocker): () => void;
  refresh(): void;
}
const RouteContext = createContext<RouteContextValue | null>(null);
const noop = () => undefined;

export function GuardedRouteProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(currentRoute);
  const accepted = useRef({ route, entry: routeEntry() });
  const displayed = useRef<string | null>(null);
  const blocker = useRef<NavigationBlocker | null>(null);
  const request = useRef<PendingRoute | null>(null);
  const [pending, setPending] = useState<PendingRoute | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [, redraw] = useReducer((value: number) => value + 1, 0);
  const refresh = useCallback(() => {
    invalidateNavigation();
    redraw();
  }, []);
  useLayoutEffect(
    () =>
      bindNavigationSafety(() => ({
        route: displayed.current,
        transitioning:
          !!request.current || accepted.current.route !== displayed.current,
        unsaved: blocker.current?.hasChanges() ?? false,
        saving: blocker.current?.isSaving() ?? false,
      })),
    [],
  );
  useLayoutEffect(() => {
    displayed.current = route;
    invalidateNavigation();
  }, [route]);
  const clearRequest = useCallback(() => {
    request.current = null;
    invalidateNavigation();
    setPending(null);
    setBusy(false);
    setError("");
  }, []);
  const commit = useCallback(
    (next: { route: string; entry: RouteEntry | null }) => {
      accepted.current = next;
      clearRequest();
      setRoute(next.route);
      window.scrollTo({ top: 0 });
    },
    [clearRequest],
  );
  const register = useCallback(
    (value: NavigationBlocker) => {
      blocker.current = value;
      invalidateNavigation();
      return () => {
        if (blocker.current !== value) return;
        blocker.current = null;
        // An account replacement invalidates both its editor and any pending decision.
        // Its destination may already be in the URL while the accepted screen stays
        // mounted. Cancel that URL too, or a later navigate(destination) is a no-op.
        if (request.current && currentRoute() !== accepted.current.route) {
          const entry = { ...newRouteEntry(), route: accepted.current.route };
          replaceRouteEntry(entry);
          accepted.current = { route: entry.route, entry };
        }
        clearRequest();
      };
    },
    [clearRequest],
  );
  useEffect(() => {
    const initial = routeEntry();
    const entry = initial?.route === currentRoute() ? initial : newRouteEntry();
    replaceRouteEntry(entry);
    accepted.current = { route: currentRoute(), entry };
    const change = () => {
      invalidateNavigation();
      const nextRoute = currentRoute(),
        raw = routeEntry();
      const next = {
        route: nextRoute,
        entry: raw?.route === nextRoute ? raw : null,
      };
      if (next.route === accepted.current.route) {
        accepted.current = next;
        clearRequest();
      } else if (blocker.current?.hasChanges()) {
        const nextRequest = { ...next, blocker: blocker.current };
        request.current = nextRequest;
        setPending(nextRequest);
        setBusy(false);
        setError("");
      } else commit(next);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, [clearRequest, commit]);
  const stay = () => {
    clearRequest();
    const origin = accepted.current,
      position = routeEntry();
    if (
      origin.entry &&
      position?.route === currentRoute() &&
      position.session === origin.entry.session &&
      position.index !== origin.entry.index
    ) {
      window.history.go(origin.entry.index - position.index);
    } else {
      // A raw hash assignment or pre-app history entry has no trustworthy index.
      // Replace only that entry; never guess a traversal that could leave the app.
      const entry = { ...newRouteEntry(), route: origin.route };
      replaceRouteEntry(entry);
      accepted.current = { route: origin.route, entry };
    }
  };
  const saveAndLeave = async () => {
    const target = request.current;
    if (!target || busy) return;
    setBusy(true);
    setError("");
    try {
      await target.blocker.save();
      if (request.current !== target || blocker.current !== target.blocker)
        return;
      if (target.blocker.hasChanges())
        throw new Error("まだ保存できていません。もういちど保存してください。");
      commit(target);
    } catch (failure) {
      if (request.current === target) setError(errorMessage(failure));
    } finally {
      if (request.current === target) setBusy(false);
    }
  };
  const discardAndLeave = () => {
    const target = request.current;
    if (!target || target.blocker.isSaving()) return;
    target.blocker.discard();
    commit(target);
  };
  const value = useMemo(
    () => ({ route, blocked: !!pending, register, refresh }),
    [route, pending, register, refresh],
  );
  return (
    <RouteContext.Provider value={value}>
      {children}
      {pending && (
        <Modal title="まだ保存できていない変更があります" onClose={stay}>
          <p>
            作品はこの画面に残っています。保存してから移動するか、ぬりえに戻ってください。
          </p>
          {pending.blocker.isSaving() && (
            <p role="status">
              この端末への保存を待っています。保存が終わるまで変更は破棄できません。
            </p>
          )}
          {!pending.blocker.hasChanges() && (
            <p role="status">変更はこの端末に保存されました。移動できます。</p>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={stay}
            >
              ぬりえにもどる
            </button>
            <button
              className="button"
              type="button"
              disabled={busy}
              onClick={() => {
                void saveAndLeave();
              }}
            >
              保存して移動
            </button>
            <button
              className="button button-danger"
              type="button"
              disabled={busy || pending.blocker.isSaving()}
              onClick={discardAndLeave}
            >
              未保存の変更を破棄して移動
            </button>
          </div>
        </Modal>
      )}
    </RouteContext.Provider>
  );
}

export function useGuardedRoute() {
  const context = useContext(RouteContext);
  if (!context) throw new Error("画面の切り替えを準備できませんでした。");
  return { route: context.route, blocked: context.blocked };
}
/** The registered callback reads synchronous refs, including the very first save. */
export function useNavigationBlocker(value: NavigationBlocker) {
  const context = useContext(RouteContext);
  const latest = useRef(value);
  latest.current = value;
  const register = context?.register;
  useLayoutEffect(
    () =>
      register?.({
        hasChanges: () => latest.current.hasChanges(),
        isSaving: () => latest.current.isSaving(),
        save: () => latest.current.save(),
        discard: () => latest.current.discard(),
      }),
    [register],
  );
  return { enabled: !!context, refresh: context?.refresh ?? noop };
}

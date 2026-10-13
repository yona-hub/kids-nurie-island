const ENTRY_KEY = "__islandRoute";
export interface NavigationSafety {
  route: string | null;
  transitioning: boolean;
  unsaved: boolean;
  saving: boolean;
}
let safetyReader: (() => NavigationSafety) | null = null;
let generation = 0;
export function invalidateNavigation() {
  generation++;
  window.dispatchEvent(new Event("island-navigation-changed"));
}
/** A missing/unmounted router is unsafe. The URL is never the source of display state. */
export function readNavigationSafety(): NavigationSafety & {
  generation: number;
} {
  return {
    ...(safetyReader?.() ?? {
      route: null,
      transitioning: true,
      unsaved: true,
      saving: true,
    }),
    generation,
  };
}
export function navigationAllowsUpdate() {
  const state = readNavigationSafety();
  return (
    state.route === "/home" &&
    !state.transitioning &&
    !state.unsaved &&
    !state.saving
  );
}
export function bindNavigationSafety(reader: () => NavigationSafety) {
  safetyReader = reader;
  invalidateNavigation();
  return () => {
    if (safetyReader !== reader) return;
    safetyReader = null;
    invalidateNavigation();
  };
}
export interface RouteEntry {
  session: string;
  index: number;
  route: string;
}
export const currentRoute = () => window.location.hash.slice(1) || "/home";
export function routeEntry(): RouteEntry | null {
  const value = window.history.state?.[ENTRY_KEY] as
    Partial<RouteEntry> | undefined;
  return value &&
    typeof value.session === "string" &&
    Number.isSafeInteger(value.index) &&
    typeof value.route === "string"
    ? (value as RouteEntry)
    : null;
}
function entryState(entry: RouteEntry) {
  const state: unknown = window.history.state;
  return {
    ...(state && typeof state === "object" ? state : {}),
    [ENTRY_KEY]: entry,
  };
}
export function replaceRouteEntry(entry: RouteEntry) {
  window.history.replaceState(entryState(entry), "", `#${entry.route}`);
}
export function newRouteEntry(): RouteEntry {
  return { session: crypto.randomUUID(), index: 0, route: currentRoute() };
}
/** Stamp app-created entries so cancelling a blocked traversal preserves its history position. */
export function navigate(path: string) {
  if (currentRoute() === path) return;
  const oldURL = window.location.href;
  const before = routeEntry() ?? newRouteEntry();
  window.history.pushState(
    entryState({ ...before, index: before.index + 1, route: path }),
    "",
    `#${path}`,
  );
  window.dispatchEvent(
    new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }),
  );
}

/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import type { WorkboxPlugin } from 'workbox-core/types';
import { CONTENT_ART_CACHE, MANIFEST_CACHE_HEADER, isContentManifest, isImmutableContentAsset, isHomeIllustration } from '../../../packages/content-schema/src/asset-cache';
import { activateRequestedUpdate } from './pwa-activation';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));
// Generated UI art is immutable and fetched only when its control is displayed.
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin &&
    /^\/images\/ui-art-v1\/[a-z-]+-[a-f0-9]{16}\.webp$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'island-ui-illustrations-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 90 * 24 * 60 * 60, purgeOnQuotaError: true })],
  }),
);
// Generated theme illustrations load on demand and remain available offline.
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && isHomeIllustration(url.pathname),
  new CacheFirst({
    cacheName: 'island-home-illustrations-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 36, maxAgeSeconds: 90 * 24 * 60 * 60, purgeOnQuotaError: true })],
  }),
);
const manifestSource: WorkboxPlugin = {
  fetchDidSucceed: async ({ response, state }) => { if (state) state.network = true; return response; },
  handlerWillRespond: async ({ response, state }) => {
    if (state?.network) return response;
    const headers = new Headers(response.headers);
    headers.set(MANIFEST_CACHE_HEADER, 'fallback');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    url.origin === self.location.origin &&
    isContentManifest(url.pathname),
  new NetworkFirst({
    cacheName: "island-catalog-v1",
    networkTimeoutSeconds: 3,
    fetchOptions: { cache: 'no-cache' },
    plugins: [
      manifestSource,
      new ExpirationPlugin({ maxEntries: 3, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);
registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    url.origin === self.location.origin &&
    isImmutableContentAsset(url.pathname),
  new CacheFirst({
    cacheName: CONTENT_ART_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 90,
        maxAgeSeconds: 90 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);
// Older app versions and retired templates may still request a fixed alias.
// Revalidate these mutable URLs; retain the same cache for offline migration.
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && url.pathname.startsWith('/content/'),
  new NetworkFirst({
    cacheName: CONTENT_ART_CACHE,
    networkTimeoutSeconds: 3,
    fetchOptions: { cache: 'no-cache' },
    plugins: [new ExpirationPlugin({ maxEntries: 90, maxAgeSeconds: 90 * 24 * 60 * 60, purgeOnQuotaError: true })],
  }),
);
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type !== 'ISLAND_ACTIVATE_UPDATE') return;
  const sourceId = event.source && 'id' in event.source ? event.source.id : undefined;
  event.waitUntil(activateRequestedUpdate({
    scope: self.registration.scope,
    clients: () => self.clients.matchAll({ type: 'window', includeUncontrolled: true }),
    activate: () => self.skipWaiting(),
  }, sourceId, event.data.requestId, event.ports[0]));
});

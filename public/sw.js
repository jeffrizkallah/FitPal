const CACHE_NAME = "forma-v1";

// App shell — pages and static assets to pre-cache on install
const APP_SHELL = [
  "/",
  "/workout",
  "/nutrition",
  "/advisor",
  "/manifest.json",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - POST requests: always network (never cache mutations)
// - /api/* GET: network-first, fall back to cache for safe read endpoints
// - Everything else: stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache non-GET requests
  if (request.method !== "GET") return;

  // Never intercept chrome-extension or non-http(s) requests
  if (!url.protocol.startsWith("http")) return;

  // API routes: network-first (fresh data matters)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache safe read-only endpoints for offline fallback
          const cacheable = ["/api/nutrition/daily", "/api/workouts/history"];
          if (cacheable.some((p) => url.pathname.startsWith(p)) && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets & pages: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
      return cached ?? networkFetch;
    })
  );
});

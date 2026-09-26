const CACHE_NAME = "bird-lovers-shell-v5-20260926";
const SHELL = ["/manifest.json", "/manus-storage/bird-lovers-group-icon-192_e27a2b60.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

  // Always ask the server for the document and app bundles. Vite/Vercel emits
  // hashed asset names, so caching old HTML is the main source of stale builds.
  const isNavigation = request.mode === "navigate" || request.destination === "document";
  const isApi = new URL(request.url).pathname.startsWith("/api/");
  if (isNavigation || isApi) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});

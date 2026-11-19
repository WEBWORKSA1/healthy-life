/* Healthy.Life service worker: pages you have opened keep working offline.
   Only same-origin GET requests are touched; ads and embeds pass straight through. */
var CACHE = 'healthy-life-v1';

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./offline.html']); }).catch(function () {}));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  function store(res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }
  if (req.mode === 'navigate') {          // pages: fresh first, saved copy if offline
    event.respondWith(fetch(req).then(store).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./offline.html'); });
    }));
  } else if (/\.(css|js|woff2|png|svg|json|webmanifest)$/.test(url.pathname)) {   // assets: saved copy first, refresh behind
    event.respondWith(caches.match(req).then(function (hit) {
      var fresh = fetch(req).then(store).catch(function () { return hit; });
      return hit || fresh;
    }));
  }
});

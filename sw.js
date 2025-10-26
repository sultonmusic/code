
// Service Worker for Streaming Network of Dreams
// This service worker caches core assets and downloaded video files to enable offline viewing.

// Update the cache name whenever the list of core assets changes. Incrementing
// the version string forces older caches to be cleaned up during activation.
const CORE_CACHE = 'snd-core-v2';
const DOWNLOADS_CACHE = 'snd-downloads';

// List of core assets to cache during installation. These assets make up
// the application shell and should exist within the project directory. Do NOT
// include dynamic content (e.g. Firestore documents or HLS video chunks).
// We avoid caching non‑existent files such as films.html, fonts/, or styles.css
// because attempting to fetch them will result in cache errors.  If additional
// pages are added in the future they should be added here.
const CORE_ASSETS = [
  '/',             // root entry point (resolves to index.html in most hosting setups)
  '/index.html',   // main user interface with embedded auth
  '/admin.html',   // admin dashboard shell
  '/support.html', // support chat interface
  '/sw.js',        // service worker itself for updates
  '/firebase-messaging-sw.js', // messaging service worker
  // Add more static assets here as necessary (e.g. '/placeholder_light_gray_block.png')
];

self.addEventListener('install', (event) => {
  // Pre-cache core assets
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.error('Error caching core assets:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up any old caches
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CORE_CACHE, DOWNLOADS_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We only handle GET requests.  Let non-GET requests through to the network.
  if (event.request.method !== 'GET') {
    return;
  }

  const req = event.request;
  const url = new URL(req.url);

  // Handle navigation requests (e.g. when the user navigates to a page).  We
  // perform a network-first strategy so that the latest version of the page is
  // loaded when online.  If the network fails (offline), fall back to the
  // cached page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Stash a copy of the page in the cache for offline use.  We clone
          // the response because responses can only be consumed once.
          const resClone = res.clone();
          caches.open(CORE_CACHE).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => {
          // If the user navigates to a path we don't have cached, default to
          // the root page or the offline page if available.
          return caches.match(req).then((cachedRes) => {
            return (
              cachedRes ||
              caches.match('/offline.html') ||
              caches.match('/')
            );
          });
        })
    );
    return;
  }

  // For all other GET requests (e.g. images, scripts, downloaded videos), we
  // attempt to serve downloaded videos first, then core cached assets, and
  // finally fall back to the network.  This ensures that downloaded video
  // files are playable offline.
  event.respondWith(
    caches.open(DOWNLOADS_CACHE).then((downloadCache) => {
      return downloadCache.match(req).then((cachedResponse) => {
        // If request matches a downloaded file, return it
        if (cachedResponse) {
          return cachedResponse;
        }
        // Otherwise try core cache, then network
        return caches.open(CORE_CACHE).then((coreCache) => {
          return coreCache.match(req).then((coreResponse) => {
            return coreResponse || fetch(req);
          });
        });
      });
    })
  );
});

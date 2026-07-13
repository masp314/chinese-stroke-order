const CACHE_NAME = 'stroke-order-shell-v15'
const SCOPE_URL = new URL('./', self.registration.scope)
const APP_SHELL = [
  SCOPE_URL.href,
  new URL('manifest.webmanifest', SCOPE_URL).href,
  new URL('icons/icon-192-sheng.png', SCOPE_URL).href,
  new URL('icons/icon-512-sheng.png', SCOPE_URL).href,
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  // Network-first for everything: use fresh content when online, cache as fallback for offline
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        const cacheKey = event.request.mode === 'navigate' ? SCOPE_URL.href : event.request
        void caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy))
      }
      return response
    }).catch(() => {
      const cacheKey = event.request.mode === 'navigate' ? SCOPE_URL.href : event.request
      return caches.match(cacheKey)
    }),
  )
})

const CACHE = 'loopsy-compatible-v1';
const FILES = ['./', 'index.html', 'style.css', 'js/app.js', 'js/engine.js', 'js/timing.js', 'js/capture-worklet.js', 'js/wav.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('loopsy-compatible-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => { if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return; event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))); });

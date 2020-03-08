importScripts('/cache-polyfill.js');

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('beerings').then(function(cache) {
      return cache.addAll([
      '/',
      '/index.html',
      '/styles.css',
      '/app.js',
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  // console.log(event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
const CACHE_NAME = "temporada-v1";
const urlsToCache = ["index.html", "style.css", "app.js", "manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  const reqUrl = new URL(event.request.url);

  // Solo interceptamos peticiones a nuestro mismo origen
  if (reqUrl.origin !== location.origin) {
    // Dejamos que el navegador maneje por defecto las peticiones cross‑origin
    return;
  }

  // Para todo lo demás (nuestro sitio), usar cache primero
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
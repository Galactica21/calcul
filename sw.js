// Service worker : l'application s'ouvre sans internet (les taux, eux, demandent une connexion).
const CACHE = "calcul-retraite-v3";
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./icon-512-maskable.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FICHIERS.map((f) => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // les API de taux passent toujours par le reseau
  // fichiers de l'application : cache d'abord, mise a jour en arriere-plan
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((enCache) => {
      const reseau = fetch(req)
        .then((rep) => {
          if (rep && rep.ok) caches.open(CACHE).then((c) => c.put(req, rep.clone()));
          return rep;
        })
        .catch(() => enCache);
      return enCache || reseau;
    })
  );
});

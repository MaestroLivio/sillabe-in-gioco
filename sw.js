/* Service worker — cache offline per l'app Sillabe in Gioco */
const CACHE = "sillabe-v2.2.2";
/* 40 illustrazioni delle frasi + 20 del laboratorio «Formazione di parole» */
const ILLUSTRATIONS = Array.from({ length: 60 }, (_, i) => `./illustrations/${String(i + 1).padStart(2, "0")}.png`);
// Solo l'indice audio si precarica: i singoli clip sono centinaia e vengono
// messi in cache al primo ascolto (vedi la strategia cache-first dei media).
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./audio/manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  ...ILLUSTRATIONS
];

/* I clip audio non cambiano mai per una data versione: si servono subito
   dalla cache e si scaricano solo la prima volta. */
function isAudio(url) {
  return /\/audio\/.*\.mp3$/.test(new URL(url).pathname);
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Rete prima, cache come riserva: l'app resta usabile anche offline.
   I clip audio invece sono immutabili: prima la cache, così il secondo
   ascolto è istantaneo e non consuma rete. */
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  if (isAudio(req.url)) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});

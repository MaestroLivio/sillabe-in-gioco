/* Service worker — cache offline per l'app Sillabe in Gioco */
const CACHE = "sillabe-v2.4.0";
/* 40 frasi + 20 parole + 7 gruppi del percorso sillabico */
const ILLUSTRATIONS = Array.from({ length: 67 }, (_, i) => `./illustrations/${String(i + 1).padStart(2, "0")}.png`);
// Solo l'indice audio si precarica: i singoli clip sono centinaia e vengono
// messi in cache al primo ascolto (vedi la strategia cache-first dei media).
// Eccezione: i 30 fonemi delle lettere. Sono ~84 kB in tutto e servono alle
// prime tessere di «Formazione di parole»: se non fossero in cache, la prima
// lettera toccata resterebbe muta giocando senza rete.
const FONEMI = [
  "a", "e", "e_aperta", "i", "o", "o_aperta", "u",
  "p", "b", "t", "d", "k", "g", "f", "v", "s", "z_sonora_fricativa",
  "m", "n", "gn", "l", "gli", "r", "sc_dolce", "j", "w",
  "z_sorda_affricata", "z_sonora_affricata", "c_dolce", "g_dolce"
].map(id => `./audio/fonemi/${id}.mp3`);
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./audio/manifest.json",
  "./css/viaggio.css",
  "./js/fonemi.js",
  ...FONEMI,
  "./js/viaggio-dati.js",
  "./js/viaggio.js",
  "./illustrations/parole/manifest.json",
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
    caches.open(CACHE).then(async cache => {
      await cache.addAll(ASSETS);
      // Le schede delle parole sono tante ma leggere: si prova a metterle
      // in cache una per una, senza far fallire l'installazione se una manca.
      try {
        const res = await fetch("./illustrations/parole/manifest.json");
        if (res.ok) {
          const m = await res.json();
          const cards = (m.items || []).map(x => "./" + x.file);
          await Promise.all(cards.map(c => cache.add(c).catch(() => {})));
        }
      } catch (e) { /* la cache lazy coprirà le schede al primo uso */ }
    }).then(() => self.skipWaiting())
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

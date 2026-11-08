#!/usr/bin/env node
/**
 * Impacchetta la versione web/PWA e l'estensione per ChromeOS.
 *
 * Output:
 *   dist/web/       → sito statico installabile come PWA (ChromeOS, Chromebook, browser)
 *   dist/chromeos/  → estensione Chrome non pacchettizzata (caricabile da chrome://extensions)
 *   dist/SillabeInGioco-ChromeOS-v<ver>.zip → estensione pronta per la distribuzione
 *   dist/sillabe-web-v<ver>.zip             → pacchetto PWA statico
 *
 * Uso: node scripts/package-web.js
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const pkg = require(path.join(ROOT, "package.json"));
const VERSION = pkg.version;

function copy(file, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, file), path.join(destDir, path.basename(file)));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(path.join(ROOT, src), { withFileTypes: true })) {
    const from = path.join(ROOT, src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(path.join(src, entry.name), to);
    else fs.copyFileSync(from, to);
  }
}

function zip(dir, outName) {
  const out = path.join(DIST, outName);
  fs.rmSync(out, { force: true });
  try {
    execFileSync("zip", ["-rq", out, "."], { cwd: dir });
    console.log("✔ " + path.relative(ROOT, out));
  } catch (e) {
    console.warn("! zip non disponibile, pacchetto non creato:", outName);
  }
}

/* ---------- 1. PWA / web ---------- */
const web = path.join(DIST, "web");
fs.rmSync(web, { recursive: true, force: true });
fs.mkdirSync(web, { recursive: true });

["index.html", "manifest.webmanifest", "sw.js", "favicon.png", "LICENSE"].forEach(f => {
  if (fs.existsSync(path.join(ROOT, f))) copy(f, web);
});
copyDir("icons", path.join(web, "icons"));
copyDir("illustrations", path.join(web, "illustrations"));
copyDir("audio", path.join(web, "audio"));
copyDir("css", path.join(web, "css"));
copyDir("js", path.join(web, "js"));

/* manifest specifico per il web: start_url relativo alla cartella */
const webManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));
webManifest.start_url = "./index.html";
fs.writeFileSync(path.join(web, "manifest.webmanifest"), JSON.stringify(webManifest, null, 2));

fs.writeFileSync(path.join(web, "README.txt"),
`SILLABE IN GIOCO ${VERSION} — versione web / PWA

Come usarla:
1. Pubblica questa cartella su qualsiasi hosting statico (HTTPS obbligatorio per l'installazione PWA).
2. Apri index.html con Chrome o Edge.
3. Menu del browser → "Installa app" (o icona di installazione nella barra degli indirizzi).

Su Chromebook / ChromeOS:
- La stessa cartella funziona come web app installabile dal Launcher.
- In alternativa usa l'estensione in dist/chromeos (caricamento non pacchettizzato)
  oppure il pacchetto .crx/.zip pubblicato sul Chrome Web Store.

Note:
- Funziona anche offline dopo il primo caricamento (service worker).
- Non richiede server, database, account.
- La sintesi vocale usa le voci italiane installate nel sistema.

Licenza CC BY 4.0 — Copyright © 2026 Livio Luppino
`);

console.log("✔ dist/web");

/* ---------- 2. Estensione ChromeOS ---------- */
const chr = path.join(DIST, "chromeos");
fs.rmSync(chr, { recursive: true, force: true });
fs.mkdirSync(chr, { recursive: true });

copy("index.html", chr);
copy("LICENSE", chr);
copyDir("icons", path.join(chr, "icons"));
copyDir("illustrations", path.join(chr, "illustrations"));
copyDir("audio", path.join(chr, "audio"));
copyDir("css", path.join(chr, "css"));
copyDir("js", path.join(chr, "js"));

/* manifest dell'estensione: aggiunge le risorse web accessibili */
const extManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "chromeos", "manifest.json"), "utf8"));
extManifest.version = VERSION;
extManifest.web_accessible_resources = [{
  resources: ["index.html", "icons/*", "illustrations/*", "illustrations/parole/*", "audio/*", "audio/*/*", "css/*", "js/*"],
  matches: ["<all_urls>"]
}];
fs.writeFileSync(path.join(chr, "manifest.json"), JSON.stringify(extManifest, null, 2));
fs.copyFileSync(path.join(ROOT, "chromeos", "background.js"), path.join(chr, "background.js"));

fs.writeFileSync(path.join(chr, "README.txt"),
`SILLABE IN GIOCO ${VERSION} — app per ChromeOS / Chrome

Installazione come estensione (modalità sviluppatore):
1. Apri chrome://extensions
2. Attiva "Modalità sviluppatore" (in alto a destra)
3. Premi "Carica estensione non pacchettizzata" e scegli questa cartella
4. L'app si apre in una finestra dedicata e appare nel Launcher di ChromeOS

Pubblicazione sul Chrome Web Store:
1. Comprimi questa cartella in un file ZIP (o usa dist/SillabeInGioco-ChromeOS-v${VERSION}.zip)
2. Carica lo ZIP nella Chrome Web Store Developer Dashboard
3. Compila la scheda, le motivazioni dei permessi (solo "storage") e la privacy policy

Licenza CC BY 4.0 — Copyright © 2026 Livio Luppino
`);

console.log("✔ dist/chromeos");

zip(web, `sillabe-web-v${VERSION}.zip`);
zip(chr, `SillabeInGioco-ChromeOS-v${VERSION}.zip`);

console.log("\nPacchetti web/ChromeOS pronti in dist/");

#!/usr/bin/env node
"use strict";
/**
 * Genera "aggiornamento.json", il manifest letto dall'app per sapere se c'è
 * una versione nuova.
 *
 * Perché un file allegato alla release invece dell'API di GitHub: l'API REST
 * consente 60 richieste l'ora per indirizzo IP, e in una scuola tutte le
 * macchine escono dallo stesso router. Il file allegato si legge da
 * /releases/latest/download/aggiornamento.json, non ha limiti e non chiede
 * autenticazione.
 *
 * Uso:  node scripts/make-update-manifest.js [cartella-dist]
 * Output: <cartella-dist>/aggiornamento.json
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DIST = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "dist");
const pkg = require(path.join(ROOT, "package.json"));
const VERSION = pkg.version;

/* Nomi attesi. Attenzione: actions/upload-artifact di GitHub sostituisce gli
   spazi con i punti, quindi lo stesso DMG si chiama "Sillabe in Gioco-2.2.6.dmg"
   in locale ma "Sillabe.in.Gioco-2.2.6.dmg" nella release. Invece di indovinare
   si cerca il file che combacia con l'espressione, e nel manifest finisce il
   nome vero trovato sul disco: è quello che l'app userà per scaricare. */
const TARGETS = [
  { key: "darwin-arm64", re: new RegExp(`^Sillabe[ .]in[ .]Gioco-${escapeRe(VERSION)}-arm64\\.dmg$`) },
  { key: "darwin-x64", re: new RegExp(`^Sillabe[ .]in[ .]Gioco-${escapeRe(VERSION)}\\.dmg$`) },
  { key: "win32-x64", re: new RegExp(`^SillabeInGioco-Setup-${escapeRe(VERSION)}\\.exe$`) },
  { key: "linux-x64", re: new RegExp(`^SillabeInGioco-${escapeRe(VERSION)}\\.AppImage$`) }
];

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Un nome con caratteri strani finirebbe in un URL: si accettano solo quelli
   che GitHub può servire senza sorprese. */
function isSafeName(name) {
  return /^[A-Za-z0-9 ._\-()]+$/.test(name) && !name.includes("..");
}

function sha256(file) {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let read;
    while ((read = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
      hash.update(buffer.subarray(0, read));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest("hex");
}

const pacchetti = {};
const mancanti = [];
const presenti = fs.existsSync(DIST) ? fs.readdirSync(DIST) : [];

for (const t of TARGETS) {
  const nome = presenti.find(n => t.re.test(n) && isSafeName(n));
  if (!nome) {
    mancanti.push(t.key);
    continue;
  }
  const full = path.join(DIST, nome);
  const stat = fs.statSync(full);
  if (!stat.isFile() || stat.size === 0) {
    mancanti.push(t.key);
    continue;
  }
  pacchetti[t.key] = {
    file: nome,
    byte: stat.size,
    sha256: sha256(full)
  };
  console.log(`  ✔ ${t.key.padEnd(13)} ${nome} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

if (!Object.keys(pacchetti).length) {
  console.error("\n✘ Nessun pacchetto trovato in " + DIST);
  console.error("  Genera prima le build, oppure passa la cartella giusta come argomento.\n");
  process.exit(1);
}

/* Se manca un pacchetto la release è incompleta: lo si dice, ma non si
   blocca la pubblicazione — chi usa quel sistema vedrà il messaggio
   «scarica dalla pagina delle release». */
if (mancanti.length) {
  console.log("\n  ! pacchetti non trovati (la release sarà incompleta per questi sistemi):");
  mancanti.forEach(k => console.log("    - " + k));
}

const manifest = {
  version: VERSION,
  data: new Date().toISOString(),
  pacchetti
};

const out = path.join(DIST, "aggiornamento.json");
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`\n✔ ${path.relative(ROOT, out)} — versione ${VERSION}, ${Object.keys(pacchetti).length} pacchetti\n`);

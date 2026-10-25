#!/usr/bin/env node
/**
 * Verifica i file audio dell'app.
 *
 * Controlla che:
 *  1. il manifest audio esista ed elenchi i quattro gruppi;
 *  2. ogni voce del manifest punti a un file realmente presente;
 *  3. ogni sillaba dei livelli abbia il proprio clip (inclusi i distrattori);
 *  4. ogni frase e ogni parola degli esercizi abbiano il clip;
 *  5. i file non siano vuoti e abbiano una durata plausibile;
 *  6. nessun file sia orfano (presente su disco ma fuori dal manifest).
 *
 * Uso: node scripts/audio/verify.js
 * Esce con codice 1 se qualcosa non torna.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const AUDIO = path.join(ROOT, "audio");
const MANIFEST = path.join(AUDIO, "manifest.json");
const data = require("./extract");

const errors = [];
const warnings = [];
const fail = m => errors.push(m);
const warn = m => warnings.push(m);

/* --- 1. manifest --- */
if (!fs.existsSync(MANIFEST)) {
  console.error("✘ audio/manifest.json assente: esegui `npm run audio`");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
for (const g of ["syl", "parole", "frasi", "ui"]) {
  if (!manifest.groups || !manifest.groups[g]) fail(`gruppo «${g}» assente dal manifest`);
}
if (manifest.voice !== "Emma") warn(`voce del manifest: ${manifest.voice} (attesa «Emma», neurale)`);

/* --- 2. durata di un MP3 --- */
function duration(file) {
  try {
    // afinfo è macOS; altrove si ripiega su ffprobe
    if (process.platform === "darwin") {
      const out = execFileSync("afinfo", [file], { stdio: ["ignore", "pipe", "ignore"] }).toString();
      const m = out.match(/estimated duration:\s*([\d.]+)/);
      return m ? +m[1] : null;
    }
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", file], { stdio: ["ignore", "pipe", "ignore"] }).toString();
    return parseFloat(out.trim());
  } catch (e) { return null; }
}

/* --- 3. ogni voce del manifest ha il suo file --- */
const referenced = new Set();
let checked = 0;
for (const [group, entries] of Object.entries(manifest.groups)) {
  for (const [key, info] of Object.entries(entries)) {
    if (!info || !info.file) { fail(`${group}/«${key}»: voce senza percorso`); continue; }
    const abs = path.join(ROOT, info.file);
    referenced.add(path.resolve(abs));
    if (!fs.existsSync(abs)) { fail(`${group}/«${key}»: file mancante ${info.file}`); continue; }
    const size = fs.statSync(abs).size;
    if (size < 800) { fail(`${group}/«${key}»: file troppo piccolo (${size} B), probabile audio vuoto`); continue; }
    const dur = duration(abs);
    if (dur === null) { fail(`${group}/«${key}»: durata illeggibile`); continue; }
    if (dur < 0.12) fail(`${group}/«${key}»: durata ${dur.toFixed(2)}s troppo breve, sillaba troncata`);
    if (group === "syl" && dur > 2.2) fail(`${group}/«${key}»: durata ${dur.toFixed(2)}s sospetta (compitata?)`);
    if (group === "frasi" && dur < 0.6) fail(`${group}/«${key}»: frase troppo breve (${dur.toFixed(2)}s)`);
    checked++;
  }
}

/* --- 4. copertura del contenuto dell'app --- */
function missingKeys(group, keys) {
  const g = manifest.groups[group] || {};
  return keys.filter(k => !g[k]);
}

const missSyl = missingKeys("syl", data.syllables);
if (missSyl.length) fail(`sillabe senza clip (${missSyl.length}): ${missSyl.join(", ")}`);

const missFrasi = missingKeys("frasi", data.sentences.map((_, i) => String(i + 1)));
if (missFrasi.length) fail(`frasi senza clip: ${missFrasi.join(", ")}`);

const missParole = missingKeys("parole", data.words);
if (missParole.length) fail(`parole senza clip (${missParole.length}): ${missParole.join(", ")}`);

const missUi = missingKeys("ui", data.uiSource);
if (missUi.length) fail(`battute interfaccia senza clip: ${missUi.join(", ")}`);

/* --- 5. file orfani --- */
const onDisk = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith(".mp3")) onDisk.push(path.resolve(p));
  }
})(AUDIO);
const orphans = onDisk.filter(p => !referenced.has(p));
if (orphans.length) warn(`file non indicizzati nel manifest: ${orphans.length}`);

/* --- 6. lo script non deve più compitare: controllo di forma --- */
// una sillaba di 1-3 lettere non deve durare come tre lettere compitate
for (const tok of data.syllables) {
  const info = (manifest.groups.syl || {})[tok];
  if (!info) continue;
  const abs = path.join(ROOT, info.file);
  if (!fs.existsSync(abs)) continue;
  const dur = duration(abs);
  if (dur && /^[a-zàèéìòù]{1,3}$/.test(tok) && dur > 1.6) {
    fail(`sillaba «${tok}»: ${dur.toFixed(2)}s, sembra compitata lettera per lettera`);
  }
}

/* --- 7. i nomi dei file devono essere portabili su Windows ---
   Git non riesce a fare il checkout di un file chiamato `con.mp3`: CON è un
   nome di dispositivo riservato e la build Windows fallisce con
   "invalid path". Il controllo blocca il problema prima del push. */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const BAD_CHARS = /[<>:"\\|?*\u0000-\u001f]/;
const seenLower = new Map();
for (const abs of onDisk) {
  const base = path.basename(abs);
  const stem = base.replace(/\.mp3$/i, "");
  const dir = path.basename(path.dirname(abs));
  if (RESERVED.test(stem)) fail(`${dir}/${base}: nome riservato di Windows (CON, PRN, AUX, NUL, COM1-9, LPT1-9)`);
  if (BAD_CHARS.test(base)) fail(`${dir}/${base}: carattere non ammesso su Windows`);
  if (/[. ]$/.test(stem)) fail(`${dir}/${base}: nome che termina con punto o spazio`);
  const key = `${dir}/${base}`.toLowerCase();
  if (seenLower.has(key)) fail(`${dir}: nomi che differiscono solo per maiuscole (${base}, ${seenLower.get(key)})`);
  seenLower.set(key, base);
}

/* --- esito --- */
for (const w of warnings) console.warn("! " + w);
if (errors.length) {
  console.error(`\n✘ ${errors.length} problemi audio:`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✔ audio: ${checked} clip verificati (${data.syllables.length} sillabe, ${data.sentences.length} frasi, ${data.words.length} parole, ${data.uiSource.length} battute)`);

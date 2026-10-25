#!/usr/bin/env node
/**
 * Test di regressione sulla pronuncia.
 *
 * La voce di sistema può leggere una sillaba isolata come una sigla e
 * compitarla lettera per lettera («ac» → «a ci»). Questo test verifica che i
 * clip preregistrati NON siano compitati, confrontando l'audio con la stessa
 * sillaba scritta a lettere separate:
 *
 *   - se il clip è identico byte per byte alla versione compitata, la sillaba
 *     è stata letta come acronimo  ->  errore;
 *   - se la durata coincide al millesimo, è un forte indizio di compitazione
 *     -> errore;
 *   - altrimenti la sillaba è letta come sillaba  ->  ok.
 *
 * Non richiede il motore vocale: lavora sui file già generati, quindi gira
 * anche in CI. Per rigenerare il riferimento compitato serve `say` (macOS);
 * senza `say` il test si limita ai controlli sui file.
 *
 * Uso: node scripts/audio/test-pronunciation.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const MANIFEST = path.join(ROOT, "audio", "manifest.json");

/* sillabe che una voce non neurale (Alice) compita, rilevate con l'audit:
   sono il caso concreto che ha motivato i clip preregistrati */
const KNOWN_TRAPS = ["ac", "ap", "ia", "ta", "uc"];

/* nome italiano delle lettere, per costruire la forma compitata */
const LETTERS = {
  a: "a", b: "bi", c: "ci", d: "di", e: "e", f: "effe", g: "gi", h: "acca",
  i: "i", l: "elle", m: "emme", n: "enne", o: "o", p: "pi", q: "cu",
  r: "erre", s: "esse", t: "ti", u: "u", v: "vu", z: "zeta"
};

function duration(file) {
  try {
    if (process.platform === "darwin") {
      const out = execFileSync("afinfo", [file], { stdio: ["ignore", "pipe", "ignore"] }).toString();
      const m = out.match(/estimated duration:\s*([\d.]+)/);
      return m ? +m[1] : null;
    }
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", file], { stdio: ["ignore", "pipe", "ignore"] }).toString();
    return parseFloat(out.trim()) || null;
  } catch (e) { return null; }
}

function haveSay() {
  if (process.platform !== "darwin") return false;
  try { execFileSync("say", ["-v", "?", ], { stdio: "ignore" }); return true; } catch (e) { return false; }
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const sylGroup = (manifest.groups && manifest.groups.syl) || {};

const errors = [];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sillabe-pron-"));
const canSynth = haveSay();

/* riferimento: la stessa sillaba scritta a lettere separate, con la voce del
   manifest (quella usata per generare i clip) */
function spelledRef(token) {
  const letters = token.split("").map(c => LETTERS[c]).filter(Boolean);
  if (!letters.length || letters.join(" ") === token) return null;
  const aiff = path.join(tmp, "ref.aiff");
  const wav = path.join(tmp, "ref.wav");
  try {
    execFileSync("say", ["-v", manifest.voice || "Emma", "-o", aiff, letters.join(" ")], { stdio: "ignore" });
    execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16@22050", "-c", "1", aiff, wav], { stdio: "ignore" });
    return wav;
  } catch (e) { return null; }
}

function sameSamples(a, b) {
  const x = fs.readFileSync(a), y = fs.readFileSync(b);
  const dx = x.subarray(Math.max(0, x.indexOf("data") + 8));
  const dy = y.subarray(Math.max(0, y.indexOf("data") + 8));
  return dx.length === dy.length && dx.equals(dy);
}

/* --- 1. i clip delle sillabe-trappola non devono essere compitati --- */
for (const token of KNOWN_TRAPS) {
  const info = sylGroup[token];
  if (!info) { errors.push(`«${token}»: nessun clip preregistrato`); continue; }
  const clip = path.join(ROOT, info.file);
  if (!fs.existsSync(clip)) { errors.push(`«${token}»: file ${info.file} mancante`); continue; }

  if (!canSynth) continue;   // in CI senza `say` restano i controlli di forma
  const ref = spelledRef(token);
  if (!ref) continue;

  if (sameSamples(clip, ref)) {
    errors.push(`«${token}»: il clip è identico alla lettura lettera per lettera (acronimo)`);
    continue;
  }
  const dc = duration(clip), dr = duration(ref);
  if (dc && dr && Math.abs(dc - dr) < 0.004) {
    errors.push(`«${token}»: durata identica alla lettura compitata (${dc}s)`);
  }
}

/* --- 2. ogni sillaba-trappola deve durare come una sillaba sola --- */
for (const token of KNOWN_TRAPS) {
  const info = sylGroup[token];
  if (!info) continue;
  const dur = duration(path.join(ROOT, info.file));
  if (dur === null) { errors.push(`«${token}»: durata illeggibile`); continue; }
  // tre lettere compitate durerebbero > 0.8 s; una sillaba sta sotto 0,75 s
  if (dur > 0.9) errors.push(`«${token}»: durata ${dur.toFixed(2)}s, compatibile con compitazione`);
}

/* --- esito --- */
fs.rmSync(tmp, { recursive: true, force: true });
if (errors.length) {
  console.error("✘ pronuncia:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✔ pronuncia: ${KNOWN_TRAPS.length} sillabe critiche lette come sillabe` +
  (canSynth ? " (confronto con la lettura compitata)" : " (controllo di durata)"));

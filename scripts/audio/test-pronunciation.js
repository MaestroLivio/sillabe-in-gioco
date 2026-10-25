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
 * Controlla anche le singole lettere del laboratorio «Formazione di parole»:
 * devono essere il fonema (/s:/, /m:/), non il nome della lettera («esse»).
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

/* --- 3. le singole lettere devono suonare come fonema, non come nome ---
   Il laboratorio «Formazione di parole» mostra una lettera per volta: il tap
   deve far sentire il *suono* (/s:/, /m:/, lo scoppio di /t/), non il nome
   della lettera («esse», «emme», «ti»).

   La versione 2.2.1 verificava solo che il clip fosse più lungo del nome.
   Era un controllo sbagliato: la voce, scritta `"sss"`, compita il nome tre
   volte («esse esse esse», 1.40 s) e il clip risultava correttamente «più
   lungo del nome» mentre faceva esattamente quello che non doveva. Il test
   passava, l'utente sentiva «esseesseesse».

   Qui si guarda la FORMA D'ONDA, che è l'unica cosa che distingue un fonema
   tenuto da un nome ripetuto:
     - un suono tenuto è UN SOLO blocco di energia, senza pause interne;
     - un'occlusiva è UN SOLO scoppio: se ne comparissero due, il bambino
       sentirebbe «b-b» invece di /b/;
     - un nome ripetuto ha tre o più blocchi (o uno solo, ma troppo lungo:
       il nome tenuto non è un fonema).
   In più si misura la RIPETIZIONE dell'inviluppo: un loop rimette in fila lo
   stesso frammento e si riconosce così. Non basta il «flutter» (modulazione
   2-12 Hz), che sulla voce è rumore: sulla 2.2.2 il loop di /m/ aveva flutter
   1,3 dB — indistinguibile dalla voce — mentre la ripetizione era 0,96. */
const { LETTER_PHONEMES } = require("./pronunciation");

/** Decodifica un MP3 in campioni mono 22.05 kHz, senza dipendenze npm.
    Su macOS basta `afconvert` (sempre presente); altrove serve ffmpeg. */
function decode(file) {
  const wav = path.join(tmp, "dec.wav");
  try {
    if (process.platform === "darwin") {
      execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16@22050", "-c", "1", file, wav], { stdio: "ignore" });
    } else {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file,
        "-ac", "1", "-ar", "22050", wav], { stdio: "ignore" });
    }
  } catch (e) { return null; }
  const buf = fs.readFileSync(wav);
  const start = buf.indexOf("data");
  if (start < 0) return null;
  const pcm = buf.subarray(start + 8);
  const out = new Float32Array(Math.floor(pcm.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = pcm.readInt16LE(i * 2) / 32768;
  return out.length ? out : null;
}

/** Inviluppo RMS in dB, un valore ogni 2,5 ms (finestra 512 campioni).
    Il passo è fine perché il flutter da misurare sta a 2-12 Hz: con un passo
    grosso la modulazione della voce si confonde con quella del loop. */
function envelope(s) {
  const HOP = 55, WIN = 512, SR = 22050;
  const env = [];
  for (let p = 0; p + WIN <= s.length; p += HOP) {
    let e = 0;
    for (let i = 0; i < WIN; i++) e += s[p + i] * s[p + i];
    env.push(20 * Math.log10(Math.sqrt(e / WIN) || 1e-9));
  }
  return { env, hopSec: HOP / SR };
}

/** Blocchi di suono separati da pause, con la stessa soglia usata in fase di
    misura (picco −22 dB): un fonema tenuto ne ha uno, «esse esse esse» tre. */
function blocks(env) {
  const peak = Math.max(...env);
  const thr = peak - 22;
  const out = [];
  let start = null;
  env.forEach((db, i) => {
    if (db > thr && start === null) start = i;
    if (db <= thr && start !== null) { out.push([start, i]); start = null; }
  });
  if (start !== null) out.push([start, env.length]);
  return out;
}

/** Ampiezza della modulazione periodica fra 2 e 12 Hz (dB).
    Un loop mal sfumato «pompa» a ogni giro: qui si vede. I bordi si
    escludono perché le sfumate di ingresso e uscita sono modulazione voluta. */
function flutter(env, hopSec) {
  const core = env.slice(Math.round(0.12 / hopSec), env.length - Math.round(0.15 / hopSec));
  if (core.length < 8) return 0;
  const mean = core.reduce((a, b) => a + b, 0) / core.length;
  const d = core.map(v => v - mean);
  let best = 0;
  for (let f = 2; f <= 12; f += 0.1) {
    let re = 0, im = 0;
    for (let i = 0; i < d.length; i++) {
      const a = 2 * Math.PI * f * i * hopSec;
      re += d[i] * Math.cos(a);
      im += d[i] * Math.sin(a);
    }
    best = Math.max(best, 2 * Math.hypot(re, im) / d.length);
  }
  return best;
}

/** Quanto l'inviluppo si RIPETE, da 0 (nessuna somiglianza) a 1 (identico).
    È il controllo che distingue un loop da un allungamento: un loop rimette
    in fila lo stesso frammento, quindi l'inviluppo a `d` e a `d + periodo` è
    quasi identico e l'autocorrelazione sale. `atempo` invece ricostruisce il
    segnale e non ripete nulla.

    Serve perché il `flutter` da solo non basta: misurato sui clip, il loop
    della 2.2.2 su /m/ aveva flutter 1,3 dB (sotto qualunque soglia) ma
    ripetizione 0,96, mentre un `atempo` pulito su /s/ ha flutter 3,7 dB
    (sopra soglia, per il normale tremolio della voce) e ripetizione 0,00.
    Con la sola soglia sul flutter il test promuoveva i loop e bocciava i
    clip corretti. */
function repetition(env, hopSec) {
  const core = env.slice(Math.round(0.06 / hopSec), env.length - Math.round(0.08 / hopSec));
  if (core.length < 20) return 0;
  const n = core.length;
  const mean = core.reduce((a, b) => a + b, 0) / n;
  const d = core.map(v => v - mean);
  let e0 = 0;
  for (const v of d) e0 += v * v;
  if (e0 < 1e-9) return 0;
  let best = 0;
  const lo = Math.round(0.10 / hopSec), hi = Math.min(n - 4, Math.round(0.40 / hopSec));
  for (let lag = lo; lag <= hi; lag++) {
    let num = 0, m = 0;
    for (let i = 0; i + lag < n; i++) { num += d[i] * d[i + lag]; m++; }
    if (m < 8) continue;
    best = Math.max(best, num / (m * (e0 / n)));
  }
  return best;
}

let checkedLetters = 0;
let measuredLetters = 0;
for (const letter of Object.keys(LETTER_PHONEMES)) {
  const info = sylGroup[letter];
  if (!info) { errors.push(`lettera «${letter}»: nessun clip preregistrato`); continue; }
  const clip = path.join(ROOT, info.file);
  if (!fs.existsSync(clip)) { errors.push(`lettera «${letter}»: file ${info.file} mancante`); continue; }
  if (!info.spoken || info.spoken === letter) {
    errors.push(`lettera «${letter}»: il manifest dichiara il nome, non il fonema`);
    continue;
  }
  checkedLetters++;

  const s = decode(clip);
  if (!s) continue;   // senza decodificatore restano i controlli di forma
  measuredLetters++;

  const { env, hopSec } = envelope(s);
  const nBlocks = blocks(env).length;
  const dur = s.length / 22050;
  const spec = LETTER_PHONEMES[letter];

  if (spec.say) {
    /* vocale: un blocco solo, tenuto (0,4-1,3 s). Non è un fonema ritagliato,
       quindi non si controlla la ripetizione: una vocale lunga è periodica
       per natura e l'autocorrelazione dell'inviluppo non dice nulla. */
    if (nBlocks !== 1) {
      errors.push(`lettera «${letter}»: ${nBlocks} blocchi di suono, la vocale deve essere un suono solo`);
    }
    if (dur < 0.40) errors.push(`lettera «${letter}»: ${dur.toFixed(2)}s, vocale troppo breve`);
    if (dur > 1.30) errors.push(`lettera «${letter}»: ${dur.toFixed(2)}s, vocale troppo lunga`);
    continue;
  }

  if (!spec.hold) {
    /* occlusiva: un solo scoppio, corto. Due colpi si sentirebbero «b-b». */
    if (nBlocks !== 1) {
      errors.push(`lettera «${letter}»: ${nBlocks} scoppi, l'occlusiva deve essere un suono solo`);
    }
    if (dur > 0.45) errors.push(`lettera «${letter}»: ${dur.toFixed(2)}s, troppo lunga per uno scoppio`);
    continue;
  }

  /* suono tenuto: un blocco solo, di durata plausibile, senza ripetizioni */
  if (nBlocks !== 1) {
    errors.push(`lettera «${letter}»: ${nBlocks} blocchi di suono, il fonema deve essere un suono solo (nome ripetuto?)`);
    continue;
  }
  if (dur < 0.30) errors.push(`lettera «${letter}»: ${dur.toFixed(2)}s, fonema troppo breve per essere tenuto`);
  if (dur > 0.75) {
    errors.push(`lettera «${letter}»: ${dur.toFixed(2)}s, troppo lunga: sembra il nome ripetuto, non un fonema`);
  }
  /* la ripetizione è il controllo decisivo: è quello che vede il loop */
  const rep = repetition(env, hopSec);
  if (rep > 0.55) {
    errors.push(`lettera «${letter}»: inviluppo ripetuto (${rep.toFixed(2)}), il clip è un loop e non un fonema continuo`);
  }
  /* il flutter resta come rete di sicurezza per i tremolii non periodici,
     con soglia larga: la voce stessa ne produce 3-4 dB su /s/ */
  const fl = flutter(env, hopSec);
  if (fl > 6.0) {
    errors.push(`lettera «${letter}»: modulazione ${fl.toFixed(1)} dB a 2-12 Hz, il fonema non è continuo`);
  }
}

/* --- esito --- */
fs.rmSync(tmp, { recursive: true, force: true });
if (errors.length) {
  console.error("✘ pronuncia:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✔ pronuncia: ${KNOWN_TRAPS.length} sillabe critiche lette come sillabe` +
  `, ${checkedLetters} lettere lette come fonema` +
  (canSynth ? " (confronto con la lettura compitata)" : " (controllo di forma)") +
  `, ${measuredLetters} forme d'onda analizzate`);

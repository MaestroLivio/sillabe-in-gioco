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
   In più si misura la STABILITÀ DELL'ALTEZZA (vedi `f0Sd`): una vocale
   costruita con la lettera ripetuta porta una grande arcata di intonazione,
   che si sente come tremolio, e lì si vede. */
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

/** Stabilità dell'altezza della voce (Hz): deviazione standard della F0
    misurata su frame da 40 ms con passo 10 ms, solo dove il segnale è
    periodico (chiarezza ≥ 0,5) e sopra il 20 % del picco.

    È il controllo che vede l'ARCATA DI INTONAZIONE, cioè il difetto che
    l'utente sentiva come tremolio sulle vocali. La 2.2.4 costruiva le vocali
    con la lettera ripetuta (`"aaaaaa"`), e quella stringa non dà una vocale
    tenuta: la voce ci disegna sopra una grande arcata (misurato: 202 → 315 →
    202 Hz, deviazione 45 Hz). Ritagliando un tratto a F0 ferma e rallentandolo
    con `atempo` la deviazione scende sotto 5 Hz.

    Misurato sui clip veri: vecchie vocali 20-45 Hz, nuove 0,9-4,8 Hz,
    continue 2,9-5,6 Hz. Soglia 12 Hz, cioè il doppio delle continue peggiori
    e metà della vecchia vocale meno sbilanciata.

    Perché NON si usa più la ripetizione dell'inviluppo: su un suono
    stazionario — che è il risultato voluto — la varianza dell'inviluppo è
    quasi nulla e l'autocorrelazione non misura niente; con la
    normalizzazione corretta dava 0,89-1,02 su vocali buone, con quella
    sbagliata 0,96 su un loop vero e 0,00 su un `atempo` pulito, ma anche
    0,47 sulla correlazione di forma d'onda di un clip corretto. Non separava
    i due casi in modo affidabile, quindi è stata tolta. */
function f0Sd(s) {
  const SR = 22050, W = Math.round(0.04 * SR), step = Math.round(0.01 * SR);
  const frames = [];
  let peak = 0;
  for (let i = 0; i + W <= s.length; i += step) {
    let e = 0;
    for (let j = i; j < i + W; j++) e += s[j] * s[j];
    const rms = Math.sqrt(e / W);
    peak = Math.max(peak, rms);
    frames.push({ i, e, rms });
  }
  const out = [];
  for (const f of frames) {
    if (f.rms < peak * 0.2) continue;
    let best = 0, lag0 = 0;
    for (let lag = Math.round(SR / 400); lag <= Math.round(SR / 70); lag++) {
      let c = 0, e1 = 0;
      for (let j = f.i; j + lag < f.i + W; j++) { c += s[j] * s[j + lag]; e1 += s[j + lag] * s[j + lag]; }
      const n = c / Math.sqrt(f.e * e1 || 1);
      if (n > best) { best = n; lag0 = lag; }
    }
    if (best >= 0.5 && lag0) out.push(SR / lag0);
  }
  if (out.length < 6) return null;
  const m = out.reduce((a, b) => a + b, 0) / out.length;
  return Math.sqrt(out.reduce((a, b) => a + (b - m) ** 2, 0) / out.length);
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
  /* l'altezza della voce deve stare ferma: è il controllo che vede l'arcata
     di intonazione, il difetto che si sente come tremolio (vedi f0Sd).
     /r/ è esclusa: è un trillo, cioè un'interruzione periodica della voce,
     e il misuratore di altezza su un trillo non misura l'intonazione
     (deviazione 42 Hz anche sul clip corretto). */
  const sd = letter === "r" ? null : f0Sd(s);
  if (sd !== null && sd > 12) {
    errors.push(`lettera «${letter}»: altezza della voce che si muove (deviazione ${sd.toFixed(1)} Hz),` +
      ` è un'arcata di intonazione e si sente come tremolio`);
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

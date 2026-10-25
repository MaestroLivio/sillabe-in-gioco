#!/usr/bin/env node
/**
 * Genera i file audio dell'app con una voce neurale italiana.
 *
 * Per ogni token/frase:
 *   1. si sceglie la forma grafemica da pronunciare (pronunciation.js),
 *   2. si sintetizza con `say` (voce neurale "Emma Premium"),
 *   3. si normalizza il volume e si codifica in MP3 mono 32 kbps
 *      (un file per sillaba pesa ~2 kB: 230 file restano sotto 1 MB),
 *   4. si annota nel manifest la durata reale del file.
 *
 * È necessario macOS: usa `say`, `afconvert` e `afinfo`.
 *
 * Uso:
 *   node scripts/audio/build.js            genera tutto
 *   node scripts/audio/build.js --only=syl rigenera solo le sillabe
 *   node scripts/audio/build.js --missing  genera solo i clip assenti
 *   node scripts/audio/build.js --check    verifica senza scrivere
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const { syllables, sentences, words, uiSource } = require("./extract");
const { OVERRIDES, LETTER_PHONEMES, LETTER_RATE, PHONEME_GAP } = require("./pronunciation");

const ROOT = path.join(__dirname, "..", "..");
const AUDIO = path.join(ROOT, "audio");
const VOICE = "Emma";            // voce neurale it-IT ("Emma (Premium)")
const RATE = 165;                // parole al minuto: ritmo da maestra, non da sintesi
const MP3_KBPS = 32;

const args = process.argv.slice(2);
const only = (args.find(a => a.startsWith("--only=")) || "").split("=")[1] || "all";
const checkOnly = args.includes("--check");
/* --missing: sintetizza solo i clip che non esistono ancora. Serve quando si
   aggiungono poche parole nuove: rigenerare 350 file per 20 token sarebbe
   inutile (e la voce cambierebbe leggermente i clip già validati). */
const onlyMissing = args.includes("--missing");

/* --- utilità --- */
function sh(cmd, argv) {
  return execFileSync(cmd, argv, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

/** Durata in secondi di un file audio (afinfo). */
function duration(file) {
  const m = sh("afinfo", [file]).match(/estimated duration:\s*([\d.]+)/);
  return m ? +(+m[1]).toFixed(3) : 0;
}

/** Sintetizza `text` in MP3 mono, normalizzato, senza silenzi ai bordi. */
function synth(text, outMp3, { rate = RATE } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sillabe-"));
  const aiff = path.join(tmp, "t.aiff");
  const wav = path.join(tmp, "t.wav");
  try {
    sh("say", ["-v", VOICE, "-r", String(rate), "-o", aiff, text]);
    // 22.05 kHz mono: più che sufficiente per la voce, dimezza i byte
    sh("afconvert", ["-f", "WAVE", "-d", "LEI16@22050", "-c", "1", aiff, wav]);
    // normalizza e rifila i silenzi; -af silenceremove toglie pause ai bordi
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", wav,
      "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02," +
             "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse," +
             "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ac", "1", "-ar", "22050", "-b:a", MP3_KBPS + "k", outMp3]);
    return +duration(outMp3).toFixed(3);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Sintetizza il *fonema* di una singola lettera (vedi LETTER_PHONEMES).
 *
 * - i suoni continui sono già un suono tenuto: basta scrivere la lettera
 *   ripetuta e abbassare la velocità al 30%;
 * - le occlusive non si possono tenere: si sintetizza la lettera, si taglia
 *   via la vocale aggiunta dalla voce e si ripete il frammento `reps` volte,
 *   separato da una pausa breve, così il suono si sente come ritmo.
 *
 * `from`/`to` sono misurati sull'audio della voce, non stimati: sono i punti
 * in cui finisce l'occlusione e comincia la vocale.
 */
function synthPhoneme(letter, outMp3) {
  const rate = Math.round(RATE * LETTER_RATE);
  const spec = LETTER_PHONEMES[letter];
  if (typeof spec === "string") return synth(spec, outMp3, { rate });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sillabe-fon-"));
  const aiff = path.join(tmp, "t.aiff");
  const wav = path.join(tmp, "t.wav");
  const seg = path.join(tmp, "seg.wav");
  const { text, from, to, reps } = spec;
  const len = Math.max(0.02, to - from);
  const fade = Math.min(0.01, len / 3);
  try {
    sh("say", ["-v", VOICE, "-r", String(rate), "-o", aiff, text]);
    sh("afconvert", ["-f", "WAVE", "-d", "LEI16@22050", "-c", "1", aiff, wav]);
    // frammento: solo il rumore/scoppio, con la coda sfumata per non
    // produrre un click; `apad` aggiunge la pausa che separa le ripetizioni
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", wav,
      "-af", `atrim=start=${from}:end=${to},asetpts=N/SR/TB,` +
             `afade=t=out:st=${(len - fade).toFixed(3)}:d=${fade.toFixed(3)},` +
             `apad=pad_dur=${PHONEME_GAP}`,
      "-ac", "1", "-ar", "22050", seg]);
    sh("ffmpeg", ["-y", "-loglevel", "error", "-stream_loop", String(Math.max(0, reps - 1)), "-i", seg,
      "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01," +
             "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03,areverse," +
             "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ac", "1", "-ar", "22050", "-b:a", MP3_KBPS + "k", outMp3]);
    return +duration(outMp3).toFixed(3);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Esegue `task` su ogni elemento con al massimo `limit` processi `say`
 * simultanei. `say` impiega ~1 s ad avviarsi (carica il modello neurale):
 * in serie 370 clip richiederebbero mezz'ora, in parallelo pochi minuti.
 */
function pool(items, limit, task) {
  return new Promise((resolve, reject) => {
    let next = 0, done = 0;
    const total = items.length;
    if (!total) return resolve();
    const launch = () => {
      if (next >= total) return;
      const item = items[next++];
      Promise.resolve()
        .then(() => task(item))
        .then(res => {
          done++;
          if (done === total) resolve();
          else launch();
        })
        .catch(reject);
    };
    for (let k = 0; k < Math.min(limit, total); k++) launch();
  });
}

/** Nome file stabile e leggibile: traslitterazione ASCII del token.
    Le vocali accentate ricevono un suffisso numerico perché sono sillabe
    diverse dalla vocale semplice («e» congiunzione ≠ «è» verbo): senza il
    suffisso i due token finirebbero nello stesso file.

    I nomi riservati di Windows (CON, PRN, AUX, NUL, COM1-9, LPT1-9) non
    possono esistere come file: Git non riesce nemmeno a fare il checkout di
    `con.mp3` su Windows, e la build falliva. A quei token si aggiunge un
    underscore; il manifest resta la mappa vera, quindi il nome su disco è
    indifferente all'app. */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/;

function slug(token) {
  const map = {
    "à": "a1", "è": "e1", "é": "e2", "ì": "i1", "ò": "o1", "ù": "u1",
    "'": "-", " ": "_"
  };
  const s = token.toLowerCase().split("").map(c => map[c] !== undefined ? map[c] : c).join("");
  return RESERVED.test(s) ? s + "_" : s;
}

function write(group, name, text, opts) {
  const dir = path.join(AUDIO, group);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name + ".mp3");
  // --missing: se il clip è già a posto si riusa, senza risintetizzare
  if (onlyMissing && fs.existsSync(file) && fs.statSync(file).size > 800) {
    return { file: `audio/${group}/${name}.mp3`, dur: +duration(file).toFixed(3), spoken: text };
  }
  const dur = synth(text, file, opts);
  return { file: `audio/${group}/${name}.mp3`, dur, spoken: text };
}

/** Etichetta leggibile del fonema di una lettera, per il manifest. */
function phonemeLabel(letter) {
  const spec = LETTER_PHONEMES[letter];
  if (typeof spec === "string") return spec;
  return `${spec.text} (occlusiva ×${spec.reps})`;
}

/** Come `write`, ma per il fonema di una singola lettera. */
function writeLetter(name, letter) {
  const dir = path.join(AUDIO, "syl");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name + ".mp3");
  const spoken = phonemeLabel(letter);
  if (onlyMissing && fs.existsSync(file) && fs.statSync(file).size > 800) {
    return { file: `audio/syl/${name}.mp3`, dur: +duration(file).toFixed(3), spoken };
  }
  return { file: `audio/syl/${name}.mp3`, dur: synthPhoneme(letter, file), spoken };
}

/**
 * Ricostruisce `manifest.json` dai file già presenti su disco, senza
 * sintetizzare nulla. Serve dopo un aggiornamento dei testi (nuove sillabe o
 * frasi) o per riallineare l'indice se il manifest è rimasto indietro.
 */
function reindex() {
  const read = rel => {
    const abs = path.join(ROOT, rel);
    return fs.existsSync(abs) ? +duration(abs).toFixed(3) : null;
  };
  const entry = (group, name, spoken) => {
    const rel = `audio/${group}/${name}.mp3`;
    const dur = read(rel);
    return dur === null ? null : { file: rel, dur, spoken };
  };

  const groups = {};

  const syl = {};
  for (const tok of syllables) {
    const spoken = LETTER_PHONEMES[tok] ? phonemeLabel(tok) : (OVERRIDES[tok] || tok);
    const e = entry("syl", slug(tok), spoken);
    if (e) syl[tok] = e;
  }
  groups.syl = syl;

  const frasi = {};
  sentences.forEach((s, i) => {
    const e = entry("frasi", String(i + 1).padStart(2, "0"), s);
    if (e) frasi[i + 1] = e;
  });
  groups.frasi = frasi;

  const parole = {};
  for (const w of words) {
    const e = entry("parole", slug(w), OVERRIDES[w] || w);
    if (e) parole[w] = e;
  }
  groups.parole = parole;

  const ui = {};
  for (const phrase of uiSource) {
    const e = entry("ui", slug(phrase), phrase);
    if (e) ui[phrase] = e;
  }
  groups.ui = ui;

  const out = { version: 1, voice: VOICE, rate: RATE, groups };
  fs.writeFileSync(path.join(AUDIO, "manifest.json"), JSON.stringify(out, null, 1) + "\n");
  const counts = Object.entries(groups).map(([g, v]) => `${g}: ${Object.keys(v).length}`).join(", ");
  console.log(`manifest ricostruito — ${counts}`);
}

/* --- generazione ---
   Ogni blocco riempie una parte del manifest. Con --only si può rigenerare
   un solo gruppo; il manifest esistente viene letto e aggiornato, non perso. */
if (!checkOnly) fs.mkdirSync(AUDIO, { recursive: true });

const manifest = { version: 1, voice: VOICE, rate: RATE, groups: {} };
const PARALLEL = 8;     // processi `say` simultanei (oltre ~10 la voce satura)

async function generate() {
  if (only === "all" || only === "syl") {
    const syl = {};
    const rate = Math.round(RATE * 0.85);
    await pool(syllables, PARALLEL, tok => {
      /* Le singole lettere non sono sillabe: la voce le leggerebbe con il
         loro nome («esse», «zeta»). Nel laboratorio serve il *suono*, quindi
         seguono la strada dedicata (fonema lento o occlusiva ritagliata). */
      if (LETTER_PHONEMES[tok]) {
        syl[tok] = checkOnly
          ? { file: `audio/syl/${slug(tok)}.mp3`, spoken: phonemeLabel(tok) }
          : writeLetter(slug(tok), tok);
        return;
      }
      const spoken = OVERRIDES[tok] || tok;
      syl[tok] = checkOnly
        ? { file: `audio/syl/${slug(tok)}.mp3`, spoken }
        : write("syl", slug(tok), spoken, { rate });
    });
    manifest.groups.syl = syl;
    if (!checkOnly) console.log(`sillabe: ${Object.keys(syl).length}`);
  }

  if (only === "all" || only === "frasi") {
    const frasi = {};
    await pool(sentences.map((s, i) => ({ s, id: i + 1 })), PARALLEL, ({ s, id }) => {
      const name = String(id).padStart(2, "0");
      frasi[id] = checkOnly
        ? { file: `audio/frasi/${name}.mp3`, spoken: s }
        : write("frasi", name, s, { rate: RATE });
    });
    manifest.groups.frasi = frasi;
    if (!checkOnly) console.log(`frasi: ${Object.keys(frasi).length}`);
  }

  if (only === "all" || only === "parole") {
    const parole = {};
    const rate = Math.round(RATE * 0.92);
    await pool(words, PARALLEL, w => {
      const spoken = OVERRIDES[w] || w;
      parole[w] = checkOnly
        ? { file: `audio/parole/${slug(w)}.mp3`, spoken }
        : write("parole", slug(w), spoken, { rate });
    });
    manifest.groups.parole = parole;
    if (!checkOnly) console.log(`parole: ${Object.keys(parole).length}`);
  }

  if (only === "all" || only === "ui") {
    const ui = {};
    const rate = Math.round(RATE * 1.05);
    await pool(uiSource, PARALLEL, phrase => {
      ui[phrase] = checkOnly
        ? { file: `audio/ui/${slug(phrase)}.mp3`, spoken: phrase }
        : write("ui", slug(phrase), phrase, { rate });
    });
    manifest.groups.ui = ui;
    if (!checkOnly) console.log(`interfaccia: ${Object.keys(ui).length}`);
  }
}

async function main() {
  if (args.includes("--reindex")) { reindex(); return; }
  await generate();
  if (checkOnly) return;

  const file = path.join(AUDIO, "manifest.json");
  let prev = {};
  if (only !== "all" && fs.existsSync(file)) {
    try { prev = JSON.parse(fs.readFileSync(file, "utf8")).groups || {}; } catch (e) { prev = {}; }
  }
  manifest.groups = Object.assign({}, prev, manifest.groups);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 1) + "\n");

  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (p.endsWith(".mp3")) files.push(p);
    }
  })(AUDIO);
  const bytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);
  console.log(`\n${files.length} file MP3, ${(bytes / 1048576).toFixed(2)} MB in audio/`);
}

main().catch(err => {
  console.error("✘ generazione interrotta:", err.message);
  process.exit(1);
});

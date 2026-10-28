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
const { execFileSync, spawnSync } = require("child_process");

const { syllables, sentences, words, uiSource, viaggioSentences } = require("./extract");
const { OVERRIDES, LETTER_PHONEMES, STOP_PAD, PHONEME_LUFS, PHONEME_CEILING, PHONEME_PEAK } = require("./pronunciation");

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
  // Un timeout evita che un servizio di sintesi bloccato fermi l'intera
  // generazione: il token che fallisce viene segnalato e si può rigenerare.
  return execFileSync(cmd, argv, { stdio: ["ignore", "pipe", "pipe"], timeout: 60000 }).toString();
}

/** Durata in secondi di un file audio (afinfo). */
function duration(file) {
  const m = sh("afinfo", [file]).match(/estimated duration:\s*([\d.]+)/);
  return m ? +(+m[1]).toFixed(3) : 0;
}

/**
 * Rallenta `src` fino a `target` secondi, un passaggio di `atempo` per volta.
 *
 * Perché non un solo filtro: `atempo` accetta 0,5-100, quindi per rallentare di
 * 3 volte servirebbe `atempo=0.5,atempo=0.6667` nello stesso grafo — ma
 * misurato su questi clip il risultato è 0,111 s invece dei 0,213 attesi: in
 * catena la durata non è il prodotto dei fattori. Un passaggio per volta,
 * misurando ogni volta la durata vera, è l'unico modo per centrare il
 * bersaglio.
 * `atempo` conserva l'altezza (verificato: su «emme» il primo picco armonico
 * resta 159 Hz contro 157 Hz dell'originale, e il centroide spettrale di /s/
 * passa da 8445 a 8423 Hz), quindi il fonema resta lo stesso.
 */
function stretchTo(src, target, tmp, tag) {
  let cur = src;
  for (let pass = 0; pass < 5; pass++) {
    const len = duration(cur);
    if (Math.abs(len - target) < target * 0.08) break;
    const factor = Math.max(0.5, Math.min(1, len / target));
    const out = path.join(tmp, `st-${tag}-${pass}.wav`);
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", cur,
      "-filter:a", `atempo=${factor.toFixed(4)}`,
      "-ac", "1", "-ar", "22050", out]);
    cur = out;
  }
  return cur;
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

/** Picco in dBFS di un file audio (decodifica PCM, nessuna dipendenza). */
function peakDb(file) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file,
    "-ac", "1", "-ar", "22050", "-f", "s16le", "-"], { maxBuffer: 4e8 });
  let max = 0;
  for (let i = 0; i < buf.length / 2; i++) {
    const v = Math.abs(buf.readInt16LE(i * 2));
    if (v > max) max = v;
  }
  return 20 * Math.log10((max / 32768) || 1e-9);
}

/** Picco e RMS in dBFS, in un solo passaggio di decodifica. */
function levels(file) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file,
    "-ac", "1", "-ar", "22050", "-f", "s16le", "-"], { maxBuffer: 4e8 });
  let max = 0, sum = 0;
  const n = buf.length / 2;
  for (let i = 0; i < n; i++) {
    const v = buf.readInt16LE(i * 2) / 32768;
    if (Math.abs(v) > max) max = Math.abs(v);
    sum += v * v;
  }
  return { peak: 20 * Math.log10(max || 1e-9), rms: 10 * Math.log10((sum / n) || 1e-12) };
}

/** Guadagno che porta il clip a `target` RMS senza superare il tetto di picco. */
function gainFor(file, target, ceiling) {
  const { peak, rms } = levels(file);
  return Math.min(target - rms, ceiling - peak);
}

/** Loudness integrata (LUFS) misurata con `ebur128`, cioè la misura che
    corrisponde a come si sente il suono. `null` se il clip è troppo corto o
    troppo debole perché il misuratore possa dare un valore. */
function integratedLufs(file) {
  // ebur128 scrive il riepilogo su stderr: execFileSync restituisce stdout
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file,
    "-af", "ebur128", "-f", "null", "-"], { encoding: "utf8" });
  const hits = (r.stderr || "").match(/I:\s*(-?[\d.]+)\s*LUFS/g);
  if (!hits) return null;
  const v = parseFloat(hits[hits.length - 1].replace(/[^\d.-]/g, ""));
  return Number.isFinite(v) && v > -60 ? v : null;
}

/**
 * Codifica `src` in MP3 al volume di ascolto voluto.
 *
 * La misura si fa DOPO la codifica, non prima, e sulla loudness invece che
 * sul picco:
 *  - a 32 kbps l'MP3 taglia le alte frequenze, e /s/, /f/, /z/ sono quasi
 *    solo alte frequenze: un /s/ portato a −18 dB RMS sul WAV esce 7 dB più
 *    basso dopo la codifica;
 *  - a parità di picco o di RMS una fricativa e una nasale non si sentono
 *    uguali: la loudness pesa le frequenze come l'orecchio. Misurato prima
 *    della correzione: /s/ −25 LUFS contro /m/ −14,5, cioè 10 dB di
 *    differenza fra due tessere toccate una dopo l'altra.
 * Si itera sul file vero, rifacendo la codifica dal WAV originale: una sola
 * generazione lossy, non due.
 */
function encodeAt(src, out, targetLufs, ceiling, gain) {
  let g = gain;
  for (let pass = 0; pass < 4; pass++) {
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", src,
      "-af", `volume=${g.toFixed(1)}dB`, "-ac", "1", "-ar", "22050",
      "-b:a", MP3_KBPS + "k", out]);
    const lufs = integratedLufs(out);
    const { peak } = levels(out);
    if (lufs === null) break;
    const delta = targetLufs - lufs;
    if (Math.abs(delta) < 0.4 || peak + delta > ceiling) break;
    g += delta;
  }
}

/** Sintetizza la parola (o la stringa di vocali) da cui ritagliare il fonema
    e la riporta a WAV mono 22.05 kHz, che è il formato di lavoro. */
function phonemeSource(spec, tmp) {
  const aiff = path.join(tmp, "t.aiff");
  const wav = path.join(tmp, "t.wav");
  sh("say", ["-v", VOICE, "-r", String(spec.rate || RATE), "-o", aiff, spec.word || spec.say]);
  sh("afconvert", ["-f", "WAVE", "-d", "LEI16@22050", "-c", "1", aiff, wav]);
  return wav;
}

/**
 * Fonema di una singola lettera (vedi LETTER_PHONEMES).
 *
 * Due strade, perché i suoni sono di due tipi:
 *
 *  - TENUTO (`hold`): si taglia il tratto misurato dentro la parola (per le
 *    vocali un tratto a F0 ferma; per le continue la geminata) e lo si
 *    **rallenta** con `atempo` fino a `hold` secondi, conservando l'altezza
 *    della voce. Il risultato è un solo suono continuo, lo stesso fonema
 *    pronunciato adagio: nessun loop (che produce una modulazione periodica,
 *    cioè una vibrazione udibile) e nessuna ripetizione;
 *  - OCCLUSIVA (senza `hold`): si tiene il solo scoppio, una volta.
 *
 * `from`/`to` sono misurati sull'audio della voce, non stimati. Il volume si
 * porta alla loudness di ascolto (`PHONEME_LUFS`) e non al picco:
 * `loudnorm`/il picco su un suono sordo sbagliano la misura e lascerebbero il
 * clip quasi muto o troppo forte rispetto alle vocali.
 */
function synthPhoneme(letter, outMp3) {
  const spec = LETTER_PHONEMES[letter];
  if (!spec) return synth(letter, outMp3);
  if (spec.say) {
    /* le vocali passano da `synth`, che normalizza già con loudnorm: su un
       suono periodico la misura è affidabile */
    return synth(spec.say, outMp3, { rate: spec.rate });
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sillabe-fon-"));
  const seg = path.join(tmp, "seg.wav");
  const shaped = path.join(tmp, "shaped.wav");
  try {
    const wav = phonemeSource(spec, tmp);

    /* 1. il fonema, ritagliato dalla parola */
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", wav,
      "-af", `atrim=start=${spec.from}:end=${spec.to},asetpts=N/SR/TB`,
      "-ac", "1", "-ar", "22050", seg]);
    const len = duration(seg);
    if (!len || len < 0.02) throw new Error(`${letter}: fonema troppo corto (${len}s)`);

    /* 2. allungamento senza cambiare l'altezza, poi bordi sfumati. La
          lunghezza finale è un BERSAGLIO (`hold`), non un fattore: si misura
          il tratto e lo si rallenta finché non dura quello che serve. */
    const long = spec.hold ? stretchTo(seg, spec.hold, tmp, letter) : seg;
    const outLen = duration(long) || len;
    const fadeIn = Math.min(0.02, outLen * 0.1);
    const fadeOut = Math.min(0.05, outLen * 0.2);
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", long,
      "-filter:a", `afade=t=in:st=0:d=${fadeIn.toFixed(3)},` +
                   `afade=t=out:st=${Math.max(0, outLen - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}`,
      "-ac", "1", "-ar", "22050", shaped]);

    /* 3. volume: loudness per l'ascolto, picco come tetto (vedi PHONEME_LUFS).
          Le occlusive sono impulsive: si misurano di picco, altrimenti
          `loudnorm` le lascerebbe mute. */
    if (spec.hold) {
      const gain = gainFor(shaped, PHONEME_LUFS, PHONEME_CEILING);
      encodeAt(shaped, outMp3, PHONEME_LUFS, PHONEME_CEILING, gain);
      return +duration(outMp3).toFixed(3);
    }

    /* occlusiva: lo scoppio dura 20-30 ms, troppo poco perché l'MP3 sia
       valido (servono più frame). Si aggiunge silenzio DOPO il suono, non
       prima: così il colpo resta a inizio clip. */
    const gain = PHONEME_PEAK - peakDb(shaped);
    const padded = path.join(tmp, "padded.wav");
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", shaped,
      "-af", `volume=${gain.toFixed(1)}dB,adelay=20:all=1,apad=pad_dur=${STOP_PAD}`,
      "-ac", "1", "-ar", "22050", padded]);
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", padded,
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
  let s = token.toLowerCase().split("").map(c => map[c] !== undefined ? map[c] : c).join("");
  /* I nomi file devono essere validi anche su Windows: niente ? : * , ; | "
     slash, né punti o spazi finali. Le vecchie consegne con questi caratteri
     vengono rigenerate con un nome sicuro. */
  s = s.replace(/[<>:"/\\|?*,;]/g, "_").replace(/^\.+/, "").replace(/[. ]+$/, "");
  if (!s) s = "clip";
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

/** Etichetta leggibile del fonema di una lettera, per il manifest.
    Non deve coincidere con la lettera: `verify.js` la usa per riconoscere i
    clip costruiti come fonema e non come nome della lettera. */
function phonemeLabel(letter) {
  const spec = LETTER_PHONEMES[letter];
  if (!spec) return letter;
  if (spec.say) return `${letter} (${spec.say} a ${spec.rate} wpm)`;
  if (spec.hold) return `${letter} (fonema di «${spec.word}» tenuto ${spec.hold}s)`;
  return `${letter} (scoppio da «${spec.word}»)`;
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

  if (only === "all" || only === "viaggio") {
    const frasiViaggio = {};
    await pool(viaggioSentences, PARALLEL, ({ id, testo }) => {
      frasiViaggio[id] = checkOnly
        ? { file: `audio/frasiViaggio/${slug(id)}.mp3`, spoken: testo }
        : write("frasiViaggio", slug(id), testo, { rate: RATE });
    });
    manifest.groups.frasiViaggio = frasiViaggio;
    if (!checkOnly) console.log(`frasi del viaggio: ${Object.keys(frasiViaggio).length}`);
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

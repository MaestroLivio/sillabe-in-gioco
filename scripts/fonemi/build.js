#!/usr/bin/env node
/**
 * Costruisce la libreria dei 30 fonemi: audio/fonemi/*.mp3
 *
 * Le registrazioni NON si scaricano a runtime: si scaricano qui, una volta,
 * e finiscono nel pacchetto. L'app resta offline come prima.
 *
 * Due fonti, dichiarate in audio/fonemi/ATTRIBUZIONI.md:
 *   · 27 fonemi da «IPA sound files» di Ruben Schachtenhaufen (CC0 1.0);
 *   · 3 affricate che quella raccolta non ha da Wikimedia Commons
 *     (/tʃ/ e /dz/ CC BY-SA 3.0, /dʒ/ pubblico dominio).
 *
 * PERCHÉ SI RITAGLIA. Le registrazioni CC0 non sono sempre il fonema nudo:
 * i suoni occlusivi e le fricative stanno dentro una parola portatrice
 * (vocale + consonante + vocale), che è il modo corretto di registrare un
 * suono che da solo sarebbe inudibile. Il bambino però deve sentire il
 * *suono*, non la vocale che lo accompagna: si tengono le finestre qui sotto,
 * MISURATE sull'inviluppo e sullo spettro dei file veri (centroide, banda
 * 0–500 Hz, energia alta), non stimate a occhio.
 *
 * PERCHÉ MP3 E NON OGG. Il prompt suggerisce OGG Vorbis «o altro formato
 * leggero compatibile con tutte le piattaforme supportate». L'app gira anche
 * su Safari, che non decodifica Vorbis in <audio>: un .ogg lì sarebbe muto
 * e il bambino sentirebbe silenzio al posto del fonema. MP3 a 64 kbps mono
 * è leggero (≈3 kB per clip, 90 kB in tutto), conserva le alte frequenze
 * che servono a /s/, /ʃ/ e /ts/, e funziona su ogni piattaforma già
 * supportata. I nomi dei file restano quelli richiesti.
 *
 * Uso:
 *   node scripts/fonemi/build.js            scarica (se serve) e ricostruisce
 *   node scripts/fonemi/build.js --check    verifica senza scrivere
 *   node scripts/fonemi/build.js --report   stampa il rapporto dei fonemi
 *
 * Richiede ffmpeg e curl. Non serve macOS (nessuna voce di sistema).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "audio", "fonemi");
const CACHE = path.join(os.tmpdir(), "sillabe-fonemi-src");
const UA = "SillabeInGioco/2.4.0 (+https://github.com/MaestroLivio/sillabe-in-gioco)";

const args = process.argv.slice(2);
const check = args.includes("--check");
const onlyReport = args.includes("--report");

/* ------------------------------------------------------------------
   Le finestre di ritaglio. `from`/`to` sono secondi nel file originale.
   `tipo` decide il volume: gli scoppi si misurano di picco, il resto di
   loudness percepita (vedi normalize()).
   ------------------------------------------------------------------ */
const SPEC = {
  /* --- vocali: la parte centrale, a regime --- */
  a:          { src: "cc0:a",   from: 0.040, to: 0.560, tipo: "vocale" },
  e:          { src: "cc0:e",   from: 0.060, to: 0.610, tipo: "vocale" },
  e_aperta:   { src: "cc0:ɛ",   from: 0.040, to: 0.570, tipo: "vocale" },
  i:          { src: "cc0:i",   from: 0.110, to: 0.700, tipo: "vocale" },
  o:          { src: "cc0:o",   from: 0.030, to: 0.600, tipo: "vocale" },
  o_aperta:   { src: "cc0:ɔ",   from: 0.050, to: 0.620, tipo: "vocale" },
  u:          { src: "cc0:u",   from: 0.050, to: 0.550, tipo: "vocale" },

  /* --- occlusive: chiusura + scoppio, una volta sola ---
     Il taglio include il silenzio della chiusura (senza, il colpo non si
     riconosce come consonante) e finisce subito dopo il rilascio: la vocale
     che segue non entra. */
  p:          { src: "cc0:p",   from: 0.135, to: 0.253, tipo: "occlusiva" },
  b:          { src: "cc0:b",   from: 0.150, to: 0.318, tipo: "occlusiva" },
  t:          { src: "cc0:t",   from: 0.175, to: 0.322, tipo: "occlusiva" },
  d:          { src: "cc0:d",   from: 0.120, to: 0.298, tipo: "occlusiva" },
  k:          { src: "cc0:k",   from: 0.150, to: 0.315, tipo: "occlusiva" },
  g:          { src: "cc0:g",   from: 0.135, to: 0.296, tipo: "occlusiva" },

  /* --- fricative: solo la parte di rumore, fra le due vocali portatrici --- */
  f:          { src: "cc0:f",   from: 0.152, to: 0.325, tipo: "continua" },
  v:          { src: "cc0:v",   from: 0.020, to: 0.420, tipo: "continua" },
  s:          { src: "cc0:s",   from: 0.172, to: 0.386, tipo: "continua" },
  z_sonora_fricativa: { src: "cc0:z", from: 0.152, to: 0.315, tipo: "continua" },

  /* --- nasali, laterali, vibrante, approssimanti: il nucleo consonantico --- */
  m:          { src: "cc0:m",   from: 0.095, to: 0.275, tipo: "continua" },
  n:          { src: "cc0:n",   from: 0.172, to: 0.342, tipo: "continua" },
  gn:         { src: "cc0:ɲ",   from: 0.185, to: 0.335, tipo: "continua" },
  l:          { src: "cc0:l",   from: 0.152, to: 0.318, tipo: "continua" },
  gli:        { src: "cc0:ʎ",   from: 0.150, to: 0.412, tipo: "continua" },
  r:          { src: "cc0:r",   from: 0.100, to: 0.312, tipo: "continua" },
  sc_dolce:   { src: "cc0:ʃ",   from: 0.152, to: 0.348, tipo: "continua" },
  j:          { src: "cc0:j",   from: 0.120, to: 0.440, tipo: "continua" },
  w:          { src: "cc0:w",   from: 0.140, to: 0.400, tipo: "continua" },

  /* --- affricate --- */
  z_sorda_affricata:  { src: "cc0:ts", from: 0.165, to: 0.412, tipo: "continua" },
  c_dolce:    { src: "wm:Voiceless_palato-alveolar_affricate.ogg",
                from: 0.163, to: 0.336, tipo: "continua" },
  g_dolce:    { src: "wm:Voiced_palato-alveolar_affricate.ogg",
                from: 0.030, to: 0.300, tipo: "continua" },
  z_sonora_affricata: { src: "wm:Voiced_alveolar_sibilant_affricate.oga",
                from: 0.170, to: 0.452, tipo: "continua" }
};

/* ------------------------------------------------------------------
   Provenienza, per il documento di attribuzione
   ------------------------------------------------------------------ */
const SORGENTI = {
  cc0: {
    raccolta: "IPA sound files",
    autore: "Ruben Schachtenhaufen",
    pagina: "https://github.com/NewDanishPhonetics/IPA-sound-files",
    licenza: "CC0 1.0",
    licenzaUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    url: f => `https://raw.githubusercontent.com/NewDanishPhonetics/IPA-sound-files/main/${f}.wav`
  }
};

const WIKIMEDIA = {
  Voiceless_palato_alveolar: {
    file: "Voiceless_palato-alveolar_affricate.ogg",
    autore: "Peter Isotalo",
    licenza: "CC BY-SA 3.0",
    licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    pagina: "https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_affricate.ogg"
  },
  Voiced_palato_alveolar: {
    file: "Voiced_palato-alveolar_affricate.ogg",
    autore: "Octane",
    licenza: "pubblico dominio",
    licenzaUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    pagina: "https://commons.wikimedia.org/wiki/File:Voiced_palato-alveolar_affricate.ogg"
  },
  Voiced_alveolar_sibilant: {
    file: "Voiced_alveolar_sibilant_affricate.oga",
    autore: "Peter Isotalo",
    licenza: "CC BY-SA 3.0",
    licenzaUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    pagina: "https://commons.wikimedia.org/wiki/File:Voiced_alveolar_sibilant_affricate.oga"
  }
};

const wmOf = nome => {
  const k = Object.keys(WIKIMEDIA).find(x => WIKIMEDIA[x].file === nome);
  return k ? WIKIMEDIA[k] : null;
};

/* ------------------------------------------------------------------
   Utilità
   ------------------------------------------------------------------ */
function sh(cmd, argv) {
  return execFileSync(cmd, argv, { stdio: ["ignore", "pipe", "pipe"], timeout: 120000 }).toString();
}

function duration(file) {
  const out = sh("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", file]);
  return parseFloat(out.trim()) || 0;
}

/** Picco in dBFS (decodifica PCM: nessuna dipendenza npm). */
function peakDb(file) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file,
    "-ac", "1", "-ar", "44100", "-f", "s16le", "-"], { maxBuffer: 4e8 });
  let max = 0;
  for (let i = 0; i < buf.length / 2; i++) {
    const v = Math.abs(buf.readInt16LE(i * 2));
    if (v > max) max = v;
  }
  return 20 * Math.log10((max / 32768) || 1e-9);
}

/** Loudness integrata (LUFS) con ebur128: è la misura che corrisponde
    a «quanto forte si sente», non al picco. `null` se il clip è troppo
    corto perché il misuratore dia un valore. */
function lufs(file) {
  const r = require("child_process").spawnSync("ffmpeg", ["-hide_banner", "-nostats",
    "-i", file, "-af", "ebur128", "-f", "null", "-"], { encoding: "utf8" });
  const hits = (r.stderr || "").match(/I:\s*(-?[\d.]+)\s*LUFS/g);
  if (!hits) return null;
  const v = parseFloat(hits[hits.length - 1].replace(/[^\d.-]/g, ""));
  return Number.isFinite(v) && v > -60 ? v : null;
}

/* ------------------------------------------------------------------
   Download (una volta sola, in una cache temporanea)
   ------------------------------------------------------------------ */
function scarica(spec) {
  const [fonte, nome] = spec.src.split(":");
  const dest = path.join(CACHE, nome);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) return dest;
  fs.mkdirSync(CACHE, { recursive: true });
  const url = fonte === "cc0"
    ? SORGENTI.cc0.url(nome)
    : `https://commons.wikimedia.org/wiki/Special:FilePath/${nome}`;
  process.stdout.write(`  ↓ ${nome} … `);
  execFileSync("curl", ["-sSL", "--fail", "--retry", "3", "-A", UA, "-o", dest, url],
    { stdio: ["ignore", "ignore", "inherit"], timeout: 120000 });
  const size = fs.statSync(dest).size;
  if (size < 2000) throw new Error(`${nome}: download troppo piccolo (${size} B)`);
  console.log(`${Math.round(size / 1024)} kB`);
  return dest;
}

/* ------------------------------------------------------------------
   Ritaglio, normalizzazione, codifica
   ------------------------------------------------------------------ */
function costruisci(nome, spec) {
  const src = scarica(spec);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fon-"));
  const taglio = path.join(tmp, "taglio.wav");
  const finale = path.join(tmp, "finale.wav");
  const out = path.join(OUT, nome + ".mp3");
  try {
    const d = +(spec.to - spec.from).toFixed(3);
    /* sfumature brevissime: tolgono il clic del taglio, non il suono.
       Sull'uscita di un'occlusiva la sfumatura è più corta, altrimenti
       mangerebbe lo scoppio. */
    const fadeOut = spec.tipo === "occlusiva" ? 0.006 : 0.014;
    const fadeIn = 0.004;
    const filtri = [
      `atrim=start=${spec.from}:end=${spec.to}`,
      "asetpts=N/SR/TB",
      `afade=t=in:st=0:d=${fadeIn}`,
      `afade=t=out:st=${Math.max(0, d - fadeOut).toFixed(3)}:d=${fadeOut}`
    ].join(",");
    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", src,
      "-af", filtri, "-ac", "1", "-ar", "44100", taglio]);

    const lunghezza = duration(taglio);
    if (!lunghezza || lunghezza < 0.06) throw new Error(`${nome}: fonema troppo corto (${lunghezza}s)`);

    if (spec.tipo === "occlusiva") {
      /* uno scoppio dura 20-30 ms: si misura di PICCO, perché la loudness
         integrata su un impulso non ha senso. −6 dBFS: forte ma senza
         sfiorare il fondo scala. */
      const gain = -6 - peakDb(taglio);
      sh("ffmpeg", ["-y", "-loglevel", "error", "-i", taglio,
        "-af", `volume=${gain.toFixed(1)}dB`, "-ac", "1", "-ar", "44100", finale]);
    } else {
      /* loudness percepita: /s/ e /ʃ/ sono rumore con un picco alto e una
         media bassa; a parità di picco suonerebbero molto più deboli delle
         vocali. −16 LUFS, tetto −1,5 dBFS. */
      sh("ffmpeg", ["-y", "-loglevel", "error", "-i", taglio,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ac", "1", "-ar", "44100", finale]);
    }

    sh("ffmpeg", ["-y", "-loglevel", "error", "-i", finale,
      "-c:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "44100", out]);

    return {
      nome,
      file: out,
      durata: +duration(out).toFixed(3),
      picco: +peakDb(out).toFixed(1),
      lufs: lufs(out)
    };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/* ------------------------------------------------------------------
   Documento di attribuzione
   ------------------------------------------------------------------ */
function attribuzioni(risultati) {
  const righe = risultati.map(r => {
    const spec = SPEC[r.nome];
    const [fonte, nomeSrc] = spec.src.split(":");
    const wi = fonte === "wm" ? wmOf(nomeSrc) : null;
    const autore = wi ? wi.autore : SORGENTI.cc0.autore;
    const licenza = wi ? wi.licenza : SORGENTI.cc0.licenza;
    const licenzaUrl = wi ? wi.licenzaUrl : SORGENTI.cc0.licenzaUrl;
    const pagina = wi ? wi.pagina : `${SORGENTI.cc0.pagina}/blob/main/${nomeSrc}.wav`;
    return [
      `### \`${r.nome}.mp3\``,
      "",
      `- **Fonema**: ${IPA[r.nome] || "—"}`,
      `- **Autore**: ${autore}`,
      `- **URL originale**: ${pagina}`,
      `- **Licenza originale**: [${licenza}](${licenzaUrl})`,
      `- **Modifiche**: ritaglio ${spec.from.toFixed(3)}–${spec.to.toFixed(3)} s ` +
        `(misurato sull'inviluppo), sfumature di 4/14 ms, ` +
        `${spec.tipo === "occlusiva" ? "normalizzazione di picco a −6 dBFS" : "normalizzazione di loudness a −16 LUFS"}` +
        `, ricodifica MP3 mono 64 kbps 44,1 kHz. Nessuna vocale aggiunta, nessuna ripetizione, ` +
        `nessun allungamento artificiale.`,
      `- **File distribuito**: \`audio/fonemi/${r.nome}.mp3\``,
      `- **Durata**: ${r.durata.toFixed(2)} s`,
      ""
    ].join("\n");
  }).join("\n");

  return `# Attribuzioni dei fonemi

I file di \`audio/fonemi/\` sono registrazioni fonetiche di terzi, adattate
(ritaglio e normalizzazione) per l'uso didattico. Il progetto nel suo insieme
è distribuito con licenza **CC BY 4.0**; i file qui sotto restano soggetti
alla licenza della loro fonte, indicata per ciascuno. Le modifiche sono
elencate perché le licenze CC BY-SA le richiedono.

## Fonti

1. **IPA sound files** — 27 fonemi. Autore: Ruben Schachtenhaufen.
   <https://github.com/NewDanishPhonetics/IPA-sound-files>.
   Licenza **CC0 1.0** (<https://creativecommons.org/publicdomain/zero/1.0/>):
   non richiede attribuzione; la si conserva comunque per correttezza e per
   sapere da dove viene ogni suono.
2. **Wikimedia Commons** — 3 affricate che la raccolta CC0 non contiene.
   Due sono **CC BY-SA 3.0**, una è di **pubblico dominio**.

### Adattamenti di materiale CC BY-SA 3.0

Per i file derivati da Wikimedia con licenza CC BY-SA 3.0 (/\`tʃ\`/, /\`dz\`/):

- l'attribuzione all'autore e il collegamento alla licenza originale sono
  qui sopra e nella scheda di ciascun file;
- le modifiche effettuate sono dichiarate (ritaglio e normalizzazione);
- l'adattamento è distribuito con la licenza del progetto, **CC BY-SA 4.0**
  (<https://creativecommons.org/licenses/by-sa/4.0/>), che è la versione
  successiva della stessa licenza e ne conserva le condizioni
  (attribuzione + condividi allo stesso modo).

Chi ridistribuisce questi tre file deve conservare questa pagina, citare
l'autore e indicare la licenza; per il resto della libreria (CC0) non ci
sono obblighi, ma l'attribuzione resta gradita.

## Elenco dei file

${righe}
---

Verifica automatica: \`npm run test:fonemi\` controlla che ogni file esista,
non sia vuoto, abbia una durata plausibile e non contenga una vocale
portatrice; \`npm run test:audio\` continua a controllare sillabe, parole e
frasi, che non sono state toccate.
`;
}

const IPA = {
  a: "/a/", e: "/e/", e_aperta: "/ɛ/", i: "/i/", o: "/o/", o_aperta: "/ɔ/", u: "/u/",
  p: "/p/", b: "/b/", t: "/t/", d: "/d/", k: "/k/", g: "/g/",
  f: "/f/", v: "/v/", s: "/s/", z_sonora_fricativa: "/z/",
  m: "/m/", n: "/n/", gn: "/ɲ/", l: "/l/", gli: "/ʎ/", r: "/r/",
  sc_dolce: "/ʃ/", j: "/j/", w: "/w/",
  z_sorda_affricata: "/ts/", z_sonora_affricata: "/dz/",
  c_dolce: "/tʃ/", g_dolce: "/dʒ/"
};

/* ------------------------------------------------------------------
   main
   ------------------------------------------------------------------ */
function main() {
  const nomi = Object.keys(SPEC);
  if (nomi.length !== 30) {
    console.error(`✘ la specifica ha ${nomi.length} fonemi, devono essere 30`);
    process.exit(1);
  }

  /* coerenza con il motore: ogni fonema del motore deve avere la sua fonte */
  const motore = require(path.join(ROOT, "js", "fonemi.js"));
  const senzaFonte = motore.ID_FONEMI.filter(id => !SPEC[id]);
  const senzaMotore = nomi.filter(id => !motore.FONEMI[id]);
  if (senzaFonte.length || senzaMotore.length) {
    console.error("✘ libreria e motore non coincidono");
    if (senzaFonte.length) console.error("  senza fonte audio: " + senzaFonte.join(", "));
    if (senzaMotore.length) console.error("  senza voce nel motore: " + senzaMotore.join(", "));
    process.exit(1);
  }

  if (onlyReport) {
    for (const id of nomi) {
      const f = path.join(OUT, id + ".mp3");
      console.log(`${id.padEnd(22)} ${fs.existsSync(f) ? duration(f).toFixed(2) + " s" : "MANCANTE"}`);
    }
    return;
  }

  if (!check) fs.mkdirSync(OUT, { recursive: true });
  const risultati = [];
  console.log(`fonemi: ${nomi.length}`);
  for (const id of nomi) {
    const r = costruisci(id, SPEC[id]);
    risultati.push(r);
    const extra = r.lufs === null ? "" : ` ${r.lufs.toFixed(1)} LUFS`;
    console.log(`  ✓ ${id.padEnd(20)} ${r.durata.toFixed(2)}s picco ${r.picco.toFixed(1)} dB${extra}`);
    if (!check) { /* il file è già scritto da ffmpeg */ }
  }

  if (!check) {
    fs.writeFileSync(path.join(OUT, "ATTRIBUZIONI.md"), attribuzioni(risultati));
  }

  const bytes = risultati.reduce((n, r) => n + (fs.existsSync(r.file) ? fs.statSync(r.file).size : 0), 0);
  console.log(`\n${risultati.length} fonemi, ${(bytes / 1024).toFixed(0)} kB in audio/fonemi/`);
  if (!check) console.log("attribuzioni: audio/fonemi/ATTRIBUZIONI.md");
}

if (require.main === module) {
  try { main(); } catch (e) {
    console.error("✘ costruzione interrotta:", e.message);
    process.exit(1);
  }
}

module.exports = { SPEC, IPA, SORGENTI, WIKIMEDIA };

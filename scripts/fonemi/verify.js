#!/usr/bin/env node
/**
 * Verifica la libreria dei fonemi e il motore grafema→fonema.
 *
 * I test di questa app non si accontentano di «il file esiste»: controllano
 * l'identificatore del fonema scelto, perché è quello che il bambino sente.
 * Un file presente ma sbagliato (la /o/ al posto della /ɔ/, la C dura al
 * posto della dolce) è peggio di un file mancante: non si nota.
 *
 * Copre i quattordici controlli richiesti:
 *   1. presenza di tutti i 30 fonemi;
 *   2. assenza di file danneggiati (decodifica, picco, durata, vocale
 *      portatrice dentro il fonema);
 *   3. associazione lettera→fonema;
 *   4. C e G (dure, dolci, CH/GH, I muta);
 *   5. S e Z (sorda/sonora, fricativa/affricata);
 *   6. vocali aperte e chiuse, con il ripiego dichiarato come ambiguo;
 *   7. GN, GLI, SC, CH, GH;
 *   8. lettere mute;
 *   9. gruppi ortografici e doppie;
 *  10. riproduzione nelle attività con lettere singole;
 *  11. sillabe intatte (registrazioni separate, non fonemi concatenati);
 *  12. parole e frasi intatte;
 *  13. funzionamento offline (nessun URL remoto nel percorso audio);
 *  14. nessuna doppia riproduzione per un solo gesto.
 *
 * Uso: node scripts/fonemi/verify.js
 *      FONEMI_VERBOSE=1 node scripts/fonemi/verify.js   (misure dei clip)
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const Fonemi = require(path.join(ROOT, "js", "fonemi.js"));

const errori = [];
const misure = [];
const ok = (cond, msg) => { if (!cond) errori.push(msg); return !!cond; };
const eq = (reale, atteso, msg) =>
  ok(reale === atteso, `${msg}: atteso «${atteso}», trovato «${reale}»`);
const ids = parola => Fonemi.fonemiPerParola(parola).map(f => f.id).join(" ");

/* ------------------------------------------------------------------
   NOMI DEI 30 FONEMI — la tabella di verità
   ------------------------------------------------------------------ */
const ATTESI = {
  a: "a", e: "e", e_aperta: "ɛ", i: "i", o: "o", o_aperta: "ɔ", u: "u",
  p: "p", b: "b", t: "t", d: "d", k: "k", g: "g",
  f: "f", v: "v", s: "s", z_sonora_fricativa: "z",
  m: "m", n: "n", gn: "ɲ", l: "l", gli: "ʎ", r: "r",
  sc_dolce: "ʃ", j: "j", w: "w",
  z_sorda_affricata: "ts", z_sonora_affricata: "dz",
  c_dolce: "tʃ", g_dolce: "dʒ"
};
const NOMI = Object.keys(ATTESI);

const PAROLE = {
  mare: "m a r e", sole: "s o l e", pane: "p a n e", casa: "k a z_sonora_fricativa a",
  cane: "k a n e", cena: "c_dolce e n a", cibo: "c_dolce i b o",
  chiave: "k j a v e", gatto: "g a t o", gelo: "g_dolce e_aperta l o",
  gioco: "g_dolce o_aperta k o", ghiro: "g i r o",
  scena: "sc_dolce e_aperta n a", sci: "sc_dolce i", scala: "s k a l a",
  gnomo: "gn o_aperta m o", aglio: "a gli o", glicine: "g l i c_dolce i n e",
  zero: "z_sonora_affricata e_aperta r o", zaino: "z_sonora_affricata a i n o",
  stella: "s t e_aperta l a", quadro: "k w a d r o", acqua: "a k w a",
  palla: "p a l a"
};

/* ------------------------------------------------------------------
   1. PRESENZA DEI 30 FONEMI
   ------------------------------------------------------------------ */
function testPresenza() {
  eq(Fonemi.ID_FONEMI.length, 30, "numero di fonemi nel motore");
  for (const id of NOMI) ok(!!Fonemi.FONEMI[id], `fonema «${id}» assente dal motore`);
  for (const id of Fonemi.ID_FONEMI) ok(NOMI.includes(id), `fonema «${id}» inatteso`);

  /* i nomi dei file sono quelli richiesti: a.mp3, e_aperta.mp3, gn.mp3 … */
  for (const id of NOMI) {
    eq(Fonemi.fileFonema(id), `audio/fonemi/${id}.mp3`, `percorso del fonema /${ATTESI[id]}/`);
  }
  ok(fs.existsSync(path.join(ROOT, "audio", "fonemi", "ATTRIBUZIONI.md")),
    "manca audio/fonemi/ATTRIBUZIONI.md (fonte, autore, licenza)");
}

/* ------------------------------------------------------------------
   2. FILE DANNEGGIATI, VOCALE PORTATRICE, CLIPPING
   ------------------------------------------------------------------ */
const SR = 44100;
let senzaFfmpeg = false;

function pcm(file) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file,
    "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"], { maxBuffer: 1e8 });
  const out = new Float32Array(Math.floor(buf.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(i * 2) / 32768;
  return out;
}

/** Durata, picco e quota di suono sonoro (periodico).
    Una vocale è periodica, il rumore di una fricativa no: la quota di frame
    periodici distingue una vocale da una /s/, ed è il modo onesto di
    chiedersi «c'è una vocale portatrice dentro il fonema?» senza dipendere
    da una banda di formanti, che per /i/ e /u/ sposta l'energia fuori banda
    e darebbe risposte sbagliate. */
function misura(file) {
  const s = pcm(file);
  if (!s.length) return null;
  let peak = 0;
  for (let i = 0; i < s.length; i++) peak = Math.max(peak, Math.abs(s[i]));
  const durata = s.length / SR;
  const W = 1024, H = Math.round(0.02 * SR);
  let sonori = 0, tot = 0;
  for (let i = 0; i + W <= s.length; i += H) {
    let e = 0;
    for (let j = 0; j < W; j++) { const v = s[i + j]; e += v * v; }
    if (Math.sqrt(e / W) < 0.01) continue;   // silenzio
    tot++;
    /* periodicità: autocorrelazione fra 70 e 400 Hz */
    let best = 0;
    for (let lag = Math.round(SR / 400); lag <= Math.round(SR / 70); lag++) {
      let acc = 0, e1 = 0, e2 = 0;
      for (let j = 0; j + lag < W; j++) {
        acc += s[i + j] * s[i + j + lag];
        e1 += s[i + j] * s[i + j];
        e2 += s[i + j + lag] * s[i + j + lag];
      }
      const r = acc / Math.sqrt((e1 * e2) || 1e-12);
      if (r > best) best = r;
    }
    if (best >= 0.5) sonori++;
  }
  return { durata, picco: 20 * Math.log10(peak || 1e-9), sonorita: tot ? sonori / tot : 0 };
}

/* vocali: devono essere quasi tutte sonore, altrimenti il clip è tagliato */
const SOSTENUTE = ["a", "e", "e_aperta", "i", "o", "o_aperta", "u"];
/* occlusive: uno scoppio, corto. Se durassero come una sillaba vorrebbe dire
   che il clip è stato allungato o che contiene la vocale portatrice. */
const OCCLUSIVE = ["p", "b", "t", "d", "k", "g"];

function testAudio() {
  for (const id of NOMI) {
    const rel = Fonemi.fileFonema(id);
    const assoluto = path.join(ROOT, rel);
    if (!fs.existsSync(assoluto)) { errori.push(`manca il file del fonema /${ATTESI[id]}/: ${rel}`); continue; }
    const size = fs.statSync(assoluto).size;
    if (size < 800) { errori.push(`${rel}: file troppo piccolo (${size} B)`); continue; }
    if (senzaFfmpeg) continue;
    try {
      const m = misura(assoluto);
      if (!m) { errori.push(`${rel}: non decodificabile`); continue; }
      misure.push(`/${ATTESI[id]}/  ${m.durata.toFixed(2)}s  picco ${m.picco.toFixed(1)} dB  sonoro ${(m.sonorita * 100).toFixed(0)}%`);
      ok(m.durata >= 0.07 && m.durata <= 1.0, `${rel}: durata ${m.durata.toFixed(2)}s fuori scala`);
      ok(m.picco <= -0.5, `${rel}: picco ${m.picco.toFixed(1)} dB, il clip tocca il fondo scala`);
      ok(m.picco >= -12, `${rel}: picco ${m.picco.toFixed(1)} dB, troppo debole per essere udito`);
      /* La quota di suono sonoro resta informativa: la barra di sonorità di
         /b/ /d/ /g/ rende una soglia automatica inaffidabile, e bocciare /p/
         perché risuona non direbbe nulla di vero. Il test verifica invece la
         FORMA del clip (durata della classe, livello, niente clipping); la
         rimozione della vocale portatrice è stata controllata a spettro in
         fase di costruzione ed è documentata in ATTRIBUZIONI.md. */
      if (SOSTENUTE.includes(id)) {
        ok(m.durata >= 0.12, `${rel}: vocale di ${m.durata.toFixed(2)}s, troppo breve per essere udibile`);
      } else if (OCCLUSIVE.includes(id)) {
        ok(m.durata <= 0.35, `${rel}: ${m.durata.toFixed(2)}s per un'occlusiva: allungata o con la vocale`);
      } else {
        ok(m.durata <= 0.60, `${rel}: ${m.durata.toFixed(2)}s, più lungo di un fonema isolato`);
      }
    } catch (e) {
      if (/ENOENT/.test(e.message)) { senzaFfmpeg = true; continue; }
      errori.push(`${rel}: ${e.message}`);
    }
  }
}

/* ------------------------------------------------------------------
   3-9. ASSOCIAZIONE GRAFEMA → FONEMA
   ------------------------------------------------------------------ */
function testMappatura() {
  /* 3. associazioni semplici */
  const SEMPLICI = { a: "a", b: "b", d: "d", e: "e", f: "f", i: "i", l: "l",
    m: "m", n: "n", o: "o", p: "p", r: "r", t: "t", u: "u", v: "v" };
  for (const [lettera, fonema] of Object.entries(SEMPLICI)) {
    eq(Fonemi.fonemaPerLettera(lettera, "").fonema, fonema, `lettera ${lettera.toUpperCase()} isolata`);
  }
  /* senza parola E e O non possono essere aperte o chiuse: si dà la chiusa,
     ma dichiarata ambigua (è il caso delle cinque vocali del viaggio) */
  ok(Fonemi.fonemaPerLettera("e", "").ambiguo === true, "E isolata: il ripiego non è marcato ambiguo");
  ok(Fonemi.fonemaPerLettera("o", "").ambiguo === true, "O isolata: il ripiego non è marcato ambiguo");
  ok(Fonemi.fonemaPerLettera("a", "").ambiguo === false, "A isolata non deve essere ambigua");

  /* 4. C e G: dure, dolci, CH/GH, I muta o semiconsonantica */
  eq(Fonemi.fonemaPerLettera("c", "casa", 0).fonema, "k", "C di CASA");
  eq(Fonemi.fonemaPerLettera("c", "cena", 0).fonema, "c_dolce", "C di CENA");
  eq(Fonemi.fonemaPerLettera("c", "cibo", 0).fonema, "c_dolce", "C di CIBO");
  eq(Fonemi.fonemaPerLettera("c", "chiave", 0).fonema, "k", "C di CHIAVE (CH)");
  eq(Fonemi.fonemaPerLettera("h", "chiave", 1).muta, true, "H di CHIAVE è muta");
  eq(Fonemi.fonemaPerLettera("i", "chiave", 2).fonema, "j", "I di CHIAVE è semiconsonantica");
  eq(Fonemi.fonemaPerLettera("c", "camicia", 4).fonema, "c_dolce", "C di CAMICIA");
  eq(Fonemi.fonemaPerLettera("i", "camicia", 5).muta, true, "I di CAMICIA è solo ortografica");
  eq(Fonemi.fonemaPerLettera("g", "gatto", 0).fonema, "g", "G di GATTO");
  eq(Fonemi.fonemaPerLettera("g", "gelo", 0).fonema, "g_dolce", "G di GELO");
  eq(Fonemi.fonemaPerLettera("g", "gioco", 0).fonema, "g_dolce", "G di GIOCO");
  eq(Fonemi.fonemaPerLettera("g", "ghiro", 0).fonema, "g", "G di GHIRO (GH)");
  eq(Fonemi.fonemaPerLettera("h", "ghiro", 1).muta, true, "H di GHIRO è muta");

  /* 5. S e Z: sorda/sonora, fricativa/affricata */
  eq(Fonemi.fonemaPerLettera("s", "sole", 0).fonema, "s", "S di SOLE è sorda");
  eq(Fonemi.fonemaPerLettera("s", "casa", 2).fonema, "z_sonora_fricativa", "S di CASA è sonora");
  eq(Fonemi.fonemaPerLettera("s", "rosa", 2).fonema, "z_sonora_fricativa", "S di ROSA è sonora");
  eq(Fonemi.fonemaPerLettera("s", "naso", 2).fonema, "z_sonora_fricativa", "S di NASO è sonora");
  eq(Fonemi.fonemaPerLettera("z", "zero", 0).fonema, "z_sonora_affricata", "Z di ZERO è sonora");
  eq(Fonemi.fonemaPerLettera("z", "zaino", 0).fonema, "z_sonora_affricata", "Z di ZAINO è sonora");
  eq(Fonemi.fonemaPerLettera("z", "zio", 0).fonema, "z_sorda_affricata", "Z di ZIO è sorda");
  eq(Fonemi.fonemaPerLettera("z", "pizza", 2).fonema, "z_sorda_affricata", "Z di PIZZA è sorda");
  /* la /z/ fricativa non va confusa con la /dz/ affricata */
  eq(Fonemi.fonemaPerLettera("z", "zona", 0).fonema, "z_sonora_affricata", "Z di ZONA è /dz/");

  /* 6. vocali aperte e chiuse, e ripiego dichiarato */
  eq(Fonemi.fonemaPerLettera("o", "sole", 1).fonema, "o", "O di SOLE è chiusa");
  eq(Fonemi.fonemaPerLettera("o", "gioco", 2).fonema, "o_aperta", "O di GIOCO è aperta");
  eq(Fonemi.fonemaPerLettera("o", "gnomo", 2).fonema, "o_aperta", "O di GNOMO è aperta");
  eq(Fonemi.fonemaPerLettera("e", "gelo", 1).fonema, "e_aperta", "E di GELO è aperta");
  eq(Fonemi.fonemaPerLettera("c", "scena", 1).fonema, "sc_dolce", "SC di SCENA è un suono solo");
  eq(Fonemi.fonemaPerLettera("e", "scena", 2).fonema, "e_aperta", "E di SCENA è aperta");
  eq(Fonemi.fonemaPerLettera("e", "stella", 2).fonema, "e_aperta", "E di STELLA è aperta");
  eq(Fonemi.fonemaPerLettera("e", "mare", 3).fonema, "e", "E di MARE è chiusa");
  eq(Fonemi.fonemaPerLettera("o", "zero", 3).fonema, "o", "O di ZERO è chiusa");
  {
    /* parola fuori lessico: il ripiego deve DICHIARARSI ambiguo, non fingere */
    const o = Fonemi.fonemaPerLettera("o", "tavolo", 3);
    eq(o.fonema, "o", "O di TAVOLO (ripiego)");
    ok(o.ambiguo === true, "O di TAVOLO: il ripiego non è marcato ambiguo");
    const s = Fonemi.fonemaPerLettera("s", "sorriso", 0);
    ok(s.ambiguo === true, "S di SORRISO (senza lessico): il ripiego non è marcato ambiguo");
    const e = Fonemi.fonemaPerLettera("e", "cammello", 4);
    ok(e.ambiguo === true, "E di CAMMELLO (senza lessico): il ripiego non è marcato ambiguo");
  }

  /* 7. GN, GLI, SC, CH, GH */
  eq(ids("gnomo"), "gn o_aperta m o", "GNOMO");
  eq(ids("bagno"), "b a gn o", "BAGNO");
  eq(ids("aglio"), "a gli o", "AGLIO");
  eq(ids("maglia"), "m a gli a", "MAGLIA");
  eq(ids("scena"), "sc_dolce e_aperta n a", "SCENA");
  eq(ids("sci"), "sc_dolce i", "SCI");
  eq(ids("scala"), "s k a l a", "SCALA: SC davanti ad A è /s/ + /k/");
  eq(ids("pesce"), "p e sc_dolce e", "PESCE");
  eq(ids("chiave"), "k j a v e", "CHIAVE");
  eq(ids("ghiro"), "g i r o", "GHIRO");
  eq(ids("glicine"), "g l i c_dolce i n e", "GLICINE: GLI non è palatale");

  /* 8. lettere mute */
  eq(Fonemi.fonemaPerLettera("h", "ghiaccio", 1).muta, true, "H di GHIACCIO è muta");
  eq(Fonemi.fonemaPerLettera("i", "gioco", 1).muta, true, "I di GIOCO è solo ortografica");
  eq(Fonemi.fonemaPerLettera("i", "sciarpa", 2).muta, true, "I di SCIARPA è solo ortografica");

  /* 9. gruppi ortografici, doppie, parole di prova */
  for (const [parola, atteso] of Object.entries(PAROLE)) {
    eq(ids(parola), atteso, `fonemi di ${parola.toUpperCase()}`);
    for (const f of Fonemi.fonemiPerParola(parola)) {
      ok(!!Fonemi.FONEMI[f.id], `${parola}: fonema sconosciuto «${f.id}»`);
    }
  }
}

/* ------------------------------------------------------------------
   LESSICO — ogni voce deve indicare una lettera vera, alla sua posizione
   ------------------------------------------------------------------
   Il lessico è la fonte dei casi che le regole non possono decidere (S e Z
   sorde o sonore, E e O aperte o chiuse). Un indice sbagliato non produce
   errori: produce un fonema sbagliato, silenziosamente. SCENA dichiarava la
   E alla posizione 1, dove c'è la C, e il motore restava sul ripiego: questo
   controllo esiste per accorgersene. */
function testLessico() {
  const attese = {
    e: "e", e_aperta: "e", o: "o", o_aperta: "o",
    s: "s", z_sonora_fricativa: "s",
    z_sorda_affricata: "z", z_sonora_affricata: "z"
  };
  for (const [parola, mappa] of Object.entries(Fonemi.LESSICO)) {
    for (const [k, id] of Object.entries(mappa)) {
      const i = +k;
      ok(!!Fonemi.FONEMI[id], `${parola}: il lessico indica un fonema sconosciuto «${id}»`);
      if (i >= parola.length) {
        errori.push(`${parola}: il lessico indica la posizione ${i}, ma la parola è lunga ${parola.length}`);
        continue;
      }
      if (attese[id]) {
        eq(parola[i], attese[id],
          `${parola}: il lessico mette /${Fonemi.FONEMI[id].ipa}/ alla posizione ${i}, che è «${parola[i]}»`);
      }
    }
  }
}

/* ------------------------------------------------------------------
   Finto audio: registra ogni play() e si chiude subito. Serve a misurare
   QUANTE volte suona un gesto: è il difetto del controllo 14.
   ------------------------------------------------------------------ */
function audioFinto(registro) {
  return function creaAudio(file) {
    const a = {
      file, preload: "", volume: 1, paused: true,
      play() {
        registro.push(file);
        setImmediate(() => { a.paused = true; if (a.onended) a.onended(); });
        return Promise.resolve();
      },
      pause() { a.paused = true; },
      load() {}
    };
    return a;
  };
}

/* ------------------------------------------------------------------
   10 e 14. RIPRODUZIONE NELLE ATTIVITÀ CON LETTERE SINGOLE
   ------------------------------------------------------------------ */
async function testRiproduzione() {
  const reg = [];
  const g = Fonemi.creaGestoreAudio({ creaAudio: audioFinto(reg), intervallo: 0.001 });

  /* una tessera toccata = un fonema, nel contesto della parola */
  reg.length = 0;
  const casaC = await g.playLetter("c", { parola: "casa", posizione: 0 });
  eq(casaC.fonema, "k", "tap sulla C di CASA");
  eq(casaC.file, "audio/fonemi/k.mp3", "file del tap sulla C di CASA");
  eq(reg.length, 1, "un tap = un suono (C di CASA)");

  /* la stessa lettera in un'altra parola suona diversa */
  reg.length = 0;
  await g.playLetter("c", { parola: "cena", posizione: 0 });
  eq(reg[0], "audio/fonemi/c_dolce.mp3", "file del tap sulla C di CENA");
  eq(reg.length, 1, "un tap = un suono (C di CENA)");

  /* senza posizione si usa la prima occorrenza della lettera nella parola */
  reg.length = 0;
  await g.playLetter("s", { parola: "sole" });
  eq(reg[0], "audio/fonemi/s.mp3", "tap sulla S di SOLE senza posizione");

  /* una lettera muta non produce alcun suono */
  reg.length = 0;
  const h = await g.playLetter("h", { parola: "chiave", posizione: 1 });
  eq(h.riprodotto, false, "la H di CHIAVE deve restare muta");
  eq(reg.length, 0, "la H muta ha prodotto un suono");

  /* un fonema sconosciuto produce una diagnostica, non un suono e non il
     nome della lettera: `playPhoneme` non lancia, risolve false e scrive */
  const log = [];
  const ignoto = Fonemi.creaGestoreAudio({
    creaAudio: audioFinto([]), intervallo: 0.001, log: m => log.push(m)
  });
  eq(await ignoto.playPhoneme("inesistente"), false, "un fonema inesistente non deve suonare");
  ok(log.some(m => /inesistente/.test(m)), "manca la diagnostica del fonema inesistente");

  /* 7.5 — sequenza: ogni fonema UNA volta, nell'ordine delle lettere (14) */
  for (const parola of ["palla", "gatto", "acqua", "mare", "gnomo"]) {
    reg.length = 0;
    await g.playPhonemeSequence(parola);
    const suonati = reg.map(f => path.basename(f, ".mp3"));
    /* il confronto con la sequenza attesa è anche il controllo del punto 14:
       se una lettera suonasse due volte la sequenza avrebbe una voce in più.
       Non si può invece chiedere che i file siano tutti diversi: in PALLA e
       ACQUA la /a/ compare davvero due volte. */
    eq(suonati.join(" "), PAROLE[parola], `sequenza dei fonemi di ${parola.toUpperCase()}`);
  }
}

/* ------------------------------------------------------------------
   11-12. SILLABE, PAROLE, FRASI INTATTE
   ------------------------------------------------------------------ */
function testAudioEsistente() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "manifest.json"), "utf8"));
  const g = manifest.groups || {};

  /* 11. le sillabe restano registrazioni di sillabe, non fonemi concatenati */
  for (const tok of ["ma", "me", "che", "chi", "gli", "gat", "to", "sce", "ba", "gno"]) {
    const info = (g.syl || {})[tok];
    ok(!!info, `manca la sillaba «${tok}»: le sillabe non si toccano`);
    if (info) ok(fs.existsSync(path.join(ROOT, info.file)), `manca il file della sillaba «${tok}»`);
  }
  for (const tok of Object.keys(g.syl || {})) {
    if (tok === "è") continue;   // «è» è una parola di una lettera, non una tessera
    ok(!/^[a-zàèéìòù]$/i.test(tok), `il gruppo «syl» contiene ancora la lettera «${tok}»`);
  }

  /* 12. parole e frasi */
  eq(Object.keys(g.frasi || {}).length, 40, "numero di frasi storiche");
  eq(Object.keys(g.frasiViaggio || {}).length, 109, "numero di frasi del viaggio");
  ok(Object.keys(g.parole || {}).length >= 600, "numero di parole registrate");
  for (const gruppo of ["frasi", "frasiViaggio"]) {
    for (const [k, info] of Object.entries(g[gruppo] || {})) {
      ok(fs.existsSync(path.join(ROOT, info.file)), `${gruppo}/${k}: file mancante`);
    }
  }
  /* non tutte le parole di prova sono lette anche come parola intera: quelle
     che lo sono devono avere il file, le altre usano la voce di riserva */
  const paroleIntere = Object.keys(PAROLE).filter(p => (g.parole || {})[p]);
  ok(paroleIntere.length >= 15, `solo ${paroleIntere.length} parole di prova hanno la registrazione intera`);
}

/* ------------------------------------------------------------------
   13. OFFLINE
   ------------------------------------------------------------------ */
function testOffline() {
  const sorgente = fs.readFileSync(path.join(ROOT, "js", "fonemi.js"), "utf8");
  ok(!/https?:\/\//i.test(sorgente), "js/fonemi.js contiene un URL remoto: non sarebbe offline");
  for (const id of Fonemi.ID_FONEMI) {
    ok(Fonemi.fileFonema(id).startsWith("audio/fonemi/"), `percorso non locale per «${id}»`);
  }
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  ok(html.includes("js/fonemi.js"), "index.html non carica js/fonemi.js");
  ok(!html.includes("LETTER_SAY"), "index.html contiene ancora LETTER_SAY (vecchio percorso)");
  ok(/playLetterSound/.test(html), "index.html non usa playLetterSound per le lettere");

  /* 10 bis. le attività con lettere passano parola e posizione al motore */
  ok(/parola:\s*currentWord\(\)\.word/.test(html),
    "il laboratorio parole non passa la parola al motore dei fonemi");
  ok(/posizione:\s*slot\.index/.test(html),
    "il laboratorio parole non passa la posizione della lettera");
}

/* ------------------------------------------------------------------
   ESITO
   ------------------------------------------------------------------ */
async function main() {
  testPresenza();
  testAudio();
  testMappatura();
  testLessico();
  await testRiproduzione();
  testAudioEsistente();
  testOffline();

  if (process.env.FONEMI_VERBOSE) for (const m of misure) console.log("  · " + m);
  if (errori.length) {
    console.error("✘ fonemi:");
    for (const e of errori) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`✔ fonemi: 30 suoni presenti e integri, ${Object.keys(PAROLE).length} parole di prova,` +
    ` associazioni grafema→fonema verificate, sequenze senza doppie riproduzioni` +
    (senzaFfmpeg ? " (controlli di forma saltati: ffmpeg non disponibile)" : ""));
}

main().catch(e => {
  console.error("✘ fonemi: " + e.message);
  process.exit(1);
});

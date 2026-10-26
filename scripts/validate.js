#!/usr/bin/env node
/**
 * Controlli automatici sui contenuti didattici dell'app.
 * Estrae la sezione dati da index.html e verifica:
 *  - 40 livelli
 *  - frasi tutte diverse
 *  - sillabe senza spazi, caselle precompilate coerenti
 *  - distrattori che non coincidono con sillabe corrette
 *  - raggruppamenti 10/10/10/10
 *
 * Uso: node scripts/validate.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

const start = script.indexOf("const GROUP_TITLES = [");
const end = script.indexOf("/* ------------------------------------------------------------------\n   2. STATO");
if (start < 0 || end < 0) {
  console.error("✖ Sezione dati non trovata in index.html");
  process.exit(1);
}

const dataCode = script.slice(start, end)
  .replace(/const LEVELS = RAW\.map/, "globalThis.LEVELS = RAW.map")
  // WORDS e SOUNDS servono ai controlli: `const` in sandbox non finisce su globalThis
  .replace(/^const WORDS = /m, "globalThis.WORDS = ")
  .replace(/^const SOUNDS = /m, "globalThis.SOUNDS = ")
  // percorso sillabico: stesse ragioni, i dati vivono fuori dai 40 livelli
  .replace(/^const SYLL_STEPS = /m, "globalThis.SYLL_STEPS = ")
  .replace(/^const SYLL_ITEMS = /m, "globalThis.SYLL_ITEMS = ");

const sandbox = {
  console,
  shuffleArr: arr => arr.slice(),
  globalThis: null
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataCode, sandbox);

const LEVELS = sandbox.LEVELS;
const errors = [];
const warnings = [];

if (!Array.isArray(LEVELS)) errors.push("LEVELS non è un array");
else if (LEVELS.length !== 40) errors.push(`Attesi 40 livelli, trovati ${LEVELS.length}`);

const texts = new Set();
LEVELS.forEach((lvl, i) => {
  const n = i + 1;
  if (lvl.id !== n) errors.push(`Livello ${n}: id errato (${lvl.id})`);
  if (texts.has(lvl.text)) errors.push(`Livello ${n}: frase duplicata «${lvl.text}»`);
  texts.add(lvl.text);

  lvl.parts.forEach((part, pIdx) => {
    if (!part.syllables.length) errors.push(`Livello ${n}: parte ${pIdx + 1} senza sillabe`);
    if (part.prefilled.length !== part.syllables.length) {
      errors.push(`Livello ${n}: prefilled di lunghezza diversa dalle sillabe`);
    }
    part.syllables.forEach(s => {
      if (/\s/.test(s)) errors.push(`Livello ${n}: la sillaba «${s}» contiene spazi`);
      if (!s.length) errors.push(`Livello ${n}: sillaba vuota`);
    });
  });

  lvl.distractors.forEach(d => {
    if (lvl.syllables.some(s => s.toLowerCase() === d.toLowerCase())) {
      errors.push(`Livello ${n}: distrattore «${d}» coincide con una sillaba corretta`);
    }
  });

  if (lvl.mode !== "simple" && lvl.parts.length < 2) {
    errors.push(`Livello ${n}: modalità ${lvl.mode} senza due parti`);
  }
  if (lvl.parts.length > 1 && !lvl.connector) {
    warnings.push(`Livello ${n}: due parti senza connettore`);
  }
  if (lvl.connector && lvl.connector.split(" ").length > 1) {
    warnings.push(`Livello ${n}: connettore composto «${lvl.connector}»`);
  }
});

/* gruppi 10 / 10 / 10 / 10 */
const groups = [0, 1, 2, 3].map(g => LEVELS.filter(l => l.group === g).length);
if (groups.join(",") !== "10,10,10,10") errors.push(`Gruppi sbilanciati: ${groups.join("/")}`);

/* guidati solo nei primi 10 */
LEVELS.forEach((l, i) => {
  if (l.guided && i >= 10) errors.push(`Livello ${i + 1}: guidato fuori dal primo percorso`);
});

/* nessuna frase identica a un'altra anche ignorando maiuscole */
const lower = LEVELS.map(l => l.text.toLowerCase());
if (new Set(lower).size !== lower.length) errors.push("Ci sono frasi duplicate (confronto senza maiuscole)");

/* --- laboratorio «Formazione di parole»: 20 parole illustrate --- */
const WORDS = sandbox.WORDS || [];
if (WORDS.length !== 20) errors.push(`Attese 20 parole del laboratorio, trovate ${WORDS.length}`);
const wordSeen = new Set();
WORDS.forEach((w, i) => {
  const n = i + 1;
  if (w.id !== n) errors.push(`Parola ${n}: id errato (${w.id})`);
  if (wordSeen.has(w.word)) errors.push(`Parola ${n}: «${w.word}» duplicata`);
  wordSeen.add(w.word);
  if (w.word !== w.units.join("")) {
    errors.push(`Parola «${w.word}»: i pezzi (${w.units.join("-")}) non ricompongono la parola`);
  }
  if (!w.units.length) errors.push(`Parola «${w.word}»: nessun pezzo`);
  w.units.forEach(u => {
    if (!u.length) errors.push(`Parola «${w.word}»: pezzo vuoto`);
    if (/\s/.test(u)) errors.push(`Parola «${w.word}»: il pezzo «${u}» contiene spazi`);
  });
  w.distractors.forEach(d => {
    if (w.units.some(u => u.toLowerCase() === d.toLowerCase())) {
      errors.push(`Parola «${w.word}»: distrattore «${d}» coincide con un pezzo corretto`);
    }
  });
  if (w.img == null) errors.push(`Parola «${w.word}»: manca l'illustrazione`);
});
if (WORDS.filter(w => w.stage === "letters").length < 8) errors.push("Meno di 8 parole della tappa «lettere»");
if (WORDS.filter(w => w.stage === "syllables").length < 12) errors.push("Meno di 12 parole della tappa «sillabe»");

/* --- suoni difficili: 20 schede finali --- */
const SOUNDS = sandbox.SOUNDS || [];
if (SOUNDS.length !== 20) errors.push(`Attese 20 schede sui suoni difficili, trovate ${SOUNDS.length}`);
const soundSeen = new Set();
SOUNDS.forEach((s, i) => {
  const n = i + 1;
  if (s.id !== n) errors.push(`Suono ${n}: id errato (${s.id})`);
  if (soundSeen.has(s.sound)) errors.push(`Suono ${n}: «${s.sound}» duplicato`);
  soundSeen.add(s.sound);
  if (!s.word.toLowerCase().includes(s.sound.toLowerCase())) {
    errors.push(`Suono «${s.sound}»: la parola «${s.word}» non lo contiene`);
  }
  if (s.options.length !== 4) errors.push(`Suono «${s.sound}»: ${s.options.length} opzioni invece di 4`);
  const hits = s.options.filter(o => o === s.sound).length;
  if (hits !== 1) errors.push(`Suono «${s.sound}»: compare ${hits} volte fra le opzioni`);
});

/* --- percorso «La prima parola»: fonemi, sillabe, parola ---
   Ha una numerazione propria, fuori dai 40 livelli delle frasi: qui si
   controlla che le dodici tappe reggano da sole (nessuna vuota, nessun
   doppione, ogni parola ricomposta dalle sue sillabe). */
const SYLL_STEPS = sandbox.SYLL_STEPS || [];
const SYLL_ITEMS = sandbox.SYLL_ITEMS || [];
if (SYLL_STEPS.length !== 12) errors.push(`Attese 12 tappe del percorso sillabico, trovate ${SYLL_STEPS.length}`);
if (SYLL_ITEMS.length !== SYLL_STEPS.reduce((a, s) => a + s.items.length, 0)) {
  errors.push("SYLL_ITEMS non corrisponde agli item delle tappe");
}
const syllKeys = new Set();
const syllSay = new Set();
SYLL_STEPS.forEach((step, i) => {
  const n = i + 1;
  if (step.index !== i) errors.push(`Tappa ${n}: indice errato (${step.index})`);
  if (!step.items.length) errors.push(`Tappa ${n}: nessun esercizio`);
  if (!step.name || !step.note) errors.push(`Tappa ${n}: nome o consegna mancanti`);
  step.items.forEach(it => {
    if (syllKeys.has(it.key)) errors.push(`Tappa ${n}: chiave duplicata «${it.key}»`);
    syllKeys.add(it.key);
    if (it.step !== i) errors.push(`Tappa ${n}: item «${it.title}» con tappa sbagliata`);
    if (!it.units.length) errors.push(`Tappa ${n}: item «${it.title}» senza pezzi`);
    it.units.forEach(u => {
      if (!u) errors.push(`Tappa ${n}: pezzo vuoto in «${it.title}»`);
      if (/\s/.test(u)) errors.push(`Tappa ${n}: il pezzo «${u}» contiene spazi`);
    });
    /* la parola deve tornare dai suoi pezzi, altrimenti la casella non
       corrisponde alla tessera e l'esercizio diventa irrisolvibile */
    if (it.units.join("") !== it.say) {
      errors.push(`Tappa ${n}: «${it.say}» non si ricompone dai pezzi (${it.units.join("-")})`);
    }
    if (syllSay.has(it.say)) errors.push(`Tappa ${n}: «${it.say}» ripetuto in un'altra tappa`);
    syllSay.add(it.say);
    if (it.kind === "syl" && it.units.length !== 2) {
      errors.push(`Tappa ${n}: la sillaba «${it.say}» non è consonante + vocale`);
    }
  });
});

/* report */
console.log(`Livelli: ${LEVELS.length}`);
console.log(`Gruppi: ${groups.join(" · ")}`);
console.log(`Sillabe totali: ${LEVELS.reduce((a, l) => a + l.syllables.length, 0)}`);
console.log(`Frasi uniche: ${texts.size}`);
console.log(`Parole del laboratorio: ${WORDS.length} (${WORDS.filter(w => w.stage === "letters").length} lettere · ${WORDS.filter(w => w.stage === "syllables").length} sillabe)`);
console.log(`Suoni difficili: ${SOUNDS.length}`);
console.log(`Percorso sillabico: ${SYLL_STEPS.length} tappe · ${SYLL_ITEMS.length} esercizi`);
LEVELS.slice(0, 3).forEach(l => console.log(`  es. ${l.id}: ${l.text}  [${l.syllables.join("-")}]`));
LEVELS.slice(-2).forEach(l => console.log(`  es. ${l.id}: ${l.text}  [${l.syllables.join("-")}]`));

if (warnings.length) {
  console.log("\nAvvisi:");
  warnings.forEach(w => console.log("  ! " + w));
}
if (errors.length) {
  console.error("\nErrori:");
  errors.forEach(e => console.error("  ✖ " + e));
  process.exit(1);
}
console.log("\n✔ Contenuti validi");

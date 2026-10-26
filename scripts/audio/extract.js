/**
 * Estrae dall'app tutto il testo che viene letto ad alta voce.
 *
 * Sorgente unica di verità: index.html. Si estraggono
 *  - i token sillabici dei livelli (40 frasi, 443 istanze),
 *  - i distrattori del pool,
 *  - le frasi complete,
 *  - le frasi fisse dell'interfaccia (Bravo!, Riprova, ...),
 *  - i pezzi del laboratorio «Formazione di parole» (lettere e sillabe),
 *  - le parole illustrate (laboratorio + suoni difficili).
 *
 * Uso: node scripts/audio/extract.js
 * Output (stdout, JSON):
 *   { syllables: [...], sentences: [...], ui: [...], spoken: {token: formaGrafemica} }
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

/* --- blocchi di codice sorgente --- */
function block(startMarker, endMarker) {
  const a = html.indexOf(startMarker);
  if (a < 0) throw new Error("marcatore non trovato: " + startMarker);
  const b = html.indexOf(endMarker, a);
  if (b < 0) throw new Error("fine blocco non trovata per: " + startMarker);
  return html.slice(a, b);
}

/* --- stringhe di un array JS semplice ["a","b",...] --- */
function strings(src) {
  return [...src.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => JSON.parse('"' + m[1] + '"'));
}

/* --- 1. sillabe dei livelli ---
   Il blocco RAW contiene gli array di sillabe come ultimo elemento di `parts`.
   Estraiamo solo gli array che seguono una graffa di `parts:[[`. */
const rawSrc = block("const RAW = [", "const DISTRACTOR_POOL");
const syllables = new Set();
for (const m of rawSrc.matchAll(/parts:\s*\[([\s\S]*?)\]\s*\}/g)) {
  for (const arr of m[1].matchAll(/\["([^"]*)",\s*\[([^\]]*)\]/g)) {
    for (const s of strings("[" + arr[2] + "]")) syllables.add(s);
  }
}

/* --- 2. distrattori --- */
const distSrc = block("const DISTRACTOR_POOL", "const SENTENCES");
const distractors = strings(distSrc);

/* --- 3. frasi complete --- */
const sentSrc = block("const SENTENCES = [", "];");
const sentences = strings(sentSrc);

/* --- 4. frasi fisse dell'interfaccia ---
   Sono le battute che l'app dice sempre uguali. Le frasi che contengono
   numeri o nomi variabili non si preregistrano: vengono composte a runtime
   da una di queste battute + il clip della sillaba, oppure lette dalla
   sintesi di sistema. */
const uiSource = [
  "Bravo!",
  "Giusto!",
  "Riprova",
  "Quasi! Era",
  "Mancano",
  "La prossima sillaba è",
  "Hai già finito questo livello. Bravo!",
  "sillabe"
];

/* --- 4b. laboratorio «Formazione di parole» ---
   Le tappe uniscono lettere e sillabe: ogni pezzo viene letto da solo, quindi
   deve avere il proprio clip. Le lettere vivono nello stesso gruppo delle
   sillabe (`syl`), così il tap su una tessera trova sempre il file. */
const wordLabSrc = block("const WORD_LAB = [", "/* Distrattori della tappa");
const wordLabWords = [];
const wordLabUnits = [];
for (const m of wordLabSrc.matchAll(
  /\{\s*word:\s*"([^"]*)",\s*stage:\s*"[^"]*",\s*units:\s*\[([^\]]*)\]/g
)) {
  wordLabWords.push(m[1]);
  strings("[" + m[2] + "]").forEach(u => wordLabUnits.push(u));
}

/* tutte le lettere del pool dei distrattori: servono ai tap delle tessere */
const letterPool = strings(block("const LETTER_POOL = [", "];"));

/* --- 4c. suoni difficili: le 20 parole finali ---
   Nel quiz il bambino ascolta la parola intera e sceglie la grafia giusta. */
const soundSrc = block("const SOUND_ITEMS = [", "const SOUNDS =");
const soundWords = [...soundSrc.matchAll(/word:\s*"([^"]*)"/g)].map(m => m[1]);
const soundGroups = [...soundSrc.matchAll(/sound:\s*"([^"]*)"/g)].map(m => m[1]);

/* --- 4d. percorso «La prima parola»: fonemi → sillabe → parola ---
   L'inventario è dichiarato in SYLL_SERIES. Per le tappe di sillabe ogni
   voce è una sillaba; per le tappe di parole la voce è la parola spezzata
   con i trattini, quindi servono due clip: le sillabe e la parola intera.
   Leggere i dati dall'app invece di riscriverli qui evita che le due liste
   divergano in silenzio. */
const syllSrc = block("const SYLL_SERIES = [", "/* Emoji delle parole");
const syllUnits = [...syllSrc.matchAll(/units:\s*"([^"]*)"/g)].map(m => m[1]);

const syllSyllables = [];
const syllWords = [];
syllUnits.forEach(units => {
  units.split(" ").filter(Boolean).forEach(token => {
    if (token.includes("-")) {
      const pieces = token.split("-").filter(Boolean);
      pieces.forEach(p => syllSyllables.push(p));
      syllWords.push(pieces.join(""));
    } else {
      syllSyllables.push(token);
    }
  });
});

const labUnits = [...new Set([...wordLabUnits, ...letterPool])]
  .sort((a, b) => a.localeCompare(b, "it"));

/* --- 5. parole intere ---
   Gli esercizi chiedono "Quante sillabe ha la parola «gatto»?" e leggono la
   parola intera: serve un file anche per quelle. Le parole del laboratorio
   e dei suoni difficili non compaiono nelle frasi, quindi vanno aggiunte. */
const words = [...new Set(
  sentences.flatMap(s => s.toLowerCase().split(/\s+/)).filter(Boolean)
    .concat(wordLabWords, soundWords, syllWords)
)].sort((a, b) => a.localeCompare(b, "it"));

const allSyllables = [...new Set([...syllables, ...distractors, ...labUnits, ...syllSyllables])]
  .sort((a, b) => a.localeCompare(b, "it"));

module.exports = {
  syllables: allSyllables,  levelSyllables: [...syllables].sort((a, b) => a.localeCompare(b, "it")),
  distractors: [...new Set(distractors)].sort((a, b) => a.localeCompare(b, "it")),
  sentences,
  words,
  uiSource,
  wordLabWords,
  wordLabUnits: labUnits,
  letterPool,
  soundWords,
  soundGroups,
  syllSyllables: [...new Set(syllSyllables)].sort((a, b) => a.localeCompare(b, "it")),
  syllWords: [...new Set(syllWords)].sort((a, b) => a.localeCompare(b, "it"))
};

if (require.main === module) {
  const d = module.exports;
  console.log(JSON.stringify({
    counts: {
      syllables: d.syllables.length,
      levelSyllables: d.levelSyllables.length,
      distractors: d.distractors.length,
      sentences: d.sentences.length,
      words: d.words.length,
      wordLab: d.wordLabWords.length,
      labUnits: d.wordLabUnits.length,
      soundWords: d.soundWords.length
    },
    syllables: d.syllables
  }, null, 1));
}

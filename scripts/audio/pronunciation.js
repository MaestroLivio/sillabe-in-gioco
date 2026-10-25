/**
 * Correzioni di pronuncia per la voce sintetica.
 *
 * La voce di sistema legge il testo senza contesto: alcune sillabe, scritte
 * così come compaiono nella frase, le legge come sigle (lettera per lettera)
 * o con la vocale sbagliata. La tabella qui sotto associa a ogni token la
 * forma grafemica da *pronunciare* (non quella mostrata a schermo: i testi
 * dell'app non cambiano).
 *
 * Regola: `spoken` deve produrre la stessa sillaba del token, non un'altra.
 *  - forme con "c"/"g" dolci si tengono dolci (ci, gia, ge, ...);
 *  - le forme accentate servono solo se la voce sbaglia la vocale;
 *  - mai sostituire con forme che cambiano il suono (es. "gi" -> "ghi"
 *    cambierebbe /dʒi/ in /gi/: sbagliato).
 *
 * L'audit (`node scripts/audio/audit.js`) verifica che ogni `spoken`
 * differisca dalla lettura lettera per lettera e sonori come una sillaba
 * sola; le voci non corrette restano identiche al token.
 */
const OVERRIDES = {
  /* --- forme che la voce compita come sigla ---
     (verificate con audit: durata > soglia E audio == lettere separate) */
};

/**
 * Fonema delle singole lettere del laboratorio «Formazione di parole».
 *
 * Nel laboratorio la tessera mostra una lettera e il tap deve far sentire il
 * *suono* della lettera, non il suo nome: chi impara a leggere deve sentire
 * /s/ prolungato («sss»), non «esse». La voce di sistema però legge una
 * lettera isolata sempre con il nome italiano (verificato: `say -v Emma "s"`
 * è identico byte per byte a `say -v Emma "esse"`), e non accetta input
 * fonetico (`[[inpt PHON]]` viene letto come testo).
 *
 * Due famiglie di suoni, due strategie:
 *
 *  1. CONTINUI (vocali, fricative, nasali, laterali, vibranti): si possono
 *     tenere. Si scrive la lettera ripetuta, che la voce pronuncia come un
 *     suono unico prolungato: «sss» → /s:/, «mmm» → /m:/, «aaa» → /a:/.
 *  2. OCCLUSIVE (p, b, t, d, c dura, g dura): non si possono tenere, per
 *     definizione. Si sintetizza la lettera e si taglia via la vocale che la
 *     voce aggiunge, tenendo solo l'occlusione e lo scoppio; il frammento
 *     viene poi ripetuto, così il bambino sente il ritmo del suono.
 *     I punti di taglio sono misurati in secondi sull'audio della voce
 *     (`say -v Emma -r 50`) e verificati da `verify.js`.
 *
 * Velocità: 165 * 0.3 ≈ 50 parole al minuto, cioè il 30% del ritmo normale,
 * come chiesto: il suono è lento e isolato, non dentro una parola.
 */
const LETTER_RATE = 0.3;   // frazione della velocità base (RATE * 0.3 ≈ 50 wpm)

const LETTER_PHONEMES = {
  /* --- continui: lettera ripetuta, la voce tiene il suono --- */
  a: "aaa", e: "eee", i: "iii", o: "ooo", u: "uuu",
  f: "fff", l: "lll", m: "mmm", n: "nnn", r: "rrr", s: "sss", v: "vvv", z: "zzz",

  /* --- occlusivi: si sintetizza la forma con vocale neutra e si taglia ---
     `say` produce la vocale dopo lo scoppio: `to`/`co` servono solo a dare
     allo scoppio un contesto stabile, poi viene eliminato.
       text  = cosa far dire alla voce
       from  = inizio del frammento da tenere (s)
       to    = fine del frammento, prima della vocale (s)
       reps  = quante volte ripetere il frammento */
     /* `from`/`to` misurati sull'audio della voce: partono col murmure (per
        le sonore) o con lo scoppio e finiscono appena prima della vocale. */
  b: { text: "b", from: 0.000, to: 0.163, reps: 2 },   // murmure + scoppio
  c: { text: "che", from: 0.004, to: 0.038, reps: 3 }, // /k/: sfregamento dello scoppio
  d: { text: "d", from: 0.000, to: 0.198, reps: 2 },   // murmure + scoppio
  g: { text: "ghe", from: 0.000, to: 0.136, reps: 2 }, // murmure + scoppio
  p: { text: "p", from: 0.008, to: 0.030, reps: 3 },
  t: { text: "t", from: 0.030, to: 0.054, reps: 3 }
};

/** Pausa fra due ripetizioni di un'occlusiva (s). */
const PHONEME_GAP = 0.11;

/* sillabe accentate: servono a evitare che la voce chiuda la vocale */
const ACCENTS = {
  "ché": "ché",
  "perché": "perché",
  "poiché": "poiché",
  "pà": "pà"
};

module.exports = { OVERRIDES, ACCENTS, LETTER_PHONEMES, LETTER_RATE, PHONEME_GAP };

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
 * /s/ tenuto, non «esse». La voce di sistema però legge una lettera isolata
 * sempre con il nome italiano (`say -v Emma "s"` è identico byte per byte a
 * `say -v Emma "esse"`) e non accetta input fonetico.
 *
 * ATTENZIONE — la soluzione «lettera ripetuta» NON funziona.
 * Scrivere `"sss"`, `"mmm"`, `"fff"` non produce un suono tenuto: la voce
 * interpreta la stringa come una sigla e compita il *nome* della lettera,
 * tre volte («esse esse esse», tre blocchi di suono separati da pause). È il
 * difetto corretto in 2.2.2: il bambino sentiva il nome ripetuto, non il
 * fonema. Le sole stringhe ripetute che restano un suono unico sono quelle
 * delle vocali («aaaaaa» è una /a:/ sola).
 *
 * Metodo attuale: si parte da una parola vera (o dal nome della lettera) e si
 * **ritaglia** il fonema misurando l'audio della voce:
 *
 *  1. VOCALI — la voce tiene già la vocale: si scrive la lettera ripetuta
 *     (`say`, campo `say`) e si tiene tutto il suono.
 *  2. CONTINUE (fricative, nasali, laterali, vibrante) — in italiano la
 *     consonante doppia è un suono tenuto: dentro «esse», «emme», «elle»,
 *     «enne», «effe», «erre» c'è la geminata /s:/, /m:/, /l:/, /n:/, /f:/,
 *     /r/ (con in mezzo il trillo). Si taglia quel tratto e lo si allunga con
 *     un *loop sfumato* (`acrossfade`): la vocale del nome non si sente mai.
 *     Per /v/ e /z/ il nome della lettera non contiene la geminata, quindi si
 *     parte da una parola vera che ce l'ha in posizione intervocalica
 *     («avvio», «pezzo»).
 *  3. OCCLUSIVE (p, b, t, d, c dura, g dura) — non si possono tenere, per
 *     definizione: si taglia il solo scoppio (il tratto non periodico subito
 *     dopo l'occlusione) e lo si ripete `reps` volte, separate da una pausa,
 *     così il bambino sente il ritmo del suono.
 *
 * `from`/`to` sono MISURATI sull'audio della voce alla velocità indicata, non
 * stimati: sono i punti in cui finisce l'occlusione e comincia la vocale (o
 * viceversa). Se si cambia voce o velocità vanno rimisurati: per questo
 * `test-pronunciation.js` controlla la forma d'onda dei clip prodotti (un
 * solo blocco di suono per i fonemi tenuti, nessuna ripetizione del nome).
 *
 * Campi:
 *   say   = testo da far pronunciare alla voce (vocali)
 *   word  = parola/nome da cui ritagliare il fonema (consonanti)
 *   rate  = parole al minuto per `say`
 *   from  = inizio del fonema da tenere (s)
 *   to    = fine del fonema (s)
 *   hold  = durata del fonema tenuto dopo il loop (s)
 *   reps  = quante volte ripetere lo scoppio (occlusive)
 */
const LETTER_PHONEMES = {
  /* --- vocali: la voce le tiene già, basta allungare la stringa --- */
  a: { say: "aaaaaa", rate: 50 },
  e: { say: "eeeeee", rate: 50 },
  i: { say: "iiiiii", rate: 50 },   // «iii» si spezza in tre pezzi: servono almeno 4 i
  o: { say: "oooooo", rate: 50 },
  u: { say: "uuuuuu", rate: 50 },

  /* --- continue: geminata ritagliata dal nome della lettera ---
     «effe» /f:/, «elle» /l:/, «emme» /m:/, «enne» /n:/, «esse» /s:/.
     Per «erre» il tratto centrale è il trillo: si tiene anche la prima
     vibrazione (da 0.140) perché la sola occlusione sarebbe di 15 ms. */
  f: { word: "effe", rate: 165, from: 0.145, to: 0.309, hold: 0.78 },
  l: { word: "elle", rate: 165, from: 0.120, to: 0.244, hold: 0.78 },
  m: { word: "emme", rate: 165, from: 0.115, to: 0.279, hold: 0.78 },
  n: { word: "enne", rate: 165, from: 0.130, to: 0.279, hold: 0.78 },
  r: { word: "erre", rate: 165, from: 0.140, to: 0.262, hold: 0.78 },
  s: { word: "esse", rate: 165, from: 0.090, to: 0.264, hold: 0.78 },

  /* /v/ e /z/: il nome della lettera non ha la geminata, si parte da una
     parola vera. Nota onesta su /v/: la voce produce una labiodentale
     *approssimante* ([ʋ], centroide ~850 Hz), non una fricativa con rumore
     in alta frequenza: è il suono che questa voce sa fare, e resta ben
     distinto da /b/ e da /f/. */
  v: { word: "avvio", rate: 120, from: 0.394, to: 0.499, hold: 0.78 },
  z: { word: "pezzo", rate: 120, from: 0.224, to: 0.349, hold: 0.78 },

  /* --- occlusive: solo lo scoppio, ripetuto ---
     `from`/`to` prendono il tratto non periodico dopo l'occlusione: per le
     sonore è il burst vero e proprio, per le sorde anche l'aspirazione. */
  b: { word: "gabbia",  rate: 120, from: 0.038, to: 0.058, reps: 2 },
  c: { word: "secco",   rate: 120, from: 0.341, to: 0.360, reps: 2 },  // /k/
  d: { word: "freddo",  rate: 120, from: 0.398, to: 0.414, reps: 2 },
  g: { word: "agguato", rate: 120, from: 0.496, to: 0.516, reps: 2 },  // /g/
  p: { word: "doppio",  rate: 120, from: 0.394, to: 0.414, reps: 2 },
  t: { word: "fatto",   rate: 120, from: 0.416, to: 0.436, reps: 2 }
};

/** Pausa fra due scoppi di un'occlusiva (s). */
const PHONEME_GAP = 0.08;

/** Loudness di ascolto dei fonemi tenuti, in LUFS (non in dB RMS).
    Si normalizza la loudness e non il picco: /s/, /f/ e /z/ sono rumore con
    un picco molto più alto della media, e a parità di picco suonerebbero
    10 dB sotto le vocali (misurato prima della correzione: /s/ −25 LUFS
    contro /m/ −14,5). Un fonema che non si sente non insegna niente. */
const PHONEME_LUFS = -16;

/** Tetto di picco (dBFS): nessun clip deve sfiorare il fondo scala. */
const PHONEME_CEILING = -1.5;

/** Picco a cui si porta uno scoppio (dBFS): le occlusive durano 30 ms e sono
    impulsive, quindi si misurano di picco; `loudnorm` le lascerebbe mute. */
const PHONEME_PEAK = -3;

/* sillabe accentate: servono a evitare che la voce chiuda la vocale */
const ACCENTS = {
  "ché": "ché",
  "perché": "perché",
  "poiché": "poiché",
  "pà": "pà"
};

module.exports = { OVERRIDES, ACCENTS, LETTER_PHONEMES, PHONEME_GAP, PHONEME_LUFS, PHONEME_CEILING, PHONEME_PEAK };

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
 * fonema. Anche le vocali ripetute (`"aaaaaa"`) NON vanno usate: la stringa
 * non dà una vocale tenuta ma una grande arcata di intonazione, che è il
 * tremolio segnalato in 2.2.5.
 *
 * Metodo attuale: si parte da una parola vera e si **ritaglia** il fonema
 * misurando l'audio della voce. Il tratto ritagliato viene poi **allungato
 * rallentandolo** (`atempo`), non ripetuto: il bambino sente un solo suono
 * continuo, lo stesso fonema pronunciato adagio.
 *
 *  1. VOCALI — stessa strada delle consonanti: un tratto di vocale ritagliato
 *     da una parola vera e rallentato. Misurata, la lettera ripetuta non
 *     produce una vocale tenuta ma una **grande arcata di intonazione** (su
 *     «aaaaaa» la F0 sale da 202 a 311 Hz e ridiscende), che all'orecchio è il
 *     tremolio segnalato dall'utente. Ritagliando invece un tratto a F0 ferma
 *     e livello pieno si ottiene una vocale dritta: misurato sul clip finito,
 *     escursione di F0 3-9 Hz su 0,44 s, contro 100-160 Hz dell'arcata.
 *  2. CONTINUE (fricative, nasali, laterali, vibrante) — in italiano la
 *     consonante doppia è un suono tenuto: dentro «esse», «emme», «elle»,
 *     «enne», «effe», «erre» c'è la geminata /s:/, /m:/, /l:/, /n:/, /f:/,
 *     /r:/ (con in mezzo il trillo). Si taglia quel tratto e lo si rallenta
 *     fino a `hold` secondi. Per /v/ il nome della lettera non contiene la
 *     geminata, quindi si parte da una parola vera che ce l'ha in posizione
 *     intervocalica («avvio»).
 *  3. OCCLUSIVE (p, b, t, d, c dura, g dura) — non si possono tenere, per
 *     definizione: si taglia chiusura + scoppio, cioè il silenzio
 *     dell'occlusione e il rilascio che lo segue. Tenere anche solo 15 ms di
 *     chiusura rende il colpo udibile come consonante e non come un clic
 *     secco; lo scoppio NON si ripete, altrimenti il bambino sentirebbe «b-b».
 *
 * PERCHÉ `atempo` E NON ALTRO (misurato, non supposto):
 *  - `atempo` conserva l'altezza della voce: su «emme» il primo picco
 *    armonico resta 159 Hz contro 157 Hz dell'originale, e il centroide
 *    spettrale di /s/ passa da 8445 a 8423 Hz. Lo spettro non si sposta,
 *    quindi il fonema resta lo stesso;
 *  - il ricampionamento (`asetrate`) invece dimezza l'altezza (79 Hz su
 *    «emme»): la voce diventa maschile e il fonema cambia;
 *  - il *loop* (`acrossfade`, usato nella 2.2.1 e nella 2.2.2) produce una
 *    modulazione periodica di 2-12 Hz: all'orecchio è una vibrazione, e su
 *    /s/ si sente come un ronzio. Era il difetto segnalato dall'utente;
 *  - ripetere la lettera nella stringa (`"sss"`) è la trappola descritta
 *    sopra e non si usa più.
 *
 * `from`/`to` sono MISURATI sull'audio della voce alla velocità indicata, non
 * stimati: sono i punti in cui comincia e finisce il fonema. Se si cambia voce
 * o velocità vanno rimisurati: per questo `test-pronunciation.js` controlla la
 * forma d'onda dei clip prodotti (un solo blocco di suono, nessuna
 * modulazione periodica, nessuna ripetizione del nome).
 *
 * Campi:
 *   word  = parola/nome da cui ritagliare il fonema
 *   rate  = parole al minuto per `say`
 *   from  = inizio del fonema da tenere (s)
 *   to    = fine del fonema (s)
 *   hold  = durata finale del fonema (s): il tratto ritagliato viene
 *           rallentato fino a questa lunghezza. Vale per le vocali e per le
 *           continue; le occlusive non hanno `hold` (lo scoppio non si tiene).
 */
const LETTER_PHONEMES = {
  /* --- vocali: tratto di vocale a F0 ferma, ritagliato e rallentato ---
     `from`/`to` sono MISURATI con la ricerca su 24-30 parole portatrici per
     vocale, con tre criteri insieme: F0 piatta (escursione < 5 Hz), livello
     pieno fino ai due bordi (mai una coda in dissolvenza), correlazione
     spettrale ≥ 0,9 con la vocale isolata (per non tagliare una consonante
     sonora vicina: in «lupo» /l/ e /u/ hanno la stessa altezza).
     Misurato sul clip finito: `a` 1,3-2,0 Hz di deviazione, `e` 1,2, `i` 0,9,
     `o` 3,2, `u` 4,6: prima della correzione erano 9-68 Hz, cioè l'arcata di
     intonazione che si sentiva come tremolio. */
  a: { word: "tappo", rate: 60, from: 0.020, to: 0.120, hold: 0.45 },
  e: { word: "pelo",  rate: 60, from: 0.020, to: 0.120, hold: 0.45 },
  i: { word: "tipo",  rate: 60, from: 0.030, to: 0.130, hold: 0.45 },
  o: { word: "rosa",  rate: 60, from: 0.130, to: 0.230, hold: 0.45 },
  u: { word: "lupo",  rate: 60, from: 0.030, to: 0.130, hold: 0.45 },

  /* --- continue: geminata ritagliata dal nome della lettera e rallentata ---
     «effe» /f:/, «elle» /l:/, «emme» /m:/, «enne» /n:/, «esse» /s:/.
     Per «erre» il tratto centrale è il trillo: si taglia dal rilascio alla
     fine della vibrazione. `hold` è 0,40 s perché è la durata in cui `atempo`
     resta pulito (misurato: /s/ a 0,40 s ha una modulazione di 2,7 dB, a
     0,60 s sale a 4,9 dB e si sente «pompare»). */
  f: { word: "effe", rate: 60, from: 0.191, to: 0.389, hold: 0.40 },
  l: { word: "elle", rate: 60, from: 0.165, to: 0.335, hold: 0.40 },
  m: { word: "emme", rate: 60, from: 0.163, to: 0.350, hold: 0.40 },
  n: { word: "enne", rate: 60, from: 0.170, to: 0.357, hold: 0.40 },
  r: { word: "erre", rate: 60, from: 0.180, to: 0.335, hold: 0.38 },
  s: { word: "esse", rate: 60, from: 0.126, to: 0.347, hold: 0.40 },

  /* /v/: il nome della lettera non ha la geminata, si parte da una parola
     vera. Nota onesta su /v/: la voce produce una labiodentale
     *approssimante* ([ʋ], centroide ~200 Hz nella tenuta), non una fricativa
     con rumore in alta frequenza: è il suono che questa voce sa fare, e resta
     ben distinto da /b/ e da /f/. */
  v: { word: "avvio", rate: 60, from: 0.105, to: 0.215, hold: 0.40 },

  /* /z/: in italiano la lettera zeta è un'AFFRICATA (/ts/ o /dz/), non una
     fricativa: il fonema da insegnare è /ts/, quindi si taglia il rilascio
     dell'affricata e non la sua parte fricativa. Si usa «zio», dove la /ts/
     è in posizione iniziale e isolata: misurato, il rilascio sta a
     0,085-0,115 s (rapporto di attraversamento per lo zero 0,57-0,69, cioè
     rumore, contro 0,02 dell'occlusione sonora che lo precede). Prima di
     questa misura il taglio prendeva l'occlusione e non lo scoppio, e il
     clip era la voce a bassa frequenza di /dz/ (96% dell'energia sotto
     1 kHz) e non il rumore di /ts/ (centroide 5554 Hz). */
  z: { word: "zio", rate: 60, from: 0.085, to: 0.115 },

  /* --- occlusive: chiusura + scoppio, UNA volta sola ---
     `from`/`to` comprendono il silenzio della chiusura: è quello che rende il
     colpo riconoscibile come consonante. I tagli sono misurati sulle parole
     qui indicate; /k/ viene da «cima» perché «secco» ha lo scoppio sepolto
     nel silenzio (centroide 1744 Hz contro 5980 Hz di «cima», cioè rumore
     vero contro voce). */
  b: { word: "gabbia",  rate: 60, from: 0.434, to: 0.470 },  // /b/
  c: { word: "cima",    rate: 60, from: 0.000, to: 0.030 },  // /k/
  d: { word: "freddo",  rate: 60, from: 0.462, to: 0.492 },  // /d/
  g: { word: "gallo",   rate: 60, from: 0.070, to: 0.096 },  // /g/
  p: { word: "pala",    rate: 60, from: 0.014, to: 0.042 },  // /p/
  t: { word: "tana",    rate: 60, from: 0.001, to: 0.025 }   // /t/
};

/** Silenzio aggiunto in coda a uno scoppio (s): uno scoppio dura 20-30 ms e
    un MP3 così corto non è valido; la coda non si sente e rende il colpo
    identico per tutte e sei le occlusive. */
const STOP_PAD = 0.12;

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

module.exports = { OVERRIDES, ACCENTS, LETTER_PHONEMES, STOP_PAD, PHONEME_LUFS, PHONEME_CEILING, PHONEME_PEAK };

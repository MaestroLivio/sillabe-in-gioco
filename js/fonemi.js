/* ------------------------------------------------------------------
   MOTORE GRAFEMA → FONEMA + BIBLIOTECA DI FONEMI (italiano)

   Un solo posto decide che suono ha una lettera *dentro una parola*. Il
   laboratorio «Formazione di parole», il percorso «La prima parola» e
   qualunque attività che mostri lettere singole passano da qui: nessun
   esercizio tiene una propria tabella, altrimenti due schermate
   finirebbero per insegnare due suoni diversi per la stessa lettera.

   Tre livelli, separati apposta:

     1. LESSICO   — la verità linguistica, quando esiste: le parole che
                    l'italiano pronuncia in modo non deducibile dalla
                    grafia (S sonora, Z sonora, E/O aperte). È un dato,
                    non una regola: si corregge aggiungendo una riga.
     2. REGOLE    — la grammatica ortografica: C/G dolci e dure, CH/GH,
                    GN, GLI, SCI/SCE, QU, CQ, lettere mute, doppie.
     3. RIPIEGO   — quando né lessico né regola decidono (una parola nuova
                    con S o Z): si sceglie il valore più frequente e lo si
                    dichiara `ambiguo`. Non si finge che sia certo.

   Il fonema restituito è sempre un *suono*, mai il nome della lettera:
   M → /m/, non «emme». I file stanno in audio/fonemi/ e sono registrazioni
   fonetiche (vedi audio/fonemi/ATTRIBUZIONI.md).

   Il modulo è usato dal browser (`window.Fonemi`) e da Node
   (`require("./js/fonemi")`): la stessa fonte alimenta app e test.
   ------------------------------------------------------------------ */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Fonemi = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. LA BIBLIOTECA — 30 fonemi, un file per fonema
     ------------------------------------------------------------------ */

  const CARTELLA = "audio/fonemi/";

  /**
   * Ogni voce: file, simbolo IPA, tipo, e come si chiama il suono in una
   * frase per il rapporto di consegna (non compare mai a schermo).
   *
   * `tipo` serve al gestore audio: le occlusive non si possono tenere
   * (sono uno scoppio) e non vanno né allungate né ripetute; le vocali e
   * le continue sì, ma il file è già pronunciato adagio: non si stira.
   */
  const FONEMI = {
    a:                 { file: "a.mp3",                 ipa: "a",  tipo: "vocale" },
    e:                 { file: "e.mp3",                 ipa: "e",  tipo: "vocale" },
    e_aperta:          { file: "e_aperta.mp3",          ipa: "ɛ",  tipo: "vocale" },
    i:                 { file: "i.mp3",                 ipa: "i",  tipo: "vocale" },
    o:                 { file: "o.mp3",                 ipa: "o",  tipo: "vocale" },
    o_aperta:          { file: "o_aperta.mp3",          ipa: "ɔ",  tipo: "vocale" },
    u:                 { file: "u.mp3",                 ipa: "u",  tipo: "vocale" },
    p:                 { file: "p.mp3",                 ipa: "p",  tipo: "occlusiva" },
    b:                 { file: "b.mp3",                 ipa: "b",  tipo: "occlusiva" },
    t:                 { file: "t.mp3",                 ipa: "t",  tipo: "occlusiva" },
    d:                 { file: "d.mp3",                 ipa: "d",  tipo: "occlusiva" },
    k:                 { file: "k.mp3",                 ipa: "k",  tipo: "occlusiva" },
    g:                 { file: "g.mp3",                 ipa: "g",  tipo: "occlusiva" },
    f:                 { file: "f.mp3",                 ipa: "f",  tipo: "fricativa" },
    v:                 { file: "v.mp3",                 ipa: "v",  tipo: "fricativa" },
    s:                 { file: "s.mp3",                 ipa: "s",  tipo: "fricativa" },
    z_sonora_fricativa:{ file: "z_sonora_fricativa.mp3", ipa: "z", tipo: "fricativa" },
    m:                 { file: "m.mp3",                 ipa: "m",  tipo: "nasale" },
    n:                 { file: "n.mp3",                 ipa: "n",  tipo: "nasale" },
    gn:                { file: "gn.mp3",                ipa: "ɲ",  tipo: "nasale" },
    l:                 { file: "l.mp3",                 ipa: "l",  tipo: "laterale" },
    gli:               { file: "gli.mp3",               ipa: "ʎ",  tipo: "laterale" },
    r:                 { file: "r.mp3",                 ipa: "r",  tipo: "vibrante" },
    sc_dolce:          { file: "sc_dolce.mp3",          ipa: "ʃ",  tipo: "fricativa" },
    j:                 { file: "j.mp3",                 ipa: "j",  tipo: "approssimante" },
    w:                 { file: "w.mp3",                 ipa: "w",  tipo: "approssimante" },
    z_sorda_affricata: { file: "z_sorda_affricata.mp3", ipa: "ts", tipo: "affricata" },
    z_sonora_affricata:{ file: "z_sonora_affricata.mp3", ipa: "dz", tipo: "affricata" },
    c_dolce:           { file: "c_dolce.mp3",           ipa: "tʃ", tipo: "affricata" },
    g_dolce:           { file: "g_dolce.mp3",           ipa: "dʒ", tipo: "affricata" }
  };

  const ID_FONEMI = Object.keys(FONEMI);

  /** Lettere con un solo suono, sempre: la tabella della sezione 6.1.
      Non comprende C, G, S, Z, E, O, che dipendono dal contesto. */
  const LETTERE_SEMPICI = {
    a: "a", b: "b", d: "d", f: "f", i: "i", l: "l", m: "m",
    n: "n", p: "p", r: "r", t: "t", u: "u", v: "v"
  };

  /** Vocali accentate: l'accento non cambia il fonema, ma dice quale.
      «è» è aperta (/ɛ/), «é» chiusa (/e/): è il DOP, non un'opinione. */
  const VOCALI_ACCENTATE = {
    "à": "a", "á": "a", "è": "e_aperta", "é": "e",
    "ì": "i", "í": "i", "ò": "o_aperta", "ó": "o",
    "ù": "u", "ú": "u", "î": "i", "û": "u"
  };

  const VOCALI = "aeiou";
  const isVocale = c => !!c && VOCALI.includes(c);

  /* ------------------------------------------------------------------
     2. IL LESSICO — dove la grafia non basta

     Chiave: la parola in minuscolo senza accenti. Valore: mappa
     «posizione della lettera nella parola → fonema». La posizione è un
     indice assoluto, così non c'è modo di confondere la S di «casa» con
     quella di «scena»: si dichiara esattamente la lettera che si vuole.

     Fonti: Dizionario di pronuncia italiana (DiPI, Canepari) per E/O
     aperte e chiuse, S e Z sorde e sonore. Sono le forme del parlato
     sorvegliato, non di una regione; dove il DiPI ammette entrambe le
     realizzazioni si è scelta quella più diffusa nell'italiano standard.

     Il lessico NON è un dizionario completo: copre le parole dell'app e
     quelle dei test. Per una parola assente valgono le regole, e quando
     nemmeno loro decidono il risultato è marcato `ambiguo`.
     ------------------------------------------------------------------ */
  const LESSICO = {
    /* --- S sonora: sono le parole dell'app e dei test --- */
    casa:      { 2: "z_sonora_fricativa" },
    rosa:      { 1: "o_aperta", 2: "z_sonora_fricativa" },
    chiesa:    { 2: "j", 3: "e_aperta", 4: "z_sonora_fricativa" },
    viso:      { 2: "z_sonora_fricativa" },
    naso:      { 2: "z_sonora_fricativa" },
    cosa:      { 1: "o_aperta", 2: "z_sonora_fricativa" },
    musica:    { 2: "z_sonora_fricativa" },
    isola:     { 1: "z_sonora_fricativa", 2: "o_aperta" },
    tesoro:    { 2: "z_sonora_fricativa" },
    esempio:   { 1: "z_sonora_fricativa" },
    esercizio: { 1: "z_sonora_fricativa" },
    bisogno:   { 2: "z_sonora_fricativa" },
    misura:    { 2: "z_sonora_fricativa" },
    susina:    { 2: "z_sonora_fricativa" },

    /* --- Z: l'affricata non si deduce dalla grafia, decide il lessico --- */
    zero:      { 0: "z_sonora_affricata", 1: "e_aperta" },
    zaino:     { 0: "z_sonora_affricata" },
    zona:      { 0: "z_sonora_affricata", 1: "o_aperta" },
    zebra:     { 0: "z_sonora_affricata", 1: "e_aperta" },
    zanzara:   { 0: "z_sonora_affricata", 3: "z_sonora_affricata" },
    zio:       { 0: "z_sorda_affricata" },
    zuppa:     { 0: "z_sorda_affricata" },
    zucchero:  { 0: "z_sorda_affricata", 5: "e" },
    pizza:     { 2: "z_sorda_affricata" },

    /* --- E/O aperte e chiuse --- */
    gelo:      { 1: "e_aperta" },
    gioco:     { 2: "o_aperta" },
    gnomo:     { 2: "o_aperta" },
    scena:     { 2: "e_aperta" },
    stella:    { 2: "e_aperta" },
    treno:     { 2: "e_aperta" },
    quaderno:  { 4: "e_aperta" },
    cielo:     { 2: "e_aperta" },
    cieco:     { 2: "e_aperta" },
    genere:    { 1: "e_aperta" },
    ieri:      { 1: "e_aperta" },
    topo:      { 1: "o_aperta" },
    ciotola:   { 2: "o_aperta" },
    nuovo:     { 2: "o_aperta" },
    buono:     { 2: "o_aperta" },
    ruota:     { 2: "o_aperta" },
    fuori:     { 2: "o_aperta" },
    uovo:      { 1: "o_aperta" },
    mare:      { 3: "e" },
    sole:      { 1: "o" },
    ombrello:  { 4: "e" },
    chiave:    { 5: "e" },
    cesto:     { 1: "e" },
    formiche:  { 7: "e" },
    alghe:     { 4: "e" },
    pesce:     { 1: "e", 4: "e" },
    cena:      { 1: "e" },
    cane:      { 3: "e" },
    pane:      { 3: "e" },
    gelato:    { 1: "e" },
    spremuta:  { 3: "e" },
    freccia:   { 2: "e" },
    voce:      { 1: "o" },
    croce:     { 2: "o" },
    dolce:     { 1: "o" },
    bosco:     { 1: "o" },
    noce:      { 1: "o" },
    libro:     { 4: "o" },
    fiore:     { 2: "o" },
    ciuffo:    { 5: "o" },
    ghiaccio:  { 7: "o" },
    cibo:      { 3: "o" },
    ghiro:     { 4: "o" },
    giro:      { 3: "o" },
    scivolo:   { 4: "o" }
  };

  /** Parole in cui GLI non è il gruppo palatale ma /ɡli/ (o /ɡl/ + vocale).
      La regola generale è già «GLI + consonante → duro» (GLICINE, GLITTER,
      NEGLIGENTE); l'elenco serve per le eccezioni e per documentarle. */
  const ECCEZIONI_GLI = new Set([
    "glicine", "glicerina", "glicemia", "glicerolo", "glicolico",
    "glissando", "glitter", "anglicano", "anglicismo", "ganglio",
    "geroglifico", "negligente", "negligere", "negligenza"
  ]);

  /* ------------------------------------------------------------------
     3. ANALISI — la parola diventa una sequenza di gruppi e di suoni
     ------------------------------------------------------------------ */

  /** Minuscolo, senza spazi ai bordi, apostrofi tipografici normalizzati.
      Gli accenti restano: dicono quale vocale aperta o chiusa si sente. */
  function normalizza(parola) {
    return String(parola == null ? "" : parola)
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .trim();
  }

  /** Toglie gli accenti, per cercare la parola nel lessico. */
  function chiaveLessico(parola) {
    return parola.replace(/[àáèéìíòóùúîû]/g, c => ({
      "à": "a", "á": "a", "è": "e", "é": "e", "ì": "i", "í": "i",
      "ò": "o", "ó": "o", "ù": "u", "ú": "u", "î": "i", "û": "u"
    }[c]));
  }

  /* Consonanti che hanno un solo suono, sempre uguale al segno. C e G non
     sono qui: dipendono dalla vocale che segue e hanno le loro regole. */
  const CONSONANTI_SEMPICI = {
    b: "b", d: "d", f: "f", l: "l", m: "m", n: "n",
    p: "p", r: "r", t: "t", v: "v"
  };

  function fonemaDi(c) {
    if (VOCALI_ACCENTATE[c]) return VOCALI_ACCENTATE[c];
    return LETTERE_SEMPICI[c] || null;
  }

  /**
   * Analizza `parola` e restituisce l'elenco dei gruppi ortografici.
   *
   * Ogni gruppo: { inizio, lunghezza, grafemi, suoni, gruppo, nota }
   *   suoni:    [{ id, lettere: [indici *dentro* il gruppo] }]
   *             `id` null = lettera muta (H, I di CIA/GIA/SCIA, seconda
   *             di una doppia già suonata).
   *   gruppo:   nome del gruppo ortografico ("ch", "gli", "sci", ...).
   *
   * Si legge la parola da sinistra a destra e si decide *una volta sola*:
   * le regole non si sovrappongono, quindi «chiesa» non può produrre due
   * suoni per la C.
   */
  function analizzaParola(parola, opzioni) {
    const opts = opzioni || {};
    const w = normalizza(parola);
    const chiave = chiaveLessico(w);
    const lessico = Object.assign({}, LESSICO[chiave] || {}, opts.trascrizione || {});
    const gruppi = [];
    const n = w.length;

    const push = (inizio, lunghezza, gruppo, suoni, nota) => {
      gruppi.push({
        inizio,
        lunghezza,
        grafemi: w.slice(inizio, inizio + lunghezza),
        suoni,
        gruppo: gruppo || null,
        nota: nota || null
      });
    };

    /* Un suono, con le lettere del gruppo che lo producono. */
    const uno = (id, lettere, muta) => ({ id: muta ? null : id, lettere: lettere || [0] });

    let i = 0;
    while (i < n) {
      const c = w[i];
      const c1 = w[i + 1];
      const c2 = w[i + 2];
      const c3 = w[i + 3];

      /* --- spazi e apostrofi: separano, non suonano --- */
      if (c === " " || c === "'" || c === "-") { i++; continue; }

      /* --- H: muta, salvo quando forma CH/GH (gestite sotto) --- */
      if (c === "h") { push(i, 1, "h", [uno(null, [0], true)], "muta"); i++; continue; }

      /* --- consonanti semplici: B D F L M N P R T V. Un segno, un suono,
             senza contesto: la M di MARE è /m/ e basta. --- */
      if (CONSONANTI_SEMPICI[c]) {
        push(i, 1, null, [uno(CONSONANTI_SEMPICI[c], [0])]);
        i += 1;
        continue;
      }

      /* --- GLI palatale: ʎ. Diventa /ɡli/ se seguito da consonante
             (GLICINE, GLITTER) o se la parola è fra le eccezioni. --- */
      if (c === "g" && c1 === "l" && c2 === "i") {
        const dopo = w[i + 3];
        const duro = ECCEZIONI_GLI.has(chiave) || (dopo && !isVocale(dopo));
        if (!duro) {
          push(i, 3, "gli", [uno("gli", [0, 1, 2])], "gruppo palatale");
          i += 3;
          continue;
        }
        push(i, 1, null, [uno("g", [0])]);
        push(i + 1, 1, null, [uno("l", [0])]);
        push(i + 2, 1, null, [uno("i", [0])]);
        i += 3;
        continue;
      }

      /* --- GN: ɲ (GNOMO, BAGNO, RAGNO) --- */
      if (c === "g" && c1 === "n") {
        push(i, 2, "gn", [uno("gn", [0, 1])]);
        i += 2;
        continue;
      }

      /* --- SC davanti a E/I: ʃ. SCI + vocale = ʃ + vocale (I muta). --- */
      if (c === "s" && c1 === "c" && (c2 === "e" || c2 === "i")) {
        if (c2 === "i" && c3 && isVocale(c3)) {
          push(i, 3, "sci", [uno("sc_dolce", [0, 1])], "I soltanto ortografica");
          i += 3;
          continue;
        }
        if (c2 === "i") {
          /* SCI isolata: /ʃi/, la I è vocale vera */
          push(i, 2, "sc", [uno("sc_dolce", [0, 1])]);
          push(i + 2, 1, null, [uno("i", [0])]);
          i += 3;
          continue;
        }
        push(i, 2, "sc", [uno("sc_dolce", [0, 1])]);
        i += 2;
        continue;
      }

      /* --- SCE/SCI già gestite; SC altrove = /s/ + /k/ (SCALA) --- */
      if (c === "s" && c1 === "c") {
        push(i, 1, null, [uno("s", [0])]);
        push(i + 1, 1, null, [uno("k", [0])]);
        i += 2;
        continue;
      }

      /* --- CH + E/I = /k/ con H muta. CH + I + vocale = /k/ + /j/. --- */
      if (c === "c" && c1 === "h" && (c2 === "e" || c2 === "i")) {
        push(i, 2, "ch", [uno("k", [0])], "H muta");
        i += 2;
        if (c2 === "i" && w[i + 1] && isVocale(w[i + 1])) {
          push(i, 1, null, [uno("j", [0])], "I semiconsonantica");
          i += 1;
        }
        continue;
      }

      /* --- GH + E/I = /ɡ/ con H muta. GH + I + vocale = /ɡ/ + /j/. --- */
      if (c === "g" && c1 === "h" && (c2 === "e" || c2 === "i")) {
        push(i, 2, "gh", [uno("g", [0])], "H muta");
        i += 2;
        if (c2 === "i" && w[i + 1] && isVocale(w[i + 1])) {
          push(i, 1, null, [uno("j", [0])], "I semiconsonantica");
          i += 1;
        }
        continue;
      }

      /* --- CQ: due lettere, un solo /k/ rafforzato (ACQUA /ˈakkwa/).
             Va letto PRIMA della C, altrimenti il bambino sentirebbe due
             scoppi: la doppia è un suono solo, più lungo. --- */
      if (c === "c" && c1 === "q") {
        const g = { inizio: i, lunghezza: 2, grafemi: "cq", suoni: [uno("k", [0])],
          gruppo: "cq", nota: "occlusiva rafforzata", doppia: true };
        gruppi.push(g);
        i += 2;
        continue;
      }

      /* --- doppia di C e di G: «cc» e «gg» sono UN suono ---
             GHIACCIO /ˈɡjattʃo/, MAGGIO /ˈmaddʒo/, AGGUATO /aɡˈɡwato/.
             Il suono lo decide il secondo C (dolce davanti a E/I), la I
             davanti a vocale è ortografica e viene consumata qui: senza
             questo ramo «ghiaccio» darebbe /k/ + /tʃ/ e il bambino
             sentirebbe due scoppi per una sola doppia. --- */
      if ((c === "c" || c === "g") && c1 === c) {
        const dolce = c2 === "e" || c2 === "i";
        const conI = c2 === "i" && c3 && isVocale(c3);
        const lung = conI ? 3 : 2;
        const id = dolce ? (c === "c" ? "c_dolce" : "g_dolce") : (c === "c" ? "k" : "g");
        push(i, lung, c + c, [uno(id, [0])], "doppia: un suono solo");
        gruppi[gruppi.length - 1].doppia = true;
        i += lung;
        continue;
      }

      /* --- C dolce davanti a E, e davanti a I + vocale (I muta) --- */
      if (c === "c") {
        if (c1 === "i" && c2 && isVocale(c2)) {
          push(i, 2, "ci", [uno("c_dolce", [0])], "I soltanto ortografica");
          i += 2;
          continue;
        }
        if (c1 === "e" || c1 === "i") {
          push(i, 1, null, [uno("c_dolce", [0])]);
          i += 1;
          continue;
        }
        push(i, 1, null, [uno("k", [0])]);
        i += 1;
        continue;
      }

      /* --- G dolce davanti a E, e davanti a I + vocale (I muta) --- */
      if (c === "g") {
        if (c1 === "i" && c2 && isVocale(c2)) {
          push(i, 2, "gi", [uno("g_dolce", [0])], "I soltanto ortografica");
          i += 2;
          continue;
        }
        if (c1 === "e" || c1 === "i") {
          push(i, 1, null, [uno("g_dolce", [0])]);
          i += 1;
          continue;
        }
        push(i, 1, null, [uno("g", [0])]);
        i += 1;
        continue;
      }

      /* --- Q: QU + vocale = /k/ + /w/ (QUADRO, ACQUA) --- */
      if (c === "q") {
        push(i, 1, null, [uno("k", [0])]);
        i += 1;
        continue;
      }

      /* --- S: sorda o sonora. Decide il lessico; altrimenti /s/ --- */
      if (c === "s") {
        let id = lessico[i];
        let ambiguo = false;
        if (!id) {
          /* Ripiego dichiarato: la S intervocalica è spesso sonora, ma non
             sempre (CASA /ˈkaza/ e CASA /ˈkasa/ convivono nella penisola).
             Senza lessico si sceglie la sorda, che è la più frequente. */
          id = "s";
          ambiguo = true;
        }
        push(i, 1, null, [uno(id, [0])], ambiguo ? "S di ripiego" : "S dal lessico");
        i += 1;
        continue;
      }

      /* --- Z: affricata sorda /ts/ o sonora /dz/. Decide il lessico. --- */
      if (c === "z") {
        let id = lessico[i];
        let ambiguo = false;
        if (!id) {
          id = "z_sorda_affricata";
          ambiguo = true;
        }
        push(i, 1, null, [uno(id, [0])], ambiguo ? "Z di ripiego" : "Z dal lessico");
        i += 1;
        continue;
      }

      /* --- vocali: A I U semplici; E O aperte o chiuse --- */
      if (isVocale(c) || VOCALI_ACCENTATE[c]) {
        /* I e U davanti a un'altra vocale sono semiconsonanti: PIANO,
           FIORE, BUONO, AIUTO. Non vale per la I di CIA/GIA/SCIA, che è
           già stata consumata dal gruppo. */
        if (c === "i" && c1 && isVocale(c1)) {
          push(i, 1, null, [uno("j", [0])], "I semiconsonantica");
          i += 1;
          continue;
        }
        if (c === "u" && c1 && isVocale(c1)) {
          push(i, 1, null, [uno("w", [0])], "U semiconsonantica");
          i += 1;
          continue;
        }
        let id = fonemaDi(c);
        let nota = null;
        if (c === "e" || c === "o") {
          const scelto = lessico[i];
          if (scelto) id = scelto;
          else {
            /* Ripiego dichiarato: E e O chiuse. La parola fuori lessico non
               ha una trascrizione, quindi non si può sapere se la vocale è
               aperta: il suono si dà, ma marcato `ambiguo`, e il report
               elenca queste parole invece di fingere che sia sempre giusto. */
            id = c;
            nota = "vocale di ripiego (chiusa)";
          }
        }
        push(i, 1, null, [uno(id, [0])], nota);
        i += 1;
        continue;
      }

      /* --- qualunque altro carattere: si salta, non si inventa un suono --- */
      i += 1;
    }

    /* --- doppie: due lettere, un solo suono ---
       «GATTO» non è /t/ due volte: è un /t/ rafforzato. La grafia resta
       di due lettere (le caselle sono due), ma il suono è uno. Si annota
       `doppia` sul primo e si azzera il secondo, così nessuna attività
       può riprodurre il clip due volte per una sola parola. */
    for (let k = 0; k < gruppi.length; k++) {
      const g = gruppi[k];
      const succ = gruppi[k + 1];
      if (!g || !succ || g.lunghezza !== 1 || succ.lunghezza !== 1) continue;
      if (g.grafemi !== succ.grafemi) continue;
      if (!g.suoni[0] || !g.suoni[0].id) continue;
      if (g.suoni[0].id !== succ.suoni[0].id) continue;
      /* vocali lunghe e consonanti doppie: un solo fonema */
      g.doppia = true;
      succ.doppia = true;
      succ.suoni = succ.suoni.map(s => ({ id: null, lettere: s.lettere }));
      succ.nota = "seconda di una doppia: il suono è già nel primo";
    }

    return gruppi;
  }

  /* ------------------------------------------------------------------
     4. CONSULTAZIONE — dal grafema al fonema, sempre contestualizzato
     ------------------------------------------------------------------ */

  /** Elenco piatto dei fonemi di una parola, senza le lettere mute.
      Ogni voce: { id, file, ipa, inizio, grafemi, doppia, ambiguo } */
  function fonemiPerParola(parola, opzioni) {
    const gruppi = analizzaParola(parola, opzioni);
    const out = [];
    for (const g of gruppi) {
      for (const s of g.suoni) {
        if (!s.id) continue;
        out.push({
          id: s.id,
          file: fileFonema(s.id),
          ipa: FONEMI[s.id] ? FONEMI[s.id].ipa : null,
          tipo: FONEMI[s.id] ? FONEMI[s.id].tipo : null,
          inizio: g.inizio,
          grafemi: g.grafemi,
          gruppo: g.gruppo,
          doppia: !!g.doppia,
          ambiguo: !!(g.nota && /ripiego/.test(g.nota))
        });
      }
    }
    return out;
  }

  function fileFonema(id) {
    const f = FONEMI[id];
    return f ? CARTELLA + f.file : null;
  }

  /**
   * Fonema della lettera `lettera` dentro `parola`, alla posizione
   * `posizione` (indice della lettera nella parola).
   *
   * Senza posizione si cerca la prima occorrenza della lettera che
   * produce un suono: è il caso del tap sulla tessera, quando la casella
   * non è ancora stata scelta. Con la posizione si risponde esattamente
   * per quella lettera, anche quando fa parte di un gruppo (la C di CENA
   * dà /tʃ/, la C di CASA dà /k/).
   *
   * Ritorna { fonema, file, ipa, gruppo, muta, ambiguo, parola, lettera }.
   * `fonema` è null solo quando la lettera è muta (H, I di CIA): il
   * chiamante non deve ripiegare sul nome della lettera, deve tacere.
   */
  function fonemaPerLettera(lettera, parola, posizione) {
    const L = normalizza(lettera).slice(0, 1);
    const w = normalizza(parola);
    const base = { lettera: L, parola: w, fonema: null, file: null, ipa: null,
      gruppo: null, muta: false, ambiguo: false };

    /* Lettera isolata, nessuna parola: è il caso di una tessera in un
       esercizio che non compone una parola. Valgono le associazioni
       semplici; per C, G, S, Z si sceglie il suono non marcato e lo si
       dichiara ambiguo (non si finge che sia l'unico). */
    if (!w) {
      const semplice = fonemaDi(L);
      if (semplice) return Object.assign(base, { fonema: semplice, file: fileFonema(semplice) });
      /* E e O isolate non hanno un lessico che dica se sono aperte: si sceglie
         la chiusa e la si dichiara ambigua, con la stessa regola dell'analisi
         della parola. Le cinque vocali del viaggio passano di qui. */
      const scelte = { e: "e", o: "o", c: "k", g: "g", s: "s",
        z: "z_sorda_affricata", h: null };
      if (L in scelte) {
        return Object.assign(base, {
          fonema: scelte[L], file: fileFonema(scelte[L]),
          muta: scelte[L] === null, ambiguo: L !== "h"
        });
      }
      return base;
    }

    const gruppi = analizzaParola(w);
    const pos = (typeof posizione === "number" && posizione >= 0) ? posizione : null;

    /* 1. la lettera sta dentro un gruppo: si risponde per quella lettera */
    if (pos !== null) {
      for (const g of gruppi) {
        if (pos < g.inizio || pos >= g.inizio + g.lunghezza) continue;
        const off = pos - g.inizio;
        const s = g.suoni.find(x => x.lettere.includes(off));
        const c = w[pos];
        if (!s || !s.id) {
          return Object.assign(base, {
            muta: true, gruppo: g.gruppo,
            nota: g.nota || "lettera muta nel gruppo"
          });
        }
        /* la lettera appartiene al gruppo ma il suono è di un'altra
           lettera (la C di SCIA suona già nella S di SCI): muta */
        if (!s.lettere.includes(off)) return Object.assign(base, { muta: true, gruppo: g.gruppo });
        return Object.assign(base, {
          fonema: s.id, file: fileFonema(s.id),
          ipa: FONEMI[s.id] ? FONEMI[s.id].ipa : null,
          gruppo: g.gruppo, muta: false,
          ambiguo: !!(g.nota && /ripiego/.test(g.nota)),
          nota: g.nota
        });
      }
      return base;
    }

    /* 2. nessuna posizione: prima occorrenza della lettera che suona */
    for (const g of gruppi) {
      const off = g.grafemi.indexOf(L);
      if (off < 0) continue;
      const s = g.suoni.find(x => x.lettere.includes(off));
      if (s && s.id) {
        return Object.assign(base, {
          fonema: s.id, file: fileFonema(s.id),
          ipa: FONEMI[s.id] ? FONEMI[s.id].ipa : null,
          gruppo: g.gruppo, ambiguo: !!(g.nota && /ripiego/.test(g.nota))
        });
      }
    }
    /* 3. la lettera c'è ma è sempre muta (H) */
    if (w.includes(L)) return Object.assign(base, { muta: true });
    return base;
  }

  /* ------------------------------------------------------------------
     5. GESTORE AUDIO — un solo posto che riproduce i fonemi

     Non usa la Web Speech API per le lettere: se il file manca lo dice
     (`errore`), non ripiega sul nome della lettera. Il nome è esattamente
     quello che il bambino non deve sentire.
     ------------------------------------------------------------------ */

  /**
   * Crea il gestore. `opzioni`:
   *   stopOther()  ferma l'audio dell'app (file e sintesi) prima di suonare
   *   volume()     volume corrente 0..1
   *   base         prefisso dei file (default "audio/fonemi/")
   *   intervallo   pausa fra due fonemi in sequenza, secondi (default 0.28)
   *   log(msg)     diagnostica degli errori
   *   creaAudio    sostituibile nei test (default: new Audio())
   */
  function creaGestoreAudio(opzioni) {
    const o = opzioni || {};
    const cache = new Map();
    let corrente = null;
    let fermato = false;
    /* la sequenza in corso: `stopPhoneme()` la annulla a metà, così toccare
       un'altra tessera non lascia in coda i suoni della parola precedente */
    let sequenzaCorrente = null;

    const base = o.base || CARTELLA;
    const log = o.log || (() => {});
    const creaAudio = o.creaAudio || (file => new Audio(file));
    /* L'intervallo può essere un numero o una funzione. L'app passa una
       funzione che legge le impostazioni a ogni ascolto: così il cursore
       «Pausa fra i suoni» ha effetto subito, senza ricreare il gestore. */
    const intervalloBase = o.intervallo;
    const intervallo = () => typeof intervalloBase === "function"
      ? intervalloBase()
      : (typeof intervalloBase === "number" ? intervalloBase : 0.28);

    function percorso(id) {
      const f = FONEMI[id];
      return f ? base + f.file : null;
    }

    function ferma() {
      fermato = true;
      if (corrente) {
        try { corrente.pause(); } catch (e) { /* già fermo */ }
        try { corrente.currentTime = 0; } catch (e) { /* non ancora caricato */ }
        corrente = null;
      }
      if (o.stopOther) { try { o.stopOther(); } catch (e) { /* ignora */ } }
    }

    /**
     * Riproduce un fonema. Ritorna una Promise risolta a fine suono
     * (true) oppure a suono non riprodotto (false): non lancia mai, così
     * un file mancante non può bloccare un esercizio.
     */
    function playPhoneme(id, opts) {
      const opz = opts || {};
      const file = percorso(id);
      if (!file) {
        log(`fonema sconosciuto: ${id}`);
        return Promise.resolve(false);
      }
      if (!opz.queue && !opz.sovrapponi) ferma();
      const mioStato = { annullato: false };
      if (!opz.sovrapponi) fermato = false;
      return new Promise(resolve => {
        let a;
        try { a = creaAudio(file); } catch (e) {
          log(`impossibile aprire ${file}`);
          return resolve(false);
        }
        corrente = a;
        a.preload = "auto";
        if (typeof o.volume === "function") {
          const v = o.volume();
          if (typeof v === "number") a.volume = Math.max(0, Math.min(1, v));
        }
        let finito = false;
        const fine = ok => {
          if (finito) return;
          finito = true;
          if (corrente === a) corrente = null;
          resolve(ok);
        };
        a.onended = () => fine(true);
        a.onerror = () => { log(`file del fonema assente o illeggibile: ${file}`); fine(false); };
        try {
          const p = a.play();
          /* Un play() rifiutato non è un file guasto: è il browser che nega
             l'autoplay senza un gesto dell'utente (prima apertura, test
             automatici). Il file vero e proprio lo segnala `onerror`, che
             sopra resta la diagnostica dei casi importanti. */
          if (p && p.catch) p.catch(() => fine(false));
        } catch (e) {
          log(`riproduzione non disponibile: ${file}`);
          fine(false);
        }
      });
    }

    /**
     * Riproduce il fonema di una lettera nel contesto della parola.
     * `contesto` = { parola, posizione }.
     * Ritorna { fonema, file, muta, ... } con in più `riprodotto` (bool).
     */
    function playLetter(lettera, contesto) {
      const ctx = contesto || {};
      const esito = fonemaPerLettera(lettera, ctx.parola, ctx.posizione);
      if (!esito.fonema) {
        /* lettera muta: si tace, non si dice il nome */
        return Promise.resolve(Object.assign({ riprodotto: false }, esito));
      }
      return playPhoneme(esito.fonema, ctx).then(ok =>
        Object.assign({ riprodotto: ok }, esito));
    }

    /** Riproduce in successione i suoni di una parola, con pausa. */
    function playPhonemeSequence(parola, opts) {
      const opz = opts || {};
      const lista = fonemiPerParola(parola, opz.trascrizione ? { trascrizione: opz.trascrizione } : undefined);
      const pausa = (typeof opz.intervallo === "number" ? opz.intervallo : intervallo()) * 1000;
      stopPhoneme();
      const mio = { annullato: false };
      sequenzaCorrente = mio;
      let i = 0;
      return new Promise(resolve => {
        if (!lista.length) return resolve(false);
        const next = () => {
          if (mio.annullato) return resolve(false);
          if (i >= lista.length) return resolve(true);
          const f = lista[i++];
          playPhoneme(f.id, { queue: true, sovrapponi: true }).then(ok => {
            if (mio.annullato) return resolve(false);
            if (!ok) return resolve(false);
            if (i >= lista.length) return resolve(true);
            setTimeout(next, pausa);
          });
        };
        next();
      });
    }

    function stopPhoneme() {
      if (sequenzaCorrente) sequenzaCorrente.annullato = true;
      sequenzaCorrente = null;
      ferma();
    }

    /** Precarga i file (evita il ritardo al primo tocco). */
    function preloadPhonemes(ids) {
      const lista = ids && ids.length ? ids : ID_FONEMI;
      const fatti = [];
      for (const id of lista) {
        const file = percorso(id);
        if (!file) { log(`fonema sconosciuto: ${id}`); continue; }
        if (cache.has(file)) continue;
        try {
          const a = creaAudio(file);
          a.preload = "auto";
          /* in alcuni browser il caricamento parte solo con load() */
          if (typeof a.load === "function") { try { a.load(); } catch (e) { /* ignora */ } }
          cache.set(file, a);
          fatti.push(id);
        } catch (e) {
          log(`precaricamento fallito: ${file}`);
        }
      }
      return fatti;
    }

    /**
     * Verifica che la libreria sia completa e coerente.
     * `opzioni.esiste(file)` → bool (in Node si passa fs.existsSync; nel
     * browser si può passare una funzione che interroga un indice).
     * Ritorna { ok, mancanti: [id], senzaFile: [id], problemi: [testo] }.
     */
    function validatePhonemeLibrary(opzioni) {
      const opz = opzioni || {};
      const mancanti = [];
      const problemi = [];
      for (const id of ID_FONEMI) {
        const f = FONEMI[id];
        if (!f || !f.file) { mancanti.push(id); continue; }
        if (opz.esiste && !opz.esiste(percorso(id))) {
          mancanti.push(id);
          problemi.push(`file mancante per /${f.ipa}/: ${percorso(id)}`);
        }
        if (!f.ipa) problemi.push(`fonema ${id}: simbolo IPA assente`);
      }
      /* i nomi dei file devono essere portabili su Windows */
      const visti = new Set();
      for (const id of ID_FONEMI) {
        const nome = FONEMI[id].file.toLowerCase();
        if (visti.has(nome)) problemi.push(`nome file duplicato: ${nome}`);
        visti.add(nome);
      }
      return { ok: mancanti.length === 0 && problemi.length === 0, mancanti, problemi };
    }

    return {
      getPhonemeForLetter: fonemaPerLettera,
      getPhonemesForWord: fonemiPerParola,
      playPhoneme,
      playLetter,
      playPhonemeSequence,
      stopPhoneme,
      preloadPhonemes,
      validatePhonemeLibrary,
      /* utilità */
      percorso,
      intervallo: () => intervallo(),
      fermaTutto: stopPhoneme
    };
  }

  return {
    CARTELLA,
    FONEMI,
    ID_FONEMI,
    LETTERE_SEMPICI,
    LESSICO,
    ECCEZIONI_GLI,
    normalizza,
    analizzaParola,
    fonemiPerParola,
    fonemaPerLettera,
    fileFonema,
    creaGestoreAudio
  };
});

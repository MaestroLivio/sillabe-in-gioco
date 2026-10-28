/* ==========================================================================
   SILLABE IN GIOCO — «Il viaggio delle sillabe»
   Dati didattici, validazione e generatore di esercizi.

   Questo file è la fonte unica dei contenuti del nuovo percorso. Non contiene
   alcun elemento di interfaccia: può essere caricato dal browser (espone
   `window.ViaggioDati`) e da Node (per i test e per la generazione di audio e
   immagini) con la stessa API.

   Regole di fondo:
   - la sillabazione è SEMPRE esplicita. Non si ricava mai cercando lettere
     all'inizio o alla fine di una parola: «MA» in MAMMA è la sillaba finale,
     non quella iniziale; «MU» in MUCCA non esiste (la prima sillaba è MUC).
   - ogni parola ha un'immagine e un audio previsti dal dizionario.
   - le unità di tipo «segmento» e «grafema» NON sono sillabe: le consegne lo
     dicono esplicitamente. Solo le unità di tipo «sillaba» sono soggette alla
     regola delle dieci attività per sillaba.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ViaggioDati = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ------------------------------------------------------------------
     0. COSTANTI E UTILITÀ
     ------------------------------------------------------------------ */
  const STATO = {
    CONVALIDATA: "convalidata",
    DA_RIVEDERE: "da_rivedere",
    PERSONALIZZATA: "personalizzata"
  };

  const COMPETENZE = [
    "uditivo", "grafico", "iniziale", "finale", "interna",
    "segmentazione", "composizione", "frase", "lettura", "posizione"
  ];

  const INTERAZIONI = ["scelta", "multipla", "ordina", "memory", "evidenzia", "costruisci"];

  const LIVELLI = [
    { id: 0, nome: "Prerequisiti e vocali", sottotitolo: "Ascoltare, riconoscere, discriminare", fase: "A–C", colore: "#38bdf8" },
    { id: 1, nome: "Prime famiglie sillabiche", sottotitolo: "M · P · L · T", fase: "B–D", colore: "#34d399" },
    { id: 2, nome: "Ampliamento delle famiglie", sottotitolo: "S · N · R · F", fase: "B–E", colore: "#a3e635" },
    { id: 3, nome: "Consolidamento e nuove consonanti", sottotitolo: "V · B · D · Z", fase: "C–F", colore: "#fbbf24" },
    { id: 4, nome: "Suoni di C e G", sottotitolo: "Duri, dolci, digrammi con H", fase: "C–G", colore: "#fb923c" },
    { id: 5, nome: "Gruppi ortografici particolari", sottotitolo: "CIA, GIA, SCA, GN, GLI, QU, CQU", fase: "D–H", colore: "#f472b6" },
    { id: 6, nome: "Sillabe inverse e segmenti", sottotitolo: "Vocali + consonante dentro le parole", fase: "E–G", colore: "#c084fc" },
    { id: 7, nome: "Strutture complesse", sottotitolo: "CVC, gruppi, doppie, dittonghi, accento", fase: "F–I", colore: "#818cf8" }
  ];

  /* Famiglie: ogni voce è una famiglia didattica. `unita` può essere una
     stringa (sillaba semplice) oppure un oggetto con tipo e note. */
  const FAMIGLIE = [
    { id: "VOCALI", nome: "Le vocali", livello: 0, emoji: "🔊", unita: ["A", "E", "I", "O", "U"] },
    { id: "M", nome: "La famiglia della M", livello: 1, emoji: "🅼", unita: ["MA", "ME", "MI", "MO", "MU"] },
    { id: "P", nome: "La famiglia della P", livello: 1, emoji: "🅿️", unita: ["PA", "PE", "PI", "PO", "PU"] },
    { id: "L", nome: "La famiglia della L", livello: 1, emoji: "🅻", unita: ["LA", "LE", "LI", "LO", "LU"] },
    { id: "T", nome: "La famiglia della T", livello: 1, emoji: "🆃", unita: ["TA", "TE", "TI", "TO", "TU"] },
    { id: "S", nome: "La famiglia della S", livello: 2, emoji: "🆂", unita: ["SA", "SE", "SI", "SO", "SU"] },
    { id: "N", nome: "La famiglia della N", livello: 2, emoji: "🅽", unita: ["NA", "NE", "NI", "NO", "NU"] },
    { id: "R", nome: "La famiglia della R", livello: 2, emoji: "🆁", unita: ["RA", "RE", "RI", "RO", "RU"] },
    { id: "F", nome: "La famiglia della F", livello: 2, emoji: "🅵", unita: ["FA", "FE", "FI", "FO", "FU"] },
    { id: "V", nome: "La famiglia della V", livello: 3, emoji: "🆅", unita: ["VA", "VE", "VI", "VO", { testo: "VU", tipo: "sillaba", nota: "Sillaba presente in «vuvuzela»; nel livello è affiancata da attività di ascolto e segmentazione." }] },
    { id: "B", nome: "La famiglia della B", livello: 3, emoji: "🅱️", unita: ["BA", "BE", "BI", "BO", "BU"] },
    { id: "D", nome: "La famiglia della D", livello: 3, emoji: "🅳", unita: ["DA", "DE", "DI", "DO", "DU"] },
    { id: "Z", nome: "La famiglia della Z", livello: 3, emoji: "🆉", unita: ["ZA", "ZE", "ZI", "ZO", { testo: "ZU", tipo: "grafema", nota: "In italiano «ZU» non forma una sillaba aperta autonoma: zucca, zuppa e zucchero hanno ZUC/ZUP. Qui si lavora sul gruppo di lettere, non sulla sillaba." }] },

    { id: "CA_CO_CU", nome: "C dura", livello: 4, emoji: "🔵", unita: ["CA", "CO", "CU"] },
    { id: "CE_CI", nome: "C dolce", livello: 4, emoji: "🟡", unita: ["CE", "CI"] },
    { id: "CHE_CHI", nome: "C dura con la H", livello: 4, emoji: "🔵", unita: ["CHE", "CHI"] },
    { id: "GA_GO_GU", nome: "G dura", livello: 4, emoji: "🟢", unita: ["GA", "GO", "GU"] },
    { id: "GE_GI", nome: "G dolce", livello: 4, emoji: "🟡", unita: ["GE", "GI"] },
    { id: "GHE_GHI", nome: "G dura con la H", livello: 4, emoji: "🟢", unita: ["GHE", "GHI"] },

    { id: "CIA_CIU", nome: "CIA · CIO · CIU", livello: 5, emoji: "🟠", unita: ["CIA", "CIO", "CIU"] },
    { id: "GIA_GIU", nome: "GIA · GIO · GIU", livello: 5, emoji: "🟣", unita: ["GIA", "GIO", "GIU"] },
    { id: "SCA_SCU", nome: "SCA · SCO · SCU", livello: 5, emoji: "🔷", unita: ["SCA", "SCO", "SCU"] },
    { id: "SCE_SCI", nome: "SCE · SCI", livello: 5, emoji: "🔶", unita: ["SCE", "SCI"] },
    { id: "SCIA_SCIU", nome: "SCIA · SCIO · SCIU", livello: 5, emoji: "🟦", unita: ["SCIA", "SCIO", "SCIU", { testo: "SCIE", tipo: "grafema", nota: "SCIE è un trigramma, non una sillaba: in «scienza» la divisione è SCIEN-ZA. Le attività riguardano il gruppo scritto." }] },
    { id: "GN", nome: "Il gruppo GN", livello: 5, emoji: "🟫", unita: ["GNA", "GNE", "GNI", "GNO", "GNU"] },
    { id: "GLI", nome: "Il gruppo GLI", livello: 5, emoji: "🟨", unita: ["GLIA", "GLIE", "GLIO", { testo: "GLI", tipo: "grafema", nota: "GLI è un digramma; la sillaba è GLIA, GLIE, GLIO. Le attività su GLI riguardano il gruppo scritto." }] },
    { id: "QU", nome: "QUA · QUE · QUI · QUO", livello: 5, emoji: "🟩", unita: ["QUA", "QUE", { testo: "QUI", tipo: "sillaba", nota: "«QUI» è una parola-sillaba; nelle altre parole il gruppo QUI è spesso dentro QUIE/QUIN." }, "QUO"] },
    { id: "CQU", nome: "CQU e ACQUA", livello: 5, emoji: "💧", unita: [{ testo: "ACQUA", tipo: "modulo", id: "MOD_ACQUA", nota: "Modulo di lettura e scrittura su CQU/ACQUA." }] },

    { id: "VC_NASALI", nome: "AM · EM · IM · OM · UM", livello: 6, emoji: "🫧", unita: [{ testo: "AM", tipo: "segmento" }, { testo: "EM", tipo: "segmento" }, { testo: "IM", tipo: "segmento" }, { testo: "OM", tipo: "segmento" }, { testo: "UM", tipo: "segmento" }] },
    { id: "VC_LIQUIDE", nome: "AL · EL · IL · OL · UL", livello: 6, emoji: "🌊", unita: [{ testo: "AL", tipo: "segmento" }, { testo: "EL", tipo: "segmento" }, { testo: "IL", tipo: "segmento" }, { testo: "OL", tipo: "segmento" }, { testo: "UL", tipo: "segmento" }] },
    { id: "VC_VIBRANTI", nome: "AR · ER · IR · OR · UR", livello: 6, emoji: "🎢", unita: [{ testo: "AR", tipo: "segmento" }, { testo: "ER", tipo: "segmento" }, { testo: "IR", tipo: "segmento" }, { testo: "OR", tipo: "segmento" }, { testo: "UR", tipo: "segmento" }] },
    { id: "VC_NASALI2", nome: "AN · EN · IN · ON · UN", livello: 6, emoji: "🎈", unita: [{ testo: "AN", tipo: "segmento" }, { testo: "EN", tipo: "segmento" }, { testo: "IN", tipo: "segmento" }, { testo: "ON", tipo: "segmento" }, { testo: "UN", tipo: "segmento" }] },

    { id: "CVC", nome: "Sillabe chiuse (CVC)", livello: 7, emoji: "🧱", unita: [{ testo: "SILLABE CHIUSE", tipo: "modulo", id: "MOD_CVC", nota: "GAT, MAM, PAL, GOM, MUC… dentro parole vere." }] },
    { id: "GRUPPI_LR", nome: "Gruppi con L e R", livello: 7, emoji: "🌪️", unita: [{ testo: "BR · CR · DR · FR · GR · PR · TR · BL · CL · FL · GL · PL", tipo: "modulo", id: "MOD_GRUPPI_LR", nota: "Modulo sui gruppi consonantici." }] },
    { id: "S_GRUPPI", nome: "Gruppi con S", livello: 7, emoji: "⭐", unita: [{ testo: "SPA · STA · SCA…", tipo: "modulo", id: "MOD_S_GRUPPI", nota: "Modulo sui gruppi S + consonante." }] },
    { id: "DOPPIE", nome: "Doppie consonanti", livello: 7, emoji: "👯", unita: [{ testo: "DOPPIE", tipo: "modulo", id: "MOD_DOPPIE", nota: "Modulo sulle consonanti doppie." }] },
    { id: "DITTONGHI", nome: "Dittonghi e trittonghi", livello: 7, emoji: "🌈", unita: [{ testo: "DITTONGHI", tipo: "modulo", id: "MOD_DITTONGHI", nota: "Modulo sui gruppi di vocali." }] },
    { id: "POLISILLABE", nome: "Parole polisillabiche", livello: 7, emoji: "🏙️", unita: [{ testo: "PAROLE LUNGHE", tipo: "modulo", id: "MOD_POLISILLABE", nota: "Modulo sulle parole di quattro o più sillabe." }] },
    { id: "ACCENTO", nome: "Accento tonico", livello: 7, emoji: "🎵", unita: [{ testo: "ACCENTO", tipo: "modulo", id: "MOD_ACCENTO", nota: "Modulo sull'accento tonico." }] },
    { id: "TRAPPOLE", nome: "Sillaba o semplice lettera?", livello: 7, emoji: "🔍", unita: [{ testo: "TRAPPOLE", tipo: "modulo", id: "MOD_TRAPPOLE", nota: "MA in MAMMA, MU in MUCCA, GA in GATTO, CHI in CHIAVE, ZA in ZAINO." }] }
  ];

  /* Costruzione delle unità: id stabile, tipo, famiglia, livello, prerequisiti. */
  const UNITA = [];
  FAMIGLIE.forEach((fam, famIndex) => {
    fam.unita.forEach((raw, idx) => {
      const spec = typeof raw === "string" ? { testo: raw } : raw;
      const testo = spec.testo;
      const tipo = spec.tipo || "sillaba";
      const id = spec.id || testo;
      const prevFam = FAMIGLIE[famIndex - 1];
      const prereq = [];
      if (idx > 0) prereq.push(fam.unita[idx - 1].testo || fam.unita[idx - 1]);
      else if (prevFam) prereq.push(prevFam.unita[prevFam.unita.length - 1].testo || prevFam.unita[prevFam.unita.length - 1]);
      UNITA.push({
        id,
        testo,
        tipo,
        famiglia: fam.id,
        famigliaNome: fam.nome,
        livello: fam.livello,
        emoji: fam.emoji,
        pronuncia: spec.pronuncia || testo.toLowerCase(),
        audioKey: tipo === "modulo" ? null : (spec.audioKey || testo.toLowerCase()),
        prerequisiti: spec.prerequisiti || prereq,
        difficolta: fam.livello <= 1 ? 1 : fam.livello <= 3 ? 2 : fam.livello <= 5 ? 3 : 4,
        statoRevisione: spec.statoRevisione || STATO.CONVALIDATA,
        nota: spec.nota || "",
        ordine: famIndex * 100 + idx
      });
    });
  });

  const PER_ID = {};
  UNITA.forEach(u => { PER_ID[u.id] = u; });
  const PER_TESTO = {};
  UNITA.forEach(u => { if (!PER_TESTO[u.testo]) PER_TESTO[u.testo] = u; });

  function unita(testoOrId) {
    return PER_ID[testoOrId] || PER_TESTO[testoOrId] || null;
  }

  /* ------------------------------------------------------------------
     1. DIZIONARIO VISIVO E SONORO
     ------------------------------------------------------------------
     Ogni parola dichiara la propria sillabazione. `img` può essere:
       "42"      → illustrazione già presente in illustrations/42.png
       "@🍎"     → scheda illustrata generata in illustrations/parole/<id>.svg
       null      → nessuna immagine: il test la segnala come errore
     ------------------------------------------------------------------ */
  const PAROLE_RAW = [];
  function P(id, testo, sillabe, img, categoria, livelloLessicale, opts) {
    PAROLE_RAW.push({ id, testo, sillabe, img, categoria, livelloLessicale, opts: opts || {} });
  }

  /* --- Livello 0 · vocali --- */
  P("ape", "APE", "A-PE", "41", "animali", 1, { alt: "Un'ape sul prato" });
  P("ago", "AGO", "A-GO", "@🪡", "oggetti", 1, { alt: "Un ago da cucito" });
  P("arancia", "ARANCIA", "A-RAN-CIA", "@🍊", "cibo", 1, { alt: "Un'arancia" });
  P("amico", "AMICO", "A-MI-CO", "@🧑‍🤝‍🧑", "persone", 1, { alt: "Due amici" });
  P("aria", "ARIA", "A-RIA", "@💨", "natura", 1, { alt: "Il vento" });

  P("elefante", "ELEFANTE", "E-LE-FAN-TE", "@🐘", "animali", 1, { alt: "Un elefante" });
  P("elica", "ELICA", "E-LI-CA", "@🚁", "oggetti", 2, { alt: "L'elica di un elicottero" });
  P("eroe", "EROE", "E-RO-E", "@🦸", "persone", 2, { alt: "Un eroe" });
  P("edera", "EDERA", "E-DE-RA", "@🌿", "natura", 1, { alt: "Una pianta di edera" });

  P("isola", "ISOLA", "I-SO-LA", "@🏝️", "luoghi", 1, { alt: "Un'isola" });
  P("idea", "IDEA", "I-DE-A", "@💡", "astratto", 2, { alt: "Una lampadina accesa: un'idea" });
  P("igloo", "IGLOO", "I-GLOO", "@🛖", "luoghi", 1, { alt: "Un igloo" });
  P("ibisco", "IBISCO", "I-BI-SCO", "@🌺", "natura", 2, { alt: "Un fiore di ibisco" });

  P("oro", "ORO", "O-RO", "@🪙", "oggetti", 1, { alt: "Una moneta d'oro" });
  P("orologio", "OROLOGIO", "O-RO-LO-GIO", "@⏰", "oggetti", 1, { alt: "Un orologio" });
  P("omelette", "OMELETTE", "O-ME-LET-TE", "@🍳", "cibo", 1, { alt: "Una omelette" });
  P("ospedale", "OSPEDALE", "O-SPE-DA-LE", "@🏥", "luoghi", 2, { alt: "Un ospedale" });

  P("uva", "UVA", "U-VA", "@🍇", "cibo", 1, { alt: "Un grappolo d'uva" });
  P("unicorno", "UNICORNO", "U-NI-COR-NO", "@🦄", "animali", 2, { alt: "Un unicorno" });
  P("universo", "UNIVERSO", "U-NI-VER-SO", "@🌌", "natura", 2, { alt: "Le stelle dell'universo" });

  /* --- Livello 1 · M --- */
  P("mare", "MARE", "MA-RE", "@🌊", "natura", 1, { alt: "Il mare con le onde" });
  P("mano", "MANO", "MA-NO", "@✋", "corpo", 1, { alt: "Una mano aperta" });
  P("matita", "MATITA", "MA-TI-TA", "@✏️", "scuola", 1, { alt: "Una matita" });
  P("mago", "MAGO", "MA-GO", "@🧙", "persone", 1, { alt: "Un mago" });
  P("gatto", "GATTO", "GAT-TO", "49", "animali", 1, { alt: "Un gatto" });
  P("mamma", "MAMMA", "MAM-MA", "@👩‍👦", "persone", 1, { alt: "Una mamma", nota: "La prima sillaba è MAM, non MA: MA è la sillaba finale." });

  P("mela", "MELA", "ME-LA", "42", "cibo", 1, { alt: "Una mela" });
  P("medico", "MEDICO", "ME-DI-CO", "@👨‍⚕️", "persone", 1, { alt: "Un medico" });
  P("merenda", "MERENDA", "ME-REN-DA", "@🍪", "cibo", 1, { alt: "Una merenda con un biscotto" });
  P("melone", "MELONE", "ME-LO-NE", "@🍈", "cibo", 1, { alt: "Un melone" });

  P("mimo", "MIMO", "MI-MO", "@🎭", "persone", 1, { alt: "Un mimo con la maschera" });
  P("mimosa", "MIMOSA", "MI-MO-SA", "@🌼", "natura", 1, { alt: "Un fiore di mimosa" });
  P("minestra", "MINESTRA", "MI-NE-STRA", "@🍲", "cibo", 1, { alt: "Una scodella di minestra" });
  P("microfono", "MICROFONO", "MI-CRO-FO-NO", "@🎤", "oggetti", 2, { alt: "Un microfono" });

  P("moto", "MOTO", "MO-TO", "@🏍️", "trasporti", 1, { alt: "Una moto" });
  P("mora", "MORA", "MO-RA", "@🫐", "cibo", 1, { alt: "Una mora" });
  P("moneta", "MONETA", "MO-NE-TA", "@🪙", "oggetti", 1, { alt: "Una moneta" });
  P("mostro", "MOSTRO", "MO-STRO", "@👾", "giochi", 1, { alt: "Un mostro buffo" });

  P("mulo", "MULO", "MU-LO", "@🫏", "animali", 1, { alt: "Un mulo", nota: "MU è la sillaba iniziale di MULO, ma non di MUCCA (MUC-CA)." });
  P("muro", "MURO", "MU-RO", "@🧱", "oggetti", 1, { alt: "Un muro di mattoni" });
  P("museo", "MUSEO", "MU-SE-O", "@🏛️", "luoghi", 2, { alt: "Un museo" });
  P("muratore", "MURATORE", "MU-RA-TO-RE", "@👷", "persone", 2, { alt: "Un muratore" });

  /* --- Livello 1 · P --- */
  P("pala", "PALA", "PA-LA", "@⛏️", "oggetti", 1, { alt: "Una pala" });
  P("pane", "PANE", "PA-NE", "45", "cibo", 1, { alt: "Un filone di pane" });
  P("papa", "PAPÀ", "PA-PÀ", "@👨", "persone", 1, { alt: "Un papà" });
  P("pavone", "PAVONE", "PA-VO-NE", "@🦚", "animali", 1, { alt: "Un pavone" });
  P("patata", "PATATA", "PA-TA-TA", "@🥔", "cibo", 1, { alt: "Una patata" });

  P("pera", "PERA", "PE-RA", "@🍐", "cibo", 1, { alt: "Una pera" });
  P("pesce", "PESCE", "PE-SCE", "51", "animali", 1, { alt: "Un pesce" });
  P("peperone", "PEPERONE", "PE-PE-RO-NE", "@🫑", "cibo", 1, { alt: "Un peperone" });
  P("peluche", "PELUCHE", "PE-LU-CHE", "@🧸", "giochi", 1, { alt: "Un peluche" });

  P("pipa", "PIPA", "PI-PA", "@🪈", "oggetti", 1, { alt: "Una pipa di legno", nota: "Immagine neutra, senza fumo: la parola è usata solo per il suono PI." });
  P("pino", "PINO", "PI-NO", "@🌲", "natura", 1, { alt: "Un pino" });
  P("pirata", "PIRATA", "PI-RA-TA", "@🏴‍☠️", "persone", 1, { alt: "Un pirata" });
  P("pila", "PILA", "PI-LA", "@🔋", "oggetti", 1, { alt: "Una pila" });

  P("pomodoro", "POMODORO", "PO-MO-DO-RO", "@🍅", "cibo", 1, { alt: "Un pomodoro" });
  P("polenta", "POLENTA", "PO-LEN-TA", "@🥣", "cibo", 1, { alt: "Una scodella di polenta" });
  P("popone", "POPONE", "PO-PO-NE", "@🍈", "cibo", 2, { alt: "Un popone" });
  P("poeta", "POETA", "PO-E-TA", "@📜", "persone", 2, { alt: "Un poeta con un foglio" });

  P("puma", "PUMA", "PU-MA", "@🐆", "animali", 1, { alt: "Un puma" });
  P("pugno", "PUGNO", "PU-GNO", "@✊", "corpo", 1, { alt: "Un pugno chiuso" });
  P("pupazzo", "PUPAZZO", "PU-PAZ-ZO", "@🧸", "giochi", 1, { alt: "Un pupazzo" });

  /* --- Livello 1 · L --- */
  P("lana", "LANA", "LA-NA", "@🧶", "oggetti", 1, { alt: "Un gomitolo di lana" });
  P("lago", "LAGO", "LA-GO", "@🏞️", "natura", 1, { alt: "Un lago" });
  P("lapis", "LAPIS", "LA-PIS", "@✏️", "scuola", 1, { alt: "Una matita lapis" });
  P("lavagna", "LAVAGNA", "LA-VA-GNA", "@📋", "scuola", 2, { alt: "Una lavagna" });

  P("leone", "LEONE", "LE-O-NE", "@🦁", "animali", 1, { alt: "Un leone" });
  P("leva", "LEVA", "LE-VA", "@🔧", "oggetti", 2, { alt: "Una leva" });
  P("lepre", "LEPRE", "LE-PRE", "@🐇", "animali", 1, { alt: "Una lepre" });
  P("legno", "LEGNO", "LE-GNO", "@🪵", "natura", 1, { alt: "Un pezzo di legno" });

  P("lima", "LIMA", "LI-MA", "@🔧", "oggetti", 2, { alt: "Una lima" });
  P("libro", "LIBRO", "LI-BRO", "58", "scuola", 1, { alt: "Un libro aperto" });
  P("limone", "LIMONE", "LI-MO-NE", "@🍋", "cibo", 1, { alt: "Un limone" });
  P("lido", "LIDO", "LI-DO", "@🏖️", "luoghi", 2, { alt: "Un lido con la spiaggia" });

  P("loto", "LOTO", "LO-TO", "@🪷", "natura", 1, { alt: "Un fiore di loto" });
  P("locomotiva", "LOCOMOTIVA", "LO-CO-MO-TI-VA", "@🚂", "trasporti", 2, { alt: "Una locomotiva" });

  P("luna", "LUNA", "LU-NA", "44", "natura", 1, { alt: "La luna" });
  P("luce", "LUCE", "LU-CE", "@💡", "natura", 1, { alt: "Una lampadina accesa" });
  P("lupo", "LUPO", "LU-PO", "@🐺", "animali", 1, { alt: "Un lupo" });
  P("lume", "LUME", "LU-ME", "@🕯️", "oggetti", 1, { alt: "Una candela accesa" });

  /* --- Livello 1 · T --- */
  P("tavolo", "TAVOLO", "TA-VO-LO", "@🪑", "oggetti", 1, { alt: "Un tavolo" });
  P("tana", "TANA", "TA-NA", "@🕳️", "luoghi", 1, { alt: "Una tana" });
  P("taglio", "TAGLIO", "TA-GLIO", "@✂️", "azioni", 1, { alt: "Delle forbici che tagliano" });
  P("tavoletta", "TAVOLETTA", "TA-VO-LET-TA", "@📋", "scuola", 2, { alt: "Una tavoletta per scrivere" });

  P("tela", "TELA", "TE-LA", "@🧵", "oggetti", 1, { alt: "Un tessuto di tela" });
  P("tema", "TEMA", "TE-MA", "@📝", "scuola", 2, { alt: "Un tema scritto" });
  P("telefono", "TELEFONO", "TE-LE-FO-NO", "@📞", "oggetti", 2, { alt: "Un telefono" });
  P("teiera", "TEIERA", "TE-IE-RA", "@🫖", "oggetti", 2, { alt: "Una teiera" });

  P("tigre", "TIGRE", "TI-GRE", "@🐯", "animali", 1, { alt: "Una tigre" });
  P("timone", "TIMONE", "TI-MO-NE", "@⛵", "trasporti", 2, { alt: "Il timone di una barca" });
  P("timo", "TIMO", "TI-MO", "@🌿", "natura", 2, { alt: "Una piantina di timo" });

  P("topo", "TOPO", "TO-PO", "53", "animali", 1, { alt: "Un topo" });
  P("toro", "TORO", "TO-RO", "@🐂", "animali", 1, { alt: "Un toro" });
  P("tovaglia", "TOVAGLIA", "TO-VA-GLIA", "@🍽️", "oggetti", 2, { alt: "Una tovaglia apparecchiata" });

  P("tuta", "TUTA", "TU-TA", "@🧥", "abbigliamento", 1, { alt: "Una tuta" });
  P("tubo", "TUBO", "TU-BO", "@🧴", "oggetti", 1, { alt: "Un tubo" });
  P("tulipano", "TULIPANO", "TU-LI-PA-NO", "@🌷", "natura", 2, { alt: "Un tulipano" });

  /* --- Livello 2 · S --- */
  P("sale", "SALE", "SA-LE", "@🧂", "cibo", 1, { alt: "Un sale" });
  P("sapone", "SAPONE", "SA-PO-NE", "@🧼", "oggetti", 1, { alt: "Una saponetta" });
  P("salame", "SALAME", "SA-LA-ME", "@🥓", "cibo", 1, { alt: "Una fetta di salame" });
  P("salice", "SALICE", "SA-LI-CE", "@🌳", "natura", 2, { alt: "Un salice" });

  P("sedia", "SEDIA", "SE-DIA", "@🪑", "oggetti", 1, { alt: "Una sedia" });
  P("seta", "SETA", "SE-TA", "@🧵", "oggetti", 1, { alt: "Un filo di seta" });
  P("sera", "SERA", "SE-RA", "@🌆", "natura", 1, { alt: "Il cielo della sera" });
  P("sedano", "SEDANO", "SE-DA-NO", "@🥬", "cibo", 1, { alt: "Un sedano" });

  P("sirena", "SIRENA", "SI-RE-NA", "@🧜‍♀️", "animali", 1, { alt: "Una sirena" });
  P("siringa", "SIRINGA", "SI-RIN-GA", "@💉", "oggetti", 2, { alt: "Una siringa" });
  P("sipario", "SIPARIO", "SI-PA-RIO", "@🎭", "oggetti", 2, { alt: "Un sipario del teatro" });
  P("silenzio", "SILENZIO", "SI-LEN-ZIO", "@🤫", "astratto", 2, { alt: "Un dito sulle labbra: silenzio" });

  P("sole", "SOLE", "SO-LE", "43", "natura", 1, { alt: "Il sole" });
  P("sonaglio", "SONAGLIO", "SO-NA-GLIO", "@🔔", "giochi", 1, { alt: "Un sonaglio" });
  P("sorella", "SORELLA", "SO-REL-LA", "@👧", "persone", 1, { alt: "Una sorella" });
  P("sofa", "SOFÀ", "SO-FÀ", "@🛋️", "oggetti", 1, { alt: "Un divano" });

  P("sugo", "SUGO", "SU-GO", "@🥫", "cibo", 1, { alt: "Un barattolo di sugo" });
  P("susina", "SUSINA", "SU-SI-NA", "@🫐", "cibo", 1, { alt: "Una susina" });
  P("sughero", "SUGHERO", "SU-GHE-RO", "@🍾", "oggetti", 2, { alt: "Un tappo di sughero" });

  /* --- Livello 2 · N --- */
  P("nave", "NAVE", "NA-VE", "57", "trasporti", 1, { alt: "Una nave" });
  P("naso", "NASO", "NA-SO", "@👃", "corpo", 1, { alt: "Un naso" });
  P("natale", "NATALE", "NA-TA-LE", "@🎄", "feste", 1, { alt: "Un albero di Natale" });

  P("neve", "NEVE", "NE-VE", "@❄️", "natura", 1, { alt: "Un fiocco di neve" });
  P("nero", "NERO", "NE-RO", "@⚫", "colori", 1, { alt: "Un cerchio nero" });
  P("nespola", "NESPOLA", "NE-SPO-LA", "@🍊", "cibo", 2, { alt: "Una nespola" });
  P("negozio", "NEGOZIO", "NE-GO-ZIO", "@🏪", "luoghi", 1, { alt: "Un negozio" });

  P("nido", "NIDO", "NI-DO", "@🪺", "natura", 1, { alt: "Un nido" });
  P("nipote", "NIPOTE", "NI-PO-TE", "@👦", "persone", 1, { alt: "Un nipote" });

  P("nome", "NOME", "NO-ME", "@🏷️", "astratto", 1, { alt: "Un cartellino con un nome" });
  P("nodo", "NODO", "NO-DO", "@🪢", "oggetti", 1, { alt: "Un nodo" });
  P("noce", "NOCE", "NO-CE", "@🌰", "cibo", 1, { alt: "Una noce" });
  P("nove", "NOVE", "NO-VE", "@9️⃣", "numeri", 1, { alt: "Il numero nove" });

  P("nuvola", "NUVOLA", "NU-VO-LA", "@☁️", "natura", 1, { alt: "Una nuvola" });
  P("nucleo", "NUCLEO", "NU-CLE-O", "@⚛️", "astratto", 3, { alt: "Il nucleo di un atomo" });
  P("nube", "NUBE", "NU-BE", "@☁️", "natura", 1, { alt: "Una nube" });
  P("nutria", "NUTRIA", "NU-TRIA", "@🦫", "animali", 2, { alt: "Una nutria" });

  /* --- Livello 2 · R --- */
  P("rana", "RANA", "RA-NA", "52", "animali", 1, { alt: "Una rana" });
  P("ramo", "RAMO", "RA-MO", "@🌿", "natura", 1, { alt: "Un ramo" });
  P("radio", "RADIO", "RA-DIO", "@📻", "oggetti", 1, { alt: "Una radio" });
  P("rasoio", "RASOIO", "RA-SO-IO", "@🪒", "oggetti", 2, { alt: "Un rasoio" });

  P("regalo", "REGALO", "RE-GA-LO", "@🎁", "giochi", 1, { alt: "Un regalo" });
  P("remo", "REMO", "RE-MO", "@🚣", "trasporti", 1, { alt: "Un remo" });
  P("rete", "RETE", "RE-TE", "@🥅", "giochi", 1, { alt: "Una rete da gioco" });
  P("regina", "REGINA", "RE-GI-NA", "@👸", "persone", 1, { alt: "Una regina" });

  P("riso", "RISO", "RI-SO", "@🍚", "cibo", 1, { alt: "Una ciotola di riso" });
  P("riga", "RIGA", "RI-GA", "@📏", "scuola", 1, { alt: "Una riga" });
  P("riva", "RIVA", "RI-VA", "@🏞️", "natura", 1, { alt: "La riva di un lago" });
  P("rimorchio", "RIMORCHIO", "RI-MOR-CHIO", "@🚛", "trasporti", 2, { alt: "Un rimorchio" });

  P("rosa", "ROSA", "RO-SA", "@🌹", "natura", 1, { alt: "Una rosa" });
  P("robot", "ROBOT", "RO-BOT", "@🤖", "giochi", 1, { alt: "Un robot" });
  P("rotella", "ROTELLA", "RO-TEL-LA", "@🛞", "oggetti", 1, { alt: "Una rotella" });
  P("rospo", "ROSPO", "RO-SPO", "@🐸", "animali", 1, { alt: "Un rospo" });

  P("rubinetto", "RUBINETTO", "RU-BI-NET-TO", "@🚰", "oggetti", 1, { alt: "Un rubinetto" });
  P("ruspa", "RUSPA", "RU-SPA", "@🚜", "trasporti", 1, { alt: "Una ruspa" });
  P("rumore", "RUMORE", "RU-MO-RE", "@🔊", "astratto", 2, { alt: "Un altoparlante che fa rumore" });
  P("ruga", "RUGA", "RU-GA", "@🧓", "corpo", 2, { alt: "Le rughe di un viso" });

  /* --- Livello 2 · F --- */
  P("fata", "FATA", "FA-TA", "@🧚", "persone", 1, { alt: "Una fata" });
  P("fagiolo", "FAGIOLO", "FA-GIO-LO", "@🫘", "cibo", 1, { alt: "Un fagiolo" });
  P("faro", "FARO", "FA-RO", "48", "luoghi", 1, { alt: "Un faro" });
  P("falena", "FALENA", "FA-LE-NA", "@🦋", "animali", 1, { alt: "Una falena" });

  P("fenice", "FENICE", "FE-NI-CE", "@🦅", "animali", 2, { alt: "Una fenice" });
  P("femore", "FEMORE", "FE-MO-RE", "@🦴", "corpo", 2, { alt: "Il femore, un osso della gamba" });

  P("filo", "FILO", "FI-LO", "@🧵", "oggetti", 1, { alt: "Un filo" });
  P("fico", "FICO", "FI-CO", "@🫐", "cibo", 1, { alt: "Un fico" });
  P("fischio", "FISCHIO", "FI-SCHIO", "@📣", "oggetti", 1, { alt: "Un fischietto" });

  P("foca", "FOCA", "FO-CA", "@🦭", "animali", 1, { alt: "Una foca" });
  P("foglia", "FOGLIA", "FO-GLIA", "@🍃", "natura", 1, { alt: "Una foglia" });
  P("focolare", "FOCOLARE", "FO-CO-LA-RE", "@🔥", "oggetti", 2, { alt: "Un focolare acceso" });

  P("fumo", "FUMO", "FU-MO", "@💨", "astratto", 1, { alt: "Del fumo" });
  P("fuga", "FUGA", "FU-GA", "@🏃", "azioni", 1, { alt: "Una persona che fugge" });
  P("fusto", "FUSTO", "FU-STO", "@🌱", "natura", 1, { alt: "Il fusto di una pianta" });

  /* --- Livello 3 · V --- */
  P("vaso", "VASO", "VA-SO", "@🏺", "oggetti", 1, { alt: "Un vaso" });
  P("vasca", "VASCA", "VA-SCA", "@🛁", "oggetti", 1, { alt: "Una vasca da bagno" });
  P("vaniglia", "VANIGLIA", "VA-NI-GLIA", "@🌼", "cibo", 2, { alt: "Un fiore di vaniglia" });
  P("vapore", "VAPORE", "VA-PO-RE", "@♨️", "natura", 2, { alt: "Del vapore" });

  P("vela", "VELA", "VE-LA", "@⛵", "trasporti", 1, { alt: "Una vela" });
  P("vespa", "VESPA", "VE-SPA", "@🐝", "animali", 1, { alt: "Una vespa" });
  P("vetro", "VETRO", "VE-TRO", "@🪟", "oggetti", 1, { alt: "Un vetro" });

  P("vino", "VINO", "VI-NO", "@🍷", "cibo", 2, { alt: "Un bicchiere di vino" });
  P("vite", "VITE", "VI-TE", "@🍇", "natura", 1, { alt: "Una vite con l'uva" });
  P("viso", "VISO", "VI-SO", "@😊", "corpo", 1, { alt: "Un viso sorridente" });

  P("volo", "VOLO", "VO-LO", "@✈️", "trasporti", 1, { alt: "Un aereo in volo" });
  P("volante", "VOLANTE", "VO-LAN-TE", "@🕹️", "oggetti", 2, { alt: "Un volante" });
  P("voce", "VOCE", "VO-CE", "@🗣️", "corpo", 1, { alt: "Una voce che parla" });

  P("vuvuzela", "VUVUZELA", "VU-VU-ZE-LA", "@📯", "oggetti", 2, { alt: "Una vuvuzela" });

  /* --- Livello 3 · B --- */
  P("banana", "BANANA", "BA-NA-NA", "@🍌", "cibo", 1, { alt: "Una banana" });
  P("balena", "BALENA", "BA-LE-NA", "@🐋", "animali", 1, { alt: "Una balena" });
  P("bagno", "BAGNO", "BA-GNO", "61", "luoghi", 1, { alt: "Un bagno" });

  P("bene", "BENE", "BE-NE", "@👍", "astratto", 1, { alt: "Un pollice in su: bene" });
  P("bere", "BERE", "BE-RE", "@🥤", "azioni", 1, { alt: "Una persona che beve" });
  P("bevanda", "BEVANDA", "BE-VAN-DA", "@🧃", "cibo", 1, { alt: "Una bevanda" });

  P("bici", "BICI", "BI-CI", "@🚲", "trasporti", 1, { alt: "Una bicicletta" });
  P("bilancia", "BILANCIA", "BI-LAN-CIA", "@⚖️", "oggetti", 1, { alt: "Una bilancia" });
  P("biscotto", "BISCOTTO", "BI-SCOT-TO", "@🍪", "cibo", 1, { alt: "Un biscotto" });
  P("bidone", "BIDONE", "BI-DO-NE", "@🗑️", "oggetti", 1, { alt: "Un bidone" });

  P("boa", "BOA", "BO-A", "@🐍", "animali", 1, { alt: "Un boa" });
  P("bosco", "BOSCO", "BO-SCO", "@🌳", "natura", 1, { alt: "Un bosco" });
  P("bove", "BOVE", "BO-VE", "@🐂", "animali", 2, { alt: "Un bove" });

  P("budino", "BUDINO", "BU-DI-NO", "@🍮", "cibo", 1, { alt: "Un budino" });
  P("bufalo", "BUFALO", "BU-FA-LO", "@🐃", "animali", 1, { alt: "Un bufalo" });
  P("bue", "BUE", "BU-E", "@🐂", "animali", 1, { alt: "Un bue" });

  /* --- Livello 3 · D --- */
  P("dado", "DADO", "DA-DO", "47", "giochi", 1, { alt: "Un dado" });
  P("dama", "DAMA", "DA-MA", "@♟️", "giochi", 1, { alt: "Una dama del gioco" });

  P("denaro", "DENARO", "DE-NA-RO", "@💰", "oggetti", 1, { alt: "Un sacchetto di denaro" });
  P("deserto", "DESERTO", "DE-SER-TO", "@🏜️", "natura", 1, { alt: "Un deserto" });

  P("dito", "DITO", "DI-TO", "@👆", "corpo", 1, { alt: "Un dito" });
  P("divano", "DIVANO", "DI-VA-NO", "@🛋️", "oggetti", 1, { alt: "Un divano" });
  P("diga", "DIGA", "DI-GA", "@🚧", "luoghi", 1, { alt: "Una diga" });

  P("domino", "DOMINO", "DO-MI-NO", "@🎲", "giochi", 1, { alt: "Una tessera del domino" });
  P("dono", "DONO", "DO-NO", "@🎁", "giochi", 1, { alt: "Un dono" });
  P("domenica", "DOMENICA", "DO-ME-NI-CA", "@📅", "tempo", 1, { alt: "Un calendario con la domenica" });

  P("duca", "DUCA", "DU-CA", "@🤴", "persone", 2, { alt: "Un duca" });
  P("due", "DUE", "DU-E", "@2️⃣", "numeri", 1, { alt: "Il numero due" });

  /* --- Livello 3 · Z --- */
  P("zabaione", "ZABAIONE", "ZA-BA-IO-NE", "@🍮", "cibo", 2, { alt: "Una coppa di zabaione" });
  P("zagara", "ZAGARA", "ZA-GA-RA", "@🌼", "natura", 2, { alt: "Un fiore di zagara" });

  P("zebra", "ZEBRA", "ZE-BRA", "@🦓", "animali", 1, { alt: "Una zebra" });
  P("zero", "ZERO", "ZE-RO", "@0️⃣", "numeri", 1, { alt: "Il numero zero" });

  P("zia", "ZIA", "ZI-A", "@👩‍🦰", "persone", 1, { alt: "Una zia" });
  P("zio", "ZIO", "ZIO", "@👨", "persone", 1, { alt: "Uno zio" });
  P("zii", "ZII", "ZI-I", "@👬", "persone", 1, { alt: "Due zii" });

  P("zoo", "ZOO", "ZO-O", "@🦁", "luoghi", 1, { alt: "Un leone allo zoo" });
  P("zona", "ZONA", "ZO-NA", "@🗺️", "luoghi", 1, { alt: "Una zona sulla mappa" });

  /* Parole per il gruppo ZU (non sillaba aperta) */
  P("zuppa", "ZUPPA", "ZUP-PA", "@🍲", "cibo", 1, { alt: "Una zuppa", nota: "Il gruppo ZU è dentro ZUP, non è una sillaba autonoma." });
  P("zucchero", "ZUCCHERO", "ZUC-CHE-RO", "@🍬", "cibo", 1, { alt: "Delle zollette di zucchero", nota: "Il gruppo ZU è dentro ZUC." });
  P("zucca", "ZUCCA", "ZUC-CA", "@🎃", "cibo", 1, { alt: "Una zucca", nota: "Il gruppo ZU è dentro ZUC." });

  /* --- Livello 4 · C e G --- */
  P("casa", "CASA", "CA-SA", "46", "luoghi", 1, { alt: "Una casa" });
  P("cane", "CANE", "CA-NE", "50", "animali", 1, { alt: "Un cane" });
  P("camera", "CAMERA", "CA-ME-RA", "@🛏️", "luoghi", 1, { alt: "Una camera da letto" });
  P("cavolo", "CAVOLO", "CA-VO-LO", "@🥬", "cibo", 1, { alt: "Un cavolo" });

  P("coniglio", "CONIGLIO", "CO-NI-GLIO", "@🐰", "animali", 1, { alt: "Un coniglio" });
  P("cocomero", "COCOMERO", "CO-CO-ME-RO", "@🍉", "cibo", 1, { alt: "Un cocomero" });
  P("corona", "CORONA", "CO-RO-NA", "@👑", "oggetti", 1, { alt: "Una corona" });
  P("cono", "CONO", "CO-NO", "@🍦", "cibo", 1, { alt: "Un cono gelato" });

  P("cubo", "CUBO", "CU-BO", "@🧊", "oggetti", 1, { alt: "Un cubo" });
  P("cucina", "CUCINA", "CU-CI-NA", "@🍳", "luoghi", 1, { alt: "Una cucina" });

  P("cena", "CENA", "CE-NA", "@🍽️", "cibo", 1, { alt: "Una tavola apparecchiata per cena" });
  P("cedro", "CEDRO", "CE-DRO", "@🍋", "cibo", 2, { alt: "Un cedro" });

  P("ciliegia", "CILIEGIA", "CI-LIE-GIA", "@🍒", "cibo", 1, { alt: "Una ciliegia" });
  P("cima", "CIMA", "CI-MA", "@⛰️", "natura", 1, { alt: "Una cima" });
  P("cinema", "CINEMA", "CI-NE-MA", "@🎬", "luoghi", 1, { alt: "Un cinema" });

  P("chela", "CHELA", "CHE-LA", "@🦀", "animali", 2, { alt: "La chela di un granchio" });
  P("cherubino", "CHERUBINO", "CHE-RU-BI-NO", "@👼", "persone", 3, { alt: "Un cherubino" });

  P("chitarra", "CHITARRA", "CHI-TAR-RA", "65", "oggetti", 1, { alt: "Una chitarra" });
  P("chilo", "CHILO", "CHI-LO", "@⚖️", "oggetti", 2, { alt: "Un peso da un chilo" });

  P("gara", "GARA", "GA-RA", "@🏁", "azioni", 1, { alt: "Una gara podistica" });
  P("gas", "GAS", "GAS", "@🛢️", "oggetti", 2, { alt: "Una bombola di gas" });
  P("gala", "GALA", "GA-LA", "@🎉", "feste", 2, { alt: "Una festa di gala" });

  P("gorilla", "GORILLA", "GO-RIL-LA", "@🦍", "animali", 1, { alt: "Un gorilla" });
  P("gomito", "GOMITO", "GO-MI-TO", "@💪", "corpo", 1, { alt: "Un gomito" });
  P("gola", "GOLA", "GO-LA", "@🗣️", "corpo", 1, { alt: "La gola" });

  P("gufo", "GUFO", "GU-FO", "@🦉", "animali", 1, { alt: "Un gufo" });
  P("guscio", "GUSCIO", "GU-SCIO", "@🥚", "natura", 1, { alt: "Un guscio d'uovo" });

  P("gelato", "GELATO", "GE-LA-TO", "@🍦", "cibo", 1, { alt: "Un gelato" });
  P("gemello", "GEMELLO", "GE-MEL-LO", "@👬", "persone", 1, { alt: "Due gemelli" });
  P("geranio", "GERANIO", "GE-RA-NIO", "@🌺", "natura", 2, { alt: "Un geranio" });

  P("giraffa", "GIRAFFA", "GI-RAF-FA", "@🦒", "animali", 1, { alt: "Una giraffa" });
  P("gita", "GITA", "GI-TA", "@🚶", "azioni", 1, { alt: "Una gita a piedi" });
  P("girasole", "GIRASOLE", "GI-RA-SO-LE", "@🌻", "natura", 1, { alt: "Un girasole" });
  P("ginocchio", "GINOCCHIO", "GI-NOC-CHIO", "@🦵", "corpo", 1, { alt: "Un ginocchio" });

  P("ghepardo", "GHEPARDO", "GHE-PAR-DO", "@🐆", "animali", 1, { alt: "Un ghepardo" });
  P("gheriglio", "GHERIGLIO", "GHE-RI-GLIO", "@🌰", "cibo", 2, { alt: "Un gheriglio di noce" });

  P("ghisa", "GHISA", "GHI-SA", "@🔩", "oggetti", 2, { alt: "Un pezzo di ghisa" });
  P("ghiro", "GHIRO", "GHI-RO", "@🐭", "animali", 2, { alt: "Un ghiro" });

  /* --- Livello 5 · CIA, CIO, CIU --- */
  P("ciabatta", "CIABATTA", "CIA-BAT-TA", "@🥖", "cibo", 1, { alt: "Una ciabatta" });
  P("camicia", "CAMICIA", "CA-MI-CIA", "@👕", "abbigliamento", 1, { alt: "Una camicia" });
  P("freccia", "FRECCIA", "FREC-CIA", "@🏹", "oggetti", 1, { alt: "Una freccia" });

  P("ciotola", "CIOTOLA", "CIO-TO-LA", "@🥣", "oggetti", 1, { alt: "Una ciotola" });
  P("bacio", "BACIO", "BA-CIO", "@💋", "azioni", 1, { alt: "Un bacio" });
  P("abbraccio", "ABBRACCIO", "AB-BRAC-CIO", "@🤗", "azioni", 1, { alt: "Un abbraccio" });

  P("ciuco", "CIUCO", "CIU-CO", "@🫏", "animali", 2, { alt: "Un ciuco" });
  P("acciuga", "ACCIUGA", "AC-CIU-GA", "@🐟", "cibo", 2, { alt: "Un'acciuga" });

  /* --- Livello 5 · GIA, GIO, GIU --- */
  P("giaguaro", "GIAGUARO", "GIA-GUA-RO", "@🐆", "animali", 2, { alt: "Un giaguaro" });
  P("giacinto", "GIACINTO", "GIA-CIN-TO", "@🌸", "natura", 2, { alt: "Un giacinto" });
  P("magia", "MAGIA", "MA-GIA", "@🪄", "giochi", 1, { alt: "Una bacchetta magica" });

  P("gioco", "GIOCO", "GIO-CO", "@🎲", "giochi", 1, { alt: "Un gioco" });
  P("gioiello", "GIOIELLO", "GIO-IEL-LO", "@💎", "oggetti", 1, { alt: "Un gioiello" });
  P("giostra", "GIOSTRA", "GIO-STRA", "@🎠", "giochi", 1, { alt: "Una giostra" });

  P("giudice", "GIUDICE", "GIU-DI-CE", "@⚖️", "persone", 2, { alt: "Un giudice" });
  P("giugno", "GIUGNO", "GIU-GNO", "@📅", "tempo", 1, { alt: "Il mese di giugno" });

  /* --- Livello 5 · SCA, SCO, SCU --- */
  P("scala", "SCALA", "SCA-LA", "@🪜", "oggetti", 1, { alt: "Una scala" });
  P("scatola", "SCATOLA", "SCA-TO-LA", "@📦", "oggetti", 1, { alt: "Una scatola" });
  P("scavo", "SCAVO", "SCA-VO", "@⛏️", "azioni", 2, { alt: "Uno scavo" });

  P("scoiattolo", "SCOIATTOLO", "SCO-IAT-TO-LO", "@🐿️", "animali", 1, { alt: "Uno scoiattolo" });
  P("scopa", "SCOPA", "SCO-PA", "@🧹", "oggetti", 1, { alt: "Una scopa" });
  P("scoglio", "SCOGLIO", "SCO-GLIO", "@🪨", "natura", 1, { alt: "Uno scoglio" });

  P("scudo", "SCUDO", "SCU-DO", "@🛡️", "oggetti", 1, { alt: "Uno scudo" });
  P("scusa", "SCUSA", "SCU-SA", "@🙏", "azioni", 1, { alt: "Un gesto di scusa" });

  /* --- Livello 5 · SCE, SCI --- */
  P("scena", "SCENA", "SCE-NA", "@🎭", "giochi", 1, { alt: "Una scena del teatro" });
  P("sceriffo", "SCERIFFO", "SCE-RIF-FO", "@🤠", "persone", 1, { alt: "Uno sceriffo" });

  P("sciroppo", "SCIROPPO", "SCI-ROP-PO", "@🍯", "cibo", 1, { alt: "Uno sciroppo" });
  P("scivolo", "SCIVOLO", "SCI-VO-LO", "63", "giochi", 1, { alt: "Uno scivolo" });

  /* --- Livello 5 · SCIA, SCIO, SCIU, SCIE --- */
  P("sciame", "SCIAME", "SCIA-ME", "@🐝", "animali", 2, { alt: "Uno sciame di api" });
  P("scia", "SCIA", "SCIA", "@🌊", "natura", 2, { alt: "La scia di una barca" });
  P("sciopero", "SCIOPERO", "SCIO-PE-RO", "@✊", "azioni", 2, { alt: "Uno sciopero" });
  P("sciogliere", "SCIOGLIERE", "SCIO-GLIE-RE", "@💧", "azioni", 2, { alt: "Ghiaccio che si scioglie" });
  P("sciupare", "SCIUPARE", "SCIU-PA-RE", "@🧥", "azioni", 2, { alt: "Un vestito sciupato" });
  P("asciugamano", "ASCIUGAMANO", "A-SCIU-GA-MA-NO", "@🧻", "oggetti", 1, { alt: "Un asciugamano" });

  P("scienza", "SCIENZA", "SCIEN-ZA", "@🔬", "scuola", 2, { alt: "Un microscopio: la scienza", nota: "SCIE è un trigramma, non una sillaba: SCIEN-ZA." });
  P("scienziato", "SCIENZIATO", "SCIEN-ZIA-TO", "@👨‍🔬", "persone", 2, { alt: "Uno scienziato", nota: "SCIE è un trigramma." });

  /* --- Livello 5 · GN --- */
  P("pigna", "PIGNA", "PI-GNA", "@🌰", "natura", 1, { alt: "Una pigna" });
  P("montagna", "MONTAGNA", "MON-TA-GNA", "@⛰️", "natura", 1, { alt: "Una montagna" });
  P("compagne", "COMPAGNE", "COM-PA-GNE", "@👭", "persone", 1, { alt: "Due compagne" });
  P("ingegnere", "INGEGNERE", "IN-GE-GNE-RE", "@👷", "persone", 2, { alt: "Un ingegnere" });
  P("ragni", "RAGNI", "RA-GNI", "@🕷️", "animali", 1, { alt: "Due ragni" });
  P("compagni", "COMPAGNI", "COM-PA-GNI", "@👬", "persone", 1, { alt: "Due compagni" });
  P("gnomo", "GNOMO", "GNO-MO", "@🧙", "persone", 1, { alt: "Uno gnomo" });
  P("gnu", "GNU", "GNU", "@🐃", "animali", 2, { alt: "Uno gnu" });

  /* --- Livello 5 · GLI --- */
  P("maglia", "MAGLIA", "MA-GLIA", "67", "abbigliamento", 1, { alt: "Una maglia" });
  P("famiglia", "FAMIGLIA", "FA-MI-GLIA", "@👨‍👩‍👧", "persone", 1, { alt: "Una famiglia" });
  P("moglie", "MOGLIE", "MO-GLIE", "@👰", "persone", 1, { alt: "Una moglie" });
  P("figlie", "FIGLIE", "FI-GLIE", "@👧", "persone", 1, { alt: "Due figlie" });
  P("aglio", "AGLIO", "A-GLIO", "62", "cibo", 1, { alt: "Uno spicchio d'aglio" });
  P("figlio", "FIGLIO", "FI-GLIO", "@👦", "persone", 1, { alt: "Un figlio" });

  /* --- Livello 5 · QU --- */
  P("quadro", "QUADRO", "QUA-DRO", "@🖼️", "oggetti", 1, { alt: "Un quadro" });
  P("quaderno", "QUADERNO", "QUA-DER-NO", "@📓", "scuola", 1, { alt: "Un quaderno" });
  P("questo", "QUESTO", "QUE-STO", "@👉", "astratto", 1, { alt: "Una mano che indica: questo" });
  P("quesito", "QUESITO", "QUE-SI-TO", "@❓", "astratto", 2, { alt: "Un punto interrogativo: un quesito" });
  P("qui", "QUI", "QUI", "@👇", "astratto", 1, { alt: "Una mano che indica il posto: qui" });
  P("quota", "QUOTA", "QUO-TA", "@📏", "astratto", 2, { alt: "Una quota misurata" });
  P("quotidiano", "QUOTIDIANO", "QUO-TI-DIA-NO", "@📰", "oggetti", 2, { alt: "Un quotidiano" });

  /* --- Livello 5 · CQU / ACQUA --- */
  P("acqua", "ACQUA", "AC-QUA", "@💧", "natura", 1, { alt: "Una goccia d'acqua" });
  P("acquario", "ACQUARIO", "AC-QUA-RIO", "@🐠", "luoghi", 1, { alt: "Un acquario" });
  P("acquerello", "ACQUERELLO", "AC-QUE-REL-LO", "@🎨", "giochi", 2, { alt: "Un acquerello" });

  /* --- Livello 6 · segmenti vocali + consonante ---
     Nei casi in cui il segmento non è una sillaba ortografica (per esempio
     UM in FUMETTO) la parola lo contiene come sequenza di suoni: la consegna
     dirà «suono», non «sillaba». La distinzione è nel tipo dell'unità. */
  P("ambra", "AMBRA", "AM-BRA", "@🟠", "natura", 2, { alt: "Un pezzo di ambra" });
  P("ambulatorio", "AMBULATORIO", "AM-BU-LA-TO-RIO", "@🏥", "luoghi", 2, { alt: "Un ambulatorio" });
  P("ambiente", "AMBIENTE", "AM-BIEN-TE", "@🌍", "natura", 2, { alt: "L'ambiente" });

  P("emblema", "EMBLEMA", "EM-BLE-MA", "@🏅", "oggetti", 2, { alt: "Un emblema" });
  P("emporio", "EMPORIO", "EM-PO-RIO", "@🏪", "luoghi", 2, { alt: "Un emporio" });

  P("imbuto", "IMBUTO", "IM-BU-TO", "@🫙", "oggetti", 1, { alt: "Un imbuto" });
  P("impronta", "IMPRONTA", "IM-PRON-TA", "@👣", "natura", 1, { alt: "Un'impronta" });

  P("ombra", "OMBRA", "OM-BRA", "@🌑", "natura", 1, { alt: "Un'ombra" });
  P("ombrello", "OMBRELLO", "OM-BREL-LO", "59", "oggetti", 1, { alt: "Un ombrello" });

  P("fumetto", "FUMETTO", "FU-MET-TO", "@💬", "giochi", 1, { alt: "Un fumetto", nota: "Il suono UM attraversa il confine tra FU e MET: non è una sillaba." });
  P("lumaca", "LUMACA", "LU-MA-CA", "@🐌", "animali", 1, { alt: "Una lumaca", nota: "Il suono UM attraversa il confine tra LU e MA: non è una sillaba." });
  P("numero", "NUMERO", "NU-ME-RO", "@🔢", "numeri", 1, { alt: "I numeri", nota: "Il suono UM attraversa il confine tra NU e ME: non è una sillaba." });

  P("albero", "ALBERO", "AL-BE-RO", "@🌳", "natura", 1, { alt: "Un albero" });
  P("alto", "ALTO", "AL-TO", "@⬆️", "astratto", 1, { alt: "Una freccia verso l'alto" });
  P("alghe", "ALGHE", "AL-GHE", "66", "natura", 1, { alt: "Delle alghe" });

  P("elmo", "ELMO", "EL-MO", "@🪖", "oggetti", 1, { alt: "Un elmo" });
  P("elmetto", "ELMETTO", "EL-MET-TO", "@🪖", "oggetti", 1, { alt: "Un elmetto" });

  P("il", "IL", "IL", "@📖", "astratto", 1, { alt: "Un libro: l'articolo IL", nota: "Parola grammaticale: l'immagine è un contesto, non un oggetto." });

  P("olmo", "OLMO", "OL-MO", "@🌳", "natura", 1, { alt: "Un olmo" });
  P("oltre", "OLTRE", "OL-TRE", "@➡️", "astratto", 2, { alt: "Una freccia oltre" });
  P("olio", "OLIO", "O-LIO", "@🫒", "cibo", 1, { alt: "Una bottiglia d'olio", nota: "Il suono OL attraversa il confine tra O e LIO: non è una sillaba." });
  P("collina", "COLLINA", "COL-LI-NA", "@⛰️", "natura", 1, { alt: "Una collina", nota: "Il suono OL è dentro COL, non è una sillaba autonoma." });

  P("ultimo", "ULTIMO", "UL-TI-MO", "@🔚", "astratto", 2, { alt: "L'ultimo posto" });
  P("culla", "CULLA", "CUL-LA", "@🛏️", "oggetti", 1, { alt: "Una culla", nota: "Il suono UL è dentro CUL." });
  P("ulna", "ULNA", "UL-NA", "@🦴", "corpo", 2, { alt: "L'ulna, un osso del braccio" });
  P("fulmine", "FULMINE", "FUL-MI-NE", "@⚡", "natura", 1, { alt: "Un fulmine", nota: "Il suono UL è dentro FUL." });

  P("arco", "ARCO", "AR-CO", "@🏹", "oggetti", 1, { alt: "Un arco" });
  P("argento", "ARGENTO", "AR-GEN-TO", "@🥈", "oggetti", 1, { alt: "Un oggetto d'argento" });

  P("erba", "ERBA", "ER-BA", "@🌿", "natura", 1, { alt: "Un ciuffo d'erba" });
  P("erbetta", "ERBETTA", "ER-BET-TA", "@🌿", "natura", 1, { alt: "Un'erbetta" });

  P("mirtillo", "MIRTILLO", "MIR-TIL-LO", "@🫐", "cibo", 1, { alt: "Un mirtillo", nota: "Il suono IR è dentro MIR." });

  P("orso", "ORSO", "OR-SO", "@🐻", "animali", 1, { alt: "Un orso" });
  P("orto", "ORTO", "OR-TO", "@🥕", "luoghi", 1, { alt: "Un orto" });

  P("urlo", "URLO", "UR-LO", "@😱", "azioni", 1, { alt: "Un urlo" });
  P("urna", "URNA", "UR-NA", "@🏺", "oggetti", 2, { alt: "Un'urna" });

  P("ancora", "ANCORA", "AN-CO-RA", "@⚓", "trasporti", 1, { alt: "Un'ancora" });
  P("angelo", "ANGELO", "AN-GE-LO", "@👼", "persone", 1, { alt: "Un angelo" });

  P("entrata", "ENTRATA", "EN-TRA-TA", "@🚪", "luoghi", 1, { alt: "Un'entrata" });
  P("entusiasmo", "ENTUSIASMO", "EN-TU-SIA-SMO", "@🎉", "astratto", 3, { alt: "Una festa: entusiasmo" });

  P("inchiostro", "INCHIOSTRO", "IN-CHIO-STRO", "@🖋️", "oggetti", 2, { alt: "Un calamaio d'inchiostro" });
  P("indice", "INDICE", "IN-DI-CE", "@👆", "corpo", 1, { alt: "L'indice della mano" });

  P("onda", "ONDA", "ON-DA", "@🌊", "natura", 1, { alt: "Un'onda" });
  P("ontano", "ONTANO", "ON-TA-NO", "@🌳", "natura", 2, { alt: "Un ontano" });

  P("uncino", "UNCINO", "UN-CI-NO", "@🪝", "oggetti", 1, { alt: "Un uncino" });
  P("unghia", "UNGHIA", "UN-GHIA", "@💅", "corpo", 1, { alt: "Un'unghia" });

  /* --- Parole per i moduli del livello 7 --- */
  P("palla", "PALLA", "PAL-LA", "55", "giochi", 1, { alt: "Una palla" });
  P("campana", "CAMPANA", "CAM-PA-NA", "60", "oggetti", 1, { alt: "Una campana" });
  P("treno", "TRENO", "TRE-NO", "56", "trasporti", 1, { alt: "Un treno" });
  P("fiore", "FIORE", "FIO-RE", "54", "natura", 1, { alt: "Un fiore" });
  P("gomma", "GOMMA", "GOM-MA", "@🧽", "oggetti", 1, { alt: "Una gomma per cancellare" });
  P("mucca", "MUCCA", "MUC-CA", "@🐄", "animali", 1, { alt: "Una mucca", nota: "La prima sillaba è MUC, non MU." });
  P("chiave", "CHIAVE", "CHIA-VE", "@🔑", "oggetti", 1, { alt: "Una chiave", nota: "La prima sillaba è CHIA, non CHI." });
  P("zaino", "ZAINO", "ZAI-NO", "@🎒", "scuola", 1, { alt: "Uno zaino", nota: "La prima sillaba è ZAI, non ZA." });
  P("farfalla", "FARFALLA", "FAR-FAL-LA", "@🦋", "animali", 1, { alt: "Una farfalla" });
  P("cioccolata", "CIOCCOLATA", "CIOC-CO-LA-TA", "@🍫", "cibo", 1, { alt: "Una tavoletta di cioccolata" });
  P("bicicletta", "BICICLETTA", "BI-CI-CLET-TA", "@🚲", "trasporti", 1, { alt: "Una bicicletta" });
  P("cappello", "CAPPELLO", "CAP-PEL-LO", "@🎩", "abbigliamento", 1, { alt: "Un cappello" });
  P("bottone", "BOTTONE", "BOT-TO-NE", "@🔘", "oggetti", 1, { alt: "Un bottone" });
  P("pennarello", "PENNARELLO", "PEN-NA-REL-LO", "@🖊️", "scuola", 1, { alt: "Un pennarello" });
  P("torta", "TORTA", "TOR-TA", "@🍰", "cibo", 1, { alt: "Una torta" });

  P("bravo", "BRAVO", "BRA-VO", "@👏", "astratto", 2, { alt: "Un applauso: bravo" });
  P("breve", "BREVE", "BRE-VE", "@⏱️", "astratto", 2, { alt: "Un intervallo breve" });
  P("brivido", "BRIVIDO", "BRI-VI-DO", "@🥶", "corpo", 2, { alt: "Un brivido di freddo" });
  P("brodo", "BRODO", "BRO-DO", "@🍲", "cibo", 1, { alt: "Una scodella di brodo" });
  P("bruma", "BRUMA", "BRU-MA", "@🌫️", "natura", 2, { alt: "La bruma" });
  P("cravatta", "CRAVATTA", "CRA-VAT-TA", "@👔", "abbigliamento", 1, { alt: "Una cravatta" });
  P("crema", "CREMA", "CRE-MA", "@🍦", "cibo", 1, { alt: "Una crema" });
  P("crisi", "CRISI", "CRI-SI", "@📉", "astratto", 3, { alt: "Una crisi" });
  P("croce", "CROCE", "CRO-CE", "@✝️", "oggetti", 2, { alt: "Una croce" });
  P("crudo", "CRUDO", "CRU-DO", "@🍣", "cibo", 2, { alt: "Del cibo crudo" });
  P("dramma", "DRAMMA", "DRAM-MA", "@🎭", "giochi", 3, { alt: "Una maschera del dramma" });
  P("dritto", "DRITTO", "DRIT-TO", "@➡️", "astratto", 1, { alt: "Una freccia dritta" });
  P("dromedario", "DROMEDARIO", "DRO-ME-DA-RIO", "@🐪", "animali", 2, { alt: "Un dromedario" });
  P("frate", "FRATE", "FRA-TE", "@🧑‍🦲", "persone", 2, { alt: "Un frate" });
  P("freno", "FRENO", "FRE-NO", "@🛑", "oggetti", 1, { alt: "Un freno" });
  P("frigo", "FRIGO", "FRI-GO", "@🧊", "oggetti", 1, { alt: "Un frigorifero" });
  P("fronte", "FRONTE", "FRON-TE", "@🤦", "corpo", 1, { alt: "La fronte" });
  P("frutta", "FRUTTA", "FRUT-TA", "@🍎", "cibo", 1, { alt: "Della frutta" });
  P("grano", "GRANO", "GRA-NO", "@🌾", "natura", 1, { alt: "Del grano" });
  P("grasso", "GRASSO", "GRAS-SO", "@🧈", "cibo", 1, { alt: "Del grasso" });
  P("grigio", "GRIGIO", "GRI-GIO", "@⚪", "colori", 1, { alt: "Il colore grigio" });
  P("grotta", "GROTTA", "GROT-TA", "@🕳️", "luoghi", 1, { alt: "Una grotta" });
  P("gru", "GRU", "GRU", "@🏗️", "oggetti", 2, { alt: "Una gru" });
  P("prato", "PRATO", "PRA-TO", "@🌿", "natura", 1, { alt: "Un prato" });
  P("premio", "PREMIO", "PRE-MIO", "@🏆", "giochi", 1, { alt: "Un premio" });
  P("prima", "PRIMA", "PRI-MA", "@1️⃣", "astratto", 1, { alt: "Il numero uno: prima" });
  P("prova", "PROVA", "PRO-VA", "@📝", "scuola", 1, { alt: "Una prova scritta" });
  P("pruno", "PRUNO", "PRU-NO", "@🌳", "natura", 2, { alt: "Un pruno" });
  P("treccia", "TRECCIA", "TREC-CIA", "@🎀", "corpo", 1, { alt: "Una treccia" });
  P("tribu", "TRIBÙ", "TRI-BÙ", "@🏕️", "persone", 2, { alt: "Una tribù" });
  P("trono", "TRONO", "TRO-NO", "@👑", "oggetti", 1, { alt: "Un trono" });
  P("trucco", "TRUCCO", "TRUC-CO", "@💄", "oggetti", 1, { alt: "Del trucco" });
  P("blusa", "BLUSA", "BLU-SA", "@👚", "abbigliamento", 1, { alt: "Una blusa" });
  P("blocco", "BLOCCO", "BLOC-CO", "@🧱", "oggetti", 1, { alt: "Un blocco" });
  P("classe", "CLASSE", "CLAS-SE", "@🏫", "scuola", 1, { alt: "Una classe" });
  P("clima", "CLIMA", "CLI-MA", "@🌤️", "natura", 2, { alt: "Il clima" });
  P("clown", "CLOWN", "CLOWN", "@🤡", "persone", 1, { alt: "Un clown" });
  P("flauto", "FLAUTO", "FLAU-TO", "@🎶", "oggetti", 1, { alt: "Un flauto" });
  P("flora", "FLORA", "FLO-RA", "@🌸", "natura", 2, { alt: "La flora" });
  P("flusso", "FLUSSO", "FLUS-SO", "@🌊", "natura", 2, { alt: "Un flusso d'acqua" });
  P("globo", "GLOBO", "GLO-BO", "@🌍", "natura", 1, { alt: "Un globo" });
  P("gladiolo", "GLADIOLO", "GLA-DIO-LO", "@🌷", "natura", 2, { alt: "Un gladiolo" });
  P("glucosio", "GLUCOSIO", "GLU-CO-SIO", "@🍬", "cibo", 3, { alt: "Il glucosio" });
  P("plastica", "PLASTICA", "PLA-STI-CA", "@🧴", "oggetti", 1, { alt: "Un oggetto di plastica" });
  P("plumcake", "PLUMCAKE", "PLUM-CAKE", "@🍰", "cibo", 2, { alt: "Un plumcake" });
  P("spazio", "SPAZIO", "SPA-ZIO", "@🌌", "natura", 1, { alt: "Lo spazio" });
  P("spada", "SPADA", "SPA-DA", "@⚔️", "oggetti", 1, { alt: "Una spada" });
  P("spiga", "SPIGA", "SPI-GA", "@🌾", "natura", 1, { alt: "Una spiga" });
  P("spillo", "SPILLO", "SPIL-LO", "@📌", "oggetti", 1, { alt: "Uno spillo" });
  P("spina", "SPINA", "SPI-NA", "@🌵", "natura", 1, { alt: "Una spina" });
  P("sposo", "SPOSO", "SPO-SO", "@🤵", "persone", 1, { alt: "Uno sposo" });
  P("sport", "SPORT", "SPORT", "@⚽", "giochi", 1, { alt: "Lo sport" });
  P("spugna", "SPUGNA", "SPU-GNA", "@🧽", "oggetti", 1, { alt: "Una spugna" });
  P("stagione", "STAGIONE", "STA-GIO-NE", "@🍂", "tempo", 1, { alt: "Le stagioni" });
  P("stampa", "STAMPA", "STAM-PA", "@🖨️", "oggetti", 1, { alt: "Una stampa" });
  P("stella", "STELLA", "STEL-LA", "@⭐", "natura", 1, { alt: "Una stella" });
  P("stivale", "STIVALE", "STI-VA-LE", "@👢", "abbigliamento", 1, { alt: "Uno stivale" });
  P("stilo", "STILO", "STI-LO", "@🖊️", "oggetti", 1, { alt: "Uno stilo" });
  P("storia", "STORIA", "STO-RIA", "@📖", "scuola", 1, { alt: "Una storia" });
  P("stoffa", "STOFFA", "STOF-FA", "@🧵", "oggetti", 1, { alt: "Una stoffa" });
  P("studente", "STUDENTE", "STU-DEN-TE", "@👨‍🎓", "persone", 1, { alt: "Uno studente" });
  P("stufa", "STUFA", "STU-FA", "@🔥", "oggetti", 1, { alt: "Una stufa" });
  P("piede", "PIEDE", "PIE-DE", "@🦶", "corpo", 1, { alt: "Un piede" });
  P("uovo", "UOVO", "UO-VO", "@🥚", "cibo", 1, { alt: "Un uovo" });
  P("aereo", "AEREO", "A-E-RE-O", "@✈️", "trasporti", 1, { alt: "Un aereo" });
  P("aiuola", "AIUOLA", "A-IUO-LA", "@🌷", "natura", 2, { alt: "Un'aiuola" });
  P("ghiaia", "GHIAIA", "GHIA-IA", "@🪨", "natura", 1, { alt: "Della ghiaia" });
  P("cuore", "CUORE", "CUO-RE", "@❤️", "corpo", 1, { alt: "Un cuore" });
  P("scuola", "SCUOLA", "SCUO-LA", "@🏫", "luoghi", 1, { alt: "Una scuola" });
  P("buono", "BUONO", "BUO-NO", "@👍", "astratto", 1, { alt: "Un pollice in su: buono" });
  P("viaggio", "VIAGGIO", "VIAG-GIO", "@🧳", "azioni", 1, { alt: "Un viaggio" });
  P("piano", "PIANO", "PIA-NO", "@🎹", "oggetti", 1, { alt: "Un pianoforte" });
  P("porta", "PORTA", "POR-TA", "@🚪", "oggetti", 1, { alt: "Una porta" });
  P("campo", "CAMPO", "CAM-PO", "@🌾", "natura", 1, { alt: "Un campo" });
  P("banco", "BANCO", "BAN-CO", "@🪑", "scuola", 1, { alt: "Un banco" });
  P("cesto", "CESTO", "CE-STO", "@🧺", "oggetti", 1, { alt: "Un cesto" });
  P("ponte", "PONTE", "PON-TE", "@🌉", "luoghi", 1, { alt: "Un ponte" });
  P("dente", "DENTE", "DEN-TE", "@🦷", "corpo", 1, { alt: "Un dente" });
  P("automobile", "AUTOMOBILE", "AU-TO-MO-BI-LE", "@🚗", "trasporti", 1, { alt: "Un'automobile" });
  P("frigorifero", "FRIGORIFERO", "FRI-GO-RI-FE-RO", "@🧊", "oggetti", 1, { alt: "Un frigorifero" });
  P("citta", "CITTÀ", "CIT-TÀ", "@🏙️", "luoghi", 1, { alt: "Una città" });
  P("perche", "PERCHÉ", "PER-CHÉ", "@❓", "astratto", 1, { alt: "Un punto interrogativo: perché" });
  P("poiche", "POICHÉ", "POI-CHÉ", "@➡️", "astratto", 2, { alt: "Una freccia: poiché" });
  P("gia", "GIÀ", "GIÀ", "@✅", "astratto", 1, { alt: "Un segno di spunta: già" });
  P("piu", "PIÙ", "PIÙ", "@➕", "astratto", 1, { alt: "Il segno più" });
  P("puo", "PUÒ", "PUÒ", "@💪", "astratto", 1, { alt: "Un braccio forte: può" });
  P("lunedi", "LUNEDÌ", "LU-NE-DÌ", "@📅", "tempo", 1, { alt: "Il lunedì sul calendario" });
  P("caffe", "CAFFÈ", "CAF-FÈ", "@☕", "cibo", 1, { alt: "Una tazza di caffè" });
  P("pero", "PERÒ", "PE-RÒ", "@🔄", "astratto", 2, { alt: "Una freccia che cambia: però" });

  /* ------------------------------------------------------------------
     2. COSTRUZIONE DEL DIZIONARIO
     ------------------------------------------------------------------ */
  const PAROLE = PAROLE_RAW.map((raw, idx) => {
    const sillabe = raw.sillabe.split("-").map(s => s.trim().toUpperCase()).filter(Boolean);
    const testo = raw.testo.toUpperCase();
    const audioKey = testo.toLowerCase();
    let immagine = null;
    if (typeof raw.img === "string" && /^\d+$/.test(raw.img)) {
      const num = raw.img.padStart(2, "0");
      immagine = { tipo: "file", src: `illustrations/${num}.png`, alt: raw.opts.alt || testo };
    } else if (typeof raw.img === "string" && raw.img.startsWith("@")) {
      const emoji = raw.img.slice(1);
      immagine = { tipo: "card", src: `illustrations/parole/${raw.id}.svg`, emoji, alt: raw.opts.alt || testo };
    }
    const word = {
      id: raw.id,
      testo,
      audioKey,
      sillabe,
      sillabaIniziale: sillabe[0] || "",
      sillabaFinale: sillabe[sillabe.length - 1] || "",
      sillabeInterne: sillabe.slice(1, -1),
      immagine,
      categoria: raw.categoria || "altro",
      livelloLessicale: raw.livelloLessicale || 1,
      prerequisiti: [...new Set(sillabe.map(s => (PER_TESTO[s] ? PER_TESTO[s].id : s)))],
      statoRevisione: raw.opts.statoRevisione || STATO.CONVALIDATA,
      nota: raw.opts.nota || "",
      alt: raw.opts.alt || testo,
      indice: idx
    };
    return word;
  });

  const PAROLA_PER_ID = {};
  PAROLE.forEach(w => { PAROLA_PER_ID[w.id] = w; });
  const PAROLA_PER_TESTO = {};
  PAROLE.forEach(w => { if (!PAROLA_PER_TESTO[w.testo]) PAROLA_PER_TESTO[w.testo] = w; });

  function parola(idOrTesto) {
    return PAROLA_PER_ID[idOrTesto] || PAROLA_PER_TESTO[String(idOrTesto).toUpperCase()] || null;
  }

  /* Indice parola → unità. Per le sillabe si confrontano le sillabe reali;
     per i grafemi e i segmenti si aggiunge anche la presenza testuale, ma
     l'unità resta marcata come non-sillaba e le consegne lo dicono. */
  const INDICE_UNITA = {};
  UNITA.forEach(u => { INDICE_UNITA[u.id] = []; });

  PAROLE.forEach(w => {
    w.sillabe.forEach((syl, i) => {
      const u = PER_TESTO[syl];
      if (!u) return;
      INDICE_UNITA[u.id].push({
        parola: w,
        indice: i,
        posizione: i === 0 ? "iniziale" : i === w.sillabe.length - 1 ? "finale" : "interna",
        esatta: true
      });
    });
  });

  /* Unità grafema/segmento: si aggiungono le parole che contengono il gruppo
     o il suono, anche quando non coincide con una sillaba. */
  UNITA.filter(u => u.tipo !== "sillaba" && u.tipo !== "modulo").forEach(u => {
    const needle = u.testo.toUpperCase();
    PAROLE.forEach(w => {
      if (!w.testo.includes(needle)) return;
      if (INDICE_UNITA[u.id].some(hit => hit.parola.id === w.id)) return;
      const exactIdx = w.sillabe.indexOf(needle);
      INDICE_UNITA[u.id].push({
        parola: w,
        indice: exactIdx >= 0 ? exactIdx : -1,
        posizione: exactIdx === 0 ? "iniziale" : exactIdx === w.sillabe.length - 1 ? "finale" : exactIdx > 0 ? "interna" : "sequenza",
        esatta: exactIdx >= 0
      });
    });
  });

  function paroleDi(unitId) {
    return (INDICE_UNITA[unitId] || []).slice();
  }
  function paroleIniziali(unitId) {
    return paroleDi(unitId).filter(h => h.posizione === "iniziale");
  }
  function paroleFinali(unitId) {
    return paroleDi(unitId).filter(h => h.posizione === "finale");
  }
  function paroleInterne(unitId) {
    return paroleDi(unitId).filter(h => h.posizione === "interna");
  }
  function paroleSequenza(unitId) {
    return paroleDi(unitId).filter(h => h.posizione === "sequenza");
  }

  /* ------------------------------------------------------------------
     3. MODULI DEL LIVELLO 7
     ------------------------------------------------------------------
     I moduli non sono sillabe: raccolgono più sillabe/parole e producono
     attività di lettura, scrittura, conteggio e analisi. La regola delle
     dieci attività vale per il modulo nel suo insieme. */
  const MODULI = {
    MOD_CVC: {
      id: "MOD_CVC",
      unitId: "MOD_CVC",
      titolo: "Sillabe chiuse (CVC)",
      parole: ["gatto", "mamma", "palla", "gomma", "mucca", "porta", "campo", "banco", "ponte", "dente", "torta", "cappello", "bottone", "farfalla", "campana", "pennarello"],
      tipi: ["prima_sillaba", "sillaba_finale", "conteggio", "completa", "ordina", "ascolta"],
      nota: "Una sillaba chiusa finisce con una consonante: GAT in GATTO, MAM in MAMMA, MUC in MUCCA."
    },
    MOD_GRUPPI_LR: {
      id: "MOD_GRUPPI_LR",
      unitId: "MOD_GRUPPI_LR",
      titolo: "Gruppi con L e R",
      parole: ["bravo", "breve", "brivido", "brodo", "bruma", "cravatta", "crema", "crisi", "croce", "crudo", "dramma", "dritto", "dromedario", "frate", "freno", "frigo", "fronte", "frutta", "grano", "grasso", "grigio", "grotta", "gru", "prato", "premio", "prima", "prova", "pruno", "treno", "treccia", "tribu", "trono", "trucco", "blusa", "blocco", "classe", "clima", "clown", "flauto", "flora", "flusso", "globo", "gladiolo", "glucosio", "plastica", "plumcake"],
      tipi: ["gruppo_iniziale", "prima_sillaba", "ordina", "conteggio", "ascolta", "completa"],
      nota: "BR, CR, DR, FR, GR, PR, TR e BL, CL, FL, GL, PL: due consonanti che si pronunciano insieme."
    },
    MOD_S_GRUPPI: {
      id: "MOD_S_GRUPPI",
      unitId: "MOD_S_GRUPPI",
      titolo: "Gruppi con S",
      parole: ["spazio", "spada", "spiga", "spillo", "spina", "sposo", "sport", "spugna", "stagione", "stampa", "stella", "stivale", "stilo", "storia", "stoffa", "studente", "stufa", "scala", "scatola", "scoiattolo", "scopa", "scoglio", "scudo", "scuola", "scena", "sceriffo", "sciroppo", "scivolo"],
      tipi: ["gruppo_iniziale", "prima_sillaba", "ordina", "conteggio", "ascolta", "completa"],
      nota: "SPA, STA, SCA, SCE, SCI: la S si unisce alla consonante che segue."
    },
    MOD_DOPPIE: {
      id: "MOD_DOPPIE",
      unitId: "MOD_DOPPIE",
      titolo: "Doppie consonanti",
      parole: ["gomma", "mamma", "palla", "gatto", "cappello", "bottone", "bicicletta", "cioccolata", "farfalla", "torta", "pennarello", "campana"],
      tipi: ["doppia", "conteggio", "completa", "ordina", "ascolta"],
      nota: "La doppia consonante si divide fra due sillabe: GOM-MA, PAL-LA, GAT-TO."
    },
    MOD_DITTONGHI: {
      id: "MOD_DITTONGHI",
      unitId: "MOD_DITTONGHI",
      titolo: "Dittonghi e tristonghi",
      parole: ["fiore", "piede", "uovo", "aereo", "aiuola", "quota", "ghiaia", "cuore", "scuola", "buono", "viaggio", "piano"],
      tipi: ["dittongo", "conteggio", "ordina", "ascolta", "completa"],
      nota: "Due o tre vocali vicine possono stare nella stessa sillaba: FIO-RE, PIE-DE, UO-VO."
    },
    MOD_POLISILLABE: {
      id: "MOD_POLISILLABE",
      unitId: "MOD_POLISILLABE",
      titolo: "Parole polisillabiche",
      parole: ["elefante", "bicicletta", "cioccolata", "automobile", "frigorifero", "telefono", "pomodoro", "farfalla", "matita", "campana"],
      tipi: ["conteggio", "ordina", "completa", "ascolta", "posizione"],
      nota: "Parole lunghe: si leggono una sillaba alla volta."
    },
    MOD_ACCENTO: {
      id: "MOD_ACCENTO",
      unitId: "MOD_ACCENTO",
      titolo: "Accento tonico",
      parole: ["papa", "citta", "perche", "poiche", "gia", "piu", "puo", "lunedi", "caffe", "pero"],
      tipi: ["accento", "conteggio", "ascolta", "completa"],
      nota: "L'accento indica la sillaba più forte: papà, città, perché, caffè."
    },
    MOD_TRAPPOLE: {
      id: "MOD_TRAPPOLE",
      unitId: "MOD_TRAPPOLE",
      titolo: "Sillaba o semplice lettera?",
      parole: ["mamma", "mucca", "gatto", "chiave", "zaino", "gomma", "palla", "campana"],
      tipi: ["trappola", "prima_sillaba", "sillaba_finale", "completa", "ascolta"],
      nota: "MA in MAMMA è la sillaba finale; MU in MUCCA non esiste: la prima sillaba è MUC."
    },
    MOD_ACQUA: {
      id: "MOD_ACQUA",
      unitId: "MOD_ACQUA",
      titolo: "CQU e ACQUA",
      parole: ["acqua", "acquario", "acquerello"],
      tipi: ["cqu", "conteggio", "ascolta", "completa", "ordina"],
      nota: "ACQUA si divide AC-QUA; il gruppo CQU si scrive con la Q."
    }
  };

  /* ------------------------------------------------------------------
     4. «LE FRASI DELLE SILLABE»
     ------------------------------------------------------------------
     Ogni parola della frase dichiara le proprie sillabe. Le occorrenze
     della sillaba bersaglio si calcolano qui, confrontando le sillabe vere:
     mai una ricerca di lettere. `soluzioni` contiene le sequenze approvate
     per la modalità «Inventa»; se ce n'è una sola, la modalità non viene
     proposta come invenzione libera.
     ------------------------------------------------------------------ */
  const FRASI_RAW = [];
  function S(id, target, livello, words, emoji, opts) {
    FRASI_RAW.push({ id, target, livello, words, emoji: emoji || [], opts: opts || {} });
  }

  S("ma-1", "MA", 1, [["MARA", "MA-RA"], ["AMA", "A-MA"], ["LA", "LA"], ["MAMMA", "MAM-MA"]], ["👧", "❤️", "👩"], { soluzioni: [["MARA", "AMA", "LA", "MAMMA"], ["MAMMA", "AMA", "MARA"]] });
  S("ma-2", "MA", 1, [["MARA", "MA-RA"], ["AMA", "A-MA"], ["LA", "LA"], ["MAMMA", "MAM-MA"], ["E", "E"], ["IL", "IL"], ["MIMO", "MI-MO"]], ["👧", "👩", "🎭"], { soluzioni: [["MARA", "AMA", "LA", "MAMMA", "E", "IL", "MIMO"], ["MAMMA", "AMA", "MARA", "E", "IL", "MIMO"]] });
  S("me-1", "ME", 1, [["MELE", "ME-LE"], ["E", "E"], ["MELONI", "ME-LO-NI"]], ["🍎", "🍈"], { soluzioni: [["MELE", "E", "MELONI"], ["MELONI", "E", "MELE"]] });
  S("mi-1", "MI", 1, [["MIMÌ", "MI-MÌ"], ["MIMA", "MI-MA"], ["IL", "IL"], ["MIMO", "MI-MO"]], ["🎭", "🎪"], { soluzioni: [["MIMÌ", "MIMA", "IL", "MIMO"]] });
  S("mi-2", "MI", 1, [["MIMÌ", "MI-MÌ"], ["MIMA", "MI-MA"], ["IL", "IL"], ["MIMO", "MI-MO"], ["E", "E"], ["MIMO", "MI-MO"], ["MIMA", "MI-MA"], ["MIMÌ", "MI-MÌ"]], ["🎭", "🎪"], { soluzioni: [["MIMÌ", "MIMA", "IL", "MIMO", "E", "MIMO", "MIMA", "MIMÌ"]] });
  S("mo-1", "MO", 1, [["MOMO", "MO-MO"], ["HA", "HA"], ["UN", "UN"], ["MOTO", "MO-TO"]], ["👦", "🏍️"], { soluzioni: [["MOMO", "HA", "UN", "MOTO"]] });
  S("mu-1", "MU", 1, [["IL", "IL"], ["MULO", "MU-LO"], ["GUARDA", "GUAR-DA"], ["IL", "IL"], ["MURO", "MU-RO"]], ["🐴", "🧱"], { soluzioni: [["IL", "MULO", "GUARDA", "IL", "MURO"]] });

  S("pa-1", "PA", 1, [["PAPÀ", "PA-PÀ"], ["PORTA", "POR-TA"], ["LA", "LA"], ["PALA", "PA-LA"]], ["👨", "⛏️"], { soluzioni: [["PAPÀ", "PORTA", "LA", "PALA"], ["PAPÀ", "USA", "LA", "PALA"]] });
  S("pa-2", "PA", 1, [["PAPÀ", "PA-PÀ"], ["PORTA", "POR-TA"], ["LA", "LA"], ["PALA", "PA-LA"], ["E", "E"], ["LA", "LA"], ["PATATA", "PA-TA-TA"]], ["👨", "⛏️", "🥔"], { soluzioni: [["PAPÀ", "PORTA", "LA", "PALA", "E", "LA", "PATATA"]] });
  S("pe-1", "PE", 1, [["PEPPE", "PEP-PE"], ["PORTA", "POR-TA"], ["LE", "LE"], ["PERE", "PE-RE"]], ["👦", "🍐"], { soluzioni: [["PEPPE", "PORTA", "LE", "PERE"]] });
  S("pi-1", "PI", 1, [["PINA", "PI-NA"], ["HA", "HA"], ["UN", "UN"], ["PINO", "PI-NO"]], ["👧", "🌲"], { soluzioni: [["PINA", "HA", "UN", "PINO"]] });
  S("po-1", "PO", 1, [["POLO", "PO-LO"], ["MANGIA", "MAN-GIA"], ["UN", "UN"], ["POMODORO", "PO-MO-DO-RO"]], ["👦", "🍅"], { soluzioni: [["POLO", "MANGIA", "UN", "POMODORO"]] });
  S("pu-1", "PU", 1, [["PUPA", "PU-PA"], ["GUARDA", "GUAR-DA"], ["LA", "LA"], ["PUMA", "PU-MA"]], ["🧸", "🐆"], { soluzioni: [["PUPA", "GUARDA", "LA", "PUMA"]] });

  S("la-1", "LA", 1, [["LARA", "LA-RA"], ["LAVA", "LA-VA"], ["LA", "LA"], ["LANA", "LA-NA"]], ["👧", "🧶"], { soluzioni: [["LARA", "LAVA", "LA", "LANA"], ["LARA", "LAVA", "LA", "LANA"]] });
  S("la-2", "LA", 1, [["LARA", "LA-RA"], ["LAVA", "LA-VA"], ["LA", "LA"], ["LANA", "LA-NA"], ["E", "E"], ["LA", "LA"], ["LAVA", "LA-VA"], ["ANCORA", "AN-CO-RA"]], ["👧", "🧶"], { soluzioni: [["LARA", "LAVA", "LA", "LANA", "E", "LA", "LAVA", "ANCORA"]] });
  S("le-1", "LE", 1, [["LENA", "LE-NA"], ["LEGGE", "LEG-GE"], ["LE", "LE"], ["LEZIONI", "LE-ZIO-NI"]], ["👧", "📖"], { soluzioni: [["LENA", "LEGGE", "LE", "LEZIONI"]] });
  S("li-1", "LI", 1, [["LINA", "LI-NA"], ["LAVA", "LA-VA"], ["IL", "IL"], ["LIMONE", "LI-MO-NE"]], ["👧", "🍋"], { soluzioni: [["LINA", "LAVA", "IL", "LIMONE"]] });
  S("lo-1", "LO", 1, [["LOLO", "LO-LO"], ["GUARDA", "GUAR-DA"], ["IL", "IL"], ["LOTO", "LO-TO"]], ["👦", "🪷"], { soluzioni: [["LOLO", "GUARDA", "IL", "LOTO"]] });
  S("lu-1", "LU", 1, [["LUCA", "LU-CA"], ["ACCENDE", "AC-CEN-DE"], ["LA", "LA"], ["LUCE", "LU-CE"]], ["👦", "💡"], { soluzioni: [["LUCA", "ACCENDE", "LA", "LUCE"]] });

  S("ta-1", "TA", 1, [["TATA", "TA-TA"], ["TAGLIA", "TA-GLIA"], ["LA", "LA"], ["TORTA", "TOR-TA"]], ["👩", "🍰"], { soluzioni: [["TATA", "TAGLIA", "LA", "TORTA"]] });
  S("te-1", "TE", 1, [["TEO", "TE-O"], ["LEGGE", "LEG-GE"], ["IL", "IL"], ["TESTO", "TE-STO"]], ["👦", "📖"], { soluzioni: [["TEO", "LEGGE", "IL", "TESTO"]] });
  S("ti-1", "TI", 1, [["TINA", "TI-NA"], ["TIRA", "TI-RA"], ["IL", "IL"], ["TIMONE", "TI-MO-NE"]], ["👧", "⛵"], { soluzioni: [["TINA", "TIRA", "IL", "TIMONE"]] });
  S("to-1", "TO", 1, [["TOTO", "TO-TO"], ["TROVA", "TRO-VA"], ["IL", "IL"], ["TOPO", "TO-PO"]], ["👦", "🐭"], { soluzioni: [["TOTO", "TROVA", "IL", "TOPO"]] });
  S("tu-1", "TU", 1, [["LA", "LA"], ["TUTA", "TU-TA"], ["E", "E"], ["IL", "IL"], ["TUBO", "TU-BO"]], ["🧥", "🧴"], { soluzioni: [["LA", "TUTA", "E", "IL", "TUBO"]] });

  S("sa-1", "SA", 1, [["SARA", "SA-RA"], ["PRENDE", "PREN-DE"], ["IL", "IL"], ["SALE", "SA-LE"]], ["👧", "🧂"], { soluzioni: [["SARA", "PRENDE", "IL", "SALE"]] });
  S("se-1", "SE", 1, [["SERENA", "SE-RE-NA"], ["PORTA", "POR-TA"], ["LA", "LA"], ["SETA", "SE-TA"]], ["👧", "🧵"], { soluzioni: [["SERENA", "PORTA", "LA", "SETA"]] });
  S("si-1", "SI", 1, [["SISI", "SI-SI"], ["SENTE", "SEN-TE"], ["LA", "LA"], ["SIRENA", "SI-RE-NA"]], ["👧", "🧜‍♀️"], { soluzioni: [["SISI", "SENTE", "LA", "SIRENA"]] });
  S("so-1", "SO", 1, [["SOFIA", "SO-FIA"], ["SUONA", "SUO-NA"], ["IL", "IL"], ["SONAGLIO", "SO-NA-GLIO"]], ["👧", "🔔"], { soluzioni: [["SOFIA", "SUONA", "IL", "SONAGLIO"]] });
  S("su-1", "SU", 1, [["SUSI", "SU-SI"], ["AMA", "A-MA"], ["IL", "IL"], ["SUGO", "SU-GO"]], ["👧", "🥫"], { soluzioni: [["SUSI", "AMA", "IL", "SUGO"]] });

  S("na-1", "NA", 1, [["NANA", "NA-NA"], ["PORTA", "POR-TA"], ["LA", "LA"], ["NAVE", "NA-VE"]], ["👧", "🚢"], { soluzioni: [["NANA", "PORTA", "LA", "NAVE"]] });
  S("ne-1", "NE", 1, [["LA", "LA"], ["NEVE", "NE-VE"], ["COPRE", "CO-PRE"], ["IL", "IL"], ["NERO", "NE-RO"]], ["❄️", "⚫"], { soluzioni: [["LA", "NEVE", "COPRE", "IL", "NERO"]] });
  S("ni-1", "NI", 1, [["NINO", "NI-NO"], ["HA", "HA"], ["UN", "UN"], ["NIDO", "NI-DO"]], ["👦", "🪺"], { soluzioni: [["NINO", "HA", "UN", "NIDO"]] });
  S("no-1", "NO", 1, [["NONNA", "NON-NA"], ["HA", "HA"], ["NOVE", "NO-VE"], ["NOCI", "NO-CI"]], ["👵", "🌰"], { soluzioni: [["NONNA", "HA", "NOVE", "NOCI"]] });
  S("nu-1", "NU", 1, [["LA", "LA"], ["NUVOLA", "NU-VO-LA"], ["HA", "HA"], ["UN", "UN"], ["NUCLEO", "NU-CLE-O"]], ["☁️"], { soluzioni: [["LA", "NUVOLA", "HA", "UN", "NUCLEO"]] });

  S("ra-1", "RA", 1, [["LA", "LA"], ["RANA", "RA-NA"], ["E", "E"], ["IL", "IL"], ["RAGNO", "RA-GNO"]], ["🐸", "🕷️"], { soluzioni: [["LA", "RANA", "E", "IL", "RAGNO"]] });
  S("re-1", "RE", 1, [["RENZO", "REN-ZO"], ["REGALA", "RE-GA-LA"], ["UN", "UN"], ["REMO", "RE-MO"]], ["👦", "🚣"], { soluzioni: [["RENZO", "REGALA", "UN", "REMO"]] });
  S("ri-1", "RI", 1, [["RITA", "RI-TA"], ["RIDE", "RI-DE"], ["CON", "CON"], ["RINO", "RI-NO"]], ["👧", "👦"], { soluzioni: [["RITA", "RIDE", "CON", "RINO"]] });
  S("ro-1", "RO", 1, [["ROSA", "RO-SA"], ["AMA", "A-MA"], ["IL", "IL"], ["ROBOT", "RO-BOT"]], ["🌹", "🤖"], { soluzioni: [["ROSA", "AMA", "IL", "ROBOT"]] });
  S("ru-1", "RU", 1, [["RUBEN", "RU-BEN"], ["USA", "U-SA"], ["LA", "LA"], ["RUSPA", "RU-SPA"]], ["👦", "🚜"], { soluzioni: [["RUBEN", "USA", "LA", "RUSPA"]] });

  S("fa-1", "FA", 1, [["LA", "LA"], ["FATA", "FA-TA"], ["FA", "FA"], ["UN", "UN"], ["FAGIOLO", "FA-GIO-LO"]], ["🧚", "🫘"], { soluzioni: [["LA", "FATA", "FA", "UN", "FAGIOLO"]] });
  S("fe-1", "FE", 1, [["LA", "LA"], ["FENICE", "FE-NI-CE"], ["È", "È"], ["FELICE", "FE-LI-CE"]], ["🦅", "😊"], { soluzioni: [["LA", "FENICE", "È", "FELICE"]] });
  S("fi-1", "FI", 1, [["FILIPPO", "FI-LIP-PO"], ["FILA", "FI-LA"], ["IL", "IL"], ["FILO", "FI-LO"]], ["👦", "🧵"], { soluzioni: [["FILIPPO", "FILA", "IL", "FILO"]] });
  S("fo-1", "FO", 1, [["LA", "LA"], ["FOCA", "FO-CA"], ["GUARDA", "GUAR-DA"], ["LA", "LA"], ["FOGLIA", "FO-GLIA"]], ["🦭", "🍃"], { soluzioni: [["LA", "FOCA", "GUARDA", "LA", "FOGLIA"]] });
  S("fu-1", "FU", 1, [["FUGA", "FU-GA"], ["DAL", "DAL"], ["FUMO", "FU-MO"]], ["🏃", "💨"], { soluzioni: [["FUGA", "DAL", "FUMO"]] });

  S("va-1", "VA", 1, [["VALERIA", "VA-LE-RIA"], ["HA", "HA"], ["UN", "UN"], ["VASO", "VA-SO"]], ["👩", "🏺"], { soluzioni: [["VALERIA", "HA", "UN", "VASO"]] });
  S("ve-1", "VE", 1, [["LA", "LA"], ["VELA", "VE-LA"], ["HA", "HA"], ["UNA", "U-NA"], ["VESPA", "VE-SPA"]], ["⛵", "🐝"], { soluzioni: [["LA", "VELA", "HA", "UNA", "VESPA"]] });
  S("vi-1", "VI", 1, [["VIVI", "VI-VI"], ["HA", "HA"], ["UN", "UN"], ["VISO", "VI-SO"]], ["👧", "😊"], { soluzioni: [["VIVI", "HA", "UN", "VISO"]] });
  S("vo-1", "VO", 1, [["LA", "LA"], ["VOCE", "VO-CE"], ["VOLA", "VO-LA"]], ["🗣️", "💨"], { soluzioni: [["LA", "VOCE", "VOLA"]] });

  S("ba-1", "BA", 1, [["LA", "LA"], ["BALENA", "BA-LE-NA"], ["MANGIA", "MAN-GIA"], ["LA", "LA"], ["BANANA", "BA-NA-NA"]], ["🐋", "🍌"], { soluzioni: [["LA", "BALENA", "MANGIA", "LA", "BANANA"]] });
  S("be-1", "BE", 1, [["BEPPE", "BEP-PE"], ["BEVE", "BE-VE"], ["BENE", "BE-NE"]], ["👦", "🥤"], { soluzioni: [["BEPPE", "BEVE", "BENE"]] });
  S("bi-1", "BI", 1, [["BIBI", "BI-BI"], ["VA", "VA"], ["IN", "IN"], ["BICI", "BI-CI"]], ["👧", "🚲"], { soluzioni: [["BIBI", "VA", "IN", "BICI"]] });
  S("bo-1", "BO", 1, [["BOBO", "BO-BO"], ["VA", "VA"], ["NEL", "NEL"], ["BOSCO", "BO-SCO"]], ["👦", "🌳"], { soluzioni: [["BOBO", "VA", "NEL", "BOSCO"]] });
  S("bu-1", "BU", 1, [["BUBA", "BU-BA"], ["MANGIA", "MAN-GIA"], ["IL", "IL"], ["BUDINO", "BU-DI-NO"]], ["👧", "🍮"], { soluzioni: [["BUBA", "MANGIA", "IL", "BUDINO"]] });

  S("da-1", "DA", 1, [["DADA", "DA-DA"], ["HA", "HA"], ["UN", "UN"], ["DADO", "DA-DO"]], ["👧", "🎲"], { soluzioni: [["DADA", "HA", "UN", "DADO"]] });
  S("de-1", "DE", 1, [["DEA", "DE-A"], ["TROVA", "TRO-VA"], ["UN", "UN"], ["DENARO", "DE-NA-RO"]], ["👧", "💰"], { soluzioni: [["DEA", "TROVA", "UN", "DENARO"]] });
  S("di-1", "DI", 1, [["DIDI", "DI-DI"], ["ALZA", "AL-ZA"], ["UN", "UN"], ["DITO", "DI-TO"]], ["👧", "👆"], { soluzioni: [["DIDI", "ALZA", "UN", "DITO"]] });
  S("do-1", "DO", 1, [["DODO", "DO-DO"], ["HA", "HA"], ["UN", "UN"], ["DONO", "DO-NO"]], ["👦", "🎁"], { soluzioni: [["DODO", "HA", "UN", "DONO"]] });
  S("du-1", "DU", 1, [["IL", "IL"], ["DUCA", "DU-CA"], ["HA", "HA"], ["DUE", "DU-E"], ["CORONE", "CO-RO-NE"]], ["🤴", "👑"], { soluzioni: [["IL", "DUCA", "HA", "DUE", "CORONE"]] });

  S("ca-1", "CA", 1, [["LA", "LA"], ["CAPRA", "CA-PRA"], ["VA", "VA"], ["A", "A"], ["CASA", "CA-SA"]], ["🐐", "🏠"], { soluzioni: [["LA", "CAPRA", "VA", "A", "CASA"]] });
  S("co-1", "CO", 1, [["COCO", "CO-CO"], ["HA", "HA"], ["UN", "UN"], ["CONO", "CO-NO"]], ["👦", "🍦"], { soluzioni: [["COCO", "HA", "UN", "CONO"]] });
  S("cu-1", "CU", 1, [["CUBA", "CU-BA"], ["HA", "HA"], ["UN", "UN"], ["CUBO", "CU-BO"]], ["👧", "🧊"], { soluzioni: [["CUBA", "HA", "UN", "CUBO"]] });
  S("ce-1", "CE", 1, [["CECE", "CE-CE"], ["PREPARA", "PRE-PA-RA"], ["LA", "LA"], ["CENA", "CE-NA"]], ["👧", "🍽️"], { soluzioni: [["CECE", "PREPARA", "LA", "CENA"]] });
  S("ci-1", "CI", 1, [["CICI", "CI-CI"], ["GUARDA", "GUAR-DA"], ["LA", "LA"], ["CIMA", "CI-MA"]], ["👧", "⛰️"], { soluzioni: [["CICI", "GUARDA", "LA", "CIMA"]] });
  S("che-1", "CHE", 1, [["CHE", "CHE"], ["BEL", "BEL"], ["CHERUBINO", "CHE-RU-BI-NO"]], ["👼"], { soluzioni: [["CHE", "BEL", "CHERUBINO"]] });
  S("chi-1", "CHI", 1, [["CHI", "CHI"], ["HA", "HA"], ["LA", "LA"], ["CHITARRA", "CHI-TAR-RA"]], ["🙋", "🎸"], { soluzioni: [["CHI", "HA", "LA", "CHITARRA"]] });

  S("ga-1", "GA", 1, [["GAIA", "GA-IA"], ["VA", "VA"], ["ALLA", "AL-LA"], ["GARA", "GA-RA"]], ["👧", "🏁"], { soluzioni: [["GAIA", "VA", "ALLA", "GARA"]] });
  S("go-1", "GO", 1, [["GOGO", "GO-GO"], ["GUARDA", "GUAR-DA"], ["IL", "IL"], ["GORILLA", "GO-RIL-LA"]], ["👦", "🦍"], { soluzioni: [["GOGO", "GUARDA", "IL", "GORILLA"]] });
  S("gu-1", "GU", 1, [["GUGO", "GU-GO"], ["HA", "HA"], ["UN", "UN"], ["GUFO", "GU-FO"]], ["👦", "🦉"], { soluzioni: [["GUGO", "HA", "UN", "GUFO"]] });
  S("ge-1", "GE", 1, [["GEGE", "GE-GE"], ["HA", "HA"], ["UN", "UN"], ["GELATO", "GE-LA-TO"]], ["👦", "🍦"], { soluzioni: [["GEGE", "HA", "UN", "GELATO"]] });
  S("gi-1", "GI", 1, [["GIGI", "GI-GI"], ["HA", "HA"], ["UNA", "U-NA"], ["GIRAFFA", "GI-RAF-FA"]], ["👦", "🦒"], { soluzioni: [["GIGI", "HA", "UNA", "GIRAFFA"]] });
  S("ghe-1", "GHE", 1, [["GHELA", "GHE-LA"], ["GUARDA", "GUAR-DA"], ["IL", "IL"], ["GHEPARDO", "GHE-PAR-DO"]], ["👧", "🐆"], { soluzioni: [["GHELA", "GUARDA", "IL", "GHEPARDO"]] });
  S("ghi-1", "GHI", 1, [["GHIGO", "GHI-GO"], ["HA", "HA"], ["UN", "UN"], ["GHIRO", "GHI-RO"]], ["👦", "🐭"], { soluzioni: [["GHIGO", "HA", "UN", "GHIRO"]] });

  S("cia-1", "CIA", 1, [["LA", "LA"], ["CAMICIA", "CA-MI-CIA"], ["HA", "HA"], ["UNA", "U-NA"], ["FRECCIA", "FREC-CIA"]], ["👕", "🏹"], { soluzioni: [["LA", "CAMICIA", "HA", "UNA", "FRECCIA"]] });
  S("cio-1", "CIO", 1, [["UN", "UN"], ["BACIO", "BA-CIO"], ["E", "E"], ["UN", "UN"], ["ABBRACCIO", "AB-BRAC-CIO"]], ["💋", "🤗"], { soluzioni: [["UN", "BACIO", "E", "UN", "ABBRACCIO"]] });
  S("ciu-1", "CIU", 1, [["IL", "IL"], ["CIUCO", "CIU-CO"], ["GUARDA", "GUAR-DA"], ["L'", "L'"], ["ACCIUGA", "AC-CIU-GA"]], ["🐴", "🐟"], { soluzioni: [["IL", "CIUCO", "GUARDA", "L'", "ACCIUGA"]] });
  S("gia-1", "GIA", 1, [["GIADA", "GIA-DA"], ["HA", "HA"], ["UNA", "U-NA"], ["MAGIA", "MA-GIA"]], ["👧", "🪄"], { soluzioni: [["GIADA", "HA", "UNA", "MAGIA"]] });
  S("gio-1", "GIO", 1, [["GIO", "GIO"], ["HA", "HA"], ["UN", "UN"], ["GIOCO", "GIO-CO"]], ["👦", "🎲"], { soluzioni: [["GIO", "HA", "UN", "GIOCO"]] });
  S("giu-1", "GIU", 1, [["GIULIA", "GIU-LIA"], ["AMA", "A-MA"], ["GIUGNO", "GIU-GNO"]], ["👧", "📅"], { soluzioni: [["GIULIA", "AMA", "GIUGNO"]] });
  S("sca-1", "SCA", 1, [["LA", "LA"], ["SCATOLA", "SCA-TO-LA"], ["È", "È"], ["SULLA", "SUL-LA"], ["SCALA", "SCA-LA"]], ["📦", "🪜"], { soluzioni: [["LA", "SCATOLA", "È", "SULLA", "SCALA"]] });
  S("sco-1", "SCO", 1, [["LO", "LO"], ["SCOIATTOLO", "SCO-IAT-TO-LO"], ["HA", "HA"], ["UNA", "U-NA"], ["SCOPA", "SCO-PA"]], ["🐿️", "🧹"], { soluzioni: [["LO", "SCOIATTOLO", "HA", "UNA", "SCOPA"]] });
  S("scu-1", "SCU", 1, [["LO", "LO"], ["SCUDO", "SCU-DO"], ["È", "È"], ["UNA", "U-NA"], ["SCUSA", "SCU-SA"]], ["🛡️", "🙏"], { soluzioni: [["LO", "SCUDO", "È", "UNA", "SCUSA"]] });
  S("sce-1", "SCE", 1, [["LA", "LA"], ["SCENA", "SCE-NA"], ["HA", "HA"], ["UNO", "U-NO"], ["SCERIFFO", "SCE-RIF-FO"]], ["🎭", "🤠"], { soluzioni: [["LA", "SCENA", "HA", "UNO", "SCERIFFO"]] });
  S("sci-1", "SCI", 1, [["LO", "LO"], ["SCIROPPO", "SCI-ROP-PO"], ["È", "È"], ["SULLO", "SUL-LO"], ["SCIVOLO", "SCI-VO-LO"]], ["🍯", "🛝"], { soluzioni: [["LO", "SCIROPPO", "È", "SULLO", "SCIVOLO"]] });
  S("scia-1", "SCIA", 1, [["LO", "LO"], ["SCIAME", "SCIA-ME"], ["SEGUE", "SE-GUE"], ["LA", "LA"], ["SCIA", "SCIA"]], ["🐝", "🌊"], { soluzioni: [["LO", "SCIAME", "SEGUE", "LA", "SCIA"]] });
  S("scio-1", "SCIO", 1, [["LO", "LO"], ["SCIOPERO", "SCIO-PE-RO"], ["FA", "FA"], ["SCIOGLIERE", "SCIO-GLIE-RE"], ["IL", "IL"], ["GHIACCIO", "GHIAC-CIO"]], ["✊", "💧"], { soluzioni: [["LO", "SCIOPERO", "FA", "SCIOGLIERE", "IL", "GHIACCIO"]] });
  S("sciu-1", "SCIU", 1, [["NON", "NON"], ["SCIUPARE", "SCIU-PA-RE"], ["L'", "L'"], ["ASCIUGAMANO", "A-SCIU-GA-MA-NO"]], ["🧥", "🧻"], { soluzioni: [["NON", "SCIUPARE", "L'", "ASCIUGAMANO"]] });
  S("gna-1", "GNA", 1, [["LA", "LA"], ["MONTAGNA", "MON-TA-GNA"], ["HA", "HA"], ["UNA", "U-NA"], ["PIGNA", "PI-GNA"]], ["⛰️", "🌰"], { soluzioni: [["LA", "MONTAGNA", "HA", "UNA", "PIGNA"]] });
  S("gne-1", "GNE", 1, [["L'", "L'"], ["INGEGNERE", "IN-GE-GNE-RE"], ["HA", "HA"], ["DUE", "DU-E"], ["COMPAGNE", "COM-PA-GNE"]], ["👷", "👭"], { soluzioni: [["L'", "INGEGNERE", "HA", "DUE", "COMPAGNE"]] });
  S("gni-1", "GNI", 1, [["I", "I"], ["RAGNI", "RA-GNI"], ["E", "E"], ["I", "I"], ["COMPAGNI", "COM-PA-GNI"], ["GIOCANO", "GIO-CA-NO"]], ["🕷️", "👬"], { soluzioni: [["I", "RAGNI", "E", "I", "COMPAGNI", "GIOCANO"]] });
  S("gno-1", "GNO", 1, [["LO", "LO"], ["GNOMO", "GNO-MO"], ["È", "È"], ["NEL", "NEL"], ["BAGNO", "BA-GNO"]], ["🧙", "🛁"], { soluzioni: [["LO", "GNOMO", "È", "NEL", "BAGNO"]] });
  S("glia-1", "GLIA", 1, [["LA", "LA"], ["FAMIGLIA", "FA-MI-GLIA"], ["HA", "HA"], ["UNA", "U-NA"], ["MAGLIA", "MA-GLIA"]], ["👨‍👩‍👧", "👕"], { soluzioni: [["LA", "FAMIGLIA", "HA", "UNA", "MAGLIA"]] });
  S("glie-1", "GLIE", 1, [["LA", "LA"], ["MOGLIE", "MO-GLIE"], ["HA", "HA"], ["DUE", "DU-E"], ["FIGLIE", "FI-GLIE"]], ["👰", "👧"], { soluzioni: [["LA", "MOGLIE", "HA", "DUE", "FIGLIE"]] });
  S("glio-1", "GLIO", 1, [["IL", "IL"], ["FIGLIO", "FI-GLIO"], ["MANGIA", "MAN-GIA"], ["L'", "L'"], ["AGLIO", "A-GLIO"]], ["👦", "🧄"], { soluzioni: [["IL", "FIGLIO", "MANGIA", "L'", "AGLIO"]] });
  S("qua-1", "QUA", 1, [["IL", "IL"], ["QUADRO", "QUA-DRO"], ["È", "È"], ["QUA", "QUA"]], ["🖼️", "👇"], { soluzioni: [["IL", "QUADRO", "È", "QUA"]] });
  S("que-1", "QUE", 1, [["QUESTO", "QUE-STO"], ["È", "È"], ["UN", "UN"], ["QUESITO", "QUE-SI-TO"]], ["👉", "❓"], { soluzioni: [["QUESTO", "È", "UN", "QUESITO"]] });
  S("quo-1", "QUO", 1, [["IL", "IL"], ["QUOTIDIANO", "QUO-TI-DIA-NO"], ["HA", "HA"], ["UNA", "U-NA"], ["QUOTA", "QUO-TA"]], ["📰", "📏"], { soluzioni: [["IL", "QUOTIDIANO", "HA", "UNA", "QUOTA"]] });
  S("acqua-1", "ACQUA", 1, [["L'", "L'"], ["ACQUA", "AC-QUA"], ["RIEMPIE", "RIEM-PIE"], ["L'", "L'"], ["ACQUARIO", "AC-QUA-RIO"]], ["💧", "🐠"], { tipoBersaglio: "parola", soluzioni: [["L'", "ACQUA", "RIEMPIE", "L'", "ACQUARIO"]] });

  S("a-1", "A", 1, [["ANNA", "AN-NA"], ["AMA", "A-MA"], ["L'", "L'"], ["ALA", "A-LA"]], ["👧", "🪽"], { soluzioni: [["ANNA", "AMA", "L'", "ALA"]] });
  S("e-1", "E", 1, [["ELENA", "E-LE-NA"], ["È", "È"], ["UN", "UN"], ["EROE", "E-RO-E"]], ["👧", "🦸"], { soluzioni: [["ELENA", "È", "UN", "EROE"]] });
  S("i-1", "I", 1, [["L'", "L'"], ["IDEA", "I-DE-A"], ["È", "È"], ["UN'", "UN'"], ["ISOLA", "I-SO-LA"]], ["💡", "🏝️"], { soluzioni: [["L'", "IDEA", "È", "UN'", "ISOLA"]] });
  S("o-1", "O", 1, [["ORO", "O-RO"], ["E", "E"], ["OROLOGIO", "O-RO-LO-GIO"]], ["🪙", "⏰"], { soluzioni: [["ORO", "E", "OROLOGIO"]] });
  S("u-1", "U", 1, [["L'", "L'"], ["UNICORNO", "U-NI-COR-NO"], ["MANGIA", "MAN-GIA"], ["L'", "L'"], ["UVA", "U-VA"]], ["🦄", "🍇"], { soluzioni: [["L'", "UNICORNO", "MANGIA", "L'", "UVA"]] });
  S("vu-1", "VU", 1, [["LA", "LA"], ["VUVUZELA", "VU-VU-ZE-LA"], ["SUONA", "SUO-NA"]], ["📯"], { soluzioni: [["LA", "VUVUZELA", "SUONA"]] });
  S("za-1", "ZA", 1, [["ZARA", "ZA-RA"], ["HA", "HA"], ["UNA", "U-NA"], ["ZAGARA", "ZA-GA-RA"]], ["👧", "🌼"], { soluzioni: [["ZARA", "HA", "UNA", "ZAGARA"]] });
  S("ze-1", "ZE", 1, [["ZERO", "ZE-RO"], ["ZEBRE", "ZE-BRE"], ["NEL", "NEL"], ["ZOO", "ZO-O"]], ["0️⃣", "🦓"], { soluzioni: [["ZERO", "ZEBRE", "NEL", "ZOO"]] });
  S("zi-1", "ZI", 1, [["ZIA", "ZI-A"], ["E", "E"], ["ZII", "ZI-I"]], ["👩", "👬"], { soluzioni: [["ZIA", "E", "ZII"]] });
  S("zo-1", "ZO", 1, [["LO", "LO"], ["ZOO", "ZO-O"], ["HA", "HA"], ["UNA", "U-NA"], ["ZONA", "ZO-NA"]], ["🦁", "🗺️"], { soluzioni: [["LO", "ZOO", "HA", "UNA", "ZONA"]] });
  S("gnu-1", "GNU", 1, [["LO", "LO"], ["GNU", "GNU"], ["È", "È"], ["NEL", "NEL"], ["ZOO", "ZO-O"]], ["🐃", "🦁"], { soluzioni: [["LO", "GNU", "È", "NEL", "ZOO"]] });
  S("qui-1", "QUI", 1, [["QUI", "QUI"], ["E", "E"], ["QUI", "QUI"]], ["👇"], { soluzioni: [["QUI", "E", "QUI"]] });

  function joinParole(list) {
    let out = "";
    list.forEach((w, i) => {
      if (i === 0) { out = w; return; }
      out += (out.endsWith("'") ? "" : " ") + w;
    });
    return out;
  }

  const FRASI = FRASI_RAW.map((raw, idx) => {
    const parole = raw.words.map(([testo, sillabe]) => ({
      testo: testo.toUpperCase(),
      sillabe: sillabe.split("-").map(s => s.trim().toUpperCase()).filter(Boolean),
      audioKey: testo.toLowerCase()
    }));
    const tipoBersaglio = raw.opts.tipoBersaglio || "sillaba";
    const occorrenze = [];
    if (tipoBersaglio === "parola") {
      parole.forEach((p, pi) => {
        if (p.testo === raw.target.toUpperCase()) occorrenze.push({ parola: pi, sillaba: 0, tipo: "parola" });
      });
    } else {
      parole.forEach((p, pi) => {
        p.sillabe.forEach((s, si) => {
          if (s === raw.target.toUpperCase()) occorrenze.push({ parola: pi, sillaba: si, tipo: "sillaba" });
        });
      });
    }
    const testo = joinParole(parole.map(p => p.testo));
    return {
      id: raw.id,
      indice: idx,
      testo,
      audioKey: raw.id,
      parole,
      sillabaBersaglio: raw.target.toUpperCase(),
      tipoBersaglio,
      occorrenze,
      illustrazioni: raw.emoji.slice(),
      livello: raw.livello,
      soluzioniValide: (raw.opts.soluzioni || [parole.map(p => p.testo)]).map(sol => sol.map(x => x.toUpperCase())),
      statoRevisione: raw.opts.statoRevisione || STATO.CONVALIDATA,
      nota: raw.opts.nota || ""
    };
  });

  const FRASE_PER_ID = {};
  FRASI.forEach(f => { FRASE_PER_ID[f.id] = f; });

  function frasiPerUnita(testo) {
    const t = String(testo).toUpperCase();
    return FRASI.filter(f => f.sillabaBersaglio === t);
  }
  function frase(id) { return FRASE_PER_ID[id] || null; }

  /* ------------------------------------------------------------------
     5. GENERATORE DI ESERCIZI
     ------------------------------------------------------------------
     Ogni esercizio è un oggetto completo: consegna, stimolo, opzioni,
     soluzione, feedback, competenza e prerequisiti. L'interfaccia non
     inventa contenuti: riceve solo esercizi già validati.
     ------------------------------------------------------------------ */
  const DEFAULT_OPTS = {
    alternative: 3,
    tipiAttivi: null,
    posizione: "tutte",
    difficolta: "auto",
    includeFrasi: true
  };

  const CONFUSABILI = {
    CE: ["CHE", "GE", "CIE"],
    CI: ["CHI", "GI", "CIA"],
    CHE: ["CE", "GE", "GHE"],
    CHI: ["CI", "GI", "GHI"],
    GE: ["GHE", "CE", "GIE"],
    GI: ["GHI", "CI", "GIA"],
    GHE: ["GE", "CHE", "GHE"],
    GHI: ["GI", "CHI", "GHI"],
    CIA: ["GIA", "CA", "SCIA"],
    CIO: ["GIO", "CO", "SCIO"],
    CIU: ["GIU", "CU", "SCIU"],
    GIA: ["CIA", "GA", "GIO"],
    GIO: ["CIO", "GO", "GIA"],
    GIU: ["CIU", "GU", "GIO"],
    SCA: ["SCIA", "SA", "STA"],
    SCO: ["SCIO", "SO", "STO"],
    SCU: ["SCIU", "SU", "STU"],
    SCE: ["SCIE", "SE", "CHE"],
    SCI: ["SCIE", "SI", "CHI"],
    SCIA: ["SCA", "SIA", "SCIE"],
    SCIO: ["SCO", "SIO", "SCIE"],
    SCIU: ["SCU", "SIU", "SCIE"],
    GNA: ["GNA", "NA", "GNE"],
    GNE: ["GNE", "NE", "GNI"],
    GNI: ["GNI", "NI", "GNE"],
    GNO: ["GNO", "NO", "GNA"],
    GNU: ["GNU", "NU", "GNO"],
    GLIA: ["GLIE", "LIA", "GIA"],
    GLIE: ["GLIA", "LIE", "GIE"],
    GLIO: ["GLIA", "LIO", "GIO"],
    QUA: ["QUO", "CA", "GUA"],
    QUE: ["QUI", "CHE", "GUE"],
    QUI: ["QUE", "CHI", "GUI"],
    QUO: ["QUA", "CO", "GUO"],
    ACQUA: ["AQUA", "ACQUA", "ACQUO"]
  };

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function uniqueBy(list, fn) {
    const seen = new Set();
    const out = [];
    list.forEach(x => {
      const key = fn(x);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(x);
    });
    return out;
  }

  function unitFamily(u) {
    return FAMIGLIE.find(f => f.id === u.famiglia) || null;
  }

  function familyUnits(u) {
    const f = unitFamily(u);
    if (!f) return [u];
    return f.unita.map(x => {
      const testo = typeof x === "string" ? x : x.testo;
      const id = typeof x === "string" ? x : (x.id || x.testo);
      return unita(id) || unita(testo);
    }).filter(Boolean);
  }

  function distrattoriSillabe(u, n, variant) {
    const clean = list => list.filter(x => x && x.testo && x.testo !== u.testo);
    const fam = clean(familyUnits(u)).filter(x => x.tipo === u.tipo);
    const conf = clean((CONFUSABILI[u.testo] || []).map(t => unita(t)).filter(Boolean));
    const known = clean(UNITA.filter(x => x.tipo === u.tipo && x.livello <= u.livello));
    const all = clean(UNITA.filter(x => x.tipo === "sillaba"));
    const rounds = variant % 3 === 0 ? [fam, conf, known, all] : variant % 3 === 1 ? [conf, fam, known, all] : [known, fam, conf, all];
    const pool = uniqueBy([].concat(...rounds), x => x.testo);
    return pool.slice(0, n);
  }

  function paroleConImmagine() {
    return PAROLE.filter(w => w.immagine);
  }

  function distrattoriParole(u, n, posizione, excludeIds) {
    const exclude = new Set(excludeIds || []);
    let pool = paroleConImmagine().filter(w => {
      if (exclude.has(w.id)) return false;
      if (posizione === "iniziale" && w.sillabaIniziale === u.testo) return false;
      if (posizione === "finale" && w.sillabaFinale === u.testo) return false;
      return true;
    });
    // varietà: prima parole dello stesso livello lessicale, poi le altre
    pool = shuffle(pool).sort((a, b) => (a.livelloLessicale - b.livelloLessicale));
    return pool.slice(0, n);
  }

  function optSillaba(testo, corretta, extra) {
    return Object.assign({ id: "opt-" + testo.toLowerCase() + "-" + Math.random().toString(36).slice(2, 7), testo, corretta: !!corretta, tipo: "sillaba" }, extra || {});
  }

  function optParola(w, corretta, extra) {
    return Object.assign({
      id: "opt-" + w.id,
      testo: w.testo,
      parolaId: w.id,
      immagine: w.immagine,
      alt: w.immagine ? w.immagine.alt : w.testo,
      corretta: !!corretta,
      tipo: "parola",
      audio: { testo: w.testo, gruppo: "parole" }
    }, extra || {});
  }

  function exBase(u, model, interazione, competenza, difficolta, consegna, extra) {
    return Object.assign({
      id: `${u.id}-${model}-${Math.random().toString(36).slice(2, 7)}`,
      unitId: u.id,
      unitTesto: u.testo,
      unitTipo: u.tipo,
      modello: model,
      interazione,
      competenza,
      difficolta,
      consegna,
      consegnaAudio: consegna,
      stimolo: { tipo: "nessuno" },
      opzioni: [],
      soluzione: null,
      aiuto: "",
      feedback: {
        corretto: "Bravo! Hai riconosciuto la sillaba giusta.",
        errato: "Riprova: ascolta di nuovo con calma."
      },
      prerequisiti: u.prerequisiti.slice(),
      meta: {}
    }, extra || {});
  }

  function exAscolta(u, opts, variant) {
    const n = Math.max(2, Math.min(5, opts.alternative || 3));
    const distr = distrattoriSillabe(u, n - 1, variant);
    const opzioni = shuffle([optSillaba(u.testo, true)].concat(distr.map(d => optSillaba(d.testo, false))));
    return exBase(u, variant === 0 ? "ascolta-a" : "ascolta-b-" + variant, "scelta", "uditivo", variant ? "intermedio" : "facile",
      "Ascolta la sillaba e scegli quella giusta.", {
        stimolo: { tipo: "audio", testo: u.testo, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni,
        soluzione: u.testo,
        aiuto: "Riascolta la sillaba e guarda bene le lettere.",
        feedback: {
          corretto: `Sì: ${u.testo}.`,
          errato: `La sillaba giusta era ${u.testo}. Riascoltala.`
        }
      });
  }

  function exDiscrimina(u, opts) {
    const n = Math.max(2, Math.min(5, opts.alternative || 3));
    const distr = distrattoriSillabe(u, n - 1, 1);
    const opzioni = shuffle([optSillaba(u.testo, true)].concat(distr.map(d => optSillaba(d.testo, false))));
    return exBase(u, "discrimina", "scelta", "uditivo", "avanzato",
      "Ascolta con attenzione: quale sillaba hai sentito?", {
        stimolo: { tipo: "audio", testo: u.testo, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni,
        soluzione: u.testo,
        aiuto: "Le sillabe si somigliano: ascolta la differenza.",
        feedback: {
          corretto: `Esatto: ${u.testo}.`,
          errato: `Era ${u.testo}. Prova a sentire la vocale.`
        }
      });
  }

  function exFamiglia(u, opts) {
    const fam = familyUnits(u);
    if (fam.length < 3) return null;
    const mostra = fam.filter(x => x.testo !== u.testo);
    const opzioni = shuffle(fam.map(x => optSillaba(x.testo, x.testo === u.testo)));
    return exBase(u, "famiglia", "scelta", "grafico", "facile",
      "Completa la famiglia: quale sillaba manca?", {
        stimolo: { tipo: "famiglia", testo: u.testo, mostra: mostra.map(x => x.testo), audio: { sequenza: mostra.map(x => ({ testo: x.testo, gruppo: "syl" })) } },
        audio: { sequenza: mostra.map(x => ({ testo: x.testo, gruppo: "syl" })) },
        opzioni,
        soluzione: u.testo,
        aiuto: "Ascolta la famiglia e cerca la sillaba che non senti.",
        feedback: {
          corretto: `Giusto: ${u.testo}. La famiglia è completa.`,
          errato: `Mancava ${u.testo}. Riascolta la famiglia.`
        }
      });
  }

  function exImmagineIniziale(u, hit, opts, variant) {
    const w = hit.parola;
    const n = Math.max(2, Math.min(5, opts.alternative || 3));
    const distr = distrattoriSillabe(u, n - 1, variant);
    const opzioni = shuffle([optSillaba(u.testo, true)].concat(distr.map(d => optSillaba(d.testo, false))));
    return exBase(u, "immagine-iniziale", "scelta", "iniziale", "intermedio",
      "Guarda l'immagine e ascolta la parola. Qual è la prima sillaba?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: u.testo,
        aiuto: `La parola è ${w.testo}. Ascoltala a pezzi: ${w.sillabe.join("-")}.`,
        feedback: {
          corretto: `Esatto: in ${w.testo} la prima sillaba è ${u.testo}.`,
          errato: `In ${w.testo} la prima sillaba è ${u.testo}: ${w.sillabe.join("-")}.`
        }
      });
  }

  function exTrovaIniziale(u, hit, opts, variant) {
    const w = hit.parola;
    const n = Math.max(2, Math.min(4, opts.alternative || 3));
    const distr = distrattoriParole(u, n - 1, "iniziale", [w.id]);
    const opzioni = shuffle([optParola(w, true)].concat(distr.map(d => optParola(d, false))));
    return exBase(u, "trova-iniziale", "scelta", "iniziale", "intermedio",
      "Ascolta la sillaba e trova la parola che inizia con questa sillaba.", {
        stimolo: { tipo: "audio", testo: u.testo, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni,
        soluzione: w.id,
        aiuto: `La parola giusta è ${w.testo}: inizia con ${w.sillabe[0]}.`,
        feedback: {
          corretto: `Sì: ${w.testo} inizia con ${u.testo}.`,
          errato: `La risposta era ${w.testo}: ${w.sillabe.join("-")}.`
        }
      });
  }

  function exImmagineFinale(u, hit, opts, variant) {
    const w = hit.parola;
    const n = Math.max(2, Math.min(5, opts.alternative || 3));
    const distr = distrattoriSillabe(u, n - 1, variant + 1);
    const opzioni = shuffle([optSillaba(u.testo, true)].concat(distr.map(d => optSillaba(d.testo, false))));
    return exBase(u, "immagine-finale", "scelta", "finale", "avanzato",
      "Guarda l'immagine e ascolta la parola. Qual è l'ultima sillaba?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: u.testo,
        aiuto: `La parola è ${w.testo}. L'ultima sillaba è ${u.testo}.`,
        feedback: {
          corretto: `Esatto: ${w.testo} finisce con ${u.testo}.`,
          errato: `In ${w.testo} l'ultima sillaba è ${u.testo}: ${w.sillabe.join("-")}.`
        }
      });
  }

  function exCacciaFinale(u, hits, opts) {
    const corretti = uniqueBy(hits.map(h => h.parola), w => w.id).slice(0, 3);
    const distr = distrattoriParole(u, 3, "finale", corretti.map(w => w.id));
    const opzioni = shuffle(corretti.map(w => optParola(w, true)).concat(distr.map(w => optParola(w, false))));
    return exBase(u, "caccia-finale", "multipla", "finale", "avanzato",
      "Tocca tutte le immagini che finiscono con la sillaba che senti.", {
        stimolo: { tipo: "audio", testo: u.testo, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni,
        soluzione: corretti.map(w => "opt-" + w.id),
        aiuto: `Ascolta ogni parola e guarda l'ultima sillaba.`,
        feedback: {
          corretto: `Bene: hai trovato le parole che finiscono con ${u.testo}.`,
          errato: `Alcune parole non finiscono con ${u.testo}. Riascoltale.`
        }
      });
  }

  function exCompleta(u, hit, opts, variant) {
    const w = hit.parola;
    const pos = hit.indice >= 0 ? hit.indice : 0;
    const n = Math.max(2, Math.min(5, opts.alternative || 3));
    const corretta = w.sillabe[pos];
    const distr = distrattoriSillabe(u, n + 1, variant).filter(d => d.testo !== corretta);
    const visti = new Set([corretta]);
    const opzioni = [optSillaba(corretta, true)];
    distr.forEach(d => { if (!visti.has(d.testo)) { visti.add(d.testo); opzioni.push(optSillaba(d.testo, false)); } });
    const mostra = w.sillabe.map((s, i) => i === pos ? "___" : s);
    return exBase(u, "completa", "scelta", "composizione", "intermedio",
      "Completa la parola con la sillaba giusta.", {
        stimolo: { tipo: "parola-incompleta", parolaId: w.id, immagine: w.immagine, parola: w.testo, mostra, sillabe: w.sillabe, posizione: pos, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni: shuffle(opzioni),
        soluzione: corretta,
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: {
          corretto: `Esatto: ${w.testo}.`,
          errato: `La tessera giusta era ${corretta} per formare ${w.testo}.`
        }
      });
  }

  function exTreno(u, hit, opts) {
    const w = hit.parola;
    if (w.sillabe.length < 2) return null;
    const extra = distrattoriSillabe(u, 3, 1).map(d => d.testo).filter(t => !w.sillabe.includes(t)).slice(0, 2);
    const tessere = shuffle(w.sillabe.concat(extra));
    return exBase(u, "treno", "ordina", "composizione", "avanzato",
      "Metti le sillabe nel giusto ordine per scrivere la parola.", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" }, tessere },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni: tessere.map(t => optSillaba(t, false)),
        soluzione: w.sillabe.slice(),
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: {
          corretto: `Perfetto: ${w.testo}.`,
          errato: `Riprova: ${w.testo} si scrive ${w.sillabe.join("-")}.`
        }
      });
  }

  function exMemory(u, hits, opts) {
    const distinct = uniqueBy(hits.map(h => h.parola), w => w.sillabaIniziale).slice(0, 3);
    if (distinct.length < 2) return null;
    const coppie = distinct.map((w, i) => ({ pairId: `p${i}`, parolaId: w.id, sillaba: w.sillabaIniziale, immagine: w.immagine, parola: w.testo }));
    return exBase(u, "memory", "memory", "iniziale", "intermedio",
      "Trova le coppie: ogni immagine con la sua prima sillaba.", {
        stimolo: { tipo: "memory", coppie, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni: [],
        soluzione: coppie.map(c => c.pairId),
        aiuto: "Guarda l'immagine e ascolta la prima sillaba della parola.",
        feedback: {
          corretto: "Bene: hai trovato tutte le coppie.",
          errato: "Queste due tessere non vanno insieme. Riprova."
        }
      });
  }

  function exSegmenta(u, hit, opts) {
    const w = hit.parola;
    const n = w.sillabe.length;
    const optsNum = new Set([n]);
    let k = 2;
    while (optsNum.size < Math.max(3, Math.min(4, opts.alternative || 3)) && k <= 6) {
      optsNum.add(k);
      k++;
    }
    const opzioni = shuffle(Array.from(optsNum).map(x => ({ id: "n" + x, testo: String(x), corretta: x === n, tipo: "numero" })));
    return exBase(u, "segmenta", "scelta", "segmentazione", "facile",
      "Quante sillabe ha questa parola?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: "n" + n,
        aiuto: `Ascolta a pezzi: ${w.sillabe.join("-")}.`,
        feedback: {
          corretto: `Esatto: ${w.testo} ha ${n} sillabe.`,
          errato: `${w.testo} ha ${n} sillabe: ${w.sillabe.join("-")}.`
        }
      });
  }

  function exPosizione(u, hit, opts) {
    const w = hit.parola;
    const occ = w.sillabe.map((s, i) => s === u.testo ? i : -1).filter(i => i >= 0);
    if (occ.length !== 1) return null;
    const pos = occ[0];
    const label = pos === 0 ? "iniziale" : pos === w.sillabe.length - 1 ? "finale" : "interna";
    const opzioni = shuffle([
      { id: "pos-inizio", testo: "All'inizio", corretta: label === "iniziale", tipo: "posizione" },
      { id: "pos-mezzo", testo: "In mezzo", corretta: label === "interna", tipo: "posizione" },
      { id: "pos-fine", testo: "Alla fine", corretta: label === "finale", tipo: "posizione" }
    ]);
    return exBase(u, "posizione", "scelta", "posizione", "avanzato",
      `Dove si trova la sillaba ${u.testo} nella parola?`, {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: "pos-" + (label === "iniziale" ? "inizio" : label === "finale" ? "fine" : "mezzo"),
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: {
          corretto: `Giusto: ${u.testo} è ${label === "iniziale" ? "all'inizio" : label === "finale" ? "alla fine" : "in mezzo"}.`,
          errato: `In ${w.testo}, ${u.testo} è ${label === "iniziale" ? "all'inizio" : label === "finale" ? "alla fine" : "in mezzo"}.`
        }
      });
  }


  /* --- esercizi sulle frasi --- */
  function exFraseOrdina(u, f, opts) {
    const parole = f.parole.map(p => p.testo);
    const tessere = shuffle(parole);
    return exBase(u, "frase-ordina", "ordina", "frase", "esperto",
      "Riordina le parole per costruire la frase.", {
        stimolo: { tipo: "frase", fraseId: f.id, testo: f.testo, parole, illustrazioni: f.illustrazioni, audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo } },
        audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo },
        opzioni: tessere.map(t => ({ id: "w-" + t + "-" + Math.random().toString(36).slice(2, 6), testo: t, corretta: false, tipo: "parola" })),
        soluzione: parole.slice(),
        aiuto: `La frase comincia con ${parole[0]}.`,
        feedback: {
          corretto: `Bravo: «${f.testo}».`,
          errato: `La frase giusta è «${f.testo}».`
        }
      });
  }

  function exFraseNascondi(u, f, opts) {
    const soluzione = f.occorrenze.map(o => ({ parola: o.parola, sillaba: o.sillaba, tipo: o.tipo }));
    return exBase(u, "frase-nascondi", "evidenzia", "lettura", "esperto",
      `Tocca tutte le ${f.tipoBersaglio === "parola" ? "parole" : "sillabe"} ${u.testo} nella frase.`, {
        stimolo: {
          tipo: "frase-segmentata",
          fraseId: f.id,
          testo: f.testo,
          parole: f.parole,
          illustrazioni: f.illustrazioni,
          audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo }
        },
        audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo },
        opzioni: [],
        soluzione,
        aiuto: "Ascolta la frase e tocca solo le sillabe uguali al bersaglio.",
        feedback: {
          corretto: `Esatto: nella frase ci sono ${soluzione.length} occorrenze di ${u.testo}.`,
          errato: `Controlla le sillabe evidenziate: dovevi toccare ${soluzione.length} occorrenze.`
        }
      });
  }

  function exFraseCompleta(u, f, opts) {
    // sceglie una parola unica (non ripetuta) e, se possibile, che contiene il bersaglio
    const counts = {};
    f.parole.forEach(p => { counts[p.testo] = (counts[p.testo] || 0) + 1; });
    let idx = f.parole.findIndex(p => counts[p.testo] === 1 && p.sillabe.includes(u.testo));
    if (idx < 0) idx = f.parole.findIndex(p => counts[p.testo] === 1 && p.testo.length > 2);
    if (idx < 0) return null;
    const corretta = f.parole[idx].testo;
    const pool = shuffle(PAROLE.filter(w => w.testo !== corretta && w.livelloLessicale <= 2)).slice(0, 3);
    const opzioni = shuffle([{ id: "w-correct", testo: corretta, corretta: true, tipo: "parola" }]
      .concat(pool.map(w => ({ id: "w-" + w.id, testo: w.testo, corretta: false, tipo: "parola" }))));
    return exBase(u, "frase-completa", "scelta", "frase", "esperto",
      "Ascolta la frase e scegli la parola che manca.", {
        stimolo: {
          tipo: "frase-buco", fraseId: f.id, testo: f.testo, parole: f.parole, buco: idx,
          illustrazioni: f.illustrazioni, audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo }
        },
        audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo },
        opzioni,
        soluzione: corretta,
        aiuto: `La frase è «${f.testo}».`,
        feedback: {
          corretto: `Esatto: «${f.testo}».`,
          errato: `La parola giusta era ${corretta}.`
        }
      });
  }

  function exInventa(u, f, opts) {
    if (!f.soluzioniValide || f.soluzioniValide.length < 2) return null;
    const words = uniqueBy([].concat(...f.soluzioniValide), x => x);
    const extra = shuffle(PAROLE.filter(w => !words.includes(w.testo))).slice(0, 2).map(w => w.testo);
    return exBase(u, "inventa", "costruisci", "frase", "esperto",
      `Inventa una frase con le parole disponibili. Usa la sillaba ${u.testo} più volte.`, {
        stimolo: {
          tipo: "inventa", fraseId: f.id, illustrazioni: f.illustrazioni,
          parole: words.concat(extra), soluzioni: f.soluzioniValide,
          audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo }
        },
        audio: { testo: f.id, gruppo: "frasiViaggio", fallback: f.testo },
        opzioni: words.concat(extra).map(t => ({ id: "w-" + t + "-" + Math.random().toString(36).slice(2, 6), testo: t, corretta: false, tipo: "parola" })),
        soluzione: f.soluzioniValide.map(s => s.slice()),
        aiuto: `Prova con: ${f.soluzioniValide[0].join(" ")}.`,
        feedback: {
          corretto: `Bene: «${f.testo}» è una frase valida.`,
          errato: "Questa sequenza non è fra le frasi approvate. Prova a cambiare l'ordine."
        }
      });
  }

  /* --- esercizi per segmenti e grafemi --- */
  function labelOf(u) {
    return u.tipo === "segmento" ? "suono" : u.tipo === "grafema" ? "gruppo" : "sillaba";
  }

  function exNonSillabaAscolta(u, opts, variant) {
    const lab = labelOf(u);
    const distr = distrattoriSillabe(u, Math.max(1, (opts.alternative || 3) - 1), variant);
    const opzioni = shuffle([optSillaba(u.testo, true)].concat(distr.map(d => optSillaba(d.testo, false))));
    return exBase(u, "ascolta-" + lab + "-" + variant, "scelta", "uditivo", variant ? "avanzato" : "intermedio",
      `Ascolta il ${lab} e scegli quello giusto.`, {
        stimolo: { tipo: "audio", testo: u.testo, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni,
        soluzione: u.testo,
        aiuto: `Riascolta il ${lab}.`,
        feedback: { corretto: `Esatto: ${u.testo}.`, errato: `Era ${u.testo}.` }
      });
  }

  function exNonSillabaTrova(u, hit, opts, variant) {
    const w = hit.parola;
    const lab = labelOf(u);
    const distr = distrattoriParole(u, Math.max(1, (opts.alternative || 3) - 1), "", [w.id]);
    const opzioni = shuffle([optParola(w, true)].concat(distr.map(d => optParola(d, false))));
    return exBase(u, "trova-" + lab, "scelta", "iniziale", "avanzato",
      `Ascolta il ${lab} e trova la parola che lo contiene.`, {
        stimolo: { tipo: "audio", testo: u.testo, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni,
        soluzione: w.id,
        aiuto: `La parola è ${w.testo}.`,
        feedback: { corretto: `Sì: ${w.testo} contiene ${u.testo}.`, errato: `La risposta era ${w.testo}.` }
      });
  }

  function exNonSillabaCompleta(u, hit, opts, variant) {
    const w = hit.parola;
    const lab = labelOf(u);
    const at = w.testo.indexOf(u.testo);
    if (at < 0) return null;
    const mostrato = w.testo.slice(0, at) + "___" + w.testo.slice(at + u.testo.length);
    const distr = distrattoriSillabe(u, Math.max(1, (opts.alternative || 3) - 1), variant);
    const opzioni = shuffle([optSillaba(u.testo, true)].concat(distr.map(d => optSillaba(d.testo, false))));
    return exBase(u, "completa-" + lab, "scelta", "grafico", "avanzato",
      `Completa la parola con il ${lab} giusto.`, {
        stimolo: { tipo: "parola-incompleta", parolaId: w.id, immagine: w.immagine, parola: w.testo, mostra: [mostrato], sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: u.testo,
        aiuto: `La parola è ${w.testo}.`,
        feedback: { corretto: `Esatto: ${w.testo}.`, errato: `La parola giusta è ${w.testo}.` }
      });
  }

  function exNonSillabaCaccia(u, hits, opts) {
    const corretti = uniqueBy(hits.map(h => h.parola).filter(w => w.testo.includes(u.testo)), w => w.id).slice(0, 3);
    if (!corretti.length) return null;
    const distr = distrattoriParole(u, 3, "", corretti.map(w => w.id)).filter(w => !w.testo.includes(u.testo));
    const opzioni = shuffle(corretti.map(w => optParola(w, true)).concat(distr.map(w => optParola(w, false))));
    return exBase(u, "caccia-" + labelOf(u), "multipla", "grafico", "avanzato",
      `Tocca tutte le parole che contengono il ${labelOf(u)} ${u.testo}.`, {
        stimolo: { tipo: "audio", testo: u.testo, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni,
        soluzione: corretti.map(w => "opt-" + w.id),
        aiuto: "Guarda e ascolta ogni parola.",
        feedback: { corretto: "Bene: hai trovato le parole giuste.", errato: "Controlla: alcune parole non contengono il gruppo." }
      });
  }

  function exNonSillabaMemory(u, hits, opts) {
    const distinct = uniqueBy(hits.map(h => h.parola), w => w.id).slice(0, 3);
    if (distinct.length < 2) return null;
    const coppie = distinct.map((w, i) => ({ pairId: `p${i}`, parolaId: w.id, sillaba: w.testo, immagine: w.immagine, parola: w.testo }));
    return exBase(u, "memory-parola", "memory", "lettura", "intermedio",
      "Trova le coppie: ogni immagine con la sua parola.", {
        stimolo: { tipo: "memory", coppie, audio: { testo: u.testo, gruppo: "syl" } },
        audio: { testo: u.testo, gruppo: "syl" },
        opzioni: [],
        soluzione: coppie.map(c => c.pairId),
        aiuto: "Ascolta il nome e cerca la parola scritta.",
        feedback: { corretto: "Bene: hai trovato tutte le coppie.", errato: "Queste due tessere non vanno insieme." }
      });
  }

  function exNonSillabaSegmenta(u, hit, opts) {
    return exSegmenta(u, hit, opts);
  }

  function exNonSillabaPosizione(u, hit, opts) {
    const w = hit.parola;
    const at = w.testo.indexOf(u.testo);
    if (at < 0) return null;
    const pos = at === 0 ? "inizio" : at + u.testo.length === w.testo.length ? "fine" : "mezzo";
    const opzioni = shuffle([
      { id: "pos-inizio", testo: "All'inizio", corretta: pos === "inizio", tipo: "posizione" },
      { id: "pos-mezzo", testo: "In mezzo", corretta: pos === "mezzo", tipo: "posizione" },
      { id: "pos-fine", testo: "Alla fine", corretta: pos === "fine", tipo: "posizione" }
    ]);
    return exBase(u, "posizione-" + labelOf(u), "scelta", "posizione", "avanzato",
      `Dove si trova il ${labelOf(u)} ${u.testo} nella parola?`, {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: "pos-" + (pos === "inizio" ? "inizio" : pos === "fine" ? "fine" : "mezzo"),
        aiuto: `La parola è ${w.testo}.`,
        feedback: { corretto: `Giusto: ${u.testo} è ${pos === "inizio" ? "all'inizio" : pos === "fine" ? "alla fine" : "in mezzo"}.`, errato: `In ${w.testo}, ${u.testo} è ${pos === "inizio" ? "all'inizio" : pos === "fine" ? "alla fine" : "in mezzo"}.` }
      });
  }

  /* --- moduli del livello 7 --- */
  function gruppoIniziale(w) {
    const s = w.sillabe[0] || "";
    const m = s.match(/^[BCDFGLMNPRSTVZ]+/i);
    return m ? m[0].toUpperCase() : "";
  }

  const DITTONGHI = {
    fiore: "IO", piede: "IE", uovo: "UO", aiuola: "IUO", ghiaia: "IA",
    cuore: "UO", scuola: "UO", buono: "UO", viaggio: "IA", piano: "IA"
  };
  const ACCENTI = {
    papa: 1, citta: 1, perche: 1, poiche: 1, gia: 0, piu: 0, puo: 0,
    lunedi: 2, caffe: 1, pero: 1
  };

  function exModuloPrimaSillaba(mod, w, opts, variant) {
    const corretta = w.sillabaIniziale;
    const trappola = w.testo.slice(0, 2);
    const distr = distrattoriSillabe(unita(w.sillabe[0]) || { testo: corretta }, 2, variant).map(d => d.testo);
    const visti = new Set([corretta]);
    const opzioni = [optSillaba(corretta, true)];
    [trappola].concat(distr).forEach(t => {
      if (!t || visti.has(t)) return;
      visti.add(t);
      opzioni.push(optSillaba(t, false));
    });
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-prima-sillaba", "scelta", "iniziale", "avanzato",
      "Qual è davvero la prima sillaba della parola? Attento: non basta guardare le prime lettere.", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni: shuffle(opzioni),
        soluzione: corretta,
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: { corretto: `Esatto: ${w.testo} inizia con ${corretta}.`, errato: `La prima sillaba di ${w.testo} è ${corretta}, non ${trappola}.` }
      });
  }

  function exModuloConteggio(mod, w, opts) {
    return exSegmenta({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, { parola: w, indice: 0 }, opts);
  }

  function exModuloCompleta(mod, w, opts, variant) {
    const hit = { parola: w, indice: 0 };
    return exCompleta({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, hit, opts, variant);
  }

  function exModuloOrdina(mod, w, opts) {
    return exTreno({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, { parola: w, indice: 0 }, opts);
  }

  function exModuloAscolta(mod, w, opts, variant) {
    const distr = distrattoriParole({ testo: w.sillabaIniziale }, 2, "", [w.id]);
    const opzioni = shuffle([optParola(w, true)].concat(distr.map(d => optParola(d, false))));
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-ascolta", "scelta", "uditivo", "intermedio",
      "Ascolta la parola e trova l'immagine giusta.", {
        stimolo: { tipo: "audio", testo: w.testo, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: w.id,
        aiuto: `La parola è ${w.testo}.`,
        feedback: { corretto: `Esatto: ${w.testo}.`, errato: `La risposta era ${w.testo}.` }
      });
  }

  function exModuloGruppo(mod, w, opts) {
    const gruppo = gruppoIniziale(w);
    if (!gruppo) return null;
    const pool = [...new Set(["BR", "CR", "DR", "FR", "GR", "PR", "TR", "BL", "CL", "FL", "GL", "PL", "SP", "ST", "SC", "GN", "QU"])].filter(g => g !== gruppo);
    const opzioni = shuffle([{ id: "g-correct", testo: gruppo, corretta: true, tipo: "gruppo" }].concat(shuffle(pool).slice(0, 2).map(g => ({ id: "g-" + g, testo: g, corretta: false, tipo: "gruppo" }))));
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-gruppo", "scelta", "grafico", "avanzato",
      "Con quale gruppo di lettere inizia la parola?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: gruppo,
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: { corretto: `Esatto: ${w.testo} inizia con ${gruppo}.`, errato: `Il gruppo iniziale è ${gruppo}.` }
      });
  }

  function exModuloDoppia(mod, w, opts) {
    const at = w.testo.search(/([BCDFGLMNPRSTVZ])\1/);
    if (at < 0) return null;
    const semplificata = w.testo.slice(0, at) + w.testo[at] + w.testo.slice(at + 2);
    if (PAROLA_PER_TESTO[semplificata]) return null;
    const opzioni = shuffle([
      { id: "w-correct", testo: w.testo, corretta: true, tipo: "parola" },
      { id: "w-semplice", testo: semplificata, corretta: false, tipo: "parola" }
    ]);
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-doppia", "scelta", "grafico", "avanzato",
      "Come si scrive questa parola?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: w.testo,
        aiuto: `Ascolta: ${w.testo}. La consonante doppia si sente.`,
        feedback: { corretto: `Esatto: ${w.testo}.`, errato: `Si scrive ${w.testo}, con la doppia.` }
      });
  }

  function exModuloDittongo(mod, w, opts) {
    const d = DITTONGHI[w.id];
    if (!d) return null;
    const pool = ["IO", "IE", "UO", "IUO", "IA", "AI", "EI", "AU"].filter(x => x !== d);
    const opzioni = shuffle([{ id: "d-correct", testo: d, corretta: true, tipo: "gruppo" }].concat(shuffle(pool).slice(0, 2).map(x => ({ id: "d-" + x, testo: x, corretta: false, tipo: "gruppo" }))));
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-dittongo", "scelta", "grafico", "avanzato",
      "Quale gruppo di vocali senti in questa parola?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: d,
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: { corretto: `Esatto: ${d}.`, errato: `Il gruppo è ${d}.` }
      });
  }

  function exModuloAccento(mod, w, opts) {
    const idx = ACCENTI[w.id];
    if (idx == null || w.sillabe.length < 2) return null;
    const opzioni = shuffle(w.sillabe.map((s, i) => ({ id: "s-" + i, testo: s, corretta: i === idx, tipo: "sillaba" })));
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-accento", "scelta", "uditivo", "esperto",
      "Qual è la sillaba accentata, quella che si sente più forte?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: w.sillabe[idx],
        aiuto: `Ascolta ${w.testo} e prova a battere le mani sulla sillaba più forte.`,
        feedback: { corretto: `Esatto: l'accento è su ${w.sillabe[idx]}.`, errato: `L'accento è su ${w.sillabe[idx]}.` }
      });
  }

  function exModuloTrappola(mod, w, opts, variant) {
    const corretta = w.sillabaIniziale;
    const trappola = w.testo.slice(0, 2);
    if (corretta === trappola) return null;
    const visti = new Set([corretta]);
    const opzioni = [{ id: "s-correct", testo: corretta, corretta: true, tipo: "sillaba" }];
    [trappola, w.sillabe[w.sillabe.length - 1], w.sillabe[Math.max(0, w.sillabe.length - 2)]].forEach(t => {
      if (!t || visti.has(t)) return;
      visti.add(t);
      opzioni.push({ id: "s-" + t, testo: t, corretta: false, tipo: "sillaba" });
    });
    const opzioniMescolate = shuffle(opzioni);
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-trappola", "scelta", "iniziale", "esperto",
      "Qual è davvero la prima sillaba? Attento: non basta guardare le prime due lettere.", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni: opzioniMescolate,
        soluzione: corretta,
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: { corretto: `Esatto: ${corretta}.`, errato: `La prima sillaba è ${corretta}, non ${trappola}.` }
      });
  }

  function exModuloCqu(mod, w, opts) {
    if (!w.testo.includes("CQU") && !w.testo.includes("ACQUA")) return null;
    const variante = w.testo.replace("CQU", "QU").replace("ACQUA", "AQUA");
    if (variante === w.testo) return null;
    const opzioni = shuffle([
      { id: "w-correct", testo: w.testo, corretta: true, tipo: "parola" },
      { id: "w-wrong", testo: variante, corretta: false, tipo: "parola" }
    ]);
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-cqu", "scelta", "grafico", "avanzato",
      "Come si scrive questa parola?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: w.testo,
        aiuto: `La parola è ${w.testo}.`,
        feedback: { corretto: `Esatto: ${w.testo}.`, errato: `Si scrive ${w.testo}.` }
      });
  }


  function exModuloSillabaFinale(mod, w, opts, variant) {
    const corretta = w.sillabaFinale;
    const n = Math.max(2, Math.min(5, opts.alternative || 3));
    const distr = distrattoriSillabe(unita(corretta) || { testo: corretta }, n - 1, variant).map(d => d.testo);
    const opzioni = shuffle([optSillaba(corretta, true)].concat(distr.filter(t => t !== corretta).map(t => optSillaba(t, false))));
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-finale", "scelta", "finale", "avanzato",
      "Qual è l'ultima sillaba della parola?", {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: corretta,
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: { corretto: `Esatto: ${corretta}.`, errato: `L'ultima sillaba è ${corretta}.` }
      });
  }

  function exModuloPosizione(mod, w, opts) {
    const target = w.sillabe[0];
    const pos = w.sillabe.length === 1 ? "unica" : "iniziale";
    const opzioni = shuffle([
      { id: "pos-inizio", testo: "All'inizio", corretta: pos === "iniziale" || pos === "unica", tipo: "posizione" },
      { id: "pos-mezzo", testo: "In mezzo", corretta: false, tipo: "posizione" },
      { id: "pos-fine", testo: "Alla fine", corretta: false, tipo: "posizione" }
    ]);
    return exBase({ id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] }, "mod-posizione", "scelta", "posizione", "avanzato",
      `Dove si trova la sillaba ${target} nella parola?`, {
        stimolo: { tipo: "immagine", parolaId: w.id, immagine: w.immagine, parola: w.testo, sillabe: w.sillabe, audio: { testo: w.testo, gruppo: "parole" } },
        audio: { testo: w.testo, gruppo: "parole" },
        opzioni,
        soluzione: "pos-inizio",
        aiuto: `La parola è ${w.testo}: ${w.sillabe.join("-")}.`,
        feedback: { corretto: `Esatto: ${target} è all'inizio.`, errato: `${target} è all'inizio di ${w.testo}.` }
      });
  }

  function hitUnico(u, hits) {
    return hits.find(h => {
      const w = h.parola;
      return w.sillabe.filter(s => s === u.testo).length === 1 && w.sillabe.length >= 2;
    });
  }

  function chiaveEsercizio(ex) {
    if (!ex) return "";
    const st = ex.stimolo || {};
    return [ex.modello, st.parolaId || st.testo || st.fraseId || "", ex.soluzione && JSON.stringify(ex.soluzione)].join("|");
  }

  function aggiungi(out, ex) {
    if (!ex) return;
    const k = chiaveEsercizio(ex);
    if (out.some(x => chiaveEsercizio(x) === k)) return;
    out.push(ex);
  }

  function generaEserciziSillaba(u, opts) {
    const out = [];
    const hits = paroleDi(u.id);
    const iniz = hits.filter(h => h.posizione === "iniziale");
    const fin = hits.filter(h => h.posizione === "finale");
    const frasi = opts.includeFrasi === false ? [] : frasiPerUnita(u.testo);

    aggiungi(out, exAscolta(u, opts, 0));
    aggiungi(out, exDiscrimina(u, opts));
    aggiungi(out, exFamiglia(u, opts));

    if (iniz.length) aggiungi(out, exImmagineIniziale(u, iniz[0], opts, 0));
    if (iniz.length) aggiungi(out, exTrovaIniziale(u, iniz[0], opts, 0));
    if (iniz.length >= 2) aggiungi(out, exTrovaIniziale(u, iniz[1], opts, 1));
    if (fin.length) aggiungi(out, exImmagineFinale(u, fin[0], opts, 0));
    if (fin.length) aggiungi(out, exCacciaFinale(u, fin, opts));
    if (hits.length) aggiungi(out, exCompleta(u, hits[0], opts, 0));
    if (hits.length) aggiungi(out, exTreno(u, hits[0], opts));
    if (hits.length) aggiungi(out, exMemory(u, hits, opts));
    if (hits.length) aggiungi(out, exSegmenta(u, hits[0], opts));
    const one = hitUnico(u, hits);
    if (one) aggiungi(out, exPosizione(u, one, opts));

    if (frasi.length) {
      aggiungi(out, exFraseOrdina(u, frasi[0], opts));
      aggiungi(out, exFraseNascondi(u, frasi[0], opts));
      aggiungi(out, exFraseCompleta(u, frasi[0], opts));
      const inventabile = frasi.find(f => f.soluzioniValide.length >= 2);
      if (inventabile) aggiungi(out, exInventa(u, inventabile, opts));
    }

    /* completamento: varianti con parole e distrattori diversi, mai la
       stessa schermata ripetuta. Se una tipologia non è applicabile
       (per esempio non ci sono parole finali), si aggiunge un'altra
       attività di pari difficoltà. */
    let variant = 1;
    const usati = new Set(out.map(x => x.stimolo && x.stimolo.parolaId).filter(Boolean));
    while (out.length < 12 && variant < 30) {
      if (variant % 4 === 1) aggiungi(out, exAscolta(u, opts, variant));
      else if (variant % 4 === 2) aggiungi(out, exDiscrimina(u, opts));
      else if (variant % 4 === 3) {
        const h = hits.find(x => !usati.has(x.parola.id)) || hits[variant % Math.max(1, hits.length)];
        if (h) { aggiungi(out, exCompleta(u, h, opts, variant)); usati.add(h.parola.id); }
      } else {
        const h = hits.find(x => !usati.has(x.parola.id)) || hits[variant % Math.max(1, hits.length)];
        if (h) { aggiungi(out, exSegmenta(u, h, opts)); usati.add(h.parola.id); }
      }
      variant++;
      if (variant > 28 && out.length < 12) {
        // ultima riserva: ascolto con distrattori sempre diversi
        aggiungi(out, exAscolta(u, Object.assign({}, opts, { alternative: Math.min(5, (opts.alternative || 3) + 1) }), variant));
      }
    }
    return out;
  }

  function generaEserciziNonSillaba(u, opts) {
    const out = [];
    const hits = paroleDi(u.id);
    const conTesto = hits.filter(h => h.parola.testo.includes(u.testo));
    const pool = conTesto.length ? conTesto : hits;
    aggiungi(out, exNonSillabaAscolta(u, opts, 0));
    if (pool.length) aggiungi(out, exNonSillabaTrova(u, pool[0], opts, 0));
    if (pool.length) aggiungi(out, exNonSillabaCompleta(u, pool[0], opts, 0));
    if (pool.length) aggiungi(out, exNonSillabaCaccia(u, pool, opts));
    if (pool.length) aggiungi(out, exNonSillabaMemory(u, pool, opts));
    if (pool.length) aggiungi(out, exNonSillabaSegmenta(u, pool[0], opts));
    if (pool.length) aggiungi(out, exNonSillabaPosizione(u, pool[0], opts));
    const lungoNon = pool.find(h => h.parola.sillabe.length >= 2);
    if (lungoNon) aggiungi(out, exTreno(u, lungoNon, opts));
    if (pool.length > 1) aggiungi(out, exNonSillabaTrova(u, pool[1], opts, 1));
    if (pool.length > 1) aggiungi(out, exNonSillabaCompleta(u, pool[1], opts, 1));
    if (pool.length > 1) aggiungi(out, exNonSillabaPosizione(u, pool[1], opts));
    aggiungi(out, exNonSillabaAscolta(u, opts, 1));
    aggiungi(out, exNonSillabaAscolta(u, opts, 2));
    if (pool.length > 2) aggiungi(out, exNonSillabaSegmenta(u, pool[2], opts));
    let k = 3;
    while (out.length < 12 && k < 30) {
      const h = pool[k % Math.max(1, pool.length)];
      if (h) aggiungi(out, exNonSillabaCompleta(u, h, opts, k));
      if (out.length < 12) aggiungi(out, exNonSillabaAscolta(u, opts, k));
      k++;
    }
    return out;
  }

  function generaEserciziModulo(mod, opts) {
    const out = [];
    const parole = mod.parole.map(id => parola(id)).filter(Boolean);
    const tipi = mod.tipi || [];
    let guard = 0;
    while (out.length < 12 && guard < 120) {
      const tipo = tipi[guard % Math.max(1, tipi.length)];
      const w = parole[guard % Math.max(1, parole.length)];
      guard++;
      if (!w) continue;
      let ex = null;
      if (tipo === "prima_sillaba") ex = exModuloPrimaSillaba(mod, w, opts, guard);
      else if (tipo === "sillaba_finale") ex = exModuloSillabaFinale(mod, w, opts, guard);
      else if (tipo === "conteggio") ex = exModuloConteggio(mod, w, opts);
      else if (tipo === "completa") ex = exModuloCompleta(mod, w, opts, guard);
      else if (tipo === "ordina") ex = exModuloOrdina(mod, w, opts);
      else if (tipo === "ascolta") ex = exModuloAscolta(mod, w, opts, guard);
      else if (tipo === "gruppo_iniziale") ex = exModuloGruppo(mod, w, opts);
      else if (tipo === "doppia") ex = exModuloDoppia(mod, w, opts);
      else if (tipo === "dittongo") ex = exModuloDittongo(mod, w, opts);
      else if (tipo === "accento") ex = exModuloAccento(mod, w, opts);
      else if (tipo === "trappola") ex = exModuloTrappola(mod, w, opts, guard);
      else if (tipo === "cqu") ex = exModuloCqu(mod, w, opts);
      else if (tipo === "posizione") ex = exModuloPosizione(mod, w, opts);
      aggiungi(out, ex);
    }
    const finto = { id: mod.unitId, testo: mod.titolo, tipo: "modulo", prerequisiti: [] };
    const hitMod = parole.map(w => ({ parola: w, indice: 0 }));
    aggiungi(out, exNonSillabaMemory(finto, hitMod, opts));
    const lungo = parole.find(w => w.sillabe.length >= 2);
    if (lungo) aggiungi(out, exModuloOrdina(mod, lungo, opts));
    // riserva: se un modulo ha tipi molto selettivi, completa con conteggio/ascolto
    let k = 0;
    while (out.length < 12 && k < parole.length * 4) {
      const w = parole[k % parole.length];
      aggiungi(out, k % 2 ? exModuloConteggio(mod, w, opts) : exModuloAscolta(mod, w, opts, k));
      k++;
    }
    return out.slice(0, 18);
  }

  function generaEsercizi(unitId, options) {
    const opts = Object.assign({}, DEFAULT_OPTS, options || {});
    const u = unita(unitId);
    if (!u) return [];
    if (u.tipo === "modulo") {
      const mod = MODULI[u.id] || Object.values(MODULI).find(m => m.unitId === u.id);
      return mod ? generaEserciziModulo(mod, opts) : [];
    }
    return u.tipo === "sillaba" ? generaEserciziSillaba(u, opts) : generaEserciziNonSillaba(u, opts);
  }

  /* ------------------------------------------------------------------
     6. VALIDAZIONE DEGLI ESERCIZI
     ------------------------------------------------------------------ */
  function validaEsercizio(ex) {
    const err = [];
    if (!ex || !ex.id) { err.push("esercizio senza id"); return err; }
    if (!ex.consegna) err.push("consegna mancante");
    if (!COMPETENZE.includes(ex.competenza)) err.push(`competenza sconosciuta: ${ex.competenza}`);
    if (!INTERAZIONI.includes(ex.interazione)) err.push(`interazione sconosciuta: ${ex.interazione}`);
    if (!["facile", "intermedio", "avanzato", "esperto"].includes(ex.difficolta)) err.push(`difficoltà sconosciuta: ${ex.difficolta}`);
    if (ex.interazione === "scelta") {
      const corrette = (ex.opzioni || []).filter(o => o.corretta);
      if (corrette.length !== 1) err.push(`scelta con ${corrette.length} risposte corrette`);
      if ((ex.opzioni || []).length < 2) err.push("meno di due opzioni");
      const testi = (ex.opzioni || []).map(o => o.testo);
      if (new Set(testi).size !== testi.length) err.push("opzioni duplicate");
      if (ex.soluzione == null) err.push("soluzione mancante");
    }
    if (ex.interazione === "multipla") {
      const corrette = (ex.opzioni || []).filter(o => o.corretta);
      if (!corrette.length) err.push("multipla senza risposte corrette");
      if (!Array.isArray(ex.soluzione) || !ex.soluzione.length) err.push("multipla senza soluzione");
      const ids = ex.soluzione || [];
      if (ids.length !== corrette.length) err.push("soluzione multipla non allineata alle opzioni");
    }
    if (ex.interazione === "ordina") {
      if (!Array.isArray(ex.soluzione) || !ex.soluzione.length) err.push("ordina senza soluzione");
    }
    if (ex.interazione === "memory") {
      const coppie = (ex.stimolo && ex.stimolo.coppie) || [];
      if (coppie.length < 2) err.push("memory con meno di due coppie");
    }
    if (ex.interazione === "evidenzia") {
      if (!Array.isArray(ex.soluzione) || !ex.soluzione.length) err.push("evidenzia senza occorrenze");
    }
    if (ex.interazione === "costruisci") {
      if (!Array.isArray(ex.soluzione) || !ex.soluzione.length) err.push("costruisci senza soluzioni");
    }
    return err;
  }

  function statisticheUnita(unitId, options) {
    const list = generaEsercizi(unitId, options);
    const count = (fn) => list.filter(fn).length;
    return {
      totale: list.length,
      interazioni: [...new Set(list.map(x => x.interazione))],
      competenze: [...new Set(list.map(x => x.competenza))],
      modelli: [...new Set(list.map(x => x.modello))],
      uditivo: count(x => x.competenza === "uditivo"),
      immagini: count(x => x.stimolo && ["immagine", "immagini", "memory"].includes(x.stimolo.tipo)),
      costruzione: count(x => x.interazione === "ordina" || x.interazione === "costruisci"),
      frasi: count(x => String(x.modello).startsWith("frase") || x.modello === "inventa"),
      difficolta: [...new Set(list.map(x => x.difficolta))]
    };
  }


  const PAROLE_BASE = JSON.parse(JSON.stringify(PAROLE));
  const FRASI_BASE = JSON.parse(JSON.stringify(FRASI));

  /* ------------------------------------------------------------------
     7. PERSONALIZZAZIONI DEL DOCENTE
     ------------------------------------------------------------------
     Le funzioni qui sotto modificano il dizionario in memoria. L'interfaccia
     salva i dati nel browser e li rimanda qui all'avvio: il generatore vede
     così le parole e le frasi aggiunte come le altre, con la stessa
     validazione. Non si accettano sillabazioni che non ricompongono la
     parola.
     ------------------------------------------------------------------ */
  function ricostruisciIndice() {
    Object.keys(INDICE_UNITA).forEach(k => { INDICE_UNITA[k] = []; });
    PAROLE.forEach(w => {
      w.sillabe.forEach((syl, i) => {
        const u = PER_TESTO[syl];
        if (!u) return;
        INDICE_UNITA[u.id].push({
          parola: w,
          indice: i,
          posizione: i === 0 ? "iniziale" : i === w.sillabe.length - 1 ? "finale" : "interna",
          esatta: true
        });
      });
    });
    UNITA.filter(u => u.tipo !== "sillaba" && u.tipo !== "modulo").forEach(u => {
      const needle = u.testo.toUpperCase();
      PAROLE.forEach(w => {
        if (!w.testo.includes(needle)) return;
        if (INDICE_UNITA[u.id].some(hit => hit.parola.id === w.id)) return;
        const exactIdx = w.sillabe.indexOf(needle);
        INDICE_UNITA[u.id].push({
          parola: w,
          indice: exactIdx >= 0 ? exactIdx : -1,
          posizione: exactIdx === 0 ? "iniziale" : exactIdx === w.sillabe.length - 1 ? "finale" : exactIdx > 0 ? "interna" : "sequenza",
          esatta: exactIdx >= 0
        });
      });
    });
  }

  function normalizzaSillabe(sillabe) {
    return (Array.isArray(sillabe) ? sillabe : String(sillabe).split("-"))
      .map(s => String(s).trim().toUpperCase()).filter(Boolean);
  }

  function ricalcolaOccorrenze(f) {
    const occ = [];
    if (f.tipoBersaglio === "parola") {
      f.parole.forEach((p, pi) => {
        if (p.testo === f.sillabaBersaglio) occ.push({ parola: pi, sillaba: 0, tipo: "parola" });
      });
    } else {
      f.parole.forEach((p, pi) => {
        p.sillabe.forEach((s, si) => {
          if (s === f.sillabaBersaglio) occ.push({ parola: pi, sillaba: si, tipo: "sillaba" });
        });
      });
    }
    f.occorrenze = occ;
  }

  function sincronizzaFrasiConParola(w) {
    FRASI.forEach(f => {
      let changed = false;
      f.parole.forEach(p => {
        if (p.testo === w.testo) { p.sillabe = w.sillabe.slice(); changed = true; }
      });
      if (changed) ricalcolaOccorrenze(f);
    });
  }

  function registraParolaPersonalizzata(raw) {
    const sillabe = normalizzaSillabe(raw.sillabe);
    const testo = String(raw.testo || "").trim().toUpperCase();
    if (!testo || !sillabe.length) throw new Error("Parola o sillabazione mancante");
    if (sillabe.join("") !== testo) throw new Error(`La sillabazione ${sillabe.join("-")} non ricompone ${testo}`);
    const existing = PAROLA_PER_TESTO[testo] || null;
    const id = raw.id || (existing ? existing.id : ("custom-" + testo.toLowerCase().replace(/[^a-z0-9]+/g, "-")));
    const w = {
      id,
      testo,
      audioKey: testo.toLowerCase(),
      sillabe,
      sillabaIniziale: sillabe[0],
      sillabaFinale: sillabe[sillabe.length - 1],
      sillabeInterne: sillabe.slice(1, -1),
      immagine: raw.immagine || null,
      categoria: raw.categoria || "altro",
      livelloLessicale: raw.livelloLessicale || 1,
      prerequisiti: [...new Set(sillabe.map(s => (PER_TESTO[s] ? PER_TESTO[s].id : s)))],
      statoRevisione: raw.statoRevisione || STATO.PERSONALIZZATA,
      nota: raw.nota || "Parola aggiunta dal docente.",
      alt: (raw.immagine && raw.immagine.alt) || testo,
      indice: PAROLE.length,
      personalizzata: !existing || !!existing.personalizzata
    };
    const oldIdx = PAROLE.findIndex(x => x.id === id);
    if (oldIdx >= 0) PAROLE[oldIdx] = w; else PAROLE.push(w);
    PAROLA_PER_ID[id] = w;
    PAROLA_PER_TESTO[testo] = w;
    ricostruisciIndice();
    sincronizzaFrasiConParola(w);
    return w;
  }

  function aggiornaSillabazione(id, sillabe) {
    const w = PAROLA_PER_ID[id];
    if (!w) throw new Error("Parola non trovata");
    const parts = normalizzaSillabe(sillabe);
    if (parts.join("") !== w.testo) throw new Error(`La sillabazione ${parts.join("-")} non ricompone ${w.testo}`);
    w.sillabe = parts;
    w.sillabaIniziale = parts[0];
    w.sillabaFinale = parts[parts.length - 1];
    w.sillabeInterne = parts.slice(1, -1);
    w.prerequisiti = [...new Set(parts.map(s => (PER_TESTO[s] ? PER_TESTO[s].id : s)))];
    w.statoRevisione = STATO.DA_RIVEDERE;
    ricostruisciIndice();
    sincronizzaFrasiConParola(w);
    return w;
  }

  function registraFrasePersonalizzata(raw) {
    const target = String(raw.target || "").toUpperCase();
    const parole = (raw.parole || []).map(p => ({
      testo: String(p.testo || "").toUpperCase(),
      sillabe: normalizzaSillabe(p.sillabe),
      audioKey: String(p.testo || "").toLowerCase()
    }));
    if (!target || !parole.length) throw new Error("Frase o bersaglio mancante");
    const occorrenze = [];
    parole.forEach((p, pi) => {
      p.sillabe.forEach((s, si) => {
        if (s === target) occorrenze.push({ parola: pi, sillaba: si, tipo: "sillaba" });
      });
    });
    if (!occorrenze.length) throw new Error(`La frase non contiene la sillaba ${target}`);
    const existing = FRASI.find(x => x.testo === joinParole(parole.map(p => p.testo)) && x.sillabaBersaglio === target);
    const frase = {
      id: raw.id || (existing ? existing.id : ("custom-frase-" + Date.now().toString(36))),
      indice: FRASI.length,
      testo: joinParole(parole.map(p => p.testo)),
      audioKey: raw.id || ("custom-frase-" + Date.now().toString(36)),
      parole,
      sillabaBersaglio: target,
      tipoBersaglio: "sillaba",
      occorrenze,
      illustrazioni: raw.illustrazioni || [],
      livello: raw.livello || 1,
      soluzioniValide: raw.soluzioni || [parole.map(p => p.testo)],
      statoRevisione: raw.statoRevisione || STATO.PERSONALIZZATA,
      nota: raw.nota || "Frase aggiunta dal docente.",
      personalizzata: true
    };
    const oldIdx = FRASI.findIndex(f => f.id === frase.id);
    if (oldIdx >= 0) FRASI[oldIdx] = frase; else FRASI.push(frase);
    FRASE_PER_ID[frase.id] = frase;
    return frase;
  }

  function rimuoviPersonalizzazioni() {
    PAROLE.length = 0;
    PAROLE_BASE.forEach(w => PAROLE.push(JSON.parse(JSON.stringify(w))));
    Object.keys(PAROLA_PER_ID).forEach(k => { delete PAROLA_PER_ID[k]; });
    Object.keys(PAROLA_PER_TESTO).forEach(k => { delete PAROLA_PER_TESTO[k]; });
    PAROLE.forEach(w => {
      PAROLA_PER_ID[w.id] = w;
      if (!PAROLA_PER_TESTO[w.testo]) PAROLA_PER_TESTO[w.testo] = w;
    });
    FRASI.length = 0;
    FRASI_BASE.forEach(f => FRASI.push(JSON.parse(JSON.stringify(f))));
    Object.keys(FRASE_PER_ID).forEach(k => { delete FRASE_PER_ID[k]; });
    FRASI.forEach(f => { FRASE_PER_ID[f.id] = f; });
    ricostruisciIndice();
  }

  const API = {
    STATO, COMPETENZE, INTERAZIONI, LIVELLI, FAMIGLIE, UNITA, PER_ID, PER_TESTO,
    PAROLE, PAROLA_PER_ID, PAROLA_PER_TESTO, INDICE_UNITA, MODULI, FRASI, FRASE_PER_ID,
    unita, parola, paroleDi, paroleIniziali, paroleFinali, paroleInterne, paroleSequenza,
    frasiPerUnita, frase, joinParole,
    DEFAULT_OPTS, CONFUSABILI, DITTONGHI, ACCENTI,
    generaEsercizi, generaEserciziSillaba, generaEserciziNonSillaba, generaEserciziModulo,
    validaEsercizio, statisticheUnita, gruppoIniziale, labelOf,
    ricostruisciIndice, registraParolaPersonalizzata, aggiornaSillabazione,
    registraFrasePersonalizzata, rimuoviPersonalizzazioni
  };
  return API;
});


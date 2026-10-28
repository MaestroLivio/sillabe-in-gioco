/* ==========================================================================
   «IL VIAGGIO DELLE SILLABE» — interfaccia e sessione di gioco
   --------------------------------------------------------------------------
   Il modulo usa i contenuti e il generatore di js/viaggio-dati.js. Non
   duplica il dizionario e non inventa esercizi: riceve oggetti già validati
   e li presenta. Riutilizza la voce (file preregistrati + sintesi), gli
   effetti, i token CSS e la navigazione dell'app esistente.
   ========================================================================== */
(function () {
  "use strict";

  const D = window.ViaggioDati;
  if (!D) {
    console.error("ViaggioDati non caricato: il modulo resta disattivato.");
    return;
  }

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const VKEY = "sillabe.viaggio.v1";
  const TIPI = {
    "ascolta-a": { icona: "👂", nome: "Ascolta la sillaba", desc: "Scegli la sillaba che senti." },
    "ascolta-b": { icona: "👂", nome: "Ascolta di nuovo", desc: "Un'altra serie di alternative." },
    "ascolta-suono": { icona: "👂", nome: "Ascolta il suono", desc: "Scegli il suono giusto." },
    "ascolta-gruppo": { icona: "👂", nome: "Ascolta il gruppo", desc: "Scegli il gruppo giusto." },
    "discrimina": { icona: "🎧", nome: "Discrimina", desc: "Sillabe simili: ascolta la differenza." },
    "famiglia": { icona: "👨‍👩‍👧‍👦", nome: "La famiglia", desc: "Completa la serie di sillabe." },
    "immagine-iniziale": { icona: "🖼️", nome: "Prima sillaba", desc: "Guarda l'immagine e scegli." },
    "trova-iniziale": { icona: "🔎", nome: "Trova la parola", desc: "Quale immagine inizia con la sillaba?" },
    "immagine-finale": { icona: "🖼️", nome: "Ultima sillaba", desc: "Ascolta la parola e scegli la fine." },
    "caccia-finale": { icona: "🎯", nome: "Caccia alla finale", desc: "Trova tutte le parole giuste." },
    "completa": { icona: "🧩", nome: "Completa la parola", desc: "Metti la sillaba che manca." },
    "treno": { icona: "🚂", nome: "Il treno delle sillabe", desc: "Ordina le sillabe." },
    "memory": { icona: "🃏", nome: "Memory", desc: "Abbina immagini e sillabe." },
    "segmenta": { icona: "✂️", nome: "Segmenta", desc: "Quante sillabe ha la parola?" },
    "posizione": { icona: "📍", nome: "Dove si trova?", desc: "Inizio, mezzo o fine." },
    "frase-ordina": { icona: "🧱", nome: "Riordina la frase", desc: "Costruisci la frase ascoltata." },
    "frase-nascondi": { icona: "🔦", nome: "Trova le sillabe", desc: "Tocca tutte le occorrenze." },
    "frase-completa": { icona: "🕳️", nome: "Parola mancante", desc: "Completa la frase." },
    "inventa": { icona: "✨", nome: "Inventa", desc: "Componi una frase nuova." },
    "ascolta-suono-0": { icona: "👂", nome: "Ascolta il suono", desc: "Scegli il suono giusto." },
    "ascolta-gruppo-0": { icona: "👂", nome: "Ascolta il gruppo", desc: "Scegli il gruppo giusto." },
    "trova-suono": { icona: "🔎", nome: "Trova il suono", desc: "Quale parola lo contiene?" },
    "trova-gruppo": { icona: "🔎", nome: "Trova il gruppo", desc: "Quale parola lo contiene?" },
    "completa-suono": { icona: "🧩", nome: "Completa il suono", desc: "Scrivi il suono che manca." },
    "completa-gruppo": { icona: "🧩", nome: "Completa il gruppo", desc: "Scrivi il gruppo che manca." },
    "caccia-suono": { icona: "🎯", nome: "Caccia al suono", desc: "Trova tutte le parole." },
    "caccia-gruppo": { icona: "🎯", nome: "Caccia al gruppo", desc: "Trova tutte le parole." },
    "posizione-suono": { icona: "📍", nome: "Dove si sente?", desc: "Inizio, mezzo o fine." },
    "posizione-gruppo": { icona: "📍", nome: "Dove si vede?", desc: "Inizio, mezzo o fine." },
    "memory-parola": { icona: "🃏", nome: "Memory delle parole", desc: "Abbina immagine e parola." },
    "mod-prima-sillaba": { icona: "🔍", nome: "Prima sillaba", desc: "Attenzione alle prime lettere." },
    "mod-finale": { icona: "🖼️", nome: "Ultima sillaba", desc: "Ascolta la fine della parola." },
    "mod-ascolta": { icona: "👂", nome: "Ascolta e trova", desc: "Scegli l'immagine giusta." },
    "mod-gruppo": { icona: "🔤", nome: "Il gruppo iniziale", desc: "BR, CR, ST, SC…" },
    "mod-doppia": { icona: "👯", nome: "Doppia o no?", desc: "Scegli la scrittura giusta." },
    "mod-dittongo": { icona: "🌈", nome: "Il gruppo di vocali", desc: "IO, IE, UO, IA…" },
    "mod-accento": { icona: "🎵", nome: "L'accento", desc: "Quale sillaba è più forte?" },
    "mod-trappola": { icona: "🪤", nome: "La trappola", desc: "Sillaba vera o prime lettere?" },
    "mod-cqu": { icona: "💧", nome: "CQU", desc: "Come si scrive?" },
    "mod-posizione": { icona: "📍", nome: "Dove si trova?", desc: "Inizio, mezzo o fine." }
  };
  const GIOCHI = [
    { id: "mercato", nome: "Il mercato delle sillabe", emoji: "🏪", desc: "Metti ogni parola al banco della sua sillaba iniziale.", modelli: ["trova-iniziale", "immagine-iniziale"] },
    { id: "bosco", nome: "Il bosco delle immagini", emoji: "🌳", desc: "Esplora le figure e riconosci la sillaba.", modelli: ["immagine-iniziale", "immagine-finale"] },
    { id: "trenino", nome: "Il trenino delle parole", emoji: "🚂", desc: "Ordina i vagoni e componi la parola.", modelli: ["treno"] },
    { id: "pesca", nome: "La pesca delle sillabe", emoji: "🎣", desc: "Cattura solo la sillaba che senti.", modelli: ["ascolta-a", "ascolta-b", "discrimina"] },
    { id: "ponte", nome: "Il ponte delle frasi", emoji: "🌉", desc: "Costruisci la frase per attraversare.", modelli: ["frase-ordina", "frase-completa"] },
    { id: "detective", nome: "Il detective delle finali", emoji: "🕵️", desc: "Trova le parole con la stessa sillaba finale.", modelli: ["caccia-finale", "immagine-finale"] },
    { id: "famiglie", nome: "Le famiglie delle sillabe", emoji: "👨‍👩‍👧‍👦", desc: "Completa MA-ME-MI-MO-MU e le altre famiglie.", modelli: ["famiglia"] }
  ];

  const DEFAULT_STORE = () => ({
    profili: [{ id: "p1", nome: "Bambino", avatar: "🐻" }],
    attivo: "p1",
    progressi: { p1: {} },
    config: {
      pin: "1234",
      alternative: 3,
      posizione: "tutte",
      tipiAttivi: [],
      unitaAttive: [],
      ordineFamiglie: [],
      soglia: 0.8,
      riduciStimoli: false,
      semplificato: false,
      audioLento: false,
      maiuscolo: true,
      ripassoSuggerito: true,
      percorso: []
    },
    personalizzazioni: { parole: [], frasi: [], media: {} },
    ultimo: null
  });

  function loadStore() {
    try {
      const raw = localStorage.getItem(VKEY);
      if (!raw) return DEFAULT_STORE();
      const parsed = JSON.parse(raw);
      const base = DEFAULT_STORE();
      const out = Object.assign(base, parsed);
      out.config = Object.assign(base.config, parsed.config || {});
      out.personalizzazioni = Object.assign(base.personalizzazioni, parsed.personalizzazioni || {});
      if (!Array.isArray(out.profili) || !out.profili.length) out.profili = base.profili;
      if (!out.progressi) out.progressi = { p1: {} };
      if (!out.profili.some(p => p.id === out.attivo)) out.attivo = out.profili[0].id;
      const attivo = out.profili.find(p => p.id === out.attivo);
      const pin = out.config.pin || "1234";
      if (attivo && attivo.config) out.config = Object.assign(out.config, attivo.config);
      out.config.pin = pin;
      return out;
    } catch (e) { return DEFAULT_STORE(); }
  }

  let store = loadStore();
  const V = {
    screen: "map",
    livello: null,
    unitId: null,
    exercises: [],
    index: 0,
    current: null,
    answered: false,
    wrongCount: 0,
    helpUsed: false,
    selected: new Set(),
    slots: [],
    tiles: [],
    drag: null,
    memory: null,
    session: null,
    game: null,
    returnTo: null,
    frasi: { unitId: null, mode: 1, fraseId: null },
    docente: { tab: "unita" },
    customAudio: {},
    toastTimer: 0
  };

  function saveStore() {
    try {
      // La configurazione attiva appartiene al profilo attivo: si salva
      // insieme al resto, così un riavvio non perde il percorso individuale.
      const p = activeProfile();
      if (p) {
        const cfg = JSON.parse(JSON.stringify(store.config));
        delete cfg.pin;
        p.config = cfg;
      }
      localStorage.setItem(VKEY, JSON.stringify(store));
    } catch (e) { toast("Spazio del browser pieno: le personalizzazioni più grandi non sono state salvate."); }
  }

  function activeProfile() {
    return store.profili.find(p => p.id === store.attivo) || store.profili[0];
  }
  function persistActiveConfig() {
    const p = activeProfile();
    if (!p) return;
    const cfg = JSON.parse(JSON.stringify(store.config));
    // Il PIN è unico per il dispositivo, non per il profilo del bambino.
    delete cfg.pin;
    p.config = cfg;
  }
  function loadProfileConfig(id) {
    const pin = store.config.pin || "1234";
    const p = store.profili.find(x => x.id === id);
    store.config = p && p.config
      ? Object.assign(DEFAULT_STORE().config, p.config)
      : DEFAULT_STORE().config;
    store.config.pin = pin;
  }
  function progressOf(unitId) {
    const p = activeProfile().id;
    store.progressi[p] = store.progressi[p] || {};
    const all = store.progressi[p];
    if (!all[unitId]) {
      all[unitId] = {
        competenze: {}, esercizi: {}, tentativi: 0, corrette: 0, aiuti: 0,
        sessioni: 0, ultimo: 0, ultimoRipasso: 0, acquisita: false
      };
    }
    return all[unitId];
  }
  function competenzaOf(unitId, key) {
    const p = progressOf(unitId);
    p.competenze[key] = p.competenze[key] || { corrette: 0, tentativi: 0, aiuti: 0, ultimo: 0 };
    return p.competenze[key];
  }

  function pct(rec) {
    return rec && rec.tentativi ? Math.round(rec.corrette / rec.tentativi * 100) : 0;
  }

  function mastery(unitId) {
    const p = progressOf(unitId);
    const soglia = store.config.soglia || 0.8;
    const comps = Object.values(p.competenze);
    const tot = comps.reduce((a, c) => a + c.tentativi, 0);
    const cor = comps.reduce((a, c) => a + c.corrette, 0);
    const solide = comps.filter(c => c.tentativi >= 2 && c.corrette / c.tentativi >= soglia).length;
    const helpRate = p.tentativi ? p.aiuti / p.tentativi : 0;
    const ratio = tot ? cor / tot : 0;
    const ok = tot >= 8 && solide >= 3 && ratio >= soglia && helpRate <= 0.35 && (p.sessioni || 0) >= 2;
    return {
      pct: Math.round(ratio * 100),
      ok,
      solide,
      tot,
      cor,
      helpRate,
      stelle: Math.max(0, Math.min(3, Math.round(ratio * 3)))
    };
  }

  function recordAnswer(unitId, competenza, corretta, aiuto) {
    const p = progressOf(unitId);
    const c = competenzaOf(unitId, competenza);
    p.tentativi++;
    c.tentativi++;
    if (corretta) { p.corrette++; c.corrette++; }
    if (aiuto) { p.aiuti++; c.aiuti++; }
    const now = Date.now();
    p.ultimo = now;
    c.ultimo = now;
    p.ultimoRipasso = now;
    p.acquisita = mastery(unitId).ok;
    saveStore();
  }

  function markExercise(unitId, modello, corretta) {
    const p = progressOf(unitId);
    p.esercizi[modello] = p.esercizi[modello] || { corrette: 0, tentativi: 0 };
    p.esercizi[modello].tentativi++;
    if (corretta) p.esercizi[modello].corrette++;
    saveStore();
  }

  function startSession(unitId) {
    V.session = { unitId, corrette: 0, tentativi: 0, aiuti: 0, started: Date.now(), done: new Set() };
    const p = progressOf(unitId);
    p.sessioni = (p.sessioni || 0) + 1;
    saveStore();
  }

  function vToast(msg, ms) {
    let t = $("#vToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "vToast";
      t.className = "v-toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(V.toastTimer);
    V.toastTimer = setTimeout(() => t.classList.remove("show"), ms || 2400);
  }

  function speakV(text, opts) {
    opts = opts || {};
    const key = String(text).toUpperCase();
    const custom = V.customAudio[key] || V.customAudio[String(text)];
    if (custom) {
      try {
        stopAudio();
        const a = new Audio(custom);
        a.volume = typeof settings.volume === "number" ? Math.max(0, Math.min(1, settings.volume)) : 1;
        a.play().catch(() => speak(text, opts));
        if (opts.onend) a.onended = opts.onend;
        return;
      } catch (e) { /* riprova con la voce normale */ }
    }
    speak(text, opts);
  }

  function speakToken(text, group) {
    if (!text) return;
    // L', UN', D' sono articoli elisi: il clip isolato non esiste e la voce
    // di sistema li leggerebbe come lettere. La frase intera ha il suo audio.
    if (/^[A-ZÀ-Ù]+'$/i.test(String(text).trim())) return;
    speakV(text, { group: group || "parole" });
  }

  function audioOf(ex) {
    return ex && ex.audio ? ex.audio : (ex && ex.stimolo && ex.stimolo.audio) || null;
  }
  function playExerciseAudio(ex) {
    const a = audioOf(ex);
    if (!a) return;
    if (a.sequenza) {
      speakSequence(a.sequenza.map(x => ({ text: x.testo, group: x.gruppo || "syl" })));
      return;
    }
    if (a.testo) speakV(a.testo, { group: a.gruppo || "parole", fallbackText: a.fallback, rate: store.config.audioLento ? 0.65 : undefined });
  }
  function speakSegmented(ex) {
    if (!ex) return;
    let syllables = [];
    if (ex.stimolo && ex.stimolo.parolaId) {
      const w = D.parola(ex.stimolo.parolaId);
      if (w) syllables = w.sillabe;
    } else if (ex.stimolo && Array.isArray(ex.stimolo.sillabe) && ex.stimolo.sillabe.length) {
      syllables = ex.stimolo.sillabe;
    } else if (ex.stimolo && Array.isArray(ex.stimolo.parole) && ex.stimolo.parole.length) {
      syllables = ex.stimolo.parole.flatMap(p => p.sillabe || []);
    }
    if (!syllables.length && ex.stimolo && ex.stimolo.fraseId) {
      const f = D.frase(ex.stimolo.fraseId);
      if (f) syllables = f.parole.flatMap(p => p.sillabe);
    }
    if (!syllables.length) { playExerciseAudio(ex); return; }
    speakSyllables(syllables.map(s => String(s).toLowerCase()));
  }

  function playPrompt(ex) {
    if (!ex) return;
    const text = ex.consegna || "";
    if (text) speakV(text, { group: "ui", rate: store.config.audioLento ? 0.7 : 1.0 });
  }

  function optIcon(ex) {
    const t = TIPI[ex.modello] || TIPI[String(ex.modello).replace(/-\d+$/, "")] || {};
    return t.icona || "🎯";
  }
  function optName(ex) {
    const t = TIPI[ex.modello] || TIPI[String(ex.modello).replace(/-\d+$/, "")] || {};
    return t.nome || ex.modello;
  }
  function optDesc(ex) {
    const t = TIPI[ex.modello] || TIPI[String(ex.modello).replace(/-\d+$/, "")] || {};
    return t.desc || ex.consegna || "";
  }

  function modelKey(m) { return String(m || "").replace(/-\d+$/, ""); }
  function unitOf(ex) { return D.unita(ex.unitId) || D.unita(ex.unitTesto) || null; }

  function applyLowStim() {
    const screen = $("#screen-viaggio");
    if (!screen) return;
    screen.classList.toggle("v-lowstim", !!(store.config.riduciStimoli || store.config.semplificato));
    document.documentElement.style.setProperty("--font-scale", store.config.maiuscolo ? (settings.fontScale || 1) : (settings.fontScale || 1));
    // Il maiuscolo è già il default dell'app; il minuscolo è una scelta
    // successiva e si applica solo ai testi del viaggio.
    document.body.classList.toggle("viaggio-minuscolo", !store.config.maiuscolo);
  }

  /* ------------------------------------------------------------------
     HOME CARD
     ------------------------------------------------------------------ */
  function renderHomeCard() {
    const box = $("#viaggioHomeCard");
    if (!box) return;
    const units = D.UNITA;
    const acquisite = units.filter(u => mastery(u.id).ok).length;
    const fatte = units.filter(u => progressOf(u.id).tentativi > 0).length;
    const p = Math.round(acquisite / Math.max(1, units.length) * 100);
    box.innerHTML = `
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <div style="font-size:2.8rem;line-height:1" aria-hidden="true">🗺️</div>
        <div style="flex:1;min-width:220px">
          <h2 style="margin:0 0 2px">Il viaggio delle sillabe</h2>
          <p class="muted" style="margin:0 0 8px">Il percorso fonico-sillabico completo: ascoltare, riconoscere,
          segmentare, comporre, leggere. ${units.length} unità, ${D.PAROLE.length} parole illustrate,
          ${D.FRASI.length} frasi delle sillabe.</p>
          <div class="mini-bar" style="max-width:360px"><i style="width:${p}%"></i></div>
          <div class="muted" style="font-size:.7rem;margin-top:4px">${acquisite} unità acquisite · ${fatte} già allenate · soglia ${Math.round((store.config.soglia || .8) * 100)}%</div>
        </div>
        <div class="v-actions">
          <button class="btn primary" id="vHomeEntra">▶ Entra nel viaggio</button>
          ${store.config.ripassoSuggerito ? `<button class="btn ghost small" id="vHomeRipasso">🔁 Ripasso consigliato</button>` : ""}
        </div>
      </div>`;
    const entra = $("#vHomeEntra");
    const rip = $("#vHomeRipasso");
    if (entra) entra.onclick = () => openViaggio("map");
    if (rip) rip.onclick = () => openViaggio("review");
  }

  /* ------------------------------------------------------------------
     NAVIGAZIONE
     ------------------------------------------------------------------ */
  function openViaggio(view) {
    if (!$("#screen-viaggio")) return;
    showScreen("viaggio");
    V.screen = view || "map";
    V.game = null;
    V.returnTo = null;
    renderProfileSelect();
    applyLowStim();
    renderViaggio();
  }

  function renderProfileSelect() {
    const sel = $("#viaggioProfile");
    if (!sel) return;
    sel.innerHTML = store.profili.map(p => `<option value="${p.id}" ${p.id === store.attivo ? "selected" : ""}>${p.avatar || "👤"} ${p.nome}</option>`).join("");
    sel.onchange = () => {
      const old = store.attivo;
      persistActiveConfig();
      store.attivo = sel.value;
      // Ogni profilo ha il suo percorso: si ripristina la configurazione
      // didattica del profilo scelto, non quella del profilo precedente.
      loadProfileConfig(store.attivo);
      saveStore();
      renderViaggio();
      renderHomeCard();
    };
  }

  function renderViaggio() {
    const box = $("#viaggioView");
    if (!box) return;
    applyLowStim();
    if (V.screen === "map") renderMap(box);
    else if (V.screen === "review") renderReview(box);
    else if (V.screen === "unit") renderUnit(box);
    else if (V.screen === "play") renderPlay(box);
    else if (V.screen === "frasi") renderFrasi(box);
    else if (V.screen === "giochi") renderGiochi(box);
    else if (V.screen === "docente") renderDocente(box);
    else if (V.screen === "summary") renderSummary(box);
    else renderMap(box);
  }

  function setTitle(t, sub) {
    const a = $("#viaggioTitle"), b = $("#viaggioSubtitle");
    if (a) a.textContent = t;
    if (b && sub !== undefined) b.textContent = sub;
  }

  function levelUnits(level) {
    return D.UNITA.filter(u => u.livello === level);
  }
  function visibleUnits() {
    const active = store.config.unitaAttive || [];
    if (active.includes("__none__")) return [];
    return D.UNITA.filter(u => !active.length || active.includes(u.id));
  }
  function familyUnitsUI(fam) {
    return fam.unita.map(x => {
      const testo = typeof x === "string" ? x : x.testo;
      const id = typeof x === "string" ? x : (x.id || x.testo);
      return D.unita(id) || D.unita(testo);
    }).filter(Boolean).filter(u => visibleUnits().includes(u));
  }
  function orderedFamilies(level) {
    let fams = D.FAMIGLIE.filter(f => f.livello === level);
    const ord = store.config.ordineFamiglie || [];
    if (ord.length) {
      fams = fams.slice().sort((a, b) => {
        const ia = ord.indexOf(a.id), ib = ord.indexOf(b.id);
        return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
      });
    }
    return fams;
  }

  /* ------------------------------------------------------------------
     MAPPA
     ------------------------------------------------------------------ */
  function renderMap(box) {
    setTitle("Il viaggio delle sillabe", "Scegli un livello, una famiglia, una sillaba.");
    const all = visibleUnits();
    const acquisite = all.filter(u => mastery(u.id).ok).length;
    box.innerHTML = `
      <div class="card">
        <div class="v-view-head">
          <div>
            <h2>🗺️ La mappa del viaggio</h2>
            <div class="v-sub">${all.length} unità · ${acquisite} acquisite · ${D.PAROLE.length} parole · ${D.FRASI.length} frasi</div>
          </div>
          <div class="v-actions">
            ${store.config.ripassoSuggerito ? `<button class="btn ghost small" id="vRipasso">🔁 Ripasso consigliato</button>` : ""}
            <button class="btn ghost small" id="vFrasi">💬 Le frasi delle sillabe</button>
            <button class="btn ghost small" id="vGiochi">🎲 Giochi</button>
            <button class="btn small" id="vDocente">🎓 Insegnante</button>
          </div>
        </div>
        <div class="v-map" id="vMap"></div>
      </div>`;
    if ($("#vRipasso")) $("#vRipasso").onclick = () => { V.screen = "review"; renderViaggio(); };
    $("#vFrasi").onclick = () => { V.frasi.unitId = null; V.screen = "frasi"; renderViaggio(); };
    $("#vGiochi").onclick = () => { V.screen = "giochi"; renderViaggio(); };
    $("#vDocente").onclick = openDocente;

    const map = $("#vMap");
    D.LIVELLI.forEach(level => {
      const fams = orderedFamilies(level.id).filter(f => familyUnitsUI(f).length);
      if (!fams.length) return;
      const units = fams.reduce((a, f) => a.concat(familyUnitsUI(f)), []);
      const acq = units.filter(u => mastery(u.id).ok).length;
      const wrap = document.createElement("div");
      wrap.className = "v-level";
      wrap.style.setProperty("--v-level", level.colore);
      wrap.innerHTML = `
        <div class="v-level-head">
          <div>
            <div class="v-level-title"><span class="v-num">${level.id}</span>${level.nome}</div>
            <div class="v-level-sub">${level.sottotitolo} · fase ${level.fase} · ${acq}/${units.length} acquisite</div>
          </div>
          <div class="v-actions">
            <button class="btn ghost small" data-level="${level.id}">Apri il primo non acquisito</button>
          </div>
        </div>
        <div class="v-families"></div>`;
      const famBox = wrap.querySelector(".v-families");
      fams.forEach(fam => {
        const fus = familyUnitsUI(fam);
        const f = document.createElement("div");
        f.className = "v-family";
        f.innerHTML = `<div class="v-family-head"><span class="v-emoji" aria-hidden="true">${fam.emoji}</span>
          <span class="v-family-name">${fam.nome}<small>${fus.length} unità</small></span></div>
          <div class="v-chips"></div>`;
        const chips = f.querySelector(".v-chips");
        fus.forEach(u => {
          const m = mastery(u.id);
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "v-chip" + (m.ok ? " acquisita" : progressOf(u.id).tentativi ? " in-corso" : "");
          const label = u.tipo === "modulo" ? "MODULO" : u.testo;
          chip.innerHTML = `<span>${label}</span><span class="v-star" aria-hidden="true">${"★".repeat(m.stelle)}${"☆".repeat(3 - m.stelle)}</span><span class="v-type">${u.tipo === "sillaba" ? "sill" : u.tipo === "segmento" ? "suono" : u.tipo === "grafema" ? "gruppo" : "modulo"}</span>`;
          chip.setAttribute("aria-label", `${u.testo}, ${u.tipo}, ${m.pct}% di risposte corrette, ${m.ok ? "acquisita" : "da consolidare"}. Apri le attività.`);
          chip.onclick = () => openUnit(u.id);
          chips.appendChild(chip);
        });
        famBox.appendChild(f);
      });
      wrap.querySelector("[data-level]").onclick = () => {
        const next = units.find(u => !mastery(u.id).ok) || units[0];
        if (next) openUnit(next.id);
      };
      map.appendChild(wrap);
    });
  }

  function renderReview(box) {
    setTitle("Ripasso consigliato", "Le unità da riprendere, ordinate per bisogno.");
    const units = visibleUnits().filter(u => u.tipo !== "modulo");
    const scored = units.map(u => {
      const p = progressOf(u.id);
      const m = mastery(u.id);
      const err = p.tentativi ? 1 - (p.corrette / p.tentativi) : 0.5;
      const recency = p.ultimo ? Math.min(1, (Date.now() - p.ultimo) / (1000 * 60 * 60 * 24 * 7)) : 1;
      return { u, m, p, score: err * 2 + recency + (m.ok ? -1 : 0) };
    }).sort((a, b) => b.score - a.score).slice(0, 12);
    box.innerHTML = `<div class="card"><div class="v-view-head"><div><h2>🔁 Ripasso consigliato</h2>
      <div class="v-sub">Il sistema ripropone prima le unità con più errori o non riviste da tempo. Non è un giudizio: è solo una regola di gioco.</div></div>
      <div class="v-actions"><button class="btn ghost small" id="vBackMap">← Mappa</button></div></div>
      <div class="v-exlist" id="vReviewList"></div></div>`;
    $("#vBackMap").onclick = () => { V.screen = "map"; renderViaggio(); };
    const list = $("#vReviewList");
    scored.forEach(({ u, m, p }) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "v-excard";
      card.innerHTML = `<span class="v-icon">${u.emoji || "🎯"}</span><span class="v-body">
        <span class="v-name">${u.testo} · ${u.famigliaNome}</span>
        <span class="v-desc">${p.tentativi ? `${m.pct}% corrette · ${p.tentativi} tentativi` : "non ancora allenata"}${m.ok ? " · acquisita" : ""}</span></span>
        <span class="v-tag">${m.ok ? "ripasso" : "da fare"}</span>`;
      card.onclick = () => openUnit(u.id);
      list.appendChild(card);
    });
    if (!scored.length) list.innerHTML = `<div class="v-empty">Nessuna unità disponibile con i filtri attuali.</div>`;
  }

  /* ------------------------------------------------------------------
     UNITÀ
     ------------------------------------------------------------------ */
  function openUnit(unitId) {
    const u = D.unita(unitId);
    if (!u) return;
    V.unitId = unitId;
    V.livello = u.livello;
    V.game = null;
    V.returnTo = null;
    const alt = store.config.semplificato ? Math.min(2, store.config.alternative) : store.config.alternative;
    const all = D.generaEsercizi(unitId, { alternative: alt });
    let list = all;
    if (store.config.semplificato) {
      const guidati = all.filter(ex => ex.difficolta !== "esperto");
      if (guidati.length >= 10) list = guidati;
    }
    const attivi = store.config.tipiAttivi || [];
    if (attivi.length) {
      const filtrati = all.filter(ex => attivi.includes(modelKey(ex.modello)));
      // Non si scende sotto le dieci attività: se il filtro del docente è
      // troppo stretto, si mostrano tutte e si avvisa.
      if (filtrati.length >= 10) list = filtrati;
      else vToast("Il filtro scelto lascia meno di 10 esercizi: mostro tutte le attività.");
    }
    if (store.config.posizione && store.config.posizione !== "tutte") {
      const pos = store.config.posizione;
      list = list.slice().sort((a, b) => (b.competenza === pos ? 1 : 0) - (a.competenza === pos ? 1 : 0));
    }
    V.exercises = list;
    V.index = 0;
    V.current = null;
    V.screen = "unit";
    startSession(unitId);
    renderViaggio();
    window.scrollTo({ top: 0, behavior: settings.reduceMotion ? "auto" : "smooth" });
  }

  function renderUnit(box) {
    const u = D.unita(V.unitId);
    if (!u) { V.screen = "map"; return renderMap(box); }
    setTitle(u.testo, `${u.famigliaNome} · livello ${u.livello}`);
    const m = mastery(u.id);
    const frasi = D.frasiPerUnita(u.testo);
    const skills = [
      ["uditivo", "Ascolto"], ["grafico", "Riconoscimento"], ["iniziale", "Inizio"],
      ["finale", "Fine"], ["interna", "Interna"], ["segmentazione", "Segmentazione"],
      ["composizione", "Composizione"], ["frase", "Frase"], ["lettura", "Lettura"],
      ["posizione", "Posizione"]
    ];
    box.innerHTML = `
      <div class="card">
        <div class="v-unit-head">
          <div class="v-view-head">
            <div class="v-unit-title">
              <span class="v-big">${u.tipo === "modulo" ? "MOD" : u.testo}</span>
              <div><h2>${u.tipo === "modulo" ? u.testo : "La " + (u.tipo === "segmento" ? "sequenza" : u.tipo === "grafema" ? "gruppo" : "sillaba") + " " + u.testo}</h2>
              <div class="v-sub">${u.famigliaNome} · livello ${u.livello} · ${u.tipo}</div></div>
            </div>
            <div class="v-actions">
              <button class="btn ghost small" id="vBackMap">← Mappa</button>
              <button class="btn ghost small" id="vUnitAudio">🔊 Ascolta</button>
              ${frasi.length && u.tipo === "sillaba" ? `<button class="btn ghost small" id="vUnitFrasi">💬 Frasi</button>` : ""}
            </div>
          </div>
          <div class="v-unit-note">${u.nota || (u.tipo === "sillaba" ? "Ascolta, riconosci, componi: ogni attività ha una consegna vocale." : "Attività sul " + u.tipo + ", non sulla sillaba: la consegna lo dice sempre.")}</div>
          <div class="v-mastery">
            ${skills.map(([k, label]) => {
              const c = progressOf(u.id).competenze[k] || { corrette: 0, tentativi: 0 };
              const p = c.tentativi ? Math.round(c.corrette / c.tentativi * 100) : 0;
              return `<div class="v-skill"><b>${label}</b>${p}%<div class="v-bar"><i style="width:${p}%"></i></div></div>`;
            }).join("")}
          </div>
          <div class="v-actions" style="margin-top:4px">
            <span class="v-pill">📊 ${m.pct}% complessivo</span>
            <span class="v-pill">🎯 ${m.ok ? "acquisita" : "da consolidare"}</span>
            <span class="v-pill">🧩 ${V.exercises.length} esercizi</span>
            <button class="btn primary" id="vStartSession">▶ Avvia la sessione</button>
            <button class="btn ghost small" id="vRetryErrors">🔁 Ripassa gli errori</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="v-view-head"><h2>Le attività</h2><div class="v-sub">Almeno 10 esercizi realmente giocabili; ogni carta è un compito diverso.</div></div>
        <div class="v-exlist" id="vExList"></div>
      </div>`;
    $("#vBackMap").onclick = () => { V.screen = "map"; renderViaggio(); };
    $("#vUnitAudio").onclick = () => {
      if (u.audioKey) speakV(u.audioKey, { group: "syl", rate: store.config.audioLento ? 0.65 : undefined });
      else playPrompt(V.exercises[0]);
    };
    if ($("#vUnitFrasi")) $("#vUnitFrasi").onclick = () => { V.frasi.unitId = u.id; V.screen = "frasi"; renderViaggio(); };
    $("#vStartSession").onclick = () => startExercise(0);
    $("#vRetryErrors").onclick = () => {
      const p = progressOf(u.id);
      const idx = V.exercises.findIndex(ex => {
        const rec = p.esercizi[ex.modello];
        return !rec || rec.corrette === 0;
      });
      if (idx < 0) vToast("Nessun errore da ripassare: hai già risposto bene a tutte le attività.");
      else startExercise(idx);
    };
    const list = $("#vExList");
    V.exercises.forEach((ex, i) => {
      const rec = progressOf(u.id).esercizi[ex.modello];
      const done = rec && rec.corrette > 0;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "v-excard" + (done ? " done" : "");
      card.innerHTML = `<span class="v-icon" aria-hidden="true">${optIcon(ex)}</span>
        <span class="v-body"><span class="v-name">${optName(ex)}</span><span class="v-desc">${optDesc(ex)}</span></span>
        <span class="v-tag">${ex.difficolta}</span>`;
      card.setAttribute("aria-label", `${optName(ex)}. ${ex.consegna}. Difficoltà ${ex.difficolta}.${done ? " Già completato." : ""}`);
      card.onclick = () => startExercise(i);
      list.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------
     SESSIONE DI GIOCO
     ------------------------------------------------------------------ */
  function startExercise(index) {
    if (!V.exercises.length) return;
    V.index = Math.max(0, Math.min(V.exercises.length - 1, index));
    V.current = V.exercises[V.index];
    V.answered = false;
    V.wrongCount = 0;
    V.helpUsed = false;
    V.selected = new Set();
    V.slots = [];
    V.tiles = [];
    V.memory = null;
    V.screen = "play";
    renderViaggio();
    announce(V.current.consegna);
    window.scrollTo({ top: 0, behavior: settings.reduceMotion ? "auto" : "smooth" });
    if (settings.autoRead) setTimeout(() => {
      playPrompt(V.current);
      setTimeout(() => playExerciseAudio(V.current), 900);
    }, 350);
  }

  function currentExercise() { return V.current; }

  function escAttr(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function imageHTML(img, alt, cls) {
    if (!img) return `<div class="v-emoji-big" aria-hidden="true">🖼️</div>`;
    if (img.src) {
      return `<img src="${escAttr(img.src)}" alt="${escAttr(alt || img.alt || "Immagine")}" class="${cls || ""}" loading="eager">`;
    }
    return `<div class="v-emoji-big" role="img" aria-label="${escAttr(alt || img.alt || "Immagine")}">${img.emoji || "🖼️"}</div>`;
  }

  function syllablesHTML(w) {
    return `<div class="v-syllable-row">${w.sillabe.map(s => `<span class="v-syl-static">${s}</span>`).join("")}</div>`;
  }

  function wordBigHTML(w, opts) {
    opts = opts || {};
    return `<div class="v-word">${w.sillabe.map((s, i) => `<span class="${opts.blank === i ? "v-blank" : ""}">${opts.blank === i ? "___" : s}</span>`).join("")}
      <small>${w.testo}${opts.note ? " · " + opts.note : ""}</small></div>`;
  }

  function sentenceHTML(f, opts) {
    opts = opts || {};
    const blank = opts.blank;
    const selectable = opts.selectable;
    const selected = opts.selected || new Set();
    const reveal = opts.reveal || new Set();
    return `<div class="v-sentence" role="group" aria-label="Frase: ${escAttr(f.testo)}">${f.parole.map((p, pi) => {
      if (blank === pi) {
        return `<span class="v-sword"><span class="v-gap" aria-label="parola mancante"></span></span>`;
      }
      if (opts.segment === false) {
        return `<span class="v-sword">${p.testo}</span>`;
      }
      return `<span class="v-sword" role="group" aria-label="${escAttr(p.testo)}">${p.sillabe.map((s, si) => {
        const key = pi + ":" + si;
        const cls = (selected.has(key) ? " selected" : "") + (reveal.has(key) ? " hit" : "");
        if (selectable) {
          return `<button type="button" class="v-syl${cls}" data-p="${pi}" data-s="${si}" aria-label="Sillaba ${s}">${s}</button>`;
        }
        return `<span class="v-syl${cls}">${s}</span>`;
      }).join("")}</span>`;
    }).join("")}<span class="v-punct" aria-hidden="true">.</span></div>`;
  }

  function stimulusHTML(ex) {
    const st = ex.stimolo || {};
    if (st.tipo === "audio") {
      return `<div><div class="v-emoji-big" aria-hidden="true">🔊</div><div class="v-cap">Ascolta e scegli</div></div>`;
    }
    if (st.tipo === "sillaba" || st.tipo === "suono" || st.tipo === "gruppo") {
      return `<div><div class="v-syllable">${st.testo || ex.unitTesto}</div><div class="v-cap">${st.tipo === "sillaba" ? "La sillaba da ascoltare" : st.tipo === "suono" ? "Il suono da ascoltare" : "Il gruppo da ascoltare"}</div></div>`;
    }
    if (st.tipo === "immagine") {
      return `<div style="width:100%">${imageHTML(st.immagine, st.immagine && st.immagine.alt)}${st.parola ? `<div class="v-cap">Ascolta la parola</div>` : ""}</div>`;
    }
    if (st.tipo === "parola-incompleta") {
      const mostra = st.mostra || [];
      return `<div style="width:100%">
        ${imageHTML(st.immagine, st.immagine && st.immagine.alt, "v-stim-img")}
        <div class="v-word">${mostra.map(s => `<span>${s}</span>`).join("")}</div>
        <div class="v-cap">La parola da completare</div></div>`;
    }
    if (st.tipo === "famiglia") {
      return `<div><div class="v-family-row">${(st.mostra || []).map(s => `<span>${s}</span>`).join("")}<span>?</span></div><div class="v-cap">Quale sillaba manca?</div></div>`;
    }
    if (st.tipo === "memory") {
      return `<div class="v-cap">Trova le coppie. Tocca due tessere.</div>`;
    }
    if (st.tipo === "frase" || st.tipo === "frase-segmentata" || st.tipo === "frase-buco") {
      const f = D.frase(st.fraseId);
      if (!f) return `<div class="v-empty">Frase non disponibile.</div>`;
      const opts = { blank: st.buco, segment: st.tipo === "frase-segmentata", selectable: st.tipo === "frase-segmentata", selected: new Set(), reveal: new Set() };
      return `<div style="width:100%">
        <div class="v-ill-row">${(st.illustrazioni || []).map(e => `<span class="v-ill">${e}</span>`).join("")}</div>
        ${st.tipo === "frase-buco" ? sentenceHTML(f, opts) : `<div class="v-cap">${st.tipo === "frase-segmentata" ? "Ascolta la frase e tocca tutte le sillabe bersaglio." : "Ascolta la frase, poi costruiscila."}</div>`}
      </div>`;
    }
    if (st.tipo === "immagini") {
      return `<div><div class="v-syllable">${st.testo || ex.unitTesto}</div><div class="v-cap">Tocca tutte le immagini giuste.</div></div>`;
    }
    if (st.tipo === "inventa") {
      return `<div style="width:100%"><div class="v-ill-row">${(st.illustrazioni || []).map(e => `<span class="v-ill">${e}</span>`).join("")}</div><div class="v-cap">Scegli le parole e costruisci una frase sensata.</div></div>`;
    }
    if (st.tipo === "parola") {
      return `<div><div class="v-syllable">${st.testo}</div><div class="v-cap">Ascolta e scegli.</div></div>`;
    }
    return `<div class="v-empty">${ex.consegna}</div>`;
  }

  function optionButton(opt, ex, idx) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "v-option";
    b.dataset.opt = opt.id;
    if (opt.tipo === "parola" && opt.immagine) {
      b.classList.add("image-option");
      b.innerHTML = `${imageHTML(opt.immagine, opt.alt || opt.testo)}`;
      b.setAttribute("aria-label", `Immagine: ${opt.alt || opt.testo}`);
      b.addEventListener("pointerdown", () => speakV(opt.testo, { group: "parole" }));
    } else if (opt.tipo === "sillaba" || opt.tipo === "gruppo") {
      b.innerHTML = `<span>${opt.testo}</span>`;
      b.setAttribute("aria-label", `Sillaba ${opt.testo}`);
      b.addEventListener("pointerdown", () => speakV(opt.testo, { group: "syl" }));
    } else {
      b.textContent = opt.testo;
      b.setAttribute("aria-label", opt.testo);
      if (opt.tipo === "parola") b.addEventListener("pointerdown", () => speakV(opt.testo, { group: "parole" }));
    }
    if (ex.interazione === "multipla") {
      b.addEventListener("click", () => {
        if (V.answered) return;
        if (V.selected.has(opt.id)) { V.selected.delete(opt.id); b.classList.remove("selected"); }
        else { V.selected.add(opt.id); b.classList.add("selected"); }
        if (opt.audio) speakV(opt.audio.testo, { group: opt.audio.gruppo || "parole" });
      });
    } else {
      b.addEventListener("click", () => answerChoice(opt, b, ex));
    }
    return b;
  }

  function renderAnswer(ex) {
    const box = document.createElement("div");
    box.className = "v-answer";
    if (ex.interazione === "scelta") {
      const opts = document.createElement("div");
      opts.className = "v-options" + (ex.opzioni.some(o => o.tipo === "parola" && o.immagine) ? " images" : "");
      ex.opzioni.forEach(o => opts.appendChild(optionButton(o, ex)));
      box.appendChild(opts);
    } else if (ex.interazione === "multipla") {
      const opts = document.createElement("div");
      opts.className = "v-options images";
      ex.opzioni.forEach(o => opts.appendChild(optionButton(o, ex)));
      box.appendChild(opts);
      const check = document.createElement("button");
      check.type = "button"; check.className = "btn primary"; check.id = "vCheckMulti"; check.textContent = "✔ Controlla";
      check.onclick = () => checkMulti(ex);
      box.appendChild(check);
    } else if (ex.interazione === "ordina") {
      box.appendChild(buildOrderArea(ex));
    } else if (ex.interazione === "memory") {
      box.appendChild(buildMemoryArea(ex));
    } else if (ex.interazione === "evidenzia") {
      const f = D.frase(ex.stimolo.fraseId);
      box.innerHTML = sentenceHTML(f, { segment: true, selectable: true, selected: V.selected, reveal: new Set() });
      box.querySelectorAll(".v-syl").forEach(btn => {
        btn.addEventListener("click", () => {
          if (V.answered) return;
          const key = btn.dataset.p + ":" + btn.dataset.s;
          if (V.selected.has(key)) { V.selected.delete(key); btn.classList.remove("selected"); }
          else { V.selected.add(key); btn.classList.add("selected"); }
          speakV(btn.textContent, { group: "syl" });
        });
      });
      const check = document.createElement("button");
      check.type = "button"; check.className = "btn primary"; check.id = "vCheckEvidence"; check.textContent = "✔ Controlla";
      check.onclick = () => checkEvidence(ex);
      box.appendChild(check);
    } else if (ex.interazione === "costruisci") {
      box.appendChild(buildInventaArea(ex));
    }
    return box;
  }

  function renderPlay(box) {
    const ex = currentExercise();
    if (!ex) { V.screen = "unit"; return renderViaggio(); }
    const u = unitOf(ex);
    const title = V.game ? V.game.nome : (u ? u.testo : ex.unitTesto);
    setTitle(title, V.game ? V.game.desc : (u ? u.famigliaNome + " · " + u.tipo : ""));
    box.innerHTML = `
      <div class="card">
        <div class="v-play-top">
          <div class="v-actions">
            <button class="btn ghost small" id="vBackUnit">← ${V.game ? "Giochi" : "Attività"}</button>
            <span class="v-pill">${V.game ? V.game.emoji + " " + V.game.nome : (u ? u.testo : "")}</span>
            <span class="v-pill">${V.index + 1} / ${V.exercises.length}</span>
            <span class="v-pill">${ex.difficolta}</span>
          </div>
          <div class="v-actions">
            <button class="btn ghost small" id="vPlayPrompt">🔊 Consegna</button>
            <button class="btn ghost small" id="vPlayAudioTop">🔊 Ascolta</button>
          </div>
        </div>
        <div class="v-prompt" id="vPrompt">${ex.consegna}</div>
        <div class="v-stage">
          <div class="v-stimulus" id="vStimulus">${stimulusHTML(ex)}</div>
          <div id="vAnswerWrap"></div>
        </div>
        <div class="v-feedback" id="vFeedback" role="status" aria-live="polite">Scegli una risposta. Puoi riascoltare quando vuoi.</div>
        <div class="v-actions" style="justify-content:center;margin-top:10px">
          <button class="btn ghost small" id="vRepeat">🔊 Ripeti</button>
          <button class="btn ghost small" id="vSegmented">🧩 A pezzi</button>
          <button class="btn ghost small" id="vHintBtn">💡 Aiuto</button>
          <button class="btn ghost small" id="vSkipBtn">Salta →</button>
          <button class="btn primary" id="vNextBtn" disabled>Prossimo →</button>
        </div>
      </div>`;
    $("#vBackUnit").onclick = () => {
      if (V.returnTo) { V.frasi.unitId = V.returnTo.unitId; V.returnTo = null; V.screen = "frasi"; renderViaggio(); return; }
      if (V.game) { V.game = null; V.screen = "giochi"; } else { V.screen = "unit"; }
      renderViaggio();
    };
    $("#vPlayPrompt").onclick = () => playPrompt(ex);
    $("#vPlayAudioTop").onclick = () => playExerciseAudio(ex);
    $("#vRepeat").onclick = () => { playPrompt(ex); setTimeout(() => playExerciseAudio(ex), 700); };
    $("#vSegmented").onclick = () => speakSegmented(ex);
    $("#vHintBtn").onclick = () => giveHint(ex);
    $("#vSkipBtn").onclick = () => { V.answered = true; nextExercise(); };
    $("#vNextBtn").onclick = () => nextExercise();
    const wrap = $("#vAnswerWrap");
    wrap.appendChild(renderAnswer(ex));
    // Il primo controllo riceve il focus: tastiera e screen reader partono da lì.
    setTimeout(() => {
      const first = wrap.querySelector("button");
      if (first) first.focus({ preventScroll: true });
    }, 80);
  }

  /* ------------------------------------------------------------------
     RISPOSTA, FEEDBACK, AIUTO
     ------------------------------------------------------------------ */
  function updateFeedback(html, cls) {
    const f = $("#vFeedback");
    if (!f) return;
    f.innerHTML = html;
    f.className = "v-feedback" + (cls ? " " + cls : "");
  }

  function correctAudio(ex) {
    if (ex.stimolo && ex.stimolo.parolaId) {
      const w = D.parola(ex.stimolo.parolaId);
      if (w) return { text: w.testo, group: "parole" };
    }
    if (ex.stimolo && ex.stimolo.fraseId) {
      const f = D.frase(ex.stimolo.fraseId);
      if (f) return { text: f.id, group: "frasiViaggio", fallback: f.testo };
    }
    if (ex.unitTesto) return { text: ex.unitTesto, group: "syl" };
    return null;
  }

  function playCorrectSound(ex) {
    const a = correctAudio(ex);
    if (a) setTimeout(() => speakV(a.text, { group: a.group, fallbackText: a.fallback, rate: store.config.audioLento ? 0.7 : undefined }), 450);
  }

  function revealCorrect(ex) {
    if (ex.interazione === "scelta") {
      const corrette = (ex.opzioni || []).filter(o => o.corretta).map(o => o.id);
      $$("#vAnswerWrap .v-option").forEach(b => {
        if (corrette.includes(b.dataset.opt)) b.classList.add("correct");
      });
    } else if (ex.interazione === "multipla") {
      $$("#vAnswerWrap .v-option").forEach(b => {
        const o = (ex.opzioni || []).find(x => x.id === b.dataset.opt);
        if (o && o.corretta) b.classList.add("correct");
      });
    } else if (ex.interazione === "memory" && V.memory) {
      V.memory.matched = new Set(V.memory.cards.map(c => c.id));
      renderMemory();
    } else if (ex.interazione === "evidenzia") {
      const f = D.frase(ex.stimolo.fraseId);
      const keys = new Set(ex.soluzione.map(o => o.parola + ":" + o.sillaba));
      $$("#vAnswerWrap .v-syl").forEach(b => {
        const k = b.dataset.p + ":" + b.dataset.s;
        if (keys.has(k)) b.classList.add("hit");
      });
    }
  }

  function answerCorrect(ex) {
    if (V.answered) return;
    V.answered = true;
    if (V.session) {
      V.session.corrette++;
      V.session.tentativi++;
      V.session.done.add(ex.modello);
    }
    recordAnswer(ex.unitId, ex.competenza, true, V.helpUsed);
    markExercise(ex.unitId, ex.modello, true);
    const extra = ex.stimolo && ex.stimolo.parolaId && D.parola(ex.stimolo.parolaId)
      ? ` <span class="v-word-full">${D.parola(ex.stimolo.parolaId).sillabe.join("-")}</span>`
      : "";
    updateFeedback(`<b>${ex.feedback.corretto}</b>${extra}`, "ok");
    fx("place");
    speakV("Bravo!", { group: "ui" });
    playCorrectSound(ex);
    $$("#vAnswerWrap button").forEach(b => { b.disabled = true; });
    const next = $("#vNextBtn");
    if (next) {
      next.disabled = false;
      next.textContent = V.index >= V.exercises.length - 1 ? "Fine sessione →" : "Prossimo →";
      next.focus({ preventScroll: true });
    }
    announce("Risposta corretta. " + ex.feedback.corretto);
  }

  function answerWrong(ex, extra) {
    if (V.session) V.session.tentativi++;
    recordAnswer(ex.unitId, ex.competenza, false, V.helpUsed);
    fx("wrong");
    V.wrongCount++;
    if (V.wrongCount >= 2) {
      V.answered = true;
      revealCorrect(ex);
      updateFeedback(`<b>${ex.feedback.errato}</b> ${ex.aiuto || ""}`, "no");
      const next = $("#vNextBtn");
      if (next) {
        next.disabled = false;
        next.textContent = V.index >= V.exercises.length - 1 ? "Fine sessione →" : "Prossimo →";
        next.focus({ preventScroll: true });
      }
    } else {
      updateFeedback(`<b>Non è questa.</b> ${ex.aiuto || "Riascolta e riprova."}`, "no");
    }
    const a = correctAudio(ex);
    if (a && V.wrongCount >= 2) {
      speakSequence([{ text: "Quasi! Era", group: "ui" }, { text: a.text, group: a.group }], { rate: 0.95 });
    } else {
      speakV("Riprova. " + (ex.aiuto || ""), { group: "ui", rate: 0.95 });
    }
    announce("Risposta errata. " + (V.wrongCount >= 2 ? ex.feedback.errato : "Riprova."));
  }

  function answerChoice(opt, btn, ex) {
    if (V.answered) return;
    if (opt.corretta) {
      btn.classList.add("correct");
      answerCorrect(ex);
    } else {
      btn.classList.add("wrong");
      btn.disabled = true;
      answerWrong(ex);
    }
  }

  function giveHint(ex) {
    V.helpUsed = true;
    updateFeedback(`<b>Aiuto:</b> ${ex.aiuto || "Ascolta di nuovo il suono."}`, "");
    playExerciseAudio(ex);
    speakV(ex.aiuto || ex.consegna, { group: "ui", rate: store.config.audioLento ? 0.75 : 0.95 });
    if (V.wrongCount > 0) revealCorrect(ex);
    announce("Aiuto: " + (ex.aiuto || ""));
  }

  function checkMulti(ex) {
    if (V.answered) return;
    const corrette = new Set((ex.opzioni || []).filter(o => o.corretta).map(o => o.id));
    const scelte = V.selected;
    const ok = corrette.size === scelte.size && [...corrette].every(id => scelte.has(id));
    if (ok) {
      $$("#vAnswerWrap .v-option").forEach(b => {
        if (corrette.has(b.dataset.opt)) b.classList.add("correct");
      });
      answerCorrect(ex);
    } else {
      $$("#vAnswerWrap .v-option").forEach(b => {
        if (scelte.has(b.dataset.opt) && !corrette.has(b.dataset.opt)) b.classList.add("wrong");
      });
      answerWrong(ex);
    }
  }

  function checkEvidence(ex) {
    if (V.answered) return;
    const attese = new Set(ex.soluzione.map(o => o.parola + ":" + o.sillaba));
    const ok = attese.size === V.selected.size && [...attese].every(k => V.selected.has(k));
    $$("#vAnswerWrap .v-syl").forEach(b => {
      const k = b.dataset.p + ":" + b.dataset.s;
      if (attese.has(k)) b.classList.add("hit");
      else if (V.selected.has(k)) b.classList.add("missed");
    });
    if (ok) answerCorrect(ex);
    else answerWrong(ex);
  }

  /* ------------------------------------------------------------------
     ORDINA (treno delle sillabe / frase)
     ------------------------------------------------------------------ */
  function buildOrderArea(ex) {
    const isFrase = ex.modello === "frase-ordina";
    const expected = ex.soluzione.slice();
    let tiles;
    if (isFrase) {
      tiles = ex.opzioni.map((o, i) => ({ id: o.id, testo: o.testo, used: false }));
    } else {
      const testi = (ex.stimolo && ex.stimolo.tessere) || ex.opzioni.map(o => o.testo);
      tiles = testi.map((t, i) => ({ id: "t" + i + "-" + t, testo: t, used: false }));
    }
    V.slots = new Array(expected.length).fill(null);
    V.tiles = shuffleArr(tiles);
    V.order = { isFrase, expected };
    const box = document.createElement("div");
    box.className = "v-order";
    box.innerHTML = `<div class="v-slots" id="vSlots" aria-label="Caselle da riempire"></div>
      <div class="v-tiles" id="vTiles" role="group" aria-label="Tessere disponibili"></div>
      <div class="v-cap" id="vOrderCap">${isFrase ? "Tocca le parole nell'ordine giusto." : "Tocca le sillabe nell'ordine giusto."}</div>`;
    setTimeout(() => renderOrder(), 0);
    return box;
  }

  function renderOrder() {
    const slots = $("#vSlots"), tiles = $("#vTiles");
    if (!slots || !tiles || !V.order) return;
    slots.innerHTML = "";
    V.slots.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "v-slot " + (s ? "filled" : "empty");
      b.dataset.slot = String(i);
      b.textContent = s ? s.testo : "…";
      b.setAttribute("aria-label", s ? `Casella ${i + 1}: ${s.testo}. Tocca per togliere.` : `Casella ${i + 1} vuota`);
      b.onclick = () => {
        if (V.answered || !V.slots[i]) return;
        const t = V.slots[i];
        V.slots[i] = null;
        const tile = V.tiles.find(x => x.id === t.tileId);
        if (tile) tile.used = false;
        renderOrder();
      };
      slots.appendChild(b);
    });
    tiles.innerHTML = "";
    V.tiles.forEach(t => {
      if (t.used) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "v-tile";
      b.textContent = t.testo;
      b.dataset.tile = t.id;
      b.setAttribute("aria-label", `Tessera ${t.testo}. Tocca per inserirla.`);
      b.onclick = () => placeTile(t.id);
      b.addEventListener("pointerdown", e => startViaggioDrag(e, b, t));
      tiles.appendChild(b);
    });
  }

  function placeTile(tileId, slotIndex) {
    if (V.answered || !V.order) return;
    const tile = V.tiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;
    let idx = typeof slotIndex === "number" ? slotIndex : V.slots.findIndex(s => !s);
    if (idx < 0) { vToast("Tutte le caselle sono piene: togli una tessera per cambiarla."); return; }
    if (V.slots[idx]) {
      const old = V.slots[idx];
      const oldTile = V.tiles.find(t => t.id === old.tileId);
      if (oldTile) oldTile.used = false;
    }
    const expected = V.order.expected[idx];
    if (tile.testo !== expected) {
      const slot = els(`.v-slot[data-slot="${idx}"]`);
      if (slot) { slot.classList.add("wrong"); setTimeout(() => slot.classList.remove("wrong"), 450); }
      speakToken(tile.testo, V.order.isFrase ? "parole" : "syl");
      updateFeedback("Questa tessera non va in questa casella. Riascolta e riprova.", "no");
      answerWrong(V.current);
      return;
    }
    V.slots[idx] = { testo: tile.testo, tileId: tile.id };
    tile.used = true;
    speakToken(tile.testo, V.order.isFrase ? "parole" : "syl");
    renderOrder();
    if (V.slots.every(Boolean)) {
      const seq = V.slots.map(s => s.testo);
      const ok = seq.length === V.order.expected.length && seq.every((x, i) => x === V.order.expected[i]);
      if (ok) {
        answerCorrect(V.current);
        setTimeout(() => {
          if (V.order.isFrase) {
            const f = D.frase(V.current.stimolo.fraseId);
            if (f) speakV(f.id, { group: "frasiViaggio", fallbackText: f.testo });
          } else if (V.current.stimolo && V.current.stimolo.parolaId) {
            const w = D.parola(V.current.stimolo.parolaId);
            if (w) speakV(w.testo, { group: "parole" });
          }
        }, 500);
      } else {
        updateFeedback("Quasi: l'ordine non è ancora giusto.", "no");
      }
    }
  }

  function els(sel) { return document.querySelector(sel); }

  /* --- drag con pointer events: mouse, dito, penna --- */
  let vDrag = null;
  function startViaggioDrag(e, tileEl, tile) {
    if (V.answered) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const startX = e.clientX, startY = e.clientY;
    let moved = false;
    const ghost = tileEl.cloneNode(true);
    ghost.classList.add("ghost");
    document.body.appendChild(ghost);
    ghost.style.left = startX + "px";
    ghost.style.top = startY + "px";
    const move = ev => {
      if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 6) moved = true;
      ghost.style.left = ev.clientX + "px";
      ghost.style.top = ev.clientY + "px";
      const slot = document.elementFromPoint(ev.clientX, ev.clientY);
      const target = slot && slot.closest ? slot.closest(".v-slot") : null;
      $$(".v-slot").forEach(s => s.classList.remove("drop-hover"));
      if (target) target.classList.add("drop-hover");
    };
    const up = ev => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      ghost.remove();
      $$(".v-slot").forEach(s => s.classList.remove("drop-hover"));
      if (!moved) return;
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const target = under && under.closest ? under.closest(".v-slot") : null;
      if (target) placeTile(tile.id, Number(target.dataset.slot));
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    e.preventDefault();
  }

  /* ------------------------------------------------------------------
     MEMORY
     ------------------------------------------------------------------ */
  function buildMemoryArea(ex) {
    const coppie = (ex.stimolo && ex.stimolo.coppie) || [];
    const cards = [];
    coppie.forEach((c, i) => {
      cards.push({ id: "img-" + i, pairId: c.pairId, kind: "img", immagine: c.immagine, parola: c.parola, alt: c.immagine && c.immagine.alt });
      cards.push({ id: "syl-" + i, pairId: c.pairId, kind: "syl", testo: c.sillaba, parola: c.parola });
    });
    V.memory = { cards: shuffleArr(cards), open: [], matched: new Set(), busy: false, coppie: coppie.length };
    const box = document.createElement("div");
    box.className = "v-memory";
    box.id = "vMemory";
    setTimeout(() => renderMemory(), 0);
    return box;
  }

  function renderMemory() {
    const box = $("#vMemory");
    if (!box || !V.memory) return;
    box.innerHTML = "";
    V.memory.cards.forEach(c => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "v-mcard " + (V.memory.matched.has(c.id) ? "matched" : (V.memory.open.includes(c.id) ? "flipped" : "hidden-card"));
      b.dataset.card = c.id;
      if (V.memory.open.includes(c.id) || V.memory.matched.has(c.id)) {
        if (c.kind === "img") b.innerHTML = imageHTML(c.immagine, c.alt, "v-mimg");
        else b.textContent = c.testo;
        b.setAttribute("aria-label", (c.kind === "img" ? "Immagine: " + (c.alt || c.parola) : "Sillaba " + c.testo));
      } else {
        b.textContent = "";
        b.setAttribute("aria-label", "Tessera coperta. Tocca per girarla.");
      }
      b.onclick = () => flipMemory(c.id);
      box.appendChild(b);
    });
  }

  function flipMemory(id) {
    if (!V.memory || V.memory.busy || V.answered) return;
    if (V.memory.matched.has(id) || V.memory.open.includes(id)) return;
    V.memory.open.push(id);
    const card = V.memory.cards.find(c => c.id === id);
    if (card) speakV(card.kind === "img" ? card.parola : card.testo, { group: card.kind === "img" ? "parole" : "syl" });
    renderMemory();
    if (V.memory.open.length === 2) {
      V.memory.busy = true;
      const [a, b] = V.memory.open.map(cid => V.memory.cards.find(c => c.id === cid));
      if (a && b && a.pairId === b.pairId) {
        V.memory.matched.add(a.id); V.memory.matched.add(b.id);
        V.memory.open = [];
        V.memory.busy = false;
        renderMemory();
        if (V.memory.matched.size >= V.memory.cards.length) {
          answerCorrect(V.current);
        }
      } else {
        answerWrong(V.current);
        setTimeout(() => {
          V.memory.open = [];
          V.memory.busy = false;
          renderMemory();
        }, 900);
      }
    }
  }

  /* ------------------------------------------------------------------
     INVENTA
     ------------------------------------------------------------------ */
  function buildInventaArea(ex) {
    V.inventa = { parole: (ex.stimolo.parole || []).slice(), seq: [] };
    const box = document.createElement("div");
    box.className = "v-order";
    box.innerHTML = `<div class="v-slots" id="vInvSlots" aria-label="La tua frase"></div>
      <div class="v-tiles" id="vInvTiles" role="group" aria-label="Parole disponibili"></div>
      <div class="v-actions" style="justify-content:center"><button type="button" class="btn primary" id="vCheckInv">✔ Verifica la frase</button></div>
      <div class="v-cap">Tocca le parole per comporre. Tocca una parola nella frase per toglierla.</div>`;
    setTimeout(() => { renderInventa(); $("#vCheckInv").onclick = () => checkInventa(ex); }, 0);
    return box;
  }

  function renderInventa() {
    const slots = $("#vInvSlots"), tiles = $("#vInvTiles");
    if (!slots || !tiles || !V.inventa) return;
    slots.innerHTML = "";
    V.inventa.seq.forEach((w, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "v-slot filled"; b.textContent = w;
      b.onclick = () => { if (V.answered) return; V.inventa.seq.splice(i, 1); renderInventa(); };
      slots.appendChild(b);
    });
    if (!V.inventa.seq.length) slots.innerHTML = `<span class="v-cap">La tua frase apparirà qui.</span>`;
    tiles.innerHTML = "";
    V.inventa.parole.forEach((w, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "v-tile"; b.textContent = w;
      b.onclick = () => {
        if (V.answered) return;
        V.inventa.seq.push(w);
        speakV(w, { group: "parole" });
        renderInventa();
      };
      tiles.appendChild(b);
    });
  }

  function checkInventa(ex) {
    if (V.answered) return;
    const seq = V.inventa.seq;
    const valida = (ex.soluzione || []).some(sol => sol.length === seq.length && sol.every((w, i) => w === seq[i]));
    if (valida) {
      answerCorrect(ex);
    } else {
      answerWrong(ex);
      updateFeedback(`<b>Questa sequenza non è ancora una frase approvata.</b> Prova a cambiare l'ordine. ${ex.aiuto || ""}`, "no");
    }
  }

  /* ------------------------------------------------------------------
     FINE SESSIONE
     ------------------------------------------------------------------ */
  function nextExercise() {
    if (!V.answered) return;
    if (V.index < V.exercises.length - 1) {
      V.index++;
      startExercise(V.index);
    } else {
      finishSession();
    }
  }

  function finishSession() {
    V.screen = "summary";
    const s = V.session || { corrette: 0, tentativi: 0, aiuti: 0, started: Date.now() };
    const pctAcc = s.tentativi ? Math.round(s.corrette / s.tentativi * 100) : 0;
    if (pctAcc >= 80) { fx("win"); confetti(); }
    renderViaggio();
    if (settings.autoRead) {
      setTimeout(() => speakV(`Hai risposto bene a ${s.corrette} attività su ${s.tentativi}.`, { group: "ui", rate: 1 }), 350);
    }
  }

  function nextUnitAfter(unitId) {
    const units = visibleUnits();
    const idx = units.findIndex(u => u.id === unitId);
    if (idx < 0) return null;
    return units[idx + 1] || null;
  }

  function renderSummary(box) {
    const s = V.session || { corrette: 0, tentativi: 0, aiuti: 0, started: Date.now() };
    const acc = s.tentativi ? Math.round(s.corrette / s.tentativi * 100) : 0;
    const u = V.unitId ? D.unita(V.unitId) : null;
    const next = u ? nextUnitAfter(u.id) : null;
    const secs = Math.max(1, Math.round((Date.now() - (s.started || Date.now())) / 1000));
    setTitle(V.game ? V.game.nome : (u ? u.testo : "Sessione"), "Fine della sessione");
    box.innerHTML = `
      <div class="card">
        <div class="results">
          <div class="big" aria-hidden="true">${acc >= 80 ? "🏆" : acc >= 50 ? "🌟" : "💪"}</div>
          <div class="stars" aria-label="${acc >= 80 ? "ottimo" : acc >= 50 ? "buono" : "da riprendere"}">${"★".repeat(acc >= 80 ? 3 : acc >= 50 ? 2 : 1)}${"☆".repeat(3 - (acc >= 80 ? 3 : acc >= 50 ? 2 : 1))}</div>
          <h2>${V.game ? "Partita completata!" : "Sessione completata!"}</h2>
          <p>${V.game ? V.game.nome : (u ? u.testo + " · " + u.famigliaNome : "")}</p>
          <div class="stat-grid">
            <div class="stat"><b>${s.corrette}/${s.tentativi}</b><span>RISPOSTE</span></div>
            <div class="stat"><b>${acc}%</b><span>PRECISIONE</span></div>
            <div class="stat"><b>${s.aiuti}</b><span>AIUTI</span></div>
            <div class="stat"><b>${secs}s</b><span>TEMPO</span></div>
          </div>
          <p class="muted" style="font-size:.78rem">La soglia di acquisizione è una regola di gioco, non una valutazione clinica. Puoi sempre riprovare.</p>
          <div class="v-actions" style="justify-content:center">
            <button class="btn primary" id="vSummaryRetry">🔁 Ripeti</button>
            ${V.returnTo ? `<button class="btn ghost" id="vSummaryFrasi">💬 Torna alle frasi</button>` : V.game ? `<button class="btn ghost" id="vSummaryGames">🎲 Giochi</button>` : `<button class="btn ghost" id="vSummaryUnit">📚 Torna alle attività</button>`}
            ${next && !V.game ? `<button class="btn ghost" id="vSummaryNext">➡ ${next.testo}</button>` : ""}
            <button class="btn ghost" id="vSummaryMap">🗺️ Mappa</button>
          </div>
        </div>
      </div>`;
    $("#vSummaryRetry").onclick = () => {
      V.session = { unitId: V.unitId, corrette: 0, tentativi: 0, aiuti: 0, started: Date.now(), done: new Set() };
      startExercise(0);
    };
    if ($("#vSummaryGames")) $("#vSummaryGames").onclick = () => { V.game = null; V.screen = "giochi"; renderViaggio(); };
    if ($("#vSummaryFrasi")) $("#vSummaryFrasi").onclick = () => { const r = V.returnTo; V.returnTo = null; if (r) V.frasi.unitId = r.unitId; V.screen = "frasi"; renderViaggio(); };
    if ($("#vSummaryUnit")) $("#vSummaryUnit").onclick = () => { V.screen = "unit"; renderViaggio(); };
    if ($("#vSummaryNext")) $("#vSummaryNext").onclick = () => openUnit(next.id);
    $("#vSummaryMap").onclick = () => { V.screen = "map"; renderViaggio(); };
  }

  /* ------------------------------------------------------------------
     GIOCHI
     ------------------------------------------------------------------ */
  function renderGiochi(box) {
    setTitle("Giochi delle sillabe", "Sette ambienti, gli stessi contenuti verificati.");
    box.innerHTML = `<div class="card">
      <div class="v-view-head"><div><h2>🎲 Giochi</h2><div class="v-sub">Ogni gioco riusa gli esercizi del curriculum: niente contenuti inventati per riempire.</div></div>
      <div class="v-actions"><button class="btn ghost small" id="vBackMap">← Mappa</button></div></div>
      <div class="v-games" id="vGames"></div></div>`;
    $("#vBackMap").onclick = () => { V.screen = "map"; renderViaggio(); };
    const list = $("#vGames");
    GIOCHI.forEach(g => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "v-game";
      b.innerHTML = `<span class="v-gi" aria-hidden="true">${g.emoji}</span><span><span class="v-gn">${g.nome}</span><span class="v-gs">${g.desc}</span></span>`;
      b.onclick = () => startGame(g.id);
      list.appendChild(b);
    });
  }

  function startGame(gameId) {
    const g = GIOCHI.find(x => x.id === gameId);
    if (!g) return;
    const units = shuffleArr(visibleUnits().filter(u => u.tipo !== "modulo"));
    const pool = [];
    const seen = new Set();
    for (const u of units) {
      const list = D.generaEsercizi(u.id, { alternative: store.config.alternative });
      list.forEach(ex => {
        if (!g.modelli.includes(modelKey(ex.modello))) return;
        const key = ex.modello + "|" + (ex.stimolo && (ex.stimolo.parolaId || ex.stimolo.testo || ex.stimolo.fraseId));
        if (seen.has(key)) return;
        seen.add(key);
        pool.push(ex);
      });
      if (pool.length >= 8) break;
    }
    if (!pool.length) { vToast("Nessun esercizio disponibile per questo gioco con i filtri attuali."); return; }
    V.game = g;
    V.exercises = shuffleArr(pool).slice(0, 8);
    V.index = 0;
    V.session = { unitId: null, corrette: 0, tentativi: 0, aiuti: 0, started: Date.now(), done: new Set() };
    V.returnTo = null;
    V.screen = "play";
    startExercise(0);
  }

  /* ------------------------------------------------------------------
     «LE FRASI DELLE SILLABE»
     ------------------------------------------------------------------ */
  function renderFrasi(box) {
    if (!V.frasi.unitId) {
      setTitle("Le frasi delle sillabe", "Ascolta, completa, costruisci, inventa.");
      const units = visibleUnits().filter(u => u.tipo === "sillaba" && D.frasiPerUnita(u.testo).length);
      box.innerHTML = `<div class="card">
        <div class="v-view-head"><div><h2>💬 Le frasi delle sillabe</h2>
        <div class="v-sub">Una banca di frasi con la sillaba bersaglio ripetuta. Le occorrenze sono calcolate sulla sillabazione vera.</div></div>
        <div class="v-actions"><button class="btn ghost small" id="vBackMap">← Mappa</button></div></div>
        <div class="v-exlist" id="vFrasiUnits"></div></div>`;
      $("#vBackMap").onclick = () => { V.screen = "map"; renderViaggio(); };
      const list = $("#vFrasiUnits");
      units.forEach(u => {
        const f = D.frasiPerUnita(u.testo);
        const b = document.createElement("button");
        b.type = "button"; b.className = "v-excard";
        b.innerHTML = `<span class="v-icon">${u.emoji || "💬"}</span><span class="v-body"><span class="v-name">${u.testo} · ${u.famigliaNome}</span>
          <span class="v-desc">${f.length} frase${f.length === 1 ? "" : "e"} · ${f[0].testo}</span></span><span class="v-tag">apri</span>`;
        b.onclick = () => { V.frasi.unitId = u.id; V.frasi.mode = 1; V.frasi.fraseId = f[0].id; renderViaggio(); };
        list.appendChild(b);
      });
      if (!units.length) list.innerHTML = `<div class="v-empty">Nessuna frase disponibile con i filtri attuali.</div>`;
      return;
    }
    const u = D.unita(V.frasi.unitId);
    if (!u) { V.frasi.unitId = null; return renderFrasi(box); }
    const frasi = D.frasiPerUnita(u.testo);
    if (!frasi.length) { V.frasi.unitId = null; return renderFrasi(box); }
    const f = frasi.find(x => x.id === V.frasi.fraseId) || frasi[0];
    const modi = [
      ["1", "Ascolta e osserva"],
      ["2", "Ascolta e completa"],
      ["3", "Costruisci"],
      ["4", "Inventa"]
    ];
    setTitle("Le frasi di " + u.testo, u.famigliaNome + " · " + frasi.length + " frase" + (frasi.length === 1 ? "" : "e"));
    box.innerHTML = `<div class="card">
      <div class="v-view-head"><div><h2>💬 ${u.testo}</h2><div class="v-sub">Scegli una modalità. La lettura animata evidenzia ogni sillaba mentre viene pronunciata.</div></div>
      <div class="v-actions"><button class="btn ghost small" id="vFrasiBack">← Frasi</button><button class="btn ghost small" id="vUnitFromFrasi">📚 Attività</button></div></div>
      <div class="v-phrase-tabs">${modi.map(([id, label]) => `<button type="button" class="v-tab ${String(V.frasi.mode) === id ? "active" : ""}" data-mode="${id}">${label}</button>`).join("")}</div>
      <div id="vFrasiBody"></div>
    </div>`;
    $("#vFrasiBack").onclick = () => { V.frasi.unitId = null; renderViaggio(); };
    $("#vUnitFromFrasi").onclick = () => openUnit(u.id);
    $$(".v-tab").forEach(b => { b.onclick = () => {
      V.frasi.mode = Number(b.dataset.mode);
      // Le modalità 2–4 usano la prima frase del gruppo: si riallinea la
      // selezione per non mostrare una frase e giocarne un'altra.
      if (V.frasi.mode !== 1) V.frasi.fraseId = frasi[0].id;
      renderViaggio();
    }; });
    const body = $("#vFrasiBody");
    if (V.frasi.mode === 1) {
      body.innerHTML = `<div class="v-phrase-card">
        <div class="v-sentence" id="vPhraseSentence">${sentenceHTML(f, { segment: true, selectable: false })}</div>
        <div class="v-ill-row">${(f.illustrazioni || []).map(e => `<span class="v-ill">${e}</span>`).join("")}</div>
        <div class="v-translation">${f.occorrenze.length} occorrenze di ${u.testo}</div>
        <div class="v-actions" style="justify-content:center">
          <button class="btn primary" id="vPhraseFull">🔊 Ascolta la frase</button>
          <button class="btn ghost" id="vPhraseSlow">🐢 Leggi a pezzi</button>
          <button class="btn ghost small" id="vPhraseNext">Altra frase →</button>
        </div>
      </div>`;
      $("#vPhraseFull").onclick = () => speakV(f.id, { group: "frasiViaggio", fallbackText: f.testo, rate: store.config.audioLento ? 0.7 : 0.95 });
      $("#vPhraseSlow").onclick = () => playAnimatedFrase(f);
      $("#vPhraseNext").onclick = () => {
        const i = frasi.findIndex(x => x.id === f.id);
        V.frasi.fraseId = frasi[(i + 1) % frasi.length].id;
        renderViaggio();
      };
    } else if (V.frasi.mode === 2) {
      body.innerHTML = `<div class="v-phrase-card">
        <div class="v-sentence">${sentenceHTML(f, { segment: false, blank: pickBlank(f) })}</div>
        <div class="v-actions" style="justify-content:center"><button class="btn primary" id="vPhrasePlay2">🔊 Ascolta e completa</button></div>
        <div class="v-cap">Una parola è stata tolta: ascolta la frase e scegli quella che manca.</div>
      </div>`;
      $("#vPhrasePlay2").onclick = () => startFraseExercise(u.id, "frase-completa");
    } else if (V.frasi.mode === 3) {
      body.innerHTML = `<div class="v-phrase-card">
        <div class="v-ill-row">${(f.illustrazioni || []).map(e => `<span class="v-ill">${e}</span>`).join("")}</div>
        <div class="v-cap">Riordina le parole per ricostruire la frase ascoltata.</div>
        <div class="v-actions" style="justify-content:center"><button class="btn primary" id="vPhrasePlay3">🧱 Costruisci la frase</button></div>
      </div>`;
      $("#vPhrasePlay3").onclick = () => startFraseExercise(u.id, "frase-ordina");
    } else {
      const inventabili = frasi.filter(x => x.soluzioniValide.length >= 2);
      if (!inventabili.length) {
        body.innerHTML = `<div class="v-empty">Per questa sillaba c'è una sola frase approvata: la modalità «Inventa» si attiva quando il dizionario avrà più combinazioni verificate.</div>`;
      } else {
        body.innerHTML = `<div class="v-phrase-card">
          <div class="v-ill-row">${(inventabili[0].illustrazioni || []).map(e => `<span class="v-ill">${e}</span>`).join("")}</div>
          <div class="v-cap">Usa le parole per inventare una frase nuova, grammaticalmente corretta e con la sillaba ${u.testo}.</div>
          <div class="v-actions" style="justify-content:center"><button class="btn primary" id="vPhrasePlay4">✨ Inventa</button></div>
        </div>`;
        $("#vPhrasePlay4").onclick = () => startFraseExercise(u.id, "inventa");
      }
    }
  }

  function pickBlank(f) {
    const counts = {};
    f.parole.forEach(p => { counts[p.testo] = (counts[p.testo] || 0) + 1; });
    let idx = f.parole.findIndex(p => counts[p.testo] === 1 && p.sillabe.includes(f.sillabaBersaglio));
    if (idx < 0) idx = f.parole.findIndex(p => counts[p.testo] === 1 && p.testo.length > 2);
    return Math.max(0, idx);
  }

  function startFraseExercise(unitId, modello) {
    const alt = store.config.semplificato ? Math.min(2, store.config.alternative) : store.config.alternative;
    const all = D.generaEsercizi(unitId, { alternative: alt });
    const ex = all.find(e => e.modello === modello && String(e.stimolo && e.stimolo.fraseId) === String(V.frasi.fraseId))
      || all.find(e => e.modello === modello);
    if (!ex) { vToast("Attività non disponibile per questa frase."); return; }
    V.exercises = [ex];
    V.index = 0;
    V.unitId = unitId;
    V.game = null;
    V.session = { unitId, corrette: 0, tentativi: 0, aiuti: 0, started: Date.now(), done: new Set() };
    V.returnTo = { screen: "frasi", unitId };
    startExercise(0);
  }

  function playAnimatedFrase(f) {
    if (V.frasi.playing) return;
    V.frasi.playing = true;
    const sentence = $("#vPhraseSentence");
    if (!sentence) { V.frasi.playing = false; return; }
    const nodes = Array.from(sentence.querySelectorAll(".v-syl"));
    let i = 0;
    const next = () => {
      nodes.forEach(n => n.classList.remove("highlight"));
      if (i >= nodes.length) { V.frasi.playing = false; return; }
      const n = nodes[i++];
      n.classList.add("highlight");
      n.scrollIntoView({ block: "nearest", behavior: settings.reduceMotion ? "auto" : "smooth" });
      if (/^[A-ZÀ-Ù]+'$/i.test(n.textContent.trim())) { setTimeout(next, 150); return; }
      speakV(n.textContent, { group: "syl", rate: 0.85, onend: () => setTimeout(next, 120) });
    };
    next();
  }

  /* ------------------------------------------------------------------
     PANNELLO INSEGNANTE
     ------------------------------------------------------------------ */
  const FUNZIONI = {
    IL: ["IL"], LA: ["LA"], LO: ["LO"], I: ["I"], GLI: ["GLI"], LE: ["LE"],
    UN: ["UN"], UNO: ["U-NO"], UNA: ["U-NA"], "UN'": ["UN'"],
    E: ["E"], È: ["È"], A: ["A"], DA: ["DA"], DI: ["DI"], IN: ["IN"], CON: ["CON"],
    SU: ["SU"], PER: ["PER"], TRA: ["TRA"], FRA: ["FRA"], NEL: ["NEL"], NELLA: ["NEL-LA"],
    SUL: ["SUL"], SULLA: ["SUL-LA"], AL: ["AL"], ALLA: ["AL-LA"], DEI: ["DEI"], DELLE: ["DEL-LE"],
    NON: ["NON"], HA: ["HA"], HANNO: ["HAN-NO"], SONO: ["SO-NO"], CHE: ["CHE"], CHI: ["CHI"],
    CUI: ["CUI"], SE: ["SE"], MA: ["MA"], POI: ["POI"], QUANDO: ["QUAN-DO"], MENTRE: ["MEN-TRE"],
    PERCHÉ: ["PER-CHÉ"], POICHÉ: ["POI-CHÉ"], ANCHE: ["AN-CHE"], MOLTO: ["MOL-TO"], POCO: ["PO-CO"],
    "L'": ["L'"], "D'": ["D'"]
  };

  function openDocente() {
    const pin = window.prompt ? window.prompt("PIN insegnante (predefinito 1234)") : "1234";
    if (pin === null) return;
    if (String(pin).trim() !== String(store.config.pin || "1234")) {
      vToast("PIN non corretto. Il pannello è riservato al docente.");
      return;
    }
    V.screen = "docente";
    V.docente.tab = V.docente.tab || "unita";
    renderViaggio();
  }

  function renderDocente(box) {
    setTitle("Pannello insegnante", "Contenuti, percorso, personalizzazioni e risultati.");
    const p = activeProfile();
    const tabs = [
      ["unita", "Unità attive"], ["ordine", "Percorso e attività"], ["parole", "Parole e immagini"],
      ["frasi", "Frasi"], ["risultati", "Risultati e report"]
    ];
    box.innerHTML = `<div class="card">
      <div class="v-view-head">
        <div><h2>🎓 Pannello insegnante</h2><div class="v-sub">Profilo attivo: ${p.avatar} <b>${p.nome}</b> · i dati restano su questo dispositivo.</div></div>
        <div class="v-actions">
          <button class="btn ghost small" id="vDocBack">← Mappa</button>
          <button class="btn ghost small" id="vDocAddProfile">➕ Profilo</button>
          <button class="btn ghost small" id="vDocRenameProfile">✏️ Rinomina</button>
        </div>
      </div>
      <div class="v-phrase-tabs">${tabs.map(([id, label]) => `<button type="button" class="v-tab ${V.docente.tab === id ? "active" : ""}" data-dtab="${id}">${label}</button>`).join("")}</div>
      <div id="vDocBody"></div>
      <p class="muted" style="font-size:.7rem;margin-top:10px">Il PIN predefinito è 1234. Non è una protezione crittografica: serve a evitare modifiche accidentali da parte del bambino.</p>
    </div>`;
    $("#vDocBack").onclick = () => { V.screen = "map"; renderViaggio(); };
    $("#vDocAddProfile").onclick = addProfile;
    $("#vDocRenameProfile").onclick = renameProfile;
    $$("[data-dtab]").forEach(b => b.onclick = () => { V.docente.tab = b.dataset.dtab; renderViaggio(); });
    const body = $("#vDocBody");
    if (V.docente.tab === "unita") renderDocUnita(body);
    else if (V.docente.tab === "ordine") renderDocOrdine(body);
    else if (V.docente.tab === "parole") renderDocParole(body);
    else if (V.docente.tab === "frasi") renderDocFrasi(body);
    else renderDocRisultati(body);
  }

  function addProfile() {
    const nome = window.prompt ? window.prompt("Nome del nuovo profilo", "Bambino") : "Bambino";
    if (!nome || !nome.trim()) return;
    const id = "p" + Date.now().toString(36);
    const avatar = ["🐻", "🐰", "🦊", "🐼", "🦁", "🐸"][store.profili.length % 6];
    persistActiveConfig();
    const baseConfig = JSON.parse(JSON.stringify(store.config));
    store.profili.push({ id, nome: nome.trim().slice(0, 24), avatar, config: baseConfig });
    store.progressi[id] = {};
    store.attivo = id;
    saveStore();
    renderProfileSelect();
    renderDocente($("#viaggioView"));
    renderHomeCard();
  }

  function renameProfile() {
    const p = activeProfile();
    const nome = window.prompt ? window.prompt("Nuovo nome del profilo", p.nome) : p.nome;
    if (!nome || !nome.trim()) return;
    p.nome = nome.trim().slice(0, 24);
    saveStore();
    renderProfileSelect();
    renderDocente($("#viaggioView"));
    renderHomeCard();
  }

  function renderDocUnita(body) {
    const active = store.config.unitaAttive || [];
    const isAll = !active.length;
    const none = active.includes("__none__");
    body.innerHTML = `<div class="v-panel">
      <h3>1. Scegli le unità del percorso</h3>
      <p class="muted" style="font-size:.76rem">Senza selezioni si usa tutto il curricolo. Le unità non selezionate non compaiono nella mappa del bambino. Il filtro non cancella i progressi.</p>
      <div class="v-actions">
        <button class="btn ghost small" id="vDocAll">Tutte</button>
        <button class="btn ghost small" id="vDocNone">Nessuna</button>
        <select id="vDocLevel" aria-label="Livello da selezionare">${D.LIVELLI.map(l => `<option value="${l.id}">Livello ${l.id} · ${l.nome}</option>`).join("")}</select>
        <button class="btn ghost small" id="vDocOnlyLevel">Solo questo livello</button>
      </div>
      <div class="v-check-grid" id="vDocUnits"></div>
    </div>`;
    const grid = $("#vDocUnits");
    D.LIVELLI.forEach(level => {
      const fams = D.FAMIGLIE.filter(f => f.livello === level.id);
      fams.forEach(fam => {
        fam.unita.forEach(raw => {
          const u = D.unita(typeof raw === "string" ? raw : (raw.id || raw.testo));
          if (!u) return;
          const checked = isAll || (!none && active.includes(u.id));
          const lab = document.createElement("label");
          lab.className = "v-check";
          lab.innerHTML = `<input type="checkbox" data-unit="${u.id}" ${checked ? "checked" : ""}><span>${u.tipo === "modulo" ? u.testo : u.testo}</span>`;
          grid.appendChild(lab);
        });
      });
    });
    const sync = () => {
      const checked = Array.from(grid.querySelectorAll("input[type=checkbox]")).filter(i => i.checked).map(i => i.dataset.unit);
      store.config.unitaAttive = checked.length === grid.querySelectorAll("input[type=checkbox]").length ? [] : (checked.length ? checked : ["__none__"]);
      saveStore();
    };
    grid.querySelectorAll("input").forEach(i => i.onchange = sync);
    $("#vDocAll").onclick = () => { store.config.unitaAttive = []; saveStore(); renderViaggio(); };
    $("#vDocNone").onclick = () => { store.config.unitaAttive = ["__none__"]; saveStore(); renderViaggio(); };
    $("#vDocOnlyLevel").onclick = () => {
      const lv = Number($("#vDocLevel").value);
      store.config.unitaAttive = D.UNITA.filter(u => u.livello === lv).map(u => u.id);
      saveStore();
      renderViaggio();
    };
  }

  function renderDocOrdine(body) {
    const fams = D.FAMIGLIE.slice();
    const ord = store.config.ordineFamiglie && store.config.ordineFamiglie.length
      ? store.config.ordineFamiglie
      : fams.map(f => f.id);
    const ordered = ord.map(id => fams.find(f => f.id === id)).filter(Boolean)
      .concat(fams.filter(f => !ord.includes(f.id)));
    const models = [...new Set(Object.keys(TIPI).map(modelKey))].sort();
    body.innerHTML = `<div class="v-panel">
      <h3>2. Ordine delle famiglie</h3>
      <p class="muted" style="font-size:.76rem">Sposta le famiglie con le frecce. L'ordine viene usato nella mappa e nel ripasso.</p>
      <div class="v-order" id="vDocOrder"></div>
      <div class="v-actions"><button class="btn ghost small" id="vDocOrderReset">Ripristina l'ordine del curricolo</button></div>
    </div>
    <div class="v-panel">
      <h3>3. Difficoltà e aiuti</h3>
      <div class="field"><label for="vDocPos">Posizione da mettere in evidenza</label>
        <select id="vDocPos">
          <option value="tutte" ${store.config.posizione === "tutte" ? "selected" : ""}>Tutte</option>
          <option value="iniziale" ${store.config.posizione === "iniziale" ? "selected" : ""}>Iniziale</option>
          <option value="finale" ${store.config.posizione === "finale" ? "selected" : ""}>Finale</option>
          <option value="interna" ${store.config.posizione === "interna" ? "selected" : ""}>Interna</option>
        </select></div>
      <div class="field"><label for="vDocAlt">Numero di alternative <span class="hint">2–5; le risposte vengono sempre mescolate</span></label>
        <input id="vDocAlt" type="range" min="2" max="5" step="1" value="${store.config.alternative}"></div>
      <div class="field"><label for="vDocSoglia">Soglia di acquisizione <span class="hint">Regola di gioco, non diagnosi</span></label>
        <input id="vDocSoglia" type="range" min="0.5" max="1" step="0.05" value="${store.config.soglia}"></div>
      <div class="field"><label for="vDocLow">Bassa stimolazione <span class="hint">Meno decorazioni e animazioni</span></label>
        <span class="switch"><input id="vDocLow" type="checkbox" ${store.config.riduciStimoli ? "checked" : ""}><span></span></span></div>
      <div class="field"><label for="vDocSimple">Percorso semplificato <span class="hint">Due alternative, meno stimoli, esercizi guidati</span></label>
        <span class="switch"><input id="vDocSimple" type="checkbox" ${store.config.semplificato ? "checked" : ""}><span></span></span></div>
      <div class="field"><label for="vDocSlow">Voce più lenta</label>
        <span class="switch"><input id="vDocSlow" type="checkbox" ${store.config.audioLento ? "checked" : ""}><span></span></span></div>
      <div class="field"><label for="vDocCaps">Testi in STAMPATO MAIUSCOLO</label>
        <span class="switch"><input id="vDocCaps" type="checkbox" ${store.config.maiuscolo ? "checked" : ""}><span></span></span></div>
      <div class="field"><label for="vDocReview">Ripasso mirato consigliato</label>
        <span class="switch"><input id="vDocReview" type="checkbox" ${store.config.ripassoSuggerito ? "checked" : ""}><span></span></span></div>
    </div>
    <div class="v-panel">
      <h3>4. Tipologie di esercizio</h3>
      <p class="muted" style="font-size:.76rem">Deseleziona ciò che non vuoi proporre. Se il filtro lascia meno di 10 attività, l'app mostra l'intero set e avvisa.</p>
      <div class="v-actions"><button class="btn ghost small" id="vDocTypesAll">Tutte</button><button class="btn ghost small" id="vDocTypesNone">Nessuna</button></div>
      <div class="v-check-grid" id="vDocTypes"></div>
    </div>`;
    const order = $("#vDocOrder");
    const saveOrder = list => { store.config.ordineFamiglie = list; saveStore(); renderViaggio(); };
    ordered.forEach((f, i) => {
      const row = document.createElement("div");
      row.className = "v-order-row";
      row.innerHTML = `<span class="v-on">${f.emoji} ${f.nome} <small style="color:var(--ink-soft)">livello ${f.livello}</small></span>
        <button class="v-mini" data-up="${f.id}" aria-label="Sposta su">↑</button>
        <button class="v-mini" data-down="${f.id}" aria-label="Sposta giù">↓</button>`;
      order.appendChild(row);
    });
    order.querySelectorAll("[data-up]").forEach(b => b.onclick = () => {
      const ids = ordered.map(f => f.id); const i = ids.indexOf(b.dataset.up);
      if (i > 0) { [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; saveOrder(ids); }
    });
    order.querySelectorAll("[data-down]").forEach(b => b.onclick = () => {
      const ids = ordered.map(f => f.id); const i = ids.indexOf(b.dataset.down);
      if (i >= 0 && i < ids.length - 1) { [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]; saveOrder(ids); }
    });
    $("#vDocOrderReset").onclick = () => { store.config.ordineFamiglie = []; saveStore(); renderViaggio(); };
    const bind = (id, key, transform) => {
      const node = $("#" + id); if (!node) return;
      node.oninput = node.onchange = () => { store.config[key] = transform(node); saveStore(); applyLowStim(); };
    };
    bind("vDocPos", "posizione", n => n.value);
    bind("vDocAlt", "alternative", n => Number(n.value));
    bind("vDocSoglia", "soglia", n => Number(n.value));
    bind("vDocLow", "riduciStimoli", n => n.checked);
    bind("vDocSimple", "semplificato", n => n.checked);
    bind("vDocSlow", "audioLento", n => n.checked);
    bind("vDocCaps", "maiuscolo", n => n.checked);
    bind("vDocReview", "ripassoSuggerito", n => n.checked);
    const typeBox = $("#vDocTypes");
    const attivi = store.config.tipiAttivi || [];
    models.forEach(m => {
      const checked = !attivi.length || attivi.includes(m);
      const lab = document.createElement("label");
      lab.className = "v-check";
      lab.innerHTML = `<input type="checkbox" data-model="${m}" ${checked ? "checked" : ""}><span>${(TIPI[m] && TIPI[m].nome) || m}</span>`;
      typeBox.appendChild(lab);
    });
    const syncTypes = () => {
      const checked = Array.from(typeBox.querySelectorAll("input")).filter(i => i.checked).map(i => i.dataset.model);
      store.config.tipiAttivi = checked.length === typeBox.querySelectorAll("input").length ? [] : checked;
      saveStore();
    };
    typeBox.querySelectorAll("input").forEach(i => i.onchange = syncTypes);
    $("#vDocTypesAll").onclick = () => { store.config.tipiAttivi = []; saveStore(); renderViaggio(); };
    $("#vDocTypesNone").onclick = () => { store.config.tipiAttivi = ["__none__"]; saveStore(); renderViaggio(); };
  }

  function renderDocParole(body) {
    const custom = store.personalizzazioni.parole || [];
    body.innerHTML = `<div class="v-panel">
      <h3>5. Aggiungi una parola</h3>
      <p class="muted" style="font-size:.76rem">La sillabazione va scritta con i trattini (es. <b>MA-RE</b>). La parola deve ricomporsi esattamente. Immagine e audio restano sul dispositivo.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <input id="vWordText" placeholder="PAROLA" aria-label="Parola" style="padding:9px;border-radius:10px;border:2px solid var(--line);max-width:160px">
        <input id="vWordSyll" placeholder="MA-RE" aria-label="Sillabazione" style="padding:9px;border-radius:10px;border:2px solid var(--line);max-width:160px">
        <select id="vWordCat" aria-label="Categoria">
          ${["cibo","animali","oggetti","persone","natura","luoghi","azioni","scuola","trasporti","giochi","abbigliamento","corpo","numeri","colori","astratto","altro"].map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>
        <input id="vWordEmoji" placeholder="emoji (facoltativa)" aria-label="Emoji" style="padding:9px;border-radius:10px;border:2px solid var(--line);max-width:130px">
      </div>
      <div class="row" style="gap:12px;flex-wrap:wrap;margin-top:8px">
        <label style="font-size:.78rem">Immagine <input id="vWordImg" type="file" accept="image/*"></label>
        <label style="font-size:.78rem">Audio <input id="vWordAudio" type="file" accept="audio/*"></label>
        <button class="btn primary small" id="vWordAdd">➕ Aggiungi</button>
      </div>
      <div class="v-report" id="vWordStatus" style="margin-top:8px">Nessun file scelto: si può usare un'emoji come immagine.</div>
    </div>
    <div class="v-panel">
      <h3>6. Parole personalizzate</h3>
      <div id="vCustomWords"></div>
    </div>
    <div class="v-panel">
      <h3>7. Correggi una sillabazione</h3>
      <p class="muted" style="font-size:.76rem">Dopo la verifica linguistica, puoi correggere la divisione in sillabe. La parola viene marcata «da rivedere» e i test la usano aggiornata.</p>
      <div class="row" style="gap:8px">
        <select id="vSyllWord" aria-label="Parola da correggere" style="max-width:240px">
          ${D.PAROLE.slice().sort((a,b)=>a.testo.localeCompare(b.testo,"it")).map(w => `<option value="${w.id}">${w.testo} (${w.sillabe.join("-")})</option>`).join("")}
        </select>
        <input id="vSyllValue" aria-label="Nuova sillabazione" style="padding:9px;border-radius:10px;border:2px solid var(--line);max-width:180px">
        <button class="btn ghost small" id="vSyllSave">Salva</button>
      </div>
    </div>
    <div class="v-panel">
      <h3>8. Sostituisci immagine o audio</h3>
      <p class="muted" style="font-size:.76rem">Vale per qualsiasi parola del dizionario: il file scelto resta sul dispositivo e ha la precedenza su quello predefinito. Utile per correggere una pronuncia o una figura ambigua.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <select id="vMediaWord" aria-label="Parola da personalizzare" style="max-width:240px">
          ${D.PAROLE.slice().sort((a,b)=>a.testo.localeCompare(b.testo,"it")).map(w => `<option value="${w.id}">${w.testo}</option>`).join("")}
        </select>
        <label style="font-size:.78rem">Immagine <input id="vMediaImg" type="file" accept="image/*"></label>
        <label style="font-size:.78rem">Audio <input id="vMediaAudio" type="file" accept="audio/*"></label>
        <button class="btn ghost small" id="vMediaSave">Salva</button>
      </div>
      <div class="v-report" id="vMediaStatus" style="margin-top:8px">Nessun file scelto.</div>
    </div>`;
    let imgData = "", audioData = "";
    const status = $("#vWordStatus");
    $("#vWordImg").onchange = e => readFile(e.target.files[0], "image", d => { imgData = d; status.textContent = "Immagine pronta."; });
    $("#vWordAudio").onchange = e => readFile(e.target.files[0], "audio", d => { audioData = d; status.textContent = "Audio pronto."; });
    $("#vWordAdd").onclick = () => {
      const testo = $("#vWordText").value.trim().toUpperCase();
      const sill = $("#vWordSyll").value.trim();
      const emoji = $("#vWordEmoji").value.trim();
      const cat = $("#vWordCat").value;
      if (!testo || !sill) { vToast("Scrivi la parola e la sillabazione."); return; }
      const img = imgData ? { tipo: "custom", src: imgData, alt: testo } : emoji ? { tipo: "emoji", emoji, alt: testo } : null;
      if (!img) { vToast("Scegli un'immagine o un'emoji: ogni parola deve avere una figura."); return; }
      try {
        const w = D.registraParolaPersonalizzata({ testo, sillabe: sill, immagine: img, categoria: cat, statoRevisione: D.STATO.PERSONALIZZATA });
        custom.push({ testo, sillabe: w.sillabe, immagine: img, categoria: cat, audio: audioData || "" });
        if (audioData) V.customAudio[w.testo] = audioData;
        store.personalizzazioni.parole = custom;
        saveStore();
        vToast(`Parola ${w.testo} aggiunta.`);
        renderViaggio();
      } catch (e) { vToast(e.message); }
    };
    const list = $("#vCustomWords");
    if (!custom.length) list.innerHTML = `<div class="v-empty">Nessuna parola personalizzata.</div>`;
    else custom.forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "v-order-row";
      row.innerHTML = `<span class="v-on"><b>${c.testo}</b> · ${c.sillabe.join("-")} · ${c.categoria}</span><button class="v-mini" data-del="${i}" aria-label="Elimina">✕</button>`;
      list.appendChild(row);
    });
    list.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      const i = Number(b.dataset.del);
      const c = custom[i];
      custom.splice(i, 1);
      store.personalizzazioni.parole = custom;
      try { D.rimuoviPersonalizzazioni(); applyCustomizations(); } catch (e) { /* ignore */ }
      saveStore();
      renderViaggio();
    });
    const sel = $("#vSyllWord");
    const val = $("#vSyllValue");
    const fill = () => { const w = D.parola(sel.value); if (w) val.value = w.sillabe.join("-"); };
    sel.onchange = fill; fill();
    $("#vSyllSave").onclick = () => {
      try {
        const w = D.aggiornaSillabazione(sel.value, val.value);
        store.personalizzazioni.sillabazioni = store.personalizzazioni.sillabazioni || [];
        const i = store.personalizzazioni.sillabazioni.findIndex(x => x.id === w.id);
        const rec = { id: w.id, sillabe: w.sillabe };
        if (i >= 0) store.personalizzazioni.sillabazioni[i] = rec; else store.personalizzazioni.sillabazioni.push(rec);
        saveStore();
        vToast(`Sillabazione di ${w.testo} aggiornata.`);
        renderViaggio();
      } catch (e) { vToast(e.message); }
    };

    let mediaImg = "", mediaAudio = "";
    const mediaStatus = $("#vMediaStatus");
    $("#vMediaImg").onchange = e => readFile(e.target.files[0], "image", d => { mediaImg = d; mediaStatus.textContent = "Immagine pronta."; });
    $("#vMediaAudio").onchange = e => readFile(e.target.files[0], "audio", d => { mediaAudio = d; mediaStatus.textContent = "Audio pronto."; });
    $("#vMediaSave").onclick = () => {
      const w = D.parola($("#vMediaWord").value);
      if (!w) return;
      if (!mediaImg && !mediaAudio) { vToast("Scegli almeno un file."); return; }
      const idx = custom.findIndex(x => x.testo === w.testo);
      const base = idx >= 0 ? custom[idx] : { testo: w.testo, sillabe: w.sillabe, immagine: w.immagine, categoria: w.categoria, audio: "" };
      const rec = Object.assign({}, base);
      if (mediaImg) rec.immagine = { tipo: "custom", src: mediaImg, alt: w.testo };
      if (mediaAudio) { rec.audio = mediaAudio; V.customAudio[w.testo] = mediaAudio; }
      if (idx >= 0) custom[idx] = rec; else custom.push(rec);
      store.personalizzazioni.parole = custom;
      if (mediaAudio) {
        store.personalizzazioni.media = store.personalizzazioni.media || {};
        store.personalizzazioni.media.audio = store.personalizzazioni.media.audio || {};
        store.personalizzazioni.media.audio[w.testo] = mediaAudio;
      }
      try {
        D.registraParolaPersonalizzata({ testo: w.testo, sillabe: w.sillabe, immagine: rec.immagine, categoria: w.categoria, statoRevisione: D.STATO.PERSONALIZZATA });
        saveStore();
        vToast(`Materiale di ${w.testo} aggiornato.`);
        renderViaggio();
      } catch (e) { vToast(e.message); }
    };
  }

  function readFile(file, kind, cb) {
    if (!file) return;
    const limit = kind === "image" ? 320 * 1024 : 900 * 1024;
    if (file.size > limit) { vToast(`File troppo grande (max ${Math.round(limit / 1024)} KB).`); return; }
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
  }

  function renderDocFrasi(body) {
    const custom = store.personalizzazioni.frasi || [];
    const targets = D.UNITA.filter(u => u.tipo === "sillaba");
    body.innerHTML = `<div class="v-panel">
      <h3>8. Crea una frase con parole già presenti</h3>
      <p class="muted" style="font-size:.76rem">Scrivi la frase in MAIUSCOLO. Le parole di contenuto devono esistere nel dizionario; sono ammesse le parole grammaticali. La sillaba bersaglio deve comparire almeno una volta nella sillabazione reale.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <select id="vFraseTarget" aria-label="Sillaba bersaglio" style="max-width:160px">
          ${targets.map(u => `<option value="${u.testo}">${u.testo}</option>`).join("")}
        </select>
        <input id="vFraseText" placeholder="MARA AMA LA MAMMA" aria-label="Frase" style="padding:9px;border-radius:10px;border:2px solid var(--line);flex:1;min-width:240px">
        <input id="vFraseEmoji" placeholder="emoji (facoltativa)" aria-label="Emoji della frase" style="padding:9px;border-radius:10px;border:2px solid var(--line);max-width:130px">
        <button class="btn primary small" id="vFraseAdd">➕ Crea</button>
      </div>
      <label class="v-check" style="margin-top:8px;max-width:520px"><input id="vFraseOk" type="checkbox"><span>Confermo che la frase è grammaticalmente corretta e adatta alla classe.</span></label>
    </div>
    <div class="v-panel"><h3>9. Frasi personalizzate</h3><div id="vCustomFrasi"></div></div>`;
    const list = $("#vCustomFrasi");
    if (!custom.length) list.innerHTML = `<div class="v-empty">Nessuna frase personalizzata.</div>`;
    else custom.forEach((f, i) => {
      const row = document.createElement("div");
      row.className = "v-order-row";
      row.innerHTML = `<span class="v-on"><b>${f.testo}</b> · ${f.target} · ${f.parole.length} parole</span><button class="v-mini" data-delf="${i}" aria-label="Elimina">✕</button>`;
      list.appendChild(row);
    });
    list.querySelectorAll("[data-delf]").forEach(b => b.onclick = () => {
      custom.splice(Number(b.dataset.delf), 1);
      store.personalizzazioni.frasi = custom;
      D.rimuoviPersonalizzazioni();
      applyCustomizations();
      saveStore();
      renderViaggio();
    });
    $("#vFraseAdd").onclick = () => {
      if (!$("#vFraseOk").checked) { vToast("Conferma prima la correttezza linguistica della frase."); return; }
      const target = $("#vFraseTarget").value;
      const text = $("#vFraseText").value.trim().toUpperCase();
      if (!text) { vToast("Scrivi la frase."); return; }
      const words = text.replace(/\s+/g, " ").split(" ");
      const parole = [];
      for (const raw of words) {
        const clean = raw.replace(/[.,!?;:]+$/g, "");
        if (!clean) continue;
        const w = D.parola(clean);
        if (w) { parole.push({ testo: w.testo, sillabe: w.sillabe }); continue; }
        const f = FUNZIONI[clean];
        if (f) { parole.push({ testo: clean, sillabe: f }); continue; }
        // Una parola può non essere nel dizionario illustrato ma comparire
        // già in una frase convalidata: in quel caso si usa la sua sillabazione.
        const inFrase = D.FRASI.flatMap(x => x.parole).find(x => x.testo === clean);
        if (inFrase) { parole.push({ testo: clean, sillabe: inFrase.sillabe }); continue; }
        vToast(`La parola «${clean}» non è nel dizionario. Aggiungila prima come parola illustrata.`);
        return;
      }
      try {
        const f = D.registraFrasePersonalizzata({
          target, parole,
          illustrazioni: $("#vFraseEmoji").value.trim() ? [$("#vFraseEmoji").value.trim()] : ["💬"],
          statoRevisione: D.STATO.PERSONALIZZATA
        });
        custom.push({ id: f.id, testo: f.testo, target, parole: parole.map(p => ({ testo: p.testo, sillabe: p.sillabe })), illustrazioni: f.illustrazioni });
        store.personalizzazioni.frasi = custom;
        saveStore();
        vToast(`Frase aggiunta: ${f.testo}`);
        renderViaggio();
      } catch (e) { vToast(e.message); }
    };
  }

  function renderDocRisultati(body) {
    const p = activeProfile();
    const all = store.progressi[p.id] || {};
    const rows = D.UNITA.map(u => ({ u, rec: all[u.id], m: mastery(u.id) })).filter(x => x.rec && x.rec.tentativi > 0);
    body.innerHTML = `<div class="v-panel">
      <h3>10. Risultati del profilo ${p.avatar} ${p.nome}</h3>
      <div class="v-actions" style="margin-bottom:8px">
        <button class="btn ghost small" id="vExportCsv">⬇ Esporta CSV</button>
        <button class="btn ghost small" id="vExportPdf">🖨️ Esporta PDF / stampa</button>
        <button class="btn danger small" id="vResetProfile">🗑️ Azzera tutti i progressi del profilo</button>
      </div>
      <div style="overflow:auto"><table class="v-table">
        <thead><tr><th>Unità</th><th>Livello</th><th>Tentativi</th><th>Corrette</th><th>%</th><th>Stato</th><th></th></tr></thead>
        <tbody>${rows.map(({u, rec, m}) => `<tr><td><b>${u.testo}</b></td><td>${u.livello}</td><td>${rec.tentativi}</td><td>${rec.corrette}</td><td>${m.pct}%</td><td>${m.ok ? "acquisita" : "da consolidare"}</td><td><button class="v-mini" data-reset="${u.id}" aria-label="Azzera ${u.testo}">↺</button></td></tr>`).join("")}</tbody>
      </table></div>
      ${rows.length ? "" : `<div class="v-empty">Nessun risultato per questo profilo. Gioca qualche attività e torna qui.</div>`}
    </div>
    <div class="v-panel"><h3>11. Ripasso mirato</h3>
      <p class="muted" style="font-size:.76rem">Con il ripasso attivo, la mappa propone prima le unità con più errori. La soglia di acquisizione è ${Math.round((store.config.soglia || .8) * 100)}%.</p>
      <button class="btn ghost small" id="vDocReviewNow">🔁 Apri il ripasso consigliato</button>
    </div>`;
    $("#vExportCsv").onclick = () => exportCSV(rows, p);
    $("#vExportPdf").onclick = () => exportPDF(rows, p);
    $("#vDocReviewNow").onclick = () => { V.screen = "review"; renderViaggio(); };
    $("#vResetProfile").onclick = () => {
      if (!confirm(`Azzerare tutti i progressi di ${p.nome}?`)) return;
      store.progressi[p.id] = {};
      saveStore(); renderViaggio(); renderHomeCard();
    };
    body.querySelectorAll("[data-reset]").forEach(b => b.onclick = () => {
      const id = b.dataset.reset;
      const u = D.unita(id);
      if (!confirm(`Azzerare i progressi di ${u ? u.testo : id}?`)) return;
      delete store.progressi[p.id][id];
      saveStore(); renderViaggio(); renderHomeCard();
    });
  }

  function exportCSV(rows, p) {
    const sep = ";";
    const head = ["Profilo", "Unità", "Tipo", "Livello", "Tentativi", "Corrette", "Precisione", "Aiuti", "Acquisita", "Ultimo"];
    const lines = [head.join(sep)].concat(rows.map(({u, rec, m}) => [
      p.nome, u.testo, u.tipo, u.livello, rec.tentativi, rec.corrette, m.pct + "%", rec.aiuti,
      m.ok ? "sì" : "no", rec.ultimo ? new Date(rec.ultimo).toLocaleDateString("it-IT") : ""
    ].join(sep)));
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `viaggio-sillabe-${p.nome.replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    vToast("Report CSV esportato.");
  }

  function exportPDF(rows, p) {
    const sheet = $("#printSheet");
    if (!sheet) { window.print(); return; }
    sheet.innerHTML = `<div class="ps-head"><h1>Il viaggio delle sillabe — report</h1>
      <p>Profilo: ${p.nome} · ${new Date().toLocaleDateString("it-IT")} · soglia ${Math.round((store.config.soglia || .8) * 100)}%</p></div>
      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <thead><tr><th style="text-align:left;border-bottom:2px solid #000">Unità</th><th>Livello</th><th>Tentativi</th><th>Corrette</th><th>%</th><th>Stato</th></tr></thead>
        <tbody>${rows.map(({u, rec, m}) => `<tr><td style="border-bottom:1px solid #ccc">${u.testo}</td><td style="text-align:center;border-bottom:1px solid #ccc">${u.livello}</td><td style="text-align:center;border-bottom:1px solid #ccc">${rec.tentativi}</td><td style="text-align:center;border-bottom:1px solid #ccc">${rec.corrette}</td><td style="text-align:center;border-bottom:1px solid #ccc">${m.pct}%</td><td style="text-align:center;border-bottom:1px solid #ccc">${m.ok ? "acquisita" : "da consolidare"}</td></tr>`).join("")}</tbody>
      </table>
      <div class="ps-foot">La soglia è una regola di gioco, non una diagnosi clinica. Report generato da Sillabe in Gioco.</div>`;
    setTimeout(() => window.print(), 120);
  }

  function applyCustomizations() {
    const pers = store.personalizzazioni || {};
    D.rimuoviPersonalizzazioni();
    (pers.parole || []).forEach(raw => {
      try {
        const w = D.registraParolaPersonalizzata({
          testo: raw.testo,
          sillabe: raw.sillabe,
          immagine: raw.immagine,
          categoria: raw.categoria,
          statoRevisione: D.STATO.PERSONALIZZATA
        });
        if (raw.audio) V.customAudio[w.testo] = raw.audio;
      } catch (e) { console.warn("Parola personalizzata ignorata:", raw.testo, e.message); }
    });
    (pers.sillabazioni || []).forEach(x => {
      try { D.aggiornaSillabazione(x.id, x.sillabe); }
      catch (e) { console.warn("Sillabazione ignorata:", x.id, e.message); }
    });
    (pers.frasi || []).forEach(raw => {
      try { D.registraFrasePersonalizzata(raw); }
      catch (e) { console.warn("Frase personalizzata ignorata:", raw.testo, e.message); }
    });
    (pers.media && pers.media.audio ? Object.entries(pers.media.audio) : []).forEach(([k, v]) => { V.customAudio[k] = v; });
  }


  /* ------------------------------------------------------------------
     AVVIO E SCORCIATOIE
     ------------------------------------------------------------------ */
  function initViaggio() {
    applyCustomizations();
    renderHomeCard();
    renderProfileSelect();

    const home = $("#viaggioHomeBtn");
    const close = $("#viaggioCloseBtn");
    const doc = $("#viaggioDocenteBtn");
    if (home) home.onclick = () => { stopAudio(); showScreen("home"); renderHomeCard(); };
    if (close) close.onclick = () => { stopAudio(); showScreen("home"); renderHomeCard(); };
    if (doc) doc.onclick = openDocente;

    // Il pannello docente si apre anche dal vecchio pannello impostazioni?
    // No: resta un pulsante dedicato nella schermata del viaggio.

    document.addEventListener("keydown", e => {
      if (L.screen !== "viaggio") return;
      if (e.target && e.target.matches && e.target.matches("input, select, textarea")) return;
      if (e.key === "Escape") {
        if (V.screen === "play" && V.returnTo) {
          V.frasi.unitId = V.returnTo.unitId; V.returnTo = null; V.screen = "frasi"; renderViaggio(); return;
        }
        if (V.screen === "play") { V.screen = V.game ? "giochi" : "unit"; renderViaggio(); return; }
        if (V.screen === "unit" || V.screen === "frasi" || V.screen === "giochi" || V.screen === "review" || V.screen === "docente" || V.screen === "summary") {
          V.screen = "map"; renderViaggio(); return;
        }
        stopAudio(); showScreen("home"); renderHomeCard(); return;
      }
      if (V.screen !== "play") return;
      if (e.key === "ArrowRight" && V.answered) { e.preventDefault(); nextExercise(); }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); if (V.current) { playPrompt(V.current); setTimeout(() => playExerciseAudio(V.current), 600); } }
      if (e.key.toLowerCase() === "h") { e.preventDefault(); if (V.current) giveHint(V.current); }
    });

    // La card della home si aggiorna quando si torna indietro dai pulsanti
    // storici dell'app: basta un listener sul contenitore della home.
    const homeScreen = $("#screen-home");
    if (homeScreen) {
      const obs = new MutationObserver(() => {
        if (homeScreen.classList.contains("active")) renderHomeCard();
      });
      obs.observe(homeScreen, { attributes: true, attributeFilter: ["class"] });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initViaggio);
  else initViaggio();

  /* API di servizio per i test automatici e per il pannello docente.
     Non è un punto di ingresso didattico: il bambino usa i pulsanti. */
  window.ViaggioDebug = {
    V, D, get store() { return store; },
    openViaggio, openUnit, startExercise, nextExercise, renderViaggio,
    mastery, progressOf, applyCustomizations, saveStore
  };
})();

"use strict";
/**
 * Smoke test headless: carica index.html in Electron, verifica che le schermate
 * principali si costruiscano senza errori JavaScript e simula alcune azioni.
 *
 * Uso: npx electron scripts/smoke-test.js
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");

const errors = [];
const logs = [];

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("mute-audio");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "..", "desktop", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.on("console-message", (_e, level, message, line, source) => {
    logs.push(`[${level}] ${message}`);
    // gli avvisi di sicurezza di Electron in modalità non pacchettizzata non sono errori dell'app
    const isElectronSecurityWarning = /Electron Security Warning/i.test(message);
    if (level >= 2 && !isElectronSecurityWarning) errors.push(message);
  });
  win.webContents.on("render-process-gone", (_e, d) => errors.push("render process gone: " + JSON.stringify(d)));
  win.webContents.on("did-fail-load", (_e, code, desc) => errors.push(`load fail ${code} ${desc}`));

  await win.loadFile(path.join(__dirname, "..", "index.html"));
  await new Promise(r => setTimeout(r, 700));

  const results = await win.webContents.executeJavaScript(`(async () => {
    const out = {};
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    out.levels = typeof LEVELS !== 'undefined' ? LEVELS.length : -1;
    out.uniqueSentences = new Set(LEVELS.map(l => l.sentence)).size;
    out.levelsWithZeroSyllables = LEVELS.filter(l => !l.syllables.length).length;

    // HOME
    out.homeActive = document.getElementById('screen-home').classList.contains('active');
    out.groupCards = document.querySelectorAll('#groupList .group-card').length;
    out.homeStats = document.querySelectorAll('#homeStats .stat').length;

    // apri livello 1
    startLevel(0);
    await sleep(150);
    out.levelActive = document.getElementById('screen-level').classList.contains('active');
    out.slotsL1 = document.querySelectorAll('#slotsWrap .slot').length;
    out.prefilledL1 = document.querySelectorAll('#slotsWrap .slot.prefilled').length;
    out.tilesL1 = document.querySelectorAll('#tilePool .tile').length;
    out.tvSvg = !!document.querySelector('#tvImage img');
    out.tvSvgLength = (document.querySelector('#tvImage img') || {}).src?.length || 0;

    // risolvi il livello 1 programmaticamente
    const missing = L.slots.filter(s => !s.filled);
    missing.forEach(s => {
      const node = document.querySelector('.slot[data-index="' + s.index + '"]');
      const tile = Array.from(document.querySelectorAll('.tile')).find(t => t.textContent === s.syllable);
      if (tile && node) { L.selectedTile = { tile, data: L.tiles[Number(tile.dataset.tile)] }; onSlotClick(node); }
    });
    await sleep(200);
    out.completedL1 = L.completed;
    out.filledSlots = document.querySelectorAll('.slot.filled').length;
    out.placedSlots = document.querySelectorAll('.slot.filled, .slot.prefilled').length;

    // livello coordinato 21
    startLevel(20);
    await sleep(150);
    out.connectors = document.querySelectorAll('#slotsWrap .connector').length;
    out.slotRowsL21 = document.querySelectorAll('#slotsWrap .slotrow').length;
    out.tilesL21 = document.querySelectorAll('#tilePool .tile').length;

    // livello complesso 40
    startLevel(39);
    await sleep(150);
    out.slotsL40 = document.querySelectorAll('#slotsWrap .slot').length;
    out.expectedL40 = LEVELS[39].syllables.length;
    out.rowsL40 = document.querySelectorAll('#slotsWrap .slotrow').length;

    // suggerimento
    startLevel(10);
    await sleep(120);
    document.getElementById('hintBtn').click();
    await sleep(80);
    out.hintTarget = document.querySelectorAll('.slot.target, .tile.blink').length;

    // rifai
    document.getElementById('resetBtn').click();
    await sleep(120);
    out.afterResetFilled = document.querySelectorAll('.slot.filled').length;

    // esercizi
    buildQuiz();
    await sleep(120);
    out.quizActive = document.getElementById('screen-exercises').classList.contains('active');
    out.quizOptions = document.querySelectorAll('#quizOptions .opt').length;
    const firstOpt = document.querySelector('#quizOptions .opt');
    if (firstOpt) firstOpt.click();
    await sleep(120);
    out.quizAnswered = quiz.answered;

    // trofei
    showScreen('trophies');
    await sleep(80);
    out.trophyCards = document.querySelectorAll('#trophyGrid .trophy').length;

    // impostazioni
    showScreen('home');
    openSettings();
    await sleep(100);
    out.settingsFields = document.querySelectorAll('#overlayBody .field').length;
    closeSheet();
    await sleep(60);

    // scheda di stampa
    buildPrintSheet(LEVELS[0]);
    out.printSlots = document.querySelectorAll('#printSheet .ps-slot').length;
    out.printTiles = document.querySelectorAll('#printSheet .ps-tile').length;

    // stato persistenza
    out.savedProgress = Object.keys(JSON.parse(localStorage.getItem('sillabe.progress.v2') || '{}').levels || {}).length;

    // accessibilità di base
    out.slotsFocusable = Array.from(document.querySelectorAll('#slotsWrap .slot')).every(s => s.tagName === 'BUTTON');
    out.imagesWithAlt = Array.from(document.querySelectorAll('img')).every(i => i.alt !== undefined);

    return out;
  })()`);

  let failed = 0;
  const expect = (name, cond, detail) => {
    const ok = !!cond;
    if (!ok) failed++;
    console.log(`${ok ? "✔" : "✖"} ${name}${detail !== undefined ? " = " + detail : ""}`);
  };

  console.log("— DATI —");
  expect("40 livelli", results.levels === 40, results.levels);
  expect("40 frasi uniche", results.uniqueSentences === 40, results.uniqueSentences);
  expect("nessun livello senza sillabe", results.levelsWithZeroSyllables === 0, results.levelsWithZeroSyllables);

  console.log("\n— HOME —");
  expect("home visibile", results.homeActive);
  expect("4 card percorso", results.groupCards === 4, results.groupCards);
  expect("4 statistiche", results.homeStats === 4, results.homeStats);

  console.log("\n— LIVELLO 1 (guidato) —");
  expect("schermata livello attiva", results.levelActive);
  expect("8 caselle", results.slotsL1 === 8, results.slotsL1);
  expect("4 precompilate", results.prefilledL1 === 4, results.prefilledL1);
  expect("7 tessere (4 libere + 3 distrattori)", results.tilesL1 === 7, results.tilesL1);
  expect("illustrazione SVG presente", results.tvSvg && results.tvSvgLength > 500, results.tvSvgLength);
  expect("livello completabile senza errori", results.completedL1);
  expect("tutte le caselle riempite", results.placedSlots === 8, results.placedSlots);

  console.log("\n— LIVELLO 21 (coordinate) —");
  expect("connettore centrale", results.connectors === 1, results.connectors);
  expect("due righe di caselle", results.slotRowsL21 === 2, results.slotRowsL21);
  expect("tessere 11 + 3 distrattori", results.tilesL21 === 14, results.tilesL21);

  console.log("\n— LIVELLO 40 (complessa) —");
  expect("caselle coerenti con i dati", results.slotsL40 === results.expectedL40, `${results.slotsL40}/${results.expectedL40}`);
  expect("due righe", results.rowsL40 === 2, results.rowsL40);

  console.log("\n— STRUMENTI —");
  expect("suggerimento evidenzia slot e tessera", results.hintTarget >= 1, results.hintTarget);
  expect("rifai azzera le caselle", results.afterResetFilled === 0, results.afterResetFilled);
  expect("quiz attivo", results.quizActive);
  expect("4 opzioni per domanda", results.quizOptions === 4, results.quizOptions);
  expect("risposta registrata", results.quizAnswered);
  expect("8 trofei", results.trophyCards === 8, results.trophyCards);
  expect("impostazioni con 8 campi", results.settingsFields === 8, results.settingsFields);
  expect("scheda di stampa con caselle", results.printSlots === 8, results.printSlots);
  expect("scheda di stampa con tessere", results.printTiles > 0, results.printTiles);
  expect("progressi salvati", results.savedProgress >= 1, results.savedProgress);

  console.log("\n— ACCESSIBILITÀ —");
  expect("le caselle sono <button>", results.slotsFocusable);

  if (errors.length) {
    console.log("\nErrori in console:");
    errors.forEach(e => console.log("  ✖ " + e));
  }

  const ok = failed === 0 && errors.length === 0;
  console.log(`\n${ok ? "✔ SMOKE TEST SUPERATO" : "✖ SMOKE TEST FALLITO"} (${failed} controlli falliti, ${errors.length} errori console)`);
  app.exit(ok ? 0 : 1);
}).catch(err => {
  console.error("Errore nel test:", err);
  app.exit(1);
});

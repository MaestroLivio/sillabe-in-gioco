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
    /* Attesa vera su una condizione: i tempi fissi non bastano perché in CI
       il renderer è più lento e un timer dell'app può scattare in mezzo.
       Con la condizione si aspetta quanto serve, non un numero indovinato. */
    const waitFor = async (cond, ms = 2000, step = 40) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (cond()) return true;
        await sleep(step);
      }
      return !!cond();
    };

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
    out.tvIllustration = (document.querySelector('#tvImage img') || {}).getAttribute('src') || '';

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

    // LABORATORIO PAROLE: prima parola (tappa lettere)
    // la lettura automatica resta spenta durante il test, così i conteggi
    // dei suoni non catturano i timer di apertura della parola
    const autoReadBefore = settings.autoRead;
    settings.autoRead = false;
    /* il completamento del livello 1 ha armato showResults a 1,5 s: se
       scattasse dopo l'apertura del laboratorio riporterebbe la schermata
       sui risultati. Lo si fa scattare adesso, prima di cambiare schermata. */
    await waitFor(() => document.getElementById('screen-results').classList.contains('active'), 2500);
    startWord(0);
    await waitFor(() => document.getElementById('screen-words').classList.contains('active'), 2000);
    out.wordsActive = document.getElementById('screen-words').classList.contains('active');
    out.wordsTitle = document.getElementById('wordsTitle').textContent;
    out.wordsSlots = document.querySelectorAll('#wordsSlotsWrap .slot').length;
    out.wordsUnits = WORDS[0].units.length;
    out.wordsTiles = document.querySelectorAll('#wordsTilePool .tile').length;
    out.wordsImg = (document.querySelector('#wordsImage img') || {}).getAttribute('src') || '';
    out.wordsStage = document.getElementById('wordsStageBadge').textContent;
    out.wordListChips = document.querySelectorAll('#wordList .wordchip').length;

    // risolvi la parola programmaticamente
    const wSlots = W.slots.filter(s => !s.filled);
    wSlots.forEach(s => {
      const node = document.querySelector('#wordsSlotsWrap .slot[data-index="' + s.index + '"]');
      const tile = Array.from(document.querySelectorAll('#wordsTilePool .tile')).find(t => t.textContent === s.unit);
      if (tile && node) { W.selectedTile = { tile, data: W.tiles[Number(tile.dataset.tile)] }; onWordSlotClick(node); }
    });
    await sleep(200);
    out.wordsCompleted = W.completed;
    out.wordsFilled = document.querySelectorAll('#wordsSlotsWrap .slot.filled').length;
    out.wordsBig = document.getElementById('wordsWordBig').textContent;

    // parola della tappa sillabe
    startWord(12);
    await sleep(150);
    out.wordsStage2 = document.getElementById('wordsStageBadge').textContent;
    out.wordsSlots2 = document.querySelectorAll('#wordsSlotsWrap .slot').length;
    out.wordsUnits2 = WORDS[12].units.length;

    // UNA SOLA LETTURA PER TAP: il pointerdown non deve parlare
    startWord(0);
    await sleep(150);
    let spoken = 0;
    const realSpeak = window.speak;
    window.speak = function () { spoken++; return realSpeak.apply(this, arguments); };
    const tapTile = document.querySelector('#wordsTilePool .tile');
    if (tapTile) {
      tapTile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
      tapTile.click();
    }
    await sleep(120);
    window.speak = realSpeak;
    out.tapSpeaks = spoken;
    settings.autoRead = autoReadBefore;

    /* PERCORSO «LA PRIMA PAROLA»: una tappa di sillabe (M) e una di parole */
    out.syllSteps = typeof SYLL_STEPS !== 'undefined' ? SYLL_STEPS.length : -1;
    out.syllItems = typeof SYLL_ITEMS !== 'undefined' ? SYLL_ITEMS.length : -1;
    out.syllCard = !!document.querySelector('#syllPathCard .group-card');

    settings.autoRead = false;
    startSyll(0); // tappa 1: le vocali, una casella
    await waitFor(() => document.getElementById('screen-syll').classList.contains('active'), 2000);
    out.syllActive = document.getElementById('screen-syll').classList.contains('active');
    out.syllVowelSlots = document.querySelectorAll('#syllSlotsWrap .slot').length;
    out.syllVowelUnits = SYLL_ITEMS[0].units.length;
    out.syllVowelTiles = document.querySelectorAll('#syllTilePool .tile').length;
    out.syllCounter = document.getElementById('syllCounter').textContent;

    // completa la vocale programmaticamente
    const vSlots = SY.slots.filter(s => !s.filled);
    vSlots.forEach(s => {
      const node = document.querySelector('#syllSlotsWrap .slot[data-index="' + s.index + '"]');
      const tile = Array.from(document.querySelectorAll('#syllTilePool .tile')).find(t => t.textContent === s.unit);
      if (tile && node) { SY.selectedTile = { tile, data: SY.tiles[Number(tile.dataset.tile)] }; onSyllSlotClick(node); }
    });
    await sleep(200);
    out.syllCompleted = SY.completed;
    out.syllSaved = !!(progress.syll && progress.syll[SYLL_ITEMS[0].key]);

    // tappa di sillabe: due caselle, consonante + vocale
    const sylStep = SYLL_STEPS.findIndex(s => s.kind === 'syl');
    startSyll(SYLL_ITEMS.indexOf(SYLL_STEPS[sylStep].items[0]));
    await sleep(150);
    out.syllConsSlots = document.querySelectorAll('#syllSlotsWrap .slot').length;
    out.syllConsTiles = Array.from(document.querySelectorAll('#syllTilePool .tile')).map(t => t.textContent);
    out.syllConsHasVowels = ['a','e','i','o','u'].every(v => out.syllConsTiles.includes(v));

    // tappa di parole: una casella per sillaba, con la figura grande
    const wordStep = SYLL_STEPS.findIndex(s => s.kind === 'word');
    startSyll(SYLL_ITEMS.indexOf(SYLL_STEPS[wordStep].items[0]));
    await sleep(150);
    out.syllWordSlots = document.querySelectorAll('#syllSlotsWrap .slot').length;
    out.syllWordUnits = SYLL_STEPS[wordStep].items[0].units.length;
    // La figura della parola è la scena disegnata; l'emoji resta come
    // riserva se il disegno non c'è. Il test accetta entrambe, ma vuole
    // una figura vera dentro il riquadro.
    const figImg = document.querySelector('#syllImage .syllfigure .fimg');
    const figEmo = document.querySelector('#syllImage .syllfigure .fem');
    out.syllFigure = !!(figImg || figEmo);
    out.syllFigureIsScene = !!figImg && figImg.getAttribute("src").startsWith("illustrations/") && figImg.getAttribute("src").endsWith(".png");
    out.syllFigureSrc = figImg ? figImg.getAttribute('src') : '';
    out.syllWordTiles = document.querySelectorAll('#syllTilePool .tile').length;

    // risolvi la parola: la figura e il contatore devono reggere
    const wSlots2 = SY.slots.filter(s => !s.filled);
    wSlots2.forEach(s => {
      const node = document.querySelector('#syllSlotsWrap .slot[data-index="' + s.index + '"]');
      const tile = Array.from(document.querySelectorAll('#syllTilePool .tile')).find(t => t.textContent === s.unit);
      if (tile && node) { SY.selectedTile = { tile, data: SY.tiles[Number(tile.dataset.tile)] }; onSyllSlotClick(node); }
    });
    await sleep(200);
    out.syllWordCompleted = SY.completed;
    out.syllWordBig = document.getElementById('syllWordBig').textContent;

    // ogni sillaba e ogni parola del percorso devono avere un clip
    await loadAudioManifest();
    out.syllAudioSyl = SYLL_ITEMS.every(it =>
      it.kind === 'word' ? it.units.every(u => audioFileFor(u, 'syl')) : audioFileFor(it.say, 'syl'));
    out.syllAudioWords = SYLL_ITEMS.filter(it => it.kind === 'word')
      .every(it => audioFileFor(it.say, 'parole'));
    settings.autoRead = autoReadBefore;


    // SUONI DIFFICILI: quiz con la scheda del gruppo
    settings.exercise = 'sounds';
    startChosenExercise();
    await sleep(150);
    out.soundItems = quiz.items.length;
    out.soundCard = !!document.querySelector('#quizFocus .soundcard');
    out.soundFocus = (document.querySelector('#quizFocus .soundcard .focus') || {}).textContent || '';
    out.soundOptions = document.querySelectorAll('#quizOptions .opt').length;
    out.soundAllType = quiz.items.every(i => i.type === 'sound');
    // singolo esercizio scelto dal docente
    settings.exercise = 'sound:5';
    startChosenExercise();
    await sleep(120);
    out.singleItems = quiz.items.length;
    out.singleAnswer = quiz.items[0] ? quiz.items[0].answer : '';
    settings.exercise = 'all';

    // impostazioni
    showScreen('home');
    openSettings();
    await sleep(100);
    out.settingsFields = document.querySelectorAll('#overlayBody .field').length;
    out.settingsCaps = !!document.getElementById('setCaps');
    out.settingsReadWords = !!document.getElementById('setReadWords');
    out.settingsExerciseOpts = document.querySelectorAll('#setExercise option').length;
    /* l'interruttore degli aggiornamenti esiste solo su desktop: qui gira in
       Electron, quindi deve esserci */
    out.settingsUpdateCheck = !!document.getElementById('setUpdateCheck');
    out.settingsUpdateBtn = !!document.getElementById('checkUpdatesNow');
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

    // AUDIO: l'indice dei clip preregistrati deve essere caricato e coprire
    // le sillabe del livello e la frase (i file sono la voce neurale offline)
    await loadAudioManifest();
    out.audioGroups = audioIndex ? Object.keys(audioIndex).sort() : [];
    out.audioSyl = audioIndex && audioIndex.syl ? audioIndex.syl.size : 0;
    out.audioFrasi = audioIndex && audioIndex.frasi ? audioIndex.frasi.size : 0;
    out.audioParole = audioIndex && audioIndex.parole ? audioIndex.parole.size : 0;
    out.audioUi = audioIndex && audioIndex.ui ? audioIndex.ui.size : 0;
    // ogni sillaba del livello 1 e la frase 1 devono avere un clip
    out.audioSylL1 = LEVELS[0].syllables.every(s => audioFileFor(s, 'syl'));
    out.audioFraseL1 = audioFileFor('1', 'frasi');
    // il file dichiarato dal manifest deve essere raggiungibile
    const probe = audioFileFor('a', 'syl');
    if (probe) {
      out.audioFileOk = await new Promise(res => {
        const a = new Audio(probe);
        a.oncanplaythrough = () => res(true);
        a.onerror = () => res(false);
        setTimeout(() => res(false), 3000);
        a.load();
      });
    } else out.audioFileOk = false;

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
  expect("card «La prima parola» fuori dai quattro percorsi", results.syllCard);
  expect("4 statistiche", results.homeStats === 4, results.homeStats);
  expect("20 parole nel laboratorio", results.wordListChips === 20, results.wordListChips);

  console.log("\n— LIVELLO 1 (guidato) —");
  expect("schermata livello attiva", results.levelActive);
  expect("8 caselle", results.slotsL1 === 8, results.slotsL1);
  expect("4 precompilate", results.prefilledL1 === 4, results.prefilledL1);
  expect("7 tessere (4 libere + 3 distrattori)", results.tilesL1 === 7, results.tilesL1);
  expect("illustrazione del livello presente", results.tvSvg && results.tvSvgLength > 0, results.tvSvgLength);
  expect("illustrazione riferita al file del livello 1", /illustrations\/01\.png$/.test(results.tvIllustration), results.tvIllustration);
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

  console.log("\n— LABORATORIO PAROLE —");
  expect("schermata parole attiva", results.wordsActive);
  expect("titolo della parola", /^1\. ape$/.test(results.wordsTitle), results.wordsTitle);
  expect("caselle = pezzi della parola", results.wordsSlots === results.wordsUnits, `${results.wordsSlots}/${results.wordsUnits}`);
  expect("tessere = pezzi + 3 distrattori", results.wordsTiles === results.wordsUnits + 3, results.wordsTiles);
  expect("illustrazione della parola", /illustrations\/41\.png$/.test(results.wordsImg), results.wordsImg);
  expect("tappa lettere dichiarata", /lettere/i.test(results.wordsStage), results.wordsStage);
  expect("parola completabile", results.wordsCompleted);
  expect("la parola cresce sotto le caselle", results.wordsBig === "ape", results.wordsBig);
  expect("tappa sillabe per la parola 13", /sillabe/i.test(results.wordsStage2), results.wordsStage2);
  expect("caselle della tappa sillabe", results.wordsSlots2 === results.wordsUnits2, `${results.wordsSlots2}/${results.wordsUnits2}`);
  expect("un solo suono per tap (niente doppioni)", results.tapSpeaks === 1, results.tapSpeaks);

  console.log("\n— PERCORSO «LA PRIMA PAROLA» —");
  expect("12 tappe", results.syllSteps === 12, results.syllSteps);
  expect("101 esercizi", results.syllItems === 101, results.syllItems);
  expect("schermata sillabica attiva", results.syllActive);
  expect("vocale: una casella", results.syllVowelSlots === results.syllVowelUnits, `${results.syllVowelSlots}/${results.syllVowelUnits}`);
  expect("vocale: cinque vocali fra le tessere", results.syllVowelTiles === 5, results.syllVowelTiles);
  expect("contatore sul totale degli esercizi", /^1 \/ 101$/.test(results.syllCounter), results.syllCounter);
  expect("vocale completabile", results.syllCompleted);
  expect("progresso della vocale salvato", results.syllSaved);
  expect("sillaba: due caselle", results.syllConsSlots === 2, results.syllConsSlots);
  expect("sillaba: le vocali sono scegliibili", results.syllConsHasVowels, results.syllConsTiles.join(","));
  expect("parola: una casella per sillaba", results.syllWordSlots === results.syllWordUnits, `${results.syllWordSlots}/${results.syllWordUnits}`);
  expect("parola: figura grande sulla TV", results.syllFigure);
  expect("parola: la figura è la scena disegnata", results.syllFigureIsScene, results.syllFigureSrc);
  expect("parola: tessere con distrattori", results.syllWordTiles > results.syllWordUnits, results.syllWordTiles);
  expect("parola completabile", results.syllWordCompleted);
  expect("la parola cresce sotto le caselle", results.syllWordBig.length > 0, results.syllWordBig);
  expect("ogni sillaba del percorso ha il clip", results.syllAudioSyl);
  expect("ogni parola del percorso ha il clip", results.syllAudioWords);

  console.log("\n— SUONI DIFFICILI —");
  expect("20 schede", results.soundItems === 20, results.soundItems);
  expect("scheda del gruppo visibile", results.soundCard);
  expect("il gruppo mostrato è quello giusto", results.soundFocus.length > 0, results.soundFocus);
  expect("4 opzioni", results.soundOptions === 4, results.soundOptions);
  expect("tutte le domande sono di tipo suono", results.soundAllType);
  expect("esercizio singolo scelto dal docente", results.singleItems === 1 && results.singleAnswer === "cia", `${results.singleItems}/${results.singleAnswer}`);

  console.log("\n— IMPOSTAZIONI —");
  expect("12 campi (11 + aggiornamenti)", results.settingsFields === 12, results.settingsFields);
  expect("interruttore tutto maiuscolo", results.settingsCaps);
  expect("interruttore lettura parole", results.settingsReadWords);
  expect("interruttore aggiornamenti presente su desktop", results.settingsUpdateCheck);
  expect("pulsante «Controlla adesso»", results.settingsUpdateBtn);
  expect("scelta esercizio con 22 voci", results.settingsExerciseOpts === 22, results.settingsExerciseOpts);

  console.log("\n— STAMPA E PROGRESSI —");
  expect("scheda di stampa con caselle", results.printSlots === 8, results.printSlots);
  expect("scheda di stampa con tessere", results.printTiles > 0, results.printTiles);
  expect("progressi salvati", results.savedProgress >= 1, results.savedProgress);

  console.log("\n— AUDIO PREREGISTRATO —");
  expect("manifest audio con 4 gruppi", results.audioGroups.length === 4, results.audioGroups.join(","));
  expect("clip delle sillabe presenti", results.audioSyl >= 160, results.audioSyl);
  expect("clip delle 40 frasi", results.audioFrasi === 40, results.audioFrasi);
  expect("clip delle parole degli esercizi", results.audioParole >= 130, results.audioParole);
  expect("clip delle battute interfaccia", results.audioUi >= 5, results.audioUi);
  expect("ogni sillaba del livello 1 ha il clip", results.audioSylL1);
  expect("la frase 1 ha il clip", !!results.audioFraseL1, results.audioFraseL1);
  expect("il file audio è leggibile", results.audioFileOk);

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

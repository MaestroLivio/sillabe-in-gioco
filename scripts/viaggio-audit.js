"use strict";
/**
 * Audit d'interfaccia del «Viaggio delle sillabe» in Electron.
 *
 * Non sostituisce `validate-viaggio.js` (che controlla tutti i contenuti):
 * qui si verifica che le schermate si costruiscano, che le immagini carichino,
 * che le interazioni principali funzionino e che il pannello docente apra le
 * sue sezioni. Usa una cartella dati temporanea per non sporcare i progressi.
 *
 * Uso: npx electron scripts/viaggio-audit.js
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const USER_DATA = path.join(os.tmpdir(), "sillabe-viaggio-audit");
fs.rmSync(USER_DATA, { recursive: true, force: true });
app.setPath("userData", USER_DATA);
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("mute-audio");

const errors = [];
const logs = [];

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400, height: 1100, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.webContents.on("console-message", (_e, level, message) => {
    logs.push(`[${level}] ${message}`);
    if (level >= 2 && !/Electron Security Warning/i.test(message)) errors.push(message);
  });
  win.webContents.on("render-process-gone", (_e, d) => errors.push("render process gone: " + JSON.stringify(d)));
  win.webContents.on("did-fail-load", (_e, code, desc) => errors.push(`load fail ${code} ${desc}`));

  await win.loadFile(path.join(ROOT, "index.html"));
  await new Promise(r => setTimeout(r, 900));

  const report = await win.webContents.executeJavaScript(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const D = window.ViaggioDati, DBG = window.ViaggioDebug;
    const out = { checks: [], failures: [], samples: [] };
    const check = (name, ok, detail) => {
      out.checks.push({ name, ok: !!ok, detail: detail || "" });
      if (!ok) out.failures.push(name + (detail ? ": " + detail : ""));
    };

    check("modulo dati caricato", !!D);
    check("API di servizio", !!DBG);
    check("card nella home", !!document.querySelector("#viaggioHomeCard #vHomeEntra"));
    document.querySelector("#vHomeEntra").click();
    await sleep(250);
    check("schermata viaggio attiva", $("#screen-viaggio").classList.contains("active"));
    check("8 livelli", $$(".v-level").length === 8, String($$(".v-level").length));
    check("famiglie visibili", $$(".v-family").length >= 30, String($$(".v-family").length));
    check("unità visibili", $$(".v-chip").length === D.UNITA.length, String($$(".v-chip").length));

    // Campione di unità: tutte le schede, tutte le immagini.
    const campione = ["MA", "PA", "CE", "CHI", "GNA", "SCIA", "AM", "MOD_CVC", "MOD_DOPPIE", "MOD_ACCENTO", "MOD_TRAPPOLE", "MOD_ACQUA"];
    for (const id of campione) {
      const list = D.generaEsercizi(id);
      let empty = 0, imgMissing = 0, imgSeen = 0;
      for (let i = 0; i < list.length; i++) {
        DBG.openUnit(id); DBG.startExercise(i); await sleep(25);
        if (!$("#vStimulus") || !$("#vAnswerWrap")) { empty++; continue; }
        for (const img of $$("#vStimulus img, #vAnswerWrap img")) {
          imgSeen++;
          if (!(img.complete && img.naturalWidth > 0)) {
            await new Promise(res => {
              const t = setTimeout(res, 700);
              img.onload = () => { clearTimeout(t); res(); };
              img.onerror = () => { clearTimeout(t); res(); };
            });
          }
          if (!(img.naturalWidth > 0)) imgMissing++;
        }
      }
      out.samples.push({ id, esercizi: list.length, vuoti: empty, immagini: imgSeen, mancanti: imgMissing });
      check("unità " + id + " senza schermate vuote", empty === 0, String(empty));
      check("unità " + id + " immagini caricate", imgMissing === 0, String(imgMissing));
    }

    // Risposta corretta.
    DBG.openUnit("MA"); DBG.startExercise(0); await sleep(60);
    const ex0 = DBG.V.current;
    const corr = $$("#vAnswerWrap .v-option").find(b => {
      const o = ex0.opzioni.find(x => x.id === b.dataset.opt);
      return o && o.corretta;
    });
    if (corr) corr.click();
    await sleep(100);
    check("feedback corretto", $("#vFeedback").classList.contains("ok"), $("#vFeedback").textContent.slice(0, 60));
    check("progresso scritto", DBG.progressOf("MA").tentativi >= 1, String(DBG.progressOf("MA").tentativi));

    // Treno.
    DBG.openUnit("MA");
    const ti = DBG.V.exercises.findIndex(e => e.modello === "treno");
    if (ti >= 0) {
      DBG.startExercise(ti); await sleep(80);
      for (const s of DBG.V.current.soluzione) {
        const t = $$("#vTiles .v-tile").find(b => b.textContent === s);
        if (t) { t.click(); await sleep(20); }
      }
      check("treno completo", $("#vFeedback").classList.contains("ok"), $("#vFeedback").textContent.slice(0, 50));
    }

    // Memory.
    DBG.openUnit("MA");
    const mi = DBG.V.exercises.findIndex(e => e.interazione === "memory");
    if (mi >= 0) {
      DBG.startExercise(mi); await sleep(100);
      const cards = DBG.V.memory.cards;
      for (const pair of [...new Set(cards.map(c => c.pairId))]) {
        const a = cards.find(c => c.pairId === pair && c.kind === "img");
        const b = cards.find(c => c.pairId === pair && c.kind === "syl");
        const an = document.querySelector('.v-mcard[data-card="' + a.id + '"]');
        const bn = document.querySelector('.v-mcard[data-card="' + b.id + '"]');
        if (an) an.click(); await sleep(15);
        if (bn) bn.click(); await sleep(55);
      }
      check("memory completo", $("#vFeedback").classList.contains("ok"), $("#vFeedback").textContent.slice(0, 50));
    }

    // Evidenzia le sillabe.
    DBG.openUnit("MA");
    const ei = DBG.V.exercises.findIndex(e => e.interazione === "evidenzia");
    if (ei >= 0) {
      DBG.startExercise(ei); await sleep(80);
      for (const o of DBG.V.current.soluzione) {
        const b = document.querySelector('.v-syl[data-p="' + o.parola + '"][data-s="' + o.sillaba + '"]');
        if (b) b.click();
      }
      const btn = $("#vCheckEvidence"); if (btn) btn.click();
      await sleep(80);
      check("occorrenze nella frase", $("#vFeedback").classList.contains("ok"), $("#vFeedback").textContent.slice(0, 60));
    }

    // Frase: modalità 1 e 2.
    DBG.openViaggio("map"); DBG.V.frasi.unitId = "MA"; DBG.V.screen = "frasi"; DBG.renderViaggio(); await sleep(80);
    check("quattro modalità frase", $$(".v-tab").length === 4, String($$(".v-tab").length));
    check("frase animata presente", !!$("#vPhraseSentence"));
    const tab2 = $$(".v-tab").find(b => b.dataset.mode === "2");
    if (tab2) { tab2.click(); await sleep(80); }
    check("modalità completa", !!$("#vPhrasePlay2"));

    // Pannello docente.
    window.prompt = () => "1234";
    DBG.openViaggio("map"); document.querySelector("#viaggioDocenteBtn").click(); await sleep(120);
    check("pannello docente", !!$("#vDocBody"));
    check("schede docente", $$("[data-dtab]").length === 5, String($$("[data-dtab]").length));
    const tabParole = $$("[data-dtab]").find(b => b.dataset.dtab === "parole");
    if (tabParole) { tabParole.click(); await sleep(80); }
    check("form parole", !!$("#vWordText"));
    if ($("#vWordText")) {
      $("#vWordText").value = "PROVA";
      $("#vWordSyll").value = "PRO-VA";
      $("#vWordEmoji").value = "🧪";
      $("#vWordAdd").click(); await sleep(120);
      check("parola personalizzata", !!DBG.D.parola("PROVA"));
    }
    const tabFrasi = $$("[data-dtab]").find(b => b.dataset.dtab === "frasi");
    if (tabFrasi) { tabFrasi.click(); await sleep(80); }
    check("form frasi", !!$("#vFraseText"));
    if ($("#vFraseText")) {
      $("#vFraseTarget").value = "MA";
      $("#vFraseText").value = "MARA AMA LA MAMMA";
      $("#vFraseOk").checked = true;
      $("#vFraseAdd").click(); await sleep(120);
      check("frase personalizzata", DBG.D.FRASI.some(f => f.testo === "MARA AMA LA MAMMA"));
    }
    return out;
  })()`);

  console.log("AUDIT «IL VIAGGIO DELLE SILLABE»");
  report.checks.forEach(c => console.log(`${c.ok ? "✔" : "✖"} ${c.name}${c.detail ? " — " + c.detail : ""}`));
  console.log("\nCampione unità:");
  report.samples.forEach(s => console.log(`  ${s.mancanti === 0 && s.vuoti === 0 ? "·" : "✖"} ${s.id}: ${s.esercizi} esercizi, ${s.immagini} immagini, ${s.mancanti} mancanti, ${s.vuoti} vuoti`));
  if (report.failures.length) {
    console.error("\nFallimenti:");
    report.failures.forEach(f => console.error("  ✖ " + f));
  }
  if (errors.length) {
    console.error("\nErrori console:");
    errors.slice(0, 20).forEach(e => console.error("  ✖ " + e));
  }
  const ok = report.failures.length === 0 && errors.length === 0;
  console.log(ok ? "\n✔ Audit superato" : "\n✖ Audit fallito");
  app.exit(ok ? 0 : 1);
}).catch(e => { console.error(e); app.exit(1); });

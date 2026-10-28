#!/usr/bin/env node
"use strict";
/**
 * Validazione del «Viaggio delle sillabe».
 *
 * Controlla i contenuti e il generatore, non l'interfaccia:
 *  - sillabazione esplicita e ricomposizione di ogni parola;
 *  - immagini presenti e dichiarate;
 *  - frasi con occorrenze calcolate sulle sillabe vere;
 *  - almeno 10 esercizi validi per ogni unità;
 *  - varietà didattica minima (3 interazioni, 2 attività uditive,
 *    2 associazioni con immagini, 1 costruzione, 1 frase per le sillabe);
 *  - trappole linguistiche note (MA in MAMMA, MU in MUCCA, ...);
 *  - copertura audio dei nuovi gruppi.
 *
 * Uso: node scripts/validate-viaggio.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const D = require(path.join(ROOT, "js", "viaggio-dati.js"));

const errors = [];
const warnings = [];
const fail = m => errors.push(m);
const warn = m => warnings.push(m);

/* --- 1. unità --- */
const unitIds = new Set();
const unitTexts = new Set();
D.UNITA.forEach(u => {
  if (unitIds.has(u.id)) fail(`Unità duplicata: ${u.id}`);
  unitIds.add(u.id);
  if (unitTexts.has(u.testo + "|" + u.tipo)) fail(`Unità duplicata: ${u.testo} (${u.tipo})`);
  unitTexts.add(u.testo + "|" + u.tipo);
  if (!u.testo || !u.famiglia || u.livello == null) fail(`Unità incompleta: ${u.id}`);
  if (!["sillaba", "segmento", "grafema", "modulo"].includes(u.tipo)) fail(`Tipo sconosciuto in ${u.id}: ${u.tipo}`);
  if (u.tipo !== "modulo" && !u.audioKey) fail(`Unità ${u.id} senza chiave audio`);
});

const perTipo = { sillaba: 0, segmento: 0, grafema: 0, modulo: 0 };
D.UNITA.forEach(u => { perTipo[u.tipo]++; });

/* --- 2. parole --- */
const wordIds = new Set();
const wordTexts = new Set();
D.PAROLE.forEach(w => {
  if (wordIds.has(w.id)) fail(`Parola duplicata: ${w.id}`);
  wordIds.add(w.id);
  if (wordTexts.has(w.testo)) fail(`Testo duplicato: ${w.testo}`);
  wordTexts.add(w.testo);
  if (!w.sillabe.length) fail(`${w.testo}: nessuna sillaba`);
  if (w.sillabe.join("") !== w.testo) fail(`${w.testo}: sillabazione ${w.sillabe.join("-")} non ricompone la parola`);
  if (w.sillabaIniziale !== w.sillabe[0]) fail(`${w.testo}: sillaba iniziale incoerente`);
  if (w.sillabaFinale !== w.sillabe[w.sillabe.length - 1]) fail(`${w.testo}: sillaba finale incoerente`);
  if (!w.immagine) fail(`${w.testo}: immagine mancante`);
  else if (w.immagine.src && !w.immagine.src.startsWith("data:") && !fs.existsSync(path.join(ROOT, w.immagine.src))) {
    fail(`${w.testo}: file immagine mancante ${w.immagine.src}`);
  }
  if (!w.alt) fail(`${w.testo}: descrizione accessibile mancante`);
  if (!w.categoria) fail(`${w.testo}: categoria mancante`);
});

/* --- 3. frasi --- */
const fraseIds = new Set();
D.FRASI.forEach(f => {
  if (fraseIds.has(f.id)) fail(`Frase duplicata: ${f.id}`);
  fraseIds.add(f.id);
  f.parole.forEach(p => {
    if (p.sillabe.join("") !== p.testo) fail(`${f.id}: «${p.testo}» non si ricompone (${p.sillabe.join("-")})`);
  });
  const ricalcolate = [];
  if (f.tipoBersaglio === "parola") {
    f.parole.forEach((p, pi) => {
      if (p.testo === f.sillabaBersaglio) ricalcolate.push(pi + ":0");
    });
  } else {
    f.parole.forEach((p, pi) => {
      p.sillabe.forEach((s, si) => {
        if (s === f.sillabaBersaglio) ricalcolate.push(pi + ":" + si);
      });
    });
  }
  const dichiarate = f.occorrenze.map(o => o.parola + ":" + o.sillaba);
  if (ricalcolate.join(",") !== dichiarate.join(",")) {
    fail(`${f.id}: occorrenze dichiarate ${dichiarate.join(",")} ≠ ricalcolate ${ricalcolate.join(",")}`);
  }
  if (!f.occorrenze.length) fail(`${f.id}: nessuna occorrenza di ${f.sillabaBersaglio}`);
  f.soluzioniValide.forEach(sol => {
    if (!Array.isArray(sol) || !sol.length) fail(`${f.id}: soluzione valida vuota`);
  });
});

/* --- 4. tutte le sillabe hanno almeno una frase --- */
const sillabeSenzaFrase = D.UNITA.filter(u => u.tipo === "sillaba" && !D.frasiPerUnita(u.testo).length);
if (sillabeSenzaFrase.length) fail(`Sillabe senza frasi (${sillabeSenzaFrase.length}): ${sillabeSenzaFrase.map(u => u.testo).join(", ")}`);

/* --- 5. generatore: quantità, validità, varietà --- */
let totaleEsercizi = 0;
let minEsercizi = Infinity;
let maxEsercizi = 0;
const perLivello = {};
D.UNITA.forEach(u => {
  const list = D.generaEsercizi(u.id);
  totaleEsercizi += list.length;
  minEsercizi = Math.min(minEsercizi, list.length);
  maxEsercizi = Math.max(maxEsercizi, list.length);
  perLivello[u.livello] = perLivello[u.livello] || { min: Infinity, max: 0, unita: 0 };
  perLivello[u.livello].min = Math.min(perLivello[u.livello].min, list.length);
  perLivello[u.livello].max = Math.max(perLivello[u.livello].max, list.length);
  perLivello[u.livello].unita++;

  if (list.length < 10) fail(`${u.testo} (${u.tipo}): ${list.length} esercizi, minimo 10`);
  const visti = new Set();
  list.forEach(ex => {
    const optKey = (ex.opzioni || []).map(o => o.parolaId || o.testo).join(",");
    const id = ex.modello + "|" + (ex.stimolo && (ex.stimolo.parolaId || ex.stimolo.testo || ex.stimolo.fraseId)) + "|" + optKey;
    if (visti.has(id)) warn(`${u.testo}: due esercizi con lo stesso stimolo (${id})`);
    visti.add(id);
    const e = D.validaEsercizio(ex);
    if (e.length) fail(`${u.testo} / ${ex.modello}: ${e.join("; ")}`);
    if (ex.interazione === "scelta") {
      const corrette = ex.opzioni.filter(o => o.corretta);
      if (corrette.length !== 1) fail(`${u.testo} / ${ex.modello}: ${corrette.length} risposte corrette`);
      const sol = ex.soluzione;
      const match = corrette.some(o => o.testo === sol || o.id === sol || o.parolaId === sol);
      if (!match) fail(`${u.testo} / ${ex.modello}: soluzione «${sol}» non corrisponde all'opzione corretta`);
    }
    (ex.opzioni || []).forEach(o => {
      if (o.tipo === "parola" && o.parolaId && !D.parola(o.parolaId)) fail(`${u.testo}: opzione con parola inesistente ${o.parolaId}`);
    });
    if (ex.stimolo && ex.stimolo.parolaId && !D.parola(ex.stimolo.parolaId)) fail(`${u.testo}: stimolo con parola inesistente ${ex.stimolo.parolaId}`);
    if (ex.stimolo && ex.stimolo.fraseId && !D.frase(ex.stimolo.fraseId)) fail(`${u.testo}: stimolo con frase inesistente ${ex.stimolo.fraseId}`);
  });
  const st = D.statisticheUnita(u.id);
  if (st.interazioni.length < 3) fail(`${u.testo}: solo ${st.interazioni.length} forme di interazione (${st.interazioni.join(", ")})`);
  if (st.uditivo < 2) fail(`${u.testo}: solo ${st.uditivo} attività uditive`);
  if (st.immagini < 2) fail(`${u.testo}: solo ${st.immagini} attività con immagini`);
  if (st.costruzione < 1) fail(`${u.testo}: nessuna attività di costruzione`);
  if (u.tipo === "sillaba" && st.frasi < 1) fail(`${u.testo}: nessuna attività di frase`);
  if (st.difficolta.length < 3) warn(`${u.testo}: ${st.difficolta.length} gradi di difficoltà (${st.difficolta.join(", ")})`);
});

/* --- 6. trappole linguistiche --- */
function checkWord(testo, iniziale, finale, nota) {
  const w = D.parola(testo);
  if (!w) { fail(`Trappola: parola ${testo} assente`); return; }
  if (iniziale && w.sillabaIniziale !== iniziale) fail(`${testo}: sillaba iniziale ${w.sillabaIniziale}, attesa ${iniziale} (${nota})`);
  if (finale && w.sillabaFinale !== finale) fail(`${testo}: sillaba finale ${w.sillabaFinale}, attesa ${finale} (${nota})`);
}
checkWord("MAMMA", "MAM", "MA", "MA in MAMMA è finale");
checkWord("MUCCA", "MUC", null, "MU non è la prima sillaba");
checkWord("GATTO", "GAT", null, "GA non è la prima sillaba");
checkWord("CHIAVE", "CHIA", null, "CHI non è la prima sillaba");
checkWord("ZAINO", "ZAI", null, "ZA non è la prima sillaba");
checkWord("GOMMA", "GOM", "MA", "GO non è la prima sillaba");
checkWord("PALLA", "PAL", null, "PA non è la prima sillaba");
checkWord("CAMPANA", "CAM", null, "CA non è la prima sillaba");

/* --- 7. frasi campione --- */
const ma = D.frase("ma-1");
if (!ma || ma.occorrenze.length !== 3) fail(`ma-1: attese 3 occorrenze, trovate ${ma ? ma.occorrenze.length : "frase assente"}`);
const la = D.frase("la-1");
if (!la || la.occorrenze.length !== 4) fail(`la-1: attese 4 occorrenze, trovate ${la ? la.occorrenze.length : "frase assente"}`);
const mi = D.frase("mi-1");
if (!mi || mi.occorrenze.length !== 3) fail(`mi-1: attese 3 occorrenze, trovate ${mi ? mi.occorrenze.length : "frase assente"}`);

/* --- 8. immagini: manifest delle schede --- */
const cardManifest = path.join(ROOT, "illustrations", "parole", "manifest.json");
if (!fs.existsSync(cardManifest)) fail("illustrations/parole/manifest.json assente: esegui npm run illustrations:parole");
else {
  const m = JSON.parse(fs.readFileSync(cardManifest, "utf8"));
  const cards = D.PAROLE.filter(w => w.immagine && w.immagine.tipo === "card");
  if (m.count !== cards.length) fail(`Schede illustrate: manifest ${m.count}, attese ${cards.length}`);
  cards.forEach(w => {
    if (!fs.existsSync(path.join(ROOT, w.immagine.src))) fail(`${w.testo}: scheda mancante ${w.immagine.src}`);
  });
}

/* --- 9. audio --- */
const manifestPath = path.join(ROOT, "audio", "manifest.json");
if (!fs.existsSync(manifestPath)) fail("audio/manifest.json assente");
else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const groups = manifest.groups || {};
  const checkKeys = (group, keys, label) => {
    const g = groups[group] || {};
    const missing = [...new Set(keys)].filter(k => !g[k]);
    if (missing.length) fail(`${label} senza audio (${missing.length}): ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? "…" : ""}`);
  };
  checkKeys("syl", D.UNITA.filter(u => u.audioKey).map(u => u.audioKey), "Unità");
  checkKeys("parole", D.PAROLE.map(w => w.audioKey), "Parole");
  checkKeys("parole", D.FRASI.flatMap(f => f.parole.map(p => p.audioKey)).filter(w => !w.endsWith("'")), "Parole delle frasi");
  checkKeys("frasiViaggio", D.FRASI.map(f => f.id), "Frasi del viaggio");
  const missingFiles = [];
  ["syl", "parole", "frasiViaggio", "ui"].forEach(g => {
    Object.entries(groups[g] || {}).forEach(([k, info]) => {
      if (!info || !info.file) return;
      const abs = path.join(ROOT, info.file);
      if (!fs.existsSync(abs) || fs.statSync(abs).size < 500) missingFiles.push(`${g}/${k}`);
    });
  });
  if (missingFiles.length) fail(`Clip audio mancanti o vuoti (${missingFiles.length}): ${missingFiles.slice(0, 20).join(", ")}`);
}

/* --- report --- */
console.log("IL VIAGGIO DELLE SILLABE");
console.log(`Unità: ${D.UNITA.length} (${perTipo.sillaba} sillabe · ${perTipo.segmento} segmenti · ${perTipo.grafema} grafemi · ${perTipo.modulo} moduli)`);
console.log(`Parole illustrate: ${D.PAROLE.length}`);
console.log(`Frasi: ${D.FRASI.length} (${D.FRASI.reduce((a, f) => a + f.occorrenze.length, 0)} occorrenze verificate)`);
console.log(`Esercizi generati: ${totaleEsercizi} · per unità: min ${minEsercizi}, max ${maxEsercizi}`);
Object.keys(perLivello).sort((a, b) => a - b).forEach(l => {
  const x = perLivello[l];
  console.log(`  livello ${l}: ${x.unita} unità · esercizi ${x.min}–${x.max}`);
});
const audioCount = (() => {
  try { const m = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "manifest.json"), "utf8")); return Object.values(m.groups || {}).reduce((a, g) => a + Object.keys(g).length, 0); }
  catch (e) { return 0; }
})();
console.log(`Clip audio indicizzati: ${audioCount}`);

if (warnings.length) {
  console.log("\nAvvisi:");
  warnings.forEach(w => console.log("  ! " + w));
}
if (errors.length) {
  console.error("\nErrori:");
  errors.forEach(e => console.error("  ✖ " + e));
  process.exit(1);
}
console.log("\n✔ Contenuti e generatore validi");

"use strict";
/**
 * Audit di layout e resa: la schermata attiva deve entrare SEMPRE tutta nella
 * finestra, senza scorrimento della pagina né scorrimenti interni, a qualunque
 * dimensione (finestra bassa, tablet, telefono). Controlla inoltre overflow
 * orizzontale, coperture della barra inferiore, target touch minimi, testo
 * troncato e presenza di "inchiostro" nelle illustrazioni.
 *
 * Uso: npx electron scripts/layout-audit.js
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("mute-audio");

const ROOT = path.join(__dirname, "..");
const problems = [];

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1180,
    height: 860,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  await win.loadFile(path.join(ROOT, "index.html"));
  await new Promise(r => setTimeout(r, 800));

  /**
   * Apre la schermata indicata e misura l'esito.
   * L'app non scorre più: si verifica che il contenuto dell'app non superi la
   * sua altezza (app.scrollHeight vs clientHeight) e che nessun contenitore
   * abbia una barra di scorrimento propria.
   */
  const audit = async (label, code) => {
    const r = await win.webContents.executeJavaScript(`(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      ${code}
      await sleep(450);
      const doc = document.documentElement;
      const appEl = document.querySelector('.app');
      const active = document.querySelector('.screen.active');
      const bar = (active && active.querySelector('.bottombar')) || document.querySelector('.bottombar');
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const barTop = barRect ? Math.round(barRect.top) : window.innerHeight;

      // vassoio delle tessere della schermata attiva: è l'ultimo contenuto che
      // la barra potrebbe coprire
      const pool = ['#tilePool', '#wordsTilePool', '#syllTilePool']
        .map(s => document.querySelector(s))
        .find(n => n && n.offsetParent) || null;
      const poolRect = pool ? pool.getBoundingClientRect() : null;
      const clearance = poolRect ? Math.round(barTop - poolRect.bottom) : null;

      // i target si misurano in px di progetto (si toglie lo zoom): lo zoom
      // riduce tutto in proporzione, il progetto deve restare sopra i 40px
      const scala = Number(appEl.style.zoom || 1) || 1;
      const small = [];
      document.querySelectorAll('button, .slot, .tile, .group-card, .tool').forEach(el => {
        if (!el.offsetParent) return;
        const q = el.getBoundingClientRect();
        if (q.width / scala < 40 || q.height / scala < 40) {
          small.push((el.id || el.className || el.tagName) + ' ' + Math.round(q.width / scala) + 'x' + Math.round(q.height / scala));
        }
      });

      /* nessun riquadro deve scorrere: se un contenitore ha overflow auto o
         scroll ed è più alto del suo spazio, il bambino deve trascinare dentro
         un riquadro — è proprio quello che vogliamo evitare */
      const scrollers = [];
      document.querySelectorAll('.app *, #overlay *').forEach(el => {
        if (!el.offsetParent) return;
        const cs = getComputedStyle(el);
        if (!/(auto|scroll)/.test(cs.overflowY)) return;
        const oltre = el.scrollHeight - el.clientHeight;
        if (oltre > 2) scrollers.push((el.id || el.className || el.tagName) + ' +' + oltre + 'px');
      });

      return {
        zoom: appEl ? Number(appEl.style.zoom || 1) : 1,
        overflowX: doc.scrollWidth - doc.clientWidth,
        // ingombro reale della schermata: sotto = entra, sopra = resta nascosto
        ingombro: active ? Math.round(active.getBoundingClientRect().height + (barRect ? barRect.height : 0)) : 0,
        barTop,
        barHeight: barRect ? Math.round(barRect.height) : 0,
        clearance,
        tileCleared: clearance === null ? true : clearance >= -2,
        smallCount: small.length,
        smallTargets: small.slice(0, 8),
        scrollers,
        nodes: active ? active.querySelectorAll('*').length : 0,
        chips: document.querySelectorAll('.v-chip').length,
        viewH: window.innerHeight
      };
    })()`);
    console.log(`\n— ${label} —`);
    console.log(JSON.stringify(r));
    if (r.overflowX > 0) problems.push(`${label}: esce a destra di ${r.overflowX}px`);
    if (r.ingombro > r.viewH + 1) problems.push(`${label}: contenuto più alto della finestra di ${r.ingombro - r.viewH}px (scala ${r.zoom})`);
    if (!r.tileCleared) problems.push(`${label}: la barra inferiore copre le tessere`);
    if (r.scrollers.length) problems.push(`${label}: riquadri che scorrono (${r.scrollers.slice(0, 3).join(", ")})`);
    if (r.nodes < 2) problems.push(`${label}: schermata vuota`);
    return r;
  };

  const fit = async (w, h) => {
    win.setSize(w, h);
    await new Promise(r => setTimeout(r, 450));
  };

  /* --- finestra desktop --- */
  const home = await audit("HOME desktop", `showScreen('home');`);
  if (home.smallCount > 6) problems.push(`home: ${home.smallCount} target sotto 40px`);

  const lvl = await audit("LIVELLO 1 desktop", `startLevel(0);`);
  await audit("LIVELLO 40 desktop", `startLevel(39);`);

  await audit("ESERCIZI desktop", `buildQuiz();`);
  await audit("SUONI DIFFICILI desktop", `settings.exercise = 'sounds'; startChosenExercise();`);
  await audit("PAROLE desktop", `startWord(0);`);
  await audit("PRIMA PAROLA desktop (sillaba)", `startSyll(5);`);
  await audit("PRIMA PAROLA desktop (parola)", `startSyll(93);`);
  await audit("RISULTATO desktop", `showScreen('results');`);
  await audit("TROFEI desktop", `showScreen('trophies');`);

  /* --- pannelli: impostazioni, aiuto, elenco delle tappe --- */
  await audit("PANNELLO impostazioni", `openSettings();`);
  await audit("PANNELLO aiuto", `closeSheet(); openHelp();`);
  const steps = await audit("PANNELLO tappe (101 esercizi)", `closeSheet(); startSyll(5); document.querySelector('#syllListBtn').click();`);
  if (!steps.nodes) problems.push("tappe: pannello vuoto");
  await win.webContents.executeJavaScript(`closeSheet();`);

  /* --- il viaggio delle sillabe: mappa e primo esercizio --- */
  const map = await audit("VIAGGIO mappa", `showScreen('home'); const b = document.querySelector('#viaggioHomeCard button'); if (b) b.click(); else showScreen('viaggio');`);
  if (map.nodes < 10) problems.push("viaggio: la mappa non si è aperta");
  await audit("VIAGGIO esercizio", `const c = document.querySelector('.v-chip'); if (c) c.click();`);

  /* --- finestra bassa: è il caso in cui prima si scorreva di più --- */
  await fit(1280, 640);
  await audit("LIVELLO 12 finestra bassa 1280x640", `showScreen('home'); startLevel(11);`);
  await audit("PAROLE finestra bassa 1280x640", `startWord(3);`);
  await audit("TROFEI finestra bassa 1280x640", `showScreen('trophies');`);

  /* --- tablet e telefono --- */
  await fit(768, 1024);
  const tablet = await audit("LIVELLO 21 tablet 768x1024", `startLevel(20);`);
  if (tablet.overflowX > 0) problems.push("tablet: overflow orizzontale");

  await fit(390, 844);
  const phone = await audit("LIVELLO 1 telefono 390x844", `startLevel(0);`);
  if (!phone.tileCleared) problems.push("telefono: la barra inferiore copre le tessere");
  await audit("PRIMA PAROLA telefono 390x844", `startSyll(93);`);
  await audit("HOME telefono 390x844", `showScreen('home');`);

  /* --- resa delle illustrazioni: quanti colori distinti nell'area TV --- */
  await fit(1180, 860);
  const illustration = await win.webContents.executeJavaScript(`(async () => {
    startLevel(0);
    await new Promise(r => setTimeout(r, 500));
    const img = document.querySelector('#tvImage img');
    if (!img) return { distinctColors: 0, width: 0, height: 0 };
    const box = img.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = 160; canvas.height = 90;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 160, 90);
    const data = ctx.getImageData(0, 0, 160, 90).data;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 4) {
      colors.add((data[i] >> 3) + ',' + (data[i + 1] >> 3) + ',' + (data[i + 2] >> 3));
    }
    return { distinctColors: colors.size, width: Math.round(box.width), height: Math.round(box.height) };
  })()`);
  console.log("\n— ILLUSTRAZIONE —");
  console.log(JSON.stringify(illustration));
  if (illustration.distinctColors < 12) problems.push("illustrazione: pochi colori, possibile mancata resa");
  if (illustration.width < 200) problems.push("illustrazione: troppo piccola");

  /* --- testo: nessun testo troncato nei pulsanti principali --- */
  const clipping = await win.webContents.executeJavaScript(`(() => {
    const bad = [];
    document.querySelectorAll('.tool .tl, .btn, .nav-btn, .counter').forEach(el => {
      if (!el.offsetParent) return;
      if (el.scrollWidth > el.clientWidth + 2) bad.push((el.className || el.id) + ': ' + el.textContent.trim().slice(0, 24));
    });
    return bad;
  })()`);
  console.log("\n— TESTO TRONCATO —");
  console.log(clipping.length ? clipping : "nessuno");
  if (clipping.length) problems.push("testo troncato: " + clipping.join(", "));

  console.log("\n" + (problems.length ? "✖ PROBLEMI:\n  " + problems.join("\n  ") : "✔ AUDIT SUPERATO"));
  app.exit(problems.length ? 1 : 0);
}).catch(e => { console.error(e); app.exit(1); });
